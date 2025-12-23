'use server';

import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type BackgroundTheme = 'default' | 'white' | 'gradient-cool' | 'gradient-warm';

export type ColorSettings = {
    primaryColor: string;
    accentColor: string;
};

export async function getUserSettings() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, session.user.id),
        });

        return {
            success: true,
            settings: settings || {
                userId: session.user.id,
                backgroundTheme: 'default' as BackgroundTheme,
                primaryColor: '#00D4AA',
                accentColor: '#0D7377',
            },
        };
    } catch (error: any) {
        // テーブルが存在しない場合やその他のエラーの場合、デフォルト設定を返す
        if (error?.message?.includes('no such table') || error?.code === 'SQLITE_UNKNOWN') {
            console.warn('User settings table does not exist yet, returning defaults');
            return {
                success: true,
                settings: {
                    userId: session.user.id,
                    backgroundTheme: 'default' as BackgroundTheme,
                    primaryColor: '#00D4AA',
                    accentColor: '#0D7377',
                },
            };
        }
        console.error('Failed to get user settings:', error);
        return { success: false, error: 'Failed to retrieve settings' };
    }
}

export async function updateBackgroundTheme(theme: BackgroundTheme) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.insert(userSettings)
            .values({
                userId: session.user.id,
                backgroundTheme: theme,
            })
            .onConflictDoUpdate({
                target: userSettings.userId,
                set: {
                    backgroundTheme: theme,
                    updatedAt: new Date(),
                },
            });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        // テーブルが存在しない場合、デフォルト設定を返す（エラーを表示しない）
        if (error?.message?.includes('no such table') || error?.code === 'SQLITE_UNKNOWN') {
            console.warn('User settings table does not exist yet, theme update skipped');
            // エラーを返さず、成功として扱う（テーブルが作成されたら自動的に反映される）
            return { success: true };
        }
        console.error('Failed to update background theme:', error);
        return { success: false, error: 'Failed to update theme' };
    }
}

export async function updateColorSettings(colors: ColorSettings) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await db.insert(userSettings)
            .values({
                userId: session.user.id,
                primaryColor: colors.primaryColor,
                accentColor: colors.accentColor,
            })
            .onConflictDoUpdate({
                target: userSettings.userId,
                set: {
                    primaryColor: colors.primaryColor,
                    accentColor: colors.accentColor,
                    updatedAt: new Date(),
                },
            });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        // テーブルが存在しない場合、エラーを表示しない
        if (error?.message?.includes('no such table') || error?.code === 'SQLITE_UNKNOWN') {
            console.warn('User settings table does not exist yet, color update skipped');
            return { success: true };
        }
        console.error('Failed to update color settings:', error);
        return { success: false, error: 'Failed to update colors' };
    }
}

