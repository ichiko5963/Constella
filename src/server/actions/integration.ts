'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type IntegrationProvider = 'slack' | 'notion' | 'hubspot' | 'salesforce';

/**
 * 統合を取得
 */
export async function getIntegrations() {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id; // TypeScriptの型チェックを確実にするため

    try {
        const integrationList = await db.query.integrations.findMany({
            where: eq(integrations.userId, userId),
        });

        return {
            success: true,
            integrations: integrationList.map(i => ({
                id: i.id,
                provider: i.provider as IntegrationProvider,
                enabled: i.enabled || false,
                webhookUrl: i.webhookUrl ?? undefined, // nullをundefinedに変換
                settings: i.settings ? JSON.parse(i.settings) : {},
                lastSyncAt: i.lastSyncAt ?? undefined, // nullをundefinedに変換
                createdAt: i.createdAt,
                updatedAt: i.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get integrations:', error);
        return { success: false, error: 'Failed to retrieve integrations' };
    }
}

/**
 * 統合を作成または更新
 */
export async function upsertIntegration(
    provider: IntegrationProvider,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date,
    webhookUrl?: string,
    settings?: Record<string, any>
): Promise<{ success: boolean; integrationId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 既存の統合を確認
        const existing = await db.query.integrations.findFirst({
            where: (integrations, { and, eq }) => and(
                eq(integrations.userId, session.user.id),
                eq(integrations.provider, provider)
            ),
        });

        if (existing) {
            // 更新
            await db.update(integrations)
                .set({
                    accessToken,
                    refreshToken: refreshToken || existing.refreshToken,
                    expiresAt: expiresAt || existing.expiresAt,
                    webhookUrl: webhookUrl || existing.webhookUrl,
                    settings: settings ? JSON.stringify(settings) : existing.settings,
                    enabled: true,
                    updatedAt: new Date(),
                })
                .where(eq(integrations.id, existing.id));

            revalidatePath('/settings');
            return { success: true, integrationId: existing.id };
        } else {
            // 作成
            const [inserted] = await db.insert(integrations).values({
                userId: session.user.id,
                provider,
                accessToken,
                refreshToken: refreshToken || null,
                expiresAt: expiresAt || null,
                webhookUrl: webhookUrl || null,
                settings: settings ? JSON.stringify(settings) : null,
                enabled: true,
            }).returning();

            revalidatePath('/settings');
            return { success: true, integrationId: inserted.id };
        }
    } catch (error) {
        console.error('Failed to upsert integration:', error);
        return { success: false, error: 'Failed to save integration' };
    }
}

/**
 * 統合を無効化
 */
export async function disableIntegration(integrationId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const existing = await db.query.integrations.findFirst({
            where: eq(integrations.id, integrationId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Integration not found or unauthorized' };
        }

        await db.update(integrations)
            .set({
                enabled: false,
                updatedAt: new Date(),
            })
            .where(eq(integrations.id, integrationId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to disable integration:', error);
        return { success: false, error: 'Failed to disable integration' };
    }
}

/**
 * 統合を削除
 */
export async function deleteIntegration(integrationId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const existing = await db.query.integrations.findFirst({
            where: eq(integrations.id, integrationId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Integration not found or unauthorized' };
        }

        await db.delete(integrations)
            .where(eq(integrations.id, integrationId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete integration:', error);
        return { success: false, error: 'Failed to delete integration' };
    }
}

/**
 * 議事録完了時に統合に通知を送信
 */
export async function notifyIntegrations(noteId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 有効な統合を取得
        const integrationList = await db.query.integrations.findMany({
            where: (integrations, { and, eq }) => and(
                eq(integrations.userId, session.user.id),
                eq(integrations.enabled, true)
            ),
        });

        // 議事録を取得
        const note = await db.query.meetingNotes.findFirst({
            where: eq(meetingNotes.id, noteId),
        });

        if (!note) {
            return { success: false, error: 'Note not found' };
        }

        // 各統合に通知を送信（並列実行で高速化）
        await Promise.allSettled(
            integrationList.map(integration =>
                sendToIntegration(integration, note).catch(error => {
                    console.error(`Failed to send to ${integration.provider}:`, error);
                    // エラーをログに記録するが、他の統合には影響しない
                })
            )
        );

        return { success: true };
    } catch (error) {
        console.error('Failed to notify integrations:', error);
        return { success: false, error: 'Failed to notify integrations' };
    }
}

/**
 * 統合に通知を送信（内部関数）
 */
async function sendToIntegration(integration: any, note: any) {
    switch (integration.provider) {
        case 'slack':
            if (integration.webhookUrl) {
                await fetch(integration.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `新しい議事録が生成されました: ${note.title}`,
                        blocks: [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: `*${note.title}*\n${note.summary || '要約なし'}`,
                                },
                            },
                        ],
                    }),
                });
            }
            break;
        case 'notion':
            if (integration.accessToken) {
                // Notion APIを使用してページを作成
                const notionDatabaseId = integration.settings?.databaseId;
                if (notionDatabaseId) {
                    await fetch('https://api.notion.com/v1/pages', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${integration.accessToken}`,
                            'Content-Type': 'application/json',
                            'Notion-Version': '2022-06-28',
                        },
                        body: JSON.stringify({
                            parent: { database_id: notionDatabaseId },
                            properties: {
                                'Title': {
                                    title: [{ text: { content: note.title } }],
                                },
                                'Summary': {
                                    rich_text: [{ text: { content: note.summary || '' } }],
                                },
                                'Date': {
                                    date: { start: note.meetingDate?.toISOString() || new Date().toISOString() },
                                },
                            },
                            children: note.formattedMinutes ? [
                                {
                                    object: 'block',
                                    type: 'paragraph',
                                    paragraph: {
                                        rich_text: [{ type: 'text', text: { content: note.formattedMinutes.substring(0, 2000) } }],
                                    },
                                },
                            ] : [],
                        }),
                    });
                }
            }
            break;
        case 'hubspot':
            if (integration.accessToken) {
                // HubSpot APIを使用してレコードを作成
                const contactId = integration.settings?.contactId;
                if (contactId) {
                    await fetch(`https://api.hubapi.com/crm/v3/objects/notes`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${integration.accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            properties: {
                                hs_note_body: note.summary || note.formattedMinutes || '',
                                hs_timestamp: new Date().toISOString(),
                            },
                            associations: [
                                {
                                    to: { id: contactId },
                                    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }],
                                },
                            ],
                        }),
                    });
                }
            }
            break;
        case 'salesforce':
            if (integration.accessToken && integration.settings?.instanceUrl) {
                // Salesforce APIを使用してレコードを作成
                const objectType = integration.settings?.objectType || 'Note__c';
                await fetch(`${integration.settings.instanceUrl}/services/data/v58.0/sobjects/${objectType}/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${integration.accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Title__c: note.title,
                        Summary__c: note.summary || '',
                        Content__c: note.formattedMinutes || '',
                        Meeting_Date__c: note.meetingDate?.toISOString() || new Date().toISOString(),
                    }),
                });
            }
            break;
    }
}

