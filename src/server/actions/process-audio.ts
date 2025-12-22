'use server';

import { db } from '@/db';
import { recordings, meetingNotes, taskCandidates, transcriptSegments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { openai } from '@/lib/openai';
import { updateRecordingStatus } from './recording';
import { indexMeetingNote } from './rag';
import { getPresignedDownloadUrl } from '@/lib/storage';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';

// Note: In a real production environment (Vercel), we cannot download files to local disk easily for processing if they are large.
// Also, Server Actions have timeouts.
// For MVP/Demo: We will assume we can download small files content or pass URL if supported (Whisper API needs file).
// Ideally, this should be a background job (Inngest, Trigger.dev) or a standalone Route Handler with longer timeout.
// For now, let's implement a basic version that might hit timeouts on Vercel but works locally.

export async function processRecording(recordingId: number) {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Get Recording
        const recording = await db.query.recordings.findFirst({
            where: eq(recordings.id, recordingId),
        });

        if (!recording) return { success: false, error: 'Recording not found' };

        await updateRecordingStatus(recordingId, 'transcribing');

        // 2. Transcribe
        // OpenAI Whisper API requires a ReadStream. We need to fetch the file from S3 (via URL) and stream it.

        // Generate signed URL for reading
        const signedUrl = await getPresignedDownloadUrl(recording.audioKey);

        // Fetch audio file
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error('Failed to fetch audio file');

        // Save to temp file needed for OpenAI SDK? 
        // OpenAI Node SDK `audio.transcriptions.create` accepts `fs.createReadStream` or specialized objects.
        // Let's write to temp file.
        const tempFilePath = path.join(os.tmpdir(), `rec_${recordingId}.webm`);
        const fileStream = fs.createWriteStream(tempFilePath);
        if (!response.body) throw new Error('No body');

        // @ts-expect-error pipeline signature mismatch with web streams
        await pipeline(response.body, fileStream);

        // 3. Call Whisper with verbose_json to get word-level timestamps
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1',
            response_format: 'verbose_json',
            language: 'ja',
        });

        // Clean up temp file
        fs.unlinkSync(tempFilePath);

        // Update Recording with Transcript
        await db.update(recordings)
            .set({
                transcription: transcription.text,
                status: 'processing'
            })
            .where(eq(recordings.id, recordingId));

        // 3.5. Extract and save word-level timestamps
        // Whisper APIのverbose_json形式では、wordsプロパティが存在する場合と、segmentsプロパティ内にwordsが存在する場合がある
        let words: any[] = [];
        
        if ((transcription as any).words && Array.isArray((transcription as any).words)) {
            words = (transcription as any).words;
        } else if ((transcription as any).segments && Array.isArray((transcription as any).segments)) {
            // segmentsから単語を抽出
            words = (transcription as any).segments.flatMap((segment: any) => 
                (segment.words || []).map((word: any) => ({
                    ...word,
                    word: word.word || word.text || '',
                }))
            );
        }

        if (words.length > 0) {
            const segments = words.map((word: any, index: number) => ({
                recordingId: recordingId,
                word: word.word || word.text || '',
                start: Math.round((word.start || 0) * 1000), // Convert seconds to milliseconds
                end: Math.round((word.end || word.start || 0) * 1000),
                speaker: word.speaker || null,
                wordIndex: index,
            }));

            // 既存のセグメントを削除（再処理の場合）
            await db.delete(transcriptSegments).where(eq(transcriptSegments.recordingId, recordingId));
            
            // 新しいセグメントを挿入（チャンクごとに分割して挿入、SQLiteの制限を考慮）
            const chunkSize = 500; // 一度に挿入する最大数
            for (let i = 0; i < segments.length; i += chunkSize) {
                const chunk = segments.slice(i, i + chunkSize);
                await db.insert(transcriptSegments).values(chunk);
            }
        }

        // 4. Summarize and Extract Info (GPT-4)
        // 要約テンプレートを取得
        const { getDefaultSummaryTemplate } = await import('./summary-template');
        const templateResult = await getDefaultSummaryTemplate();
        
        let prompt = '';
        if (templateResult.success && templateResult.template) {
            // テンプレートの変数を置換
            prompt = templateResult.template.prompt.replace(/\{\{transcription\}\}/g, transcription.text);
        } else {
            // フォールバック: デフォルトプロンプト
            prompt = `
    以下の会議の文字起こしから、プロフェッショナルな議事録を作成してください。
    
    JSON形式で出力してください。フォーマット:
    {
      "summary": "全体の要約",
      "keyPoints": ["要点1", "要点2"],
      "decisions": ["決定事項1"],
      "actionItems": [
        {"title": "タスク名", "assignee": "担当者推定", "dueDate": "期限推定"}
      ]
    }

    文字起こし:
    ${transcription.text}
    `;
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'system', content: 'You are an expert secretary.' }, { role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');

        // 5. Create Meeting Note
        // Check if meeting note already exists? For now assume new.
        const [note] = await db.insert(meetingNotes).values({
            userId: session.user.id,
            fileId: recording.fileId!,
            projectId: recording.projectId!,
            recordingId: recordingId,
            title: '自動生成議事録',
            summary: result.summary,
            keyPoints: JSON.stringify(result.keyPoints),
            decisions: JSON.stringify(result.decisions),
            actionItems: JSON.stringify(result.actionItems),
            rawTranscription: transcription.text,
            formattedMinutes: `## 要約\n${result.summary}\n\n## 決定事項\n${result.decisions.join('\n- ')}`,
        }).returning();

        // 5.5 Index for RAG
        // We use rawTranscription or summary? Let's use rawTranscription for full context search
        if (note && transcription.text) {
            await indexMeetingNote(note.id, transcription.text).catch(e => console.error('Indexing failed:', e));
        }

        // 6. Create Task Candidates
        const candidates = result.actionItems.map((item: any) => ({
            userId: session!.user!.id!,
            recordingId: recordingId,
            suggestedProjectId: recording.projectId,
            suggestedFileId: recording.fileId,
            title: item.title || 'New Task',
            description: item.description || '',
            suggestedPriority: 'medium', // Default
            isApproved: null, // Pending
        }));

        if (candidates.length > 0) {
            await db.insert(taskCandidates).values(candidates);
        }

        await updateRecordingStatus(recordingId, 'completed');
        return { success: true };

    } catch (error) {
        console.error('Processing failed:', error);
        await updateRecordingStatus(recordingId, 'failed');
        return { success: false, error: 'Processing failed' };
    }
}
