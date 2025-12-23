'use server';

import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type BackgroundTheme = 'default' | 'white' | 'gradient-cool' | 'gradient-warm';

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
        // テーブルが存在しない場合、エラーをログに記録するが、アプリケーションは続行
        if (error?.message?.includes('no such table') || error?.code === 'SQLITE_UNKNOWN') {
            console.warn('User settings table does not exist yet, theme update skipped');
            return { success: false, error: 'Settings table not available. Please run database migrations.' };
        }
        console.error('Failed to update background theme:', error);
        return { success: false, error: 'Failed to update theme' };
    }
}

