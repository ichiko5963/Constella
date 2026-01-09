import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI, { toFile } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * STT API - OpenAI Whisper
 * 音声ファイルをテキストに変換
 *
 * Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
        }

        // Get file extension from name or default to webm
        const fileName = audioFile.name || 'recording.webm';
        const extension = fileName.split('.').pop()?.toLowerCase() || 'webm';

        // Validate supported formats
        const supportedFormats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm', 'ogg'];
        if (!supportedFormats.includes(extension)) {
            return NextResponse.json(
                { error: `Unsupported file type: ${extension}` },
                { status: 400 }
            );
        }

        // Convert to buffer for OpenAI
        const arrayBuffer = await audioFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create file for OpenAI using toFile helper
        const file = await toFile(buffer, fileName, {
            type: audioFile.type || 'audio/webm',
        });

        // Call Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'ja',
            response_format: 'text',
        });

        return NextResponse.json({
            text: transcription,
        });

    } catch (error: any) {
        console.error('STT error:', error);

        // Check for common issues
        if (error?.code === 'ENOTFOUND' || error?.message?.includes('OPENAI_API_KEY')) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Better error message
        const errorMessage = error?.message || 'Failed to transcribe audio';

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
