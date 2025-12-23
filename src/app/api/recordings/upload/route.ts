import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { recordings } from '@/db/schema';
import { getPresignedUploadUrl } from '@/lib/storage';
import { nanoid } from 'nanoid';
import { logAuditEvent } from '@/lib/audit-log';
import { processRecording } from '@/server/actions/process-audio';

/**
 * 録音ファイルをサーバー経由でアップロード
 * CORS問題を回避するため、サーバーサイドでS3にアップロード
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const projectIdStr = formData.get('projectId') as string | null;
        const projectId = projectIdStr ? parseInt(projectIdStr, 10) : undefined;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // ファイル形式チェック
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg'];
        const validExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

        if (!isValidType) {
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        // ファイルサイズチェック（50MB制限）
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
        }

        // プロジェクトの検証（提供されている場合）
        if (projectId) {
            const project = await db.query.projects.findFirst({
                where: (p, { and, eq }) => and(
                    eq(p.id, projectId),
                    eq(p.userId, session.user.id)
                )
            });

            if (!project) {
                return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
            }
        }

        // ファイルタイプを決定
        let fileType = file.type;
        if (!fileType || fileType === 'application/octet-stream') {
            const extension = file.name.split('.').pop()?.toLowerCase();
            const mimeTypes: Record<string, string> = {
                'mp3': 'audio/mpeg',
                'wav': 'audio/wav',
                'm4a': 'audio/mp4',
                'webm': 'audio/webm',
                'ogg': 'audio/ogg',
            };
            fileType = mimeTypes[extension || ''] || 'audio/mpeg';
        }

        // S3キーを生成（拡張子を取得）
        const mimeExtension = fileType.split('/')[1] || 'webm';
        // ファイル名から拡張子を取得（より正確）
        const fileNameExtension = file.name.split('.').pop()?.toLowerCase() || mimeExtension;
        const key = `recordings/${session.user.id}/${nanoid()}.${fileNameExtension}`;

        // Presigned URLを取得
        const { url: presignedUrl } = await getPresignedUploadUrl(key, fileType);

        // ファイルをS3にアップロード
        const fileBuffer = await file.arrayBuffer();
        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': fileType,
            },
        });

        if (!uploadResponse.ok) {
            console.error('S3 upload failed:', uploadResponse.status, uploadResponse.statusText);
            return NextResponse.json({ error: 'Failed to upload to S3' }, { status: 500 });
        }

        // 録音レコードを作成
        const [recording] = await db.insert(recordings).values({
            userId: session.user.id,
            projectId: projectId || null,
            audioKey: key,
            audioUrl: presignedUrl.split('?')[0], // Base URL without signature
            status: 'uploading',
            transcription: '',
        }).returning();

        // 監査ログを記録
        await logAuditEvent('create', 'recording', recording.id, {
            projectId: projectId || null,
            fileType,
        });

        // バックグラウンドで文字起こしと議事録生成を開始
        processRecording(recording.id).catch((error) => {
            console.error('Processing failed:', error);
        });

        return NextResponse.json({
            success: true,
            recordingId: recording.id,
        });
    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upload failed' },
            { status: 500 }
        );
    }
}
