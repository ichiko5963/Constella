/**
 * Notion連携
 * P3-1: Notion連携（OAuth + ページインポート + AI再構成）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { externalIntegrations, importedContents } from '@/db/schema-extensions';
import { files } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { Client } from '@notionhq/client';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Notion OAuth認証URLを生成
 */
export async function getNotionAuthUrl() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`;

  if (!clientId) {
    throw new Error('Notion client ID not configured');
  }

  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return authUrl;
}

/**
 * Notion OAuth認証コードを交換してアクセストークンを取得
 */
export async function exchangeNotionCode(code: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`;

    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code');
    }

    const data = await response.json();

    // データベースに保存
    await db.insert(externalIntegrations).values({
      userId: session.user.id,
      serviceType: 'notion',
      accessToken: data.access_token,
      serviceAccountId: data.workspace_id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to exchange Notion code:', error);
    throw new Error('Failed to exchange Notion code');
  }
}

/**
 * Notionページ一覧を取得
 */
export async function getNotionPages() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const integration = await db.query.externalIntegrations.findFirst({
      where: and(
        eq(externalIntegrations.userId, session.user.id),
        eq(externalIntegrations.serviceType, 'notion'),
        eq(externalIntegrations.isActive, true)
      ),
    });

    if (!integration || !integration.accessToken) {
      throw new Error('Notion integration not found');
    }

    const notion = new Client({
      auth: integration.accessToken,
    });

    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page',
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    return response.results;
  } catch (error) {
    console.error('Failed to get Notion pages:', error);
    throw new Error('Failed to get Notion pages');
  }
}

/**
 * Notionページをインポート
 */
export async function importNotionPage(pageId: string, projectId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const integration = await db.query.externalIntegrations.findFirst({
      where: and(
        eq(externalIntegrations.userId, session.user.id),
        eq(externalIntegrations.serviceType, 'notion'),
        eq(externalIntegrations.isActive, true)
      ),
    });

    if (!integration || !integration.accessToken) {
      throw new Error('Notion integration not found');
    }

    const notion = new Client({
      auth: integration.accessToken,
    });

    // ページ情報を取得
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // ページのブロックを取得
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    // ブロックをMarkdownに変換
    const markdown = await convertBlocksToMarkdown(blocks.results);

    // ページタイトルを取得
    const title = getPageTitle(page);

    // AIで再構成
    const restructured = await restructureContent(title, markdown);

    // データベースに保存
    await db.insert(importedContents).values({
      userId: session.user.id,
      integrationId: integration.id,
      contentType: 'notion_page',
      originalId: pageId,
      title,
      content: restructured,
      metadata: JSON.stringify({ originalMarkdown: markdown }),
      createdAt: new Date(),
    });

    // ファイルとして保存
    const [file] = await db
      .insert(files)
      .values({
        userId: session.user.id,
        projectId,
        name: title,
        fileType: 'imported_note',
        aiGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, fileId: file.id };
  } catch (error) {
    console.error('Failed to import Notion page:', error);
    throw new Error('Failed to import Notion page');
  }
}

/**
 * Notionブロックを Markdownに変換
 */
async function convertBlocksToMarkdown(blocks: any[]): Promise<string> {
  let markdown = '';

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        markdown += `${getPlainText(block.paragraph.rich_text)}\n\n`;
        break;
      case 'heading_1':
        markdown += `# ${getPlainText(block.heading_1.rich_text)}\n\n`;
        break;
      case 'heading_2':
        markdown += `## ${getPlainText(block.heading_2.rich_text)}\n\n`;
        break;
      case 'heading_3':
        markdown += `### ${getPlainText(block.heading_3.rich_text)}\n\n`;
        break;
      case 'bulleted_list_item':
        markdown += `- ${getPlainText(block.bulleted_list_item.rich_text)}\n`;
        break;
      case 'numbered_list_item':
        markdown += `1. ${getPlainText(block.numbered_list_item.rich_text)}\n`;
        break;
      case 'code':
        markdown += `\`\`\`${block.code.language}\n${getPlainText(block.code.rich_text)}\n\`\`\`\n\n`;
        break;
      case 'quote':
        markdown += `> ${getPlainText(block.quote.rich_text)}\n\n`;
        break;
      default:
        break;
    }
  }

  return markdown;
}

/**
 * リッチテキストからプレーンテキストを取得
 */
function getPlainText(richText: any[]): string {
  return richText.map(t => t.plain_text).join('');
}

/**
 * ページタイトルを取得
 */
function getPageTitle(page: any): string {
  const titleProperty = page.properties?.title || page.properties?.Name;
  if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
    return getPlainText(titleProperty.title);
  }
  return 'Untitled';
}

/**
 * AIでコンテンツを再構成
 */
async function restructureContent(title: string, markdown: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたはActoryのコンテンツ再構成AIです。
Notionからインポートされたコンテンツを、Actoryで使いやすい形式に再構成してください。

再構成のポイント:
1. 情報を整理して読みやすくする
2. 重要なポイントを強調する
3. 必要に応じてセクションを追加・削除する
4. Markdown形式で出力する`,
      },
      {
        role: 'user',
        content: `タイトル: ${title}\n\n${markdown}`,
      },
    ],
  });

  return completion.choices[0].message.content || markdown;
}

/**
 * Notion連携を解除
 */
export async function disconnectNotion() {
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
        eq(externalIntegrations.serviceType, 'notion')
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect Notion:', error);
    throw new Error('Failed to disconnect Notion');
  }
}

