/**
 * コンテキスト管理
 * P2-2: コンテキスト管理UI
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { meetingNotes, recordings } from '@/db/schema';
import { contextManagementSessions } from '@/db/schema-extensions';
import { eq, gte, and } from 'drizzle-orm';
import { generateContextQuestions } from './structured-generation';
import { VirtualFileSystem, createVFSTools, executeVFSTool } from '@/lib/ai/file-system-abstraction';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 今日追加されたデータから質問を生成
 */
export async function generateDailyContextQuestions() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timestamp = Math.floor(today.getTime() / 1000);

    // 今日追加された議事録を取得
    const newNotes = await db
      .select()
      .from(meetingNotes)
      .where(and(
        eq(meetingNotes.userId, session.user.id),
        gte(meetingNotes.createdAt, new Date(timestamp * 1000))
      ));

    // 今日追加された録音を取得
    const newRecordings = await db
      .select()
      .from(recordings)
      .where(and(
        eq(recordings.userId, session.user.id),
        gte(recordings.createdAt, new Date(timestamp * 1000))
      ));

    if (newNotes.length === 0 && newRecordings.length === 0) {
      return { questions: [], sessionId: null };
    }

    // データをまとめる
    const recentData = {
      notes: newNotes.map(n => ({
        title: n.title,
        summary: n.summary,
        agendaItems: n.agendaItems,
      })),
      recordings: newRecordings.map(r => ({
        duration: r.duration,
        transcription: r.transcription?.substring(0, 500), // 最初の500文字のみ
      })),
    };

    // 質問を生成
    const result = await generateContextQuestions(JSON.stringify(recentData));

    // セッションを作成
    const [contextSession] = await db
      .insert(contextManagementSessions)
      .values({
        userId: session.user.id,
        targetFileIds: JSON.stringify([
          ...newNotes.map(n => n.fileId),
          ...newRecordings.map(r => r.fileId),
        ]),
        questions: JSON.stringify(result.questions),
        status: 'active',
        createdAt: new Date(),
      })
      .returning();

    return { questions: result.questions, sessionId: contextSession.id };
  } catch (error) {
    console.error('Failed to generate daily context questions:', error);
    throw new Error('Failed to generate daily context questions');
  }
}

/**
 * コンテキスト質問に回答
 */
export async function answerContextQuestion(
  sessionId: number,
  questionIndex: number,
  answer: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // セッションを取得
    const contextSession = await db.query.contextManagementSessions.findFirst({
      where: eq(contextManagementSessions.id, sessionId),
    });

    if (!contextSession || contextSession.userId !== session.user.id) {
      throw new Error('Session not found');
    }

    // 回答を保存
    const responses = contextSession.responses ? JSON.parse(contextSession.responses) : {};
    responses[questionIndex] = answer;

    await db
      .update(contextManagementSessions)
      .set({ responses: JSON.stringify(responses) })
      .where(eq(contextManagementSessions.id, sessionId));

    return { success: true };
  } catch (error) {
    console.error('Failed to answer context question:', error);
    throw new Error('Failed to answer context question');
  }
}

/**
 * コンテキストセッションを完了
 */
export async function completeContextSession(sessionId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(contextManagementSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(contextManagementSessions.id, sessionId));

    return { success: true };
  } catch (error) {
    console.error('Failed to complete context session:', error);
    throw new Error('Failed to complete context session');
  }
}

/**
 * アクティブなコンテキストセッションを取得
 */
export async function getActiveContextSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const activeSession = await db.query.contextManagementSessions.findFirst({
      where: and(
        eq(contextManagementSessions.userId, session.user.id),
        eq(contextManagementSessions.status, 'active')
      ),
    });

    if (!activeSession) {
      return null;
    }

    return {
      ...activeSession,
      questions: JSON.parse(activeSession.questions || '[]'),
      responses: JSON.parse(activeSession.responses || '{}'),
    };
  } catch (error) {
    console.error('Failed to get active context session:', error);
    throw new Error('Failed to get active context session');
  }
}

/**
 * AIエージェントとチャット（VFS使用）
 */
export async function chatWithVFS(message: string, conversationHistory: any[] = []) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const tools = createVFSTools(session.user.id);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `あなたはActoryのコンテキスト管理AIです。
ユーザーの議事録や録音データを仮想ファイルシステムとして管理しています。
ユーザーの質問に答えるために、必要に応じてファイルシステムのツールを使用してください。

利用可能なツール:
- read_file: ファイルを読み込む
- list_directory: ディレクトリ内のファイル一覧を取得
- grep_files: ファイル内を検索
- stat_file: ファイルの統計情報を取得

ファイルパスの例:
- /mnt/memories/2024/meeting_A.md
- /mnt/recordings/2024/12/recording_001.mp3`,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ],
      tools,
    });

    const responseMessage = completion.choices[0].message;

    // ツール呼び出しがある場合
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        const result = await executeVFSTool(session.user.id, toolName, toolArgs);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          content: JSON.stringify(result),
        });
      }

      // ツール結果を含めて再度APIを呼び出し
      const finalCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: `あなたはActoryのコンテキスト管理AIです。`,
          },
          ...conversationHistory,
          {
            role: 'user',
            content: message,
          },
          responseMessage,
          ...toolResults,
        ],
      });

      return {
        content: finalCompletion.choices[0].message.content,
        toolCalls: responseMessage.tool_calls,
      };
    }

    return {
      content: responseMessage.content,
      toolCalls: null,
    };
  } catch (error) {
    console.error('Failed to chat with VFS:', error);
    throw new Error('Failed to chat with VFS');
  }
}

