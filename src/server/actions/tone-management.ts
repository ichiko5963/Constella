/**
 * 口調管理機能
 * P3-3: 口調管理機能（関係性分類 + 口調学習）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { relationshipProfiles } from '@/db/schema-extensions';
import { eq, and } from 'drizzle-orm';
import OpenAI from 'openai';
import { classifyRelationship } from './structured-generation';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 関係性プロフィール一覧を取得
 */
export async function getRelationshipProfiles() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const profiles = await db
      .select()
      .from(relationshipProfiles)
      .where(eq(relationshipProfiles.userId, session.user.id));

    return profiles.map(p => ({
      ...p,
      tone: p.tone ? JSON.parse(p.tone) : null,
      context: p.context ? JSON.parse(p.context) : null,
    }));
  } catch (error) {
    console.error('Failed to get relationship profiles:', error);
    throw new Error('Failed to get relationship profiles');
  }
}

/**
 * 関係性プロフィールを作成/更新
 */
export async function upsertRelationshipProfile(data: {
  contactName?: string;
  contactEmail?: string;
  contactSlackId?: string;
  relationshipType: 'superior' | 'boss' | 'peer' | 'subordinate';
  toneExamples?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 既存のプロフィールを検索
    let existingProfile = null;

    if (data.contactEmail) {
      existingProfile = await db.query.relationshipProfiles.findFirst({
        where: and(
          eq(relationshipProfiles.userId, session.user.id),
          eq(relationshipProfiles.contactEmail, data.contactEmail)
        ),
      });
    } else if (data.contactSlackId) {
      existingProfile = await db.query.relationshipProfiles.findFirst({
        where: and(
          eq(relationshipProfiles.userId, session.user.id),
          eq(relationshipProfiles.contactSlackId, data.contactSlackId)
        ),
      });
    }

    const tone = {
      examples: data.toneExamples || [],
      patterns: await extractTonePatterns(data.toneExamples || []),
    };

    if (existingProfile) {
      // 更新
      await db
        .update(relationshipProfiles)
        .set({
          contactName: data.contactName || existingProfile.contactName,
          relationshipType: data.relationshipType,
          tone: JSON.stringify(tone),
          updatedAt: new Date(),
        })
        .where(eq(relationshipProfiles.id, existingProfile.id));

      return { success: true, profileId: existingProfile.id };
    } else {
      // 新規作成
      const [profile] = await db
        .insert(relationshipProfiles)
        .values({
          userId: session.user.id,
          contactName: data.contactName || null,
          contactEmail: data.contactEmail || null,
          contactSlackId: data.contactSlackId || null,
          relationshipType: data.relationshipType,
          tone: JSON.stringify(tone),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { success: true, profileId: profile.id };
    }
  } catch (error) {
    console.error('Failed to upsert relationship profile:', error);
    throw new Error('Failed to upsert relationship profile');
  }
}

/**
 * 口調パターンを抽出
 */
async function extractTonePatterns(examples: string[]): Promise<any> {
  if (examples.length === 0) {
    return {};
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `あなたは口調分析AIです。メッセージの例から、以下の要素を抽出してください:
1. 敬語の使用度（0-100）
2. 絵文字の使用頻度（0-100）
3. 文末表現（です・ます、だ・である、カジュアルなど）
4. 特徴的な言い回し`,
        },
        {
          role: 'user',
          content: `メッセージ例:\n${examples.join('\n\n')}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'tone_patterns',
          schema: {
            type: 'object',
            properties: {
              politenessLevel: { type: 'number' },
              emojiFrequency: { type: 'number' },
              endingStyle: { type: 'string' },
              characteristicPhrases: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['politenessLevel', 'emojiFrequency', 'endingStyle'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Failed to extract tone patterns:', error);
    return {};
  }
}

/**
 * 相手に応じた返信を生成
 */
export async function generateReplyWithTone(
  recipientIdentifier: string, // email or slackId
  originalMessage: string,
  replyContent: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 関係性プロフィールを取得
    const profile = await db.query.relationshipProfiles.findFirst({
      where: and(
        eq(relationshipProfiles.userId, session.user.id),
        // emailまたはslackIdで検索
      ),
    });

    let toneGuidance = '';
    if (profile) {
      const tone = profile.tone ? JSON.parse(profile.tone) : {};
      toneGuidance = `
関係性: ${profile.relationshipType}
口調パターン: ${JSON.stringify(tone.patterns || {})}
例文: ${(tone.examples || []).slice(0, 3).join('\n')}
`;
    } else {
      toneGuidance = '関係性: 不明（丁寧な口調を使用）';
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `あなたはActoryの返信生成AIです。
ユーザーの口調と相手との関係性を考慮して、適切な返信を生成してください。

${toneGuidance}`,
        },
        {
          role: 'user',
          content: `元のメッセージ:\n${originalMessage}\n\n返信内容:\n${replyContent}`,
        },
      ],
    });

    return {
      generatedReply: completion.choices[0].message.content,
      relationshipType: profile?.relationshipType || 'unknown',
    };
  } catch (error) {
    console.error('Failed to generate reply with tone:', error);
    throw new Error('Failed to generate reply with tone');
  }
}

/**
 * 関係性プロフィールを削除
 */
export async function deleteRelationshipProfile(profileId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .delete(relationshipProfiles)
      .where(and(
        eq(relationshipProfiles.id, profileId),
        eq(relationshipProfiles.userId, session.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to delete relationship profile:', error);
    throw new Error('Failed to delete relationship profile');
  }
}

/**
 * メッセージ履歴から自動的に関係性を学習
 */
export async function learnRelationshipsFromHistory() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Slackのインポートされたメッセージを取得
    // TODO: importedContentsから取得

    // 各連絡先ごとにメッセージをグループ化
    // TODO: グループ化ロジック

    // 各連絡先の関係性を分類
    // TODO: 分類ロジック

    return { success: true, profilesCreated: 0 };
  } catch (error) {
    console.error('Failed to learn relationships from history:', error);
    throw new Error('Failed to learn relationships from history');
  }
}

