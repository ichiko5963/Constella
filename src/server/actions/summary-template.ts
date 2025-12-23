'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { summaryTemplates } from '@/db/schema';
import { eq, or, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface SummaryTemplate {
    id: number;
    userId: string | null;
    name: string;
    description: string | null;
    prompt: string;
    outputFormat: string;
    variables: string[] | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 要約テンプレートを取得
 */
export async function getSummaryTemplates() {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // システムデフォルトとユーザー独自のテンプレートを取得
        const templates = await db.query.summaryTemplates.findMany({
            where: (templates, { or, eq, isNull }) => or(
                eq(templates.userId, session.user.id),
                isNull(templates.userId)
            ),
            orderBy: (templates, { desc, asc }) => [
                desc(templates.isDefault),
                asc(templates.createdAt),
            ],
        });

        return {
            success: true,
            templates: templates.map(t => ({
                id: t.id,
                userId: t.userId,
                name: t.name,
                description: t.description,
                prompt: t.prompt,
                outputFormat: t.outputFormat || 'markdown',
                variables: t.variables ? JSON.parse(t.variables) : [],
                isDefault: t.isDefault || false,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get summary templates:', error);
        return { success: false, error: 'Failed to retrieve templates' };
    }
}

/**
 * 要約テンプレートを作成
 */
export async function createSummaryTemplate(
    name: string,
    description: string | null,
    prompt: string,
    outputFormat: string = 'markdown',
    variables: string[] = [],
    isDefault: boolean = false
): Promise<{ success: boolean; templateId?: number; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // デフォルトテンプレートを設定する場合、既存のデフォルトを解除
        if (isDefault) {
            await db.update(summaryTemplates)
                .set({ isDefault: false })
                .where(eq(summaryTemplates.userId, session.user.id));
        }

        const [inserted] = await db.insert(summaryTemplates).values({
            userId: session.user.id,
            name,
            description: description || null,
            prompt,
            outputFormat,
            variables: JSON.stringify(variables),
            isDefault,
        }).returning();

        revalidatePath('/settings');
        return { success: true, templateId: inserted.id };
    } catch (error) {
        console.error('Failed to create summary template:', error);
        return { success: false, error: 'Failed to create template' };
    }
}

/**
 * 要約テンプレートを更新
 */
export async function updateSummaryTemplate(
    templateId: number,
    name?: string,
    description?: string | null,
    prompt?: string,
    outputFormat?: string,
    variables?: string[],
    isDefault?: boolean
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const existing = await db.query.summaryTemplates.findFirst({
            where: eq(summaryTemplates.id, templateId),
        });

        if (!existing || (existing.userId !== session.user.id && existing.userId !== null)) {
            return { success: false, error: 'Template not found or unauthorized' };
        }

        // デフォルトテンプレートを設定する場合、既存のデフォルトを解除
        if (isDefault && existing.userId === session.user.id) {
            await db.update(summaryTemplates)
                .set({ isDefault: false })
                .where(eq(summaryTemplates.userId, session.user.id));
        }

        await db.update(summaryTemplates)
            .set({
                name: name ?? existing.name,
                description: description !== undefined ? description : existing.description,
                prompt: prompt ?? existing.prompt,
                outputFormat: outputFormat ?? existing.outputFormat,
                variables: variables !== undefined ? JSON.stringify(variables) : existing.variables,
                isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
                updatedAt: new Date(),
            })
            .where(eq(summaryTemplates.id, templateId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update summary template:', error);
        return { success: false, error: 'Failed to update template' };
    }
}

/**
 * 要約テンプレートを削除
 */
export async function deleteSummaryTemplate(templateId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const existing = await db.query.summaryTemplates.findFirst({
            where: eq(summaryTemplates.id, templateId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Template not found or unauthorized' };
        }

        await db.delete(summaryTemplates)
            .where(eq(summaryTemplates.id, templateId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete summary template:', error);
        return { success: false, error: 'Failed to delete template' };
    }
}

/**
 * デフォルトテンプレートを取得
 */
export async function getDefaultSummaryTemplate() {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // ユーザーのデフォルトテンプレートを探す
        const userDefault = await db.query.summaryTemplates.findFirst({
            where: (templates, { and, eq }) => and(
                eq(templates.userId, session.user.id),
                eq(templates.isDefault, true)
            ),
        });

        if (userDefault) {
            return {
                success: true,
                template: {
                    id: userDefault.id,
                    name: userDefault.name,
                    prompt: userDefault.prompt,
                    outputFormat: userDefault.outputFormat || 'markdown',
                    variables: userDefault.variables ? JSON.parse(userDefault.variables) : [],
                },
            };
        }

        // システムデフォルトテンプレートを返す
        return {
            success: true,
            template: {
                id: 0,
                name: '標準テンプレート',
                prompt: `以下の会議の文字起こしから、プロフェッショナルな議事録を作成してください。

JSON形式で出力してください。フォーマット:
{
  "summary": "全体の要約",
  "keyPoints": ["要点1", "要点2"],
  "decisions": ["決定事項1"],
  "actionItems": [
    {"title": "タスク名", "assignee": "担当者推定", "dueDate": "期限推定"}
  ]
}

文字起こし:
{{transcription}}`,
                outputFormat: 'markdown',
                variables: ['transcription'],
            },
        };
    } catch (error) {
        console.error('Failed to get default summary template:', error);
        return { success: false, error: 'Failed to retrieve default template' };
    }
}

