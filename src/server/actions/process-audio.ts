'use server';

import { db } from '@/db';
import { recordings, meetingNotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { openai } from '@/lib/openai';
import { updateRecordingStatus } from './recording';
import { auth } from '@/lib/auth';
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
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Get Recording
        const recording = await db.query.recordings.findFirst({
            where: eq(recordings.id, recordingId),
        });

        if (!recording) return { success: false, error: 'Recording not found' };

        await updateRecordingStatus(recordingId, 'transcribing');

        // 2. Transcribe (Mocking download for now, assuming we handle file differently or use a URL-based transcription service?)
        // OpenAI Whisper API requires a ReadStream. We need to fetch the file from S3 (via URL) and stream it.

        // Fetch audio file
        const response = await fetch(recording.audioUrl);
        if (!response.ok) throw new Error('Failed to fetch audio file');

        // Save to temp file needed for OpenAI SDK? 
        // OpenAI Node SDK `audio.transcriptions.create` accepts `fs.createReadStream` or specialized objects.
        // Let's write to temp file.
        const tempFilePath = path.join(os.tmpdir(), `rec_${recordingId}.webm`);
        const fileStream = fs.createWriteStream(tempFilePath);
        if (!response.body) throw new Error('No body');

        // @ts-expect-error pipeline signature mismatch with web streams
        await pipeline(response.body, fileStream);

        // 3. Call Whisper
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

        // 4. Summarize and Extract Info (GPT-4)
        const prompt = `
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

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'system', content: 'You are an expert secretary.' }, { role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(completion.choices[0].message.content || '{}');

        // 5. Create Meeting Note
        // Check if meeting note already exists? For now assume new.
        await db.insert(meetingNotes).values({
            userId: session.user.id,
            fileId: recording.fileId!, // Assuming fileId exists or we need to handle it
            projectId: recording.projectId!, // Assuming projectId exists
            recordingId: recordingId,
            title: '自動生成議事録', // Should extract from content
            summary: result.summary,
            keyPoints: JSON.stringify(result.keyPoints),
            decisions: JSON.stringify(result.decisions),
            actionItems: JSON.stringify(result.actionItems),
            rawTranscription: transcription.text,
            formattedMinutes: `## 要約\n${result.summary}\n\n## 決定事項\n${result.decisions.join('\n- ')}`,
        });

        await updateRecordingStatus(recordingId, 'completed');

        return { success: true };

    } catch (error) {
        console.error('Processing failed:', error);
        await updateRecordingStatus(recordingId, 'failed');
        return { success: false, error: 'Processing failed' };
    }
}
