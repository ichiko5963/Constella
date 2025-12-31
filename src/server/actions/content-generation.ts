/**
 * コンテンツ生成機能
 * P3-4: コンテンツ生成機能（note/X/YouTube + 週次提案）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { contentGenerations, meetingNotes } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { suggestContentGeneration } from './structured-generation';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 議事録からコンテンツ提案を生成
 */
export async function suggestContentFromNote(noteId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const note = await db.query.meetingNotes.findFirst({
      where: eq(meetingNotes.id, noteId),
    });

    if (!note || note.userId !== session.user.id) {
      throw new Error('Note not found');
    }

    const noteContent = `
タイトル: ${note.title}
要約: ${note.summary}
詳細: ${note.formattedMinutes || note.discussionDetails}
`;

    const suggestions = await suggestContentGeneration(noteContent);

    return suggestions;
  } catch (error) {
    console.error('Failed to suggest content from note:', error);
    throw new Error('Failed to suggest content from note');
  }
}

/**
 * 週次コンテンツ提案を生成
 */
export async function generateWeeklyContentSuggestions() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 過去1週間の議事録を取得
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentNotes = await db
      .select()
      .from(meetingNotes)
      .where(and(
        eq(meetingNotes.userId, session.user.id),
        gte(meetingNotes.createdAt, oneWeekAgo)
      ));

    if (recentNotes.length === 0) {
      return { suggestions: [] };
    }

    // 議事録をまとめる
    const weeklyContent = recentNotes.map(n => ({
      title: n.title,
      summary: n.summary,
      date: n.meetingDate,
    }));

    const suggestions = await suggestContentGeneration(JSON.stringify(weeklyContent));

    return suggestions;
  } catch (error) {
    console.error('Failed to generate weekly content suggestions:', error);
    throw new Error('Failed to generate weekly content suggestions');
  }
}

/**
 * コンテンツを生成
 */
export async function generateContent(
  contentType: 'diagram' | 'pdf_manual' | 'note_article' | 'x_post' | 'youtube_script',
  sourceNoteId: number | null,
  title: string,
  instructions?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    let sourceContent = '';

    if (sourceNoteId) {
      const note = await db.query.meetingNotes.findFirst({
        where: eq(meetingNotes.id, sourceNoteId),
      });

      if (!note || note.userId !== session.user.id) {
        throw new Error('Note not found');
      }

      sourceContent = `
タイトル: ${note.title}
要約: ${note.summary}
詳細: ${note.formattedMinutes || note.discussionDetails}
`;
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (contentType) {
      case 'diagram':
        systemPrompt = `あなたは図解作成AIです。複雑な情報を分かりやすい図解に変換してください。
Mermaid記法を使用して、フローチャート、シーケンス図、マインドマップなどを生成してください。`;
        userPrompt = `以下の内容を図解してください:\n\n${sourceContent}\n\n追加指示: ${instructions || 'なし'}`;
        break;

      case 'pdf_manual':
        systemPrompt = `あなたはマニュアル作成AIです。手順書やマニュアルを分かりやすく作成してください。
Markdown形式で、目次、手順、注意点、FAQ を含めてください。`;
        userPrompt = `以下の内容からマニュアルを作成してください:\n\n${sourceContent}\n\n追加指示: ${instructions || 'なし'}`;
        break;

      case 'note_article':
        systemPrompt = `あなたはnote記事作成AIです。経験談や学びを読みやすい記事にしてください。
読者の興味を引く導入、具体的な内容、学びのまとめを含めてください。`;
        userPrompt = `以下の内容からnote記事を作成してください:\n\n${sourceContent}\n\n追加指示: ${instructions || 'なし'}`;
        break;

      case 'x_post':
        systemPrompt = `あなたはX（旧Twitter）投稿作成AIです。140文字以内で、インパクトのある投稿を作成してください。
ハッシュタグも含めてください。`;
        userPrompt = `以下の内容からX投稿を作成してください:\n\n${sourceContent}\n\n追加指示: ${instructions || 'なし'}`;
        break;

      case 'youtube_script':
        systemPrompt = `あなたはYouTube台本作成AIです。視聴者を引き込む台本を作成してください。
導入、本編、まとめの構成で、話し言葉で書いてください。`;
        userPrompt = `以下の内容からYouTube台本を作成してください:\n\n${sourceContent}\n\n追加指示: ${instructions || 'なし'}`;
        break;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const generatedContent = completion.choices[0].message.content || '';

    // データベースに保存
    const [content] = await db
      .insert(contentGenerations)
      .values({
        userId: session.user.id,
        meetingNoteId: sourceNoteId,
        contentType,
        title,
        content: generatedContent,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, contentId: content.id, content: generatedContent };
  } catch (error) {
    console.error('Failed to generate content:', error);
    throw new Error('Failed to generate content');
  }
}

/**
 * 生成されたコンテンツ一覧を取得
 */
export async function getGeneratedContents(contentType?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const contents = await db
      .select()
      .from(contentGenerations)
      .where(
        contentType
          ? and(
              eq(contentGenerations.userId, session.user.id),
              eq(contentGenerations.contentType, contentType)
            )
          : eq(contentGenerations.userId, session.user.id)
      );

    return contents;
  } catch (error) {
    console.error('Failed to get generated contents:', error);
    throw new Error('Failed to get generated contents');
  }
}

/**
 * コンテンツを更新
 */
export async function updateGeneratedContent(
  contentId: number,
  updates: {
    title?: string;
    content?: string;
    status?: 'draft' | 'published';
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(contentGenerations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contentGenerations.id, contentId),
        eq(contentGenerations.userId, session.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to update generated content:', error);
    throw new Error('Failed to update generated content');
  }
}

/**
 * コンテンツを削除
 */
export async function deleteGeneratedContent(contentId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .delete(contentGenerations)
      .where(and(
        eq(contentGenerations.id, contentId),
        eq(contentGenerations.userId, session.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to delete generated content:', error);
    throw new Error('Failed to delete generated content');
  }
}

