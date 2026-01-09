import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';
import { db } from '@/db';
import { recordings } from '@/db/schema';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const { messages, projectId: rawProjectId } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
        }

        // Convert projectId to number or null
        const projectId = rawProjectId ? parseInt(rawProjectId, 10) : null;

        // Format conversation
        const conversationText = messages
            .map((m: Message) => `${m.role === 'user' ? 'ユーザー' : 'Lumi'}: ${m.content}`)
            .join('\n');

        // Default context data
        let contextData = {
            summary: `${messages.length}件のメッセージ`,
            insights: [] as string[],
            topics: [] as string[],
            actionItems: [] as string[],
            sentiment: 'neutral' as string
        };

        // Try to generate AI summary (but don't fail if it doesn't work)
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `会話から重要な情報を抽出。JSON形式で出力:
{"summary": "要約2-3文", "insights": ["インサイト"], "topics": ["トピック"], "actionItems": ["アクション"], "sentiment": "positive/neutral/negative"}
日本語で。`
                    },
                    {
                        role: 'user',
                        content: conversationText
                    }
                ],
                response_format: { type: 'json_object' },
                max_tokens: 300,
                temperature: 0.3,
            });

            const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
            if (parsed.summary) {
                contextData = { ...contextData, ...parsed };
            }
        } catch (aiError) {
            console.log('AI summarization skipped:', aiError);
            // Continue without AI summary
        }

        // Create title
        const conversationTitle = contextData.topics?.length > 0
            ? `Lumiとの会話: ${contextData.topics[0]}`
            : `Lumiとの会話 - ${new Date().toLocaleDateString('ja-JP')}`;

        const transcriptionContent = `## 会話内容\n\n${conversationText}\n\n## 要約\n${contextData.summary}`;

        // Save to database
        const conversationId = `lumi-${Date.now()}`;
        const [saved] = await db.insert(recordings).values({
            userId: session.user.id,
            projectId: projectId,
            audioUrl: `lumi://${conversationId}`,
            audioKey: conversationId,
            duration: 0,
            transcription: transcriptionContent,
            structuredNotes: JSON.stringify({
                title: conversationTitle,
                summary: contextData.summary,
                type: 'lumi_conversation',
                insights: contextData.insights,
                topics: contextData.topics,
                actionItems: contextData.actionItems,
                sentiment: contextData.sentiment,
                messageCount: messages.length,
                savedAt: new Date().toISOString()
            }),
            status: 'completed',
        }).returning();

        return NextResponse.json({
            success: true,
            recordingId: saved.id,
            summary: contextData.summary,
        });

    } catch (error) {
        console.error('Lumi save context error:', error);
        return NextResponse.json(
            { error: 'Failed to save context', details: String(error) },
            { status: 500 }
        );
    }
}
