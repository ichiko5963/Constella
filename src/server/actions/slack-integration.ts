/**
 * Slack連携
 * P3-2: Slack連携（OAuth + メッセージインポート）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { externalIntegrations, importedContents, relationshipProfiles } from '@/db/schema-extensions';
import { eq, and } from 'drizzle-orm';
import { classifyRelationship } from './structured-generation';

/**
 * Slack OAuth認証URLを生成
 */
export async function getSlackAuthUrl() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;

  if (!clientId) {
    throw new Error('Slack client ID not configured');
  }

  const scopes = [
    'channels:history',
    'channels:read',
    'users:read',
    'users:read.email',
  ].join(',');

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return authUrl;
}

/**
 * Slack OAuth認証コードを交換してアクセストークンを取得
 */
export async function exchangeSlackCode(code: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to exchange code');
    }

    // データベースに保存
    await db.insert(externalIntegrations).values({
      userId: session.user.id,
      serviceType: 'slack',
      accessToken: data.access_token,
      serviceAccountId: data.team.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to exchange Slack code:', error);
    throw new Error('Failed to exchange Slack code');
  }
}

/**
 * Slackチャンネル一覧を取得
 */
export async function getSlackChannels() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const integration = await db.query.externalIntegrations.findFirst({
      where: and(
        eq(externalIntegrations.userId, session.user.id),
        eq(externalIntegrations.serviceType, 'slack'),
        eq(externalIntegrations.isActive, true)
      ),
    });

    if (!integration || !integration.accessToken) {
      throw new Error('Slack integration not found');
    }

    const response = await fetch('https://slack.com/api/conversations.list', {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
      },
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to get channels');
    }

    return data.channels;
  } catch (error) {
    console.error('Failed to get Slack channels:', error);
    throw new Error('Failed to get Slack channels');
  }
}

/**
 * Slackチャンネルからメッセージをインポート
 */
export async function importSlackMessages(channelId: string, limit: number = 100) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const integration = await db.query.externalIntegrations.findFirst({
      where: and(
        eq(externalIntegrations.userId, session.user.id),
        eq(externalIntegrations.serviceType, 'slack'),
        eq(externalIntegrations.isActive, true)
      ),
    });

    if (!integration || !integration.accessToken) {
      throw new Error('Slack integration not found');
    }

    // メッセージを取得
    const response = await fetch(
      `https://slack.com/api/conversations.history?channel=${channelId}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to get messages');
    }

    // ユーザー情報を取得
    const userIds = [...new Set(data.messages.map((m: any) => m.user))];
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const userResponse = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
          headers: {
            Authorization: `Bearer ${integration.accessToken}`,
          },
        });
        const userData = await userResponse.json();
        return userData.ok ? userData.user : null;
      })
    );

    const userMap = new Map(users.filter(Boolean).map((u: any) => [u.id, u]));

    // メッセージをインポート
    for (const message of data.messages) {
      if (!message.text) continue;

      const user = userMap.get(message.user);
      const userName = user?.real_name || user?.name || 'Unknown';

      await db.insert(importedContents).values({
        userId: session.user.id,
        integrationId: integration.id,
        contentType: 'slack_message',
        originalId: message.ts,
        title: `${userName}: ${message.text.substring(0, 50)}...`,
        content: message.text,
        metadata: JSON.stringify({
          user: userName,
          userId: message.user,
          channelId,
          timestamp: message.ts,
        }),
        createdAt: new Date(),
      });

      // 口調学習のために関係性プロフィールを更新
      await learnToneFromMessage(session.user.id, message.user, userName, message.text);
    }

    await db
      .update(externalIntegrations)
      .set({ lastSyncAt: new Date() })
      .where(eq(externalIntegrations.id, integration.id));

    return { success: true, messagesImported: data.messages.length };
  } catch (error) {
    console.error('Failed to import Slack messages:', error);
    throw new Error('Failed to import Slack messages');
  }
}

/**
 * メッセージから口調を学習
 */
async function learnToneFromMessage(
  userId: string,
  slackUserId: string,
  userName: string,
  message: string
) {
  try {
    // 既存のプロフィールを取得
    const existingProfile = await db.query.relationshipProfiles.findFirst({
      where: and(
        eq(relationshipProfiles.userId, userId),
        eq(relationshipProfiles.contactSlackId, slackUserId)
      ),
    });

    if (existingProfile) {
      // 既存のプロフィールを更新
      const tone = existingProfile.tone ? JSON.parse(existingProfile.tone) : { examples: [] };
      tone.examples.push(message);

      // 最新100件のみ保持
      if (tone.examples.length > 100) {
        tone.examples = tone.examples.slice(-100);
      }

      await db
        .update(relationshipProfiles)
        .set({
          tone: JSON.stringify(tone),
          updatedAt: new Date(),
        })
        .where(eq(relationshipProfiles.id, existingProfile.id));
    } else {
      // 新しいプロフィールを作成
      // 関係性を分類
      const classification = await classifyRelationship(message);

      await db.insert(relationshipProfiles).values({
        userId,
        contactName: userName,
        contactSlackId: slackUserId,
        relationshipType: classification.relationshipType,
        tone: JSON.stringify({ examples: [message] }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Failed to learn tone from message:', error);
    // エラーを無視して続行
  }
}

/**
 * Slack連携を解除
 */
export async function disconnectSlack() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(externalIntegrations)
      .set({ isActive: false })
      .where(and(
        eq(externalIntegrations.userId, session.user.id),
        eq(externalIntegrations.serviceType, 'slack')
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect Slack:', error);
    throw new Error('Failed to disconnect Slack');
  }
}

