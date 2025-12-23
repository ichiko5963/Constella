'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { recordingSegments, transcriptSegments, recordings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getPresignedDownloadUrl } from '@/lib/storage';

/**
 * AssemblyAI Speaker Diarization APIを使用して話者識別を実行
 */
export async function performDiarization(recordingId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. 録音ファイルのURLを取得
        const recording = await db.query.recordings.findFirst({
            where: eq(recordings.id, recordingId),
        });

        if (!recording || !recording.audioUrl) {
            return { success: false, error: 'Recording not found or no audio URL' };
        }

        // 2. Deepgram APIを使用して話者識別を実行
        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramApiKey) {
            // Fallback to AssemblyAI if Deepgram is not configured
            return await performDiarizationWithAssemblyAI(recordingId, recording.audioUrl);
        }

        // Deepgram APIを使用
        const audioUrl = recording.audioUrl;
        
        // Deepgram transcription with speaker diarization
        const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=ja&punctuate=true&diarize=true&smart_format=true', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${deepgramApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: audioUrl,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Deepgram API error:', errorText);
            return { success: false, error: 'Failed to call Deepgram API' };
        }

        const data = await response.json();
        const results = data.results;
        
        if (!results || !results.channels || results.channels.length === 0) {
            return { success: false, error: 'No transcription results' };
        }

        const channel = results.channels[0];
        const utterances = channel.alternatives[0]?.utterances || [];

        // 既存のセグメントを削除
        await db.delete(recordingSegments)
            .where(eq(recordingSegments.recordingId, recordingId));

        // 話者セグメントを保存
        const segments = utterances.map((utterance: any, index: number) => ({
            recordingId,
            speakerId: utterance.speaker || 0,
            speakerLabel: `Speaker ${(utterance.speaker || 0) + 1}`,
            startTime: Math.round(utterance.start * 1000), // Convert to milliseconds
            endTime: Math.round(utterance.end * 1000),
            confidence: utterance.confidence || null,
        }));

        if (segments.length > 0) {
            await db.insert(recordingSegments).values(segments);
        }

        // transcriptSegmentsのspeakerIdを更新
        const words = channel.alternatives[0]?.words || [];
        for (const word of words) {
            const startMs = Math.round(word.start * 1000);
            await db.update(transcriptSegments)
                .set({ 
                    speakerId: word.speaker || null,
                    speaker: `Speaker ${(word.speaker || 0) + 1}`,
                })
                .where(and(
                    eq(transcriptSegments.recordingId, recordingId),
                    eq(transcriptSegments.start, startMs)
                ));
        }

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
                .where(and(
                    eq(recordingSegments.recordingId, segment.recordingId),
                    eq(recordingSegments.speakerId, segment.speakerId)
                ));
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

/**
 * AssemblyAI APIを使用した話者識別（フォールバック）
 */
async function performDiarizationWithAssemblyAI(recordingId: number, audioUrl: string): Promise<{ success: boolean; error?: string }> {
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!assemblyApiKey) {
        return { success: false, error: 'No diarization API key configured (DEEPGRAM_API_KEY or ASSEMBLYAI_API_KEY)' };
    }

    try {
        // 1. Upload audio to AssemblyAI
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'authorization': assemblyApiKey,
            },
            body: await fetch(audioUrl).then(r => r.blob()),
        });

        if (!uploadResponse.ok) {
            return { success: false, error: 'Failed to upload audio to AssemblyAI' };
        }

        const { upload_url } = await uploadResponse.json();

        // 2. Start transcription with speaker diarization
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': assemblyApiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: upload_url,
                speaker_labels: true,
                language_code: 'ja',
            }),
        });

        if (!transcriptResponse.ok) {
            return { success: false, error: 'Failed to start transcription' };
        }

        const { id } = await transcriptResponse.json();

        // 3. Poll for completion
        let transcriptData;
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: {
                    'authorization': assemblyApiKey,
                },
            });

            transcriptData = await statusResponse.json();

            if (transcriptData.status === 'completed') {
                break;
            } else if (transcriptData.status === 'error') {
                return { success: false, error: transcriptData.error || 'Transcription failed' };
            }

            attempts++;
        }

        if (!transcriptData || transcriptData.status !== 'completed') {
            return { success: false, error: 'Transcription timeout' };
        }

        // 4. Extract speaker segments
        const utterances = transcriptData.utterances || [];
        
        // 既存のセグメントを削除
        await db.delete(recordingSegments)
            .where(eq(recordingSegments.recordingId, recordingId));

        // 話者セグメントを保存
        const segments = utterances.map((utterance: any) => ({
            recordingId,
            speakerId: utterance.speaker || 0,
            speakerLabel: `Speaker ${(utterance.speaker || 0) + 1}`,
            startTime: Math.round(utterance.start * 1000), // Convert to milliseconds
            endTime: Math.round(utterance.end * 1000),
            confidence: utterance.confidence || null,
        }));

        if (segments.length > 0) {
            await db.insert(recordingSegments).values(segments);
        }

        // 5. Update transcript segments with speaker IDs
        const words = transcriptData.words || [];
        for (const word of words) {
            const startMs = Math.round(word.start * 1000);
            await db.update(transcriptSegments)
                .set({ 
                    speakerId: word.speaker || null,
                    speaker: word.speaker !== null ? `Speaker ${word.speaker + 1}` : null,
                })
                .where(and(
                    eq(transcriptSegments.recordingId, recordingId),
                    eq(transcriptSegments.start, startMs)
                ));
        }

        revalidatePath(`/recordings/${recordingId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to perform diarization with AssemblyAI:', error);
        return { success: false, error: 'Failed to perform diarization' };
    }
}

