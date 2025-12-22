'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { recordingSegments, transcriptSegments, recordings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * AssemblyAI Speaker Diarization APIを使用して話者識別を実行
 */
export async function performDiarization(recordingId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // TODO: AssemblyAI APIを使用して話者識別を実行
        // 現在はプレースホルダー実装
        
        // 1. 録音ファイルのURLを取得
        const recording = await db.query.recordings.findFirst({
            where: eq(recordings.id, recordingId),
        });

        if (!recording || !recording.audioUrl) {
            return { success: false, error: 'Recording not found or no audio URL' };
        }

        // 2. AssemblyAI APIに送信（実装は後で追加）
        // const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
        // if (!assemblyApiKey) {
        //     return { success: false, error: 'AssemblyAI API key not configured' };
        // }

        // 3. 話者セグメントを保存
        // 現在はサンプルデータを保存
        const sampleSegments = [
            {
                recordingId,
                speakerId: 0,
                speakerLabel: 'Speaker 1',
                startTime: 0,
                endTime: 30000,
                confidence: 0.95,
            },
            {
                recordingId,
                speakerId: 1,
                speakerLabel: 'Speaker 2',
                startTime: 30000,
                endTime: 60000,
                confidence: 0.92,
            },
        ];

        await db.insert(recordingSegments).values(sampleSegments);

        // 4. transcriptSegmentsのspeakerIdを更新
        // これは実際のAPIレスポンスに基づいて更新する必要がある

        revalidatePath(`/recordings/${recordingId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to perform diarization:', error);
        return { success: false, error: 'Failed to perform diarization' };
    }
}

/**
 * 話者名を更新
 */
export async function updateSpeakerName(
    segmentId: number,
    speakerName: string
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.update(recordingSegments)
            .set({ speakerLabel: speakerName })
            .where(eq(recordingSegments.id, segmentId));

        // 同じspeakerIdを持つ他のセグメントも更新
        const segment = await db.query.recordingSegments.findFirst({
            where: eq(recordingSegments.id, segmentId),
        });

        if (segment) {
            await db.update(recordingSegments)
                .set({ speakerLabel: speakerName })
                .where(eq(recordingSegments.recordingId, segment.recordingId))
                .where(eq(recordingSegments.speakerId, segment.speakerId));
        }

        revalidatePath('/recordings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update speaker name:', error);
        return { success: false, error: 'Failed to update speaker name' };
    }
}

/**
 * 録音の話者セグメントを取得
 */
export async function getRecordingSegments(recordingId: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const segments = await db.query.recordingSegments.findMany({
            where: eq(recordingSegments.recordingId, recordingId),
            orderBy: (segments, { asc }) => [asc(segments.startTime)],
        });

        return {
            success: true,
            segments: segments.map(s => ({
                id: s.id,
                recordingId: s.recordingId,
                speakerId: s.speakerId,
                speakerLabel: s.speakerLabel,
                startTime: s.startTime,
                endTime: s.endTime,
                confidence: s.confidence,
            })),
        };
    } catch (error) {
        console.error('Failed to get recording segments:', error);
        return { success: false, error: 'Failed to retrieve segments' };
    }
}
