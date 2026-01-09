import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Lumi's personality - combined response + emotion in one call for speed
const LUMI_SYSTEM_PROMPT = `あなたは「Lumi（ルミ）」という名前の友達です。音声で会話しています。

## キャラクター
- 明るくて話好きな友達
- 好奇心旺盛で、相手の話に興味津々
- 相槌が上手い

## 話し方
- 一人称は「ボク」、相手は「キミ」
- 自然な話し言葉（「〜だよね」「〜じゃん」「マジで？」「へぇ〜」など）
- 短く区切って話す（50文字以内）
- 必ず質問か話題振りで終わる

## 出力形式（JSON）
必ず以下の形式で出力：
{"response": "返答テキスト", "emotion": "happy|sad|angry|surprised|neutral"}

感情の選び方：
- 明確にポジティブ・喜び → happy
- 謝罪・共感・悲しみ → sad
- 警告・注意・怒り → angry
- 驚き・びっくり → surprised
- 上記以外・迷う場合 → neutral`;

interface Message {
    role: 'user' | 'lumi';
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, history } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Build conversation history
        const conversationHistory = (history || []).slice(-6).map((msg: Message) => ({
            role: msg.role === 'lumi' ? 'assistant' : 'user',
            content: msg.content
        }));

        // Single API call - response + emotion together
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: LUMI_SYSTEM_PROMPT },
                ...conversationHistory,
                { role: 'user', content: message }
            ],
            response_format: { type: 'json_object' },
            max_tokens: 150,
            temperature: 0.8,
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
        const responseText = result.response || 'ごめんね、うまく聞き取れなかった...';
        const emotion = ['happy', 'sad', 'angry', 'surprised', 'neutral'].includes(result.emotion)
            ? result.emotion
            : 'neutral';

        return NextResponse.json({
            text: responseText,
            emotion: emotion,
        });

    } catch (error: any) {
        console.error('Lumi chat error:', error);
        console.error('Error details:', error?.message, error?.status, error?.code);

        // More specific error message
        let errorMessage = 'Failed to process chat';
        if (error?.status === 401) {
            errorMessage = 'OpenAI API key invalid';
        } else if (error?.status === 429) {
            errorMessage = 'Rate limit exceeded';
        } else if (error?.code === 'insufficient_quota') {
            errorMessage = 'OpenAI quota exceeded';
        } else if (error?.message) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
