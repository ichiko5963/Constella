'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { customPrompts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getCustomPrompts() {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const prompts = await db.query.customPrompts.findMany({
            where: eq(customPrompts.userId, session.user.id),
            orderBy: (prompts, { desc }) => [desc(prompts.createdAt)],
        });

        return {
            success: true,
            prompts: prompts.map(p => ({
                id: p.id,
                name: p.name,
                prompt: p.prompt,
                variables: p.variables ? JSON.parse(p.variables) : null,
                isDefault: p.isDefault ?? false, // nullの場合はfalseに変換
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            })),
        };
    } catch (error) {
        console.error('Failed to get custom prompts:', error);
        return { success: false, error: 'Failed to retrieve prompts' };
    }
}

export async function createCustomPrompt(
    name: string,
    prompt: string,
    variables?: Record<string, any>,
    isDefault?: boolean
): Promise<{ success: boolean; error?: string; promptId?: number }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // デフォルトプロンプトを設定する場合、既存のデフォルトを解除
        if (isDefault) {
            await db.update(customPrompts)
                .set({ isDefault: false })
                .where(eq(customPrompts.userId, session.user.id));
        }

        const [inserted] = await db.insert(customPrompts).values({
            userId: session.user.id,
            name,
            prompt,
            variables: variables ? JSON.stringify(variables) : null,
            isDefault: isDefault || false,
        }).returning();

        revalidatePath('/settings');
        return { success: true, promptId: inserted.id };
    } catch (error) {
        console.error('Failed to create custom prompt:', error);
        return { success: false, error: 'Failed to create prompt' };
    }
}

export async function updateCustomPrompt(
    promptId: number,
    name?: string,
    prompt?: string,
    variables?: Record<string, any>,
    isDefault?: boolean
): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // プロンプトの所有確認
        const existing = await db.query.customPrompts.findFirst({
            where: eq(customPrompts.id, promptId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Prompt not found or unauthorized' };
        }

        // デフォルトプロンプトを設定する場合、既存のデフォルトを解除
        if (isDefault) {
            await db.update(customPrompts)
                .set({ isDefault: false })
                .where(eq(customPrompts.userId, session.user.id));
        }

        await db.update(customPrompts)
            .set({
                name: name ?? existing.name,
                prompt: prompt ?? existing.prompt,
                variables: variables !== undefined ? JSON.stringify(variables) : existing.variables,
                isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
                updatedAt: new Date(),
            })
            .where(eq(customPrompts.id, promptId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to update custom prompt:', error);
        return { success: false, error: 'Failed to update prompt' };
    }
}

export async function deleteCustomPrompt(promptId: number): Promise<{ success: boolean; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // プロンプトの所有確認
        const existing = await db.query.customPrompts.findFirst({
            where: eq(customPrompts.id, promptId),
        });

        if (!existing || existing.userId !== session.user.id) {
            return { success: false, error: 'Prompt not found or unauthorized' };
        }

        await db.delete(customPrompts)
            .where(eq(customPrompts.id, promptId));

        revalidatePath('/settings');
        return { success: true };
    } catch (error) {
        console.error('Failed to delete custom prompt:', error);
        return { success: false, error: 'Failed to delete prompt' };
    }
}

export async function getDefaultPrompt(): Promise<{ success: boolean; prompt?: string; error?: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const defaultPrompt = await db.query.customPrompts.findFirst({
            where: (prompts, { and, eq }) => and(
                eq(prompts.userId, session.user.id),
                eq(prompts.isDefault, true)
            ),
        });

        if (defaultPrompt) {
            return { success: true, prompt: defaultPrompt.prompt };
        }

        // デフォルトプロンプトがない場合は、システムデフォルトを返す
        return {
            success: true,
            prompt: `あなたはActory AIです。プロジェクトと会議議事録を管理するための有用なアシスタントです。
ユーザーの会議議事録とプロジェクトのコンテキストにアクセスできます。

提供されたコンテキストに基づいてユーザーの質問に答えてください。答えがわからない場合は、丁寧にその旨を伝えてください。
回答は簡潔で専門的にしてください。日本語で回答してください。`,
        };
    } catch (error) {
        console.error('Failed to get default prompt:', error);
        return { success: false, error: 'Failed to retrieve default prompt' };
    }
}

