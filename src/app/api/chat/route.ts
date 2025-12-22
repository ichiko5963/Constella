import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { searchContext, getRecentContext } from '@/lib/rag';
import { getDefaultPrompt } from '@/server/actions/custom-prompt';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]; // User's last message

    // 1. Retrieve Context (高速RAG)
    let context = '';
    let sources: any[] = [];

    if (lastMessage.role === 'user') {
        // 並列実行で高速化
        const [searchResults, recent] = await Promise.all([
            searchContext(lastMessage.content, session.user.id),
            getRecentContext(session.user.id)
        ]);

        if (searchResults.length > 0) {
            context += '以下は、ユーザーの会議議事録から取得した関連コンテキストです：\n\n';
            searchResults.forEach((item: any) => {
                context += `[出典: 会議「${item.meta.title}」 - プロジェクト「${item.meta.projectName || '不明'}」]\n`;
                context += `抜粋: "${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}"\n`;
                if (item.meta.decisions) context += `関連決定事項: ${item.meta.decisions}\n`;
                context += '---\n';
                sources.push({
                    title: item.meta.title,
                    projectName: item.meta.projectName,
                    noteId: item.meta.noteId,
                    excerpt: item.content.substring(0, 150)
                });
            });
        } else if (recent.length > 0) {
            // フォールバック: 最近の会議
            context += '以下は、あなたの最近の会議です：\n';
            recent.forEach((note: any) => {
                context += `- 会議「${note.title}」: ${note.summary || '要約なし'}\n`;
            });
        }
    }

    // カスタムプロンプトを取得（デフォルトプロンプトまたはシステムデフォルト）
    const promptResult = await getDefaultPrompt();
    const basePrompt = promptResult.success && promptResult.prompt 
        ? promptResult.prompt 
        : `あなたはActory AIです。プロジェクトと会議議事録を管理するための有用なアシスタントです。
ユーザーの会議議事録とプロジェクトのコンテキストにアクセスできます。`;

    const systemPrompt = `${basePrompt}
  
  コンテキスト情報:
  ${context || '関連するコンテキストが見つかりませんでした。'}
  
  提供されたコンテキストに基づいてユーザーの質問に答えてください。答えがわからない場合は、丁寧にその旨を伝えてください。
  回答は簡潔で専門的にしてください。日本語で回答してください。`;

    const result = streamText({
        model: openai('gpt-4o'), // or gpt-4-turbo
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}
