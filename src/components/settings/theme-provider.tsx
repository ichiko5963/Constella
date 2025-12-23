'use client';

import { useEffect } from 'react';
import { getUserSettings } from '@/server/actions/user-settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const applyTheme = async () => {
            try {
                const result = await getUserSettings();
                if (result.success && result.settings) {
                    const theme = result.settings.backgroundTheme || 'default';
                    const body = document.body;
                    // 既存のテーマクラスを削除
                    body.classList.remove('theme-default', 'theme-white', 'theme-gradient-cool', 'theme-gradient-warm');
                    // 新しいテーマクラスを追加
                    body.classList.add(`theme-${theme}`);
                    
                    // 色設定を適用
                    if (result.settings.primaryColor) {
                        document.documentElement.style.setProperty('--primary', result.settings.primaryColor);
                    }
                    if (result.settings.accentColor) {
                        document.documentElement.style.setProperty('--accent', result.settings.accentColor);
                    }
                }
            } catch (error) {
                console.error('Failed to apply theme:', error);
            }
        };

        applyTheme();
    }, []);

    return <>{children}</>;
}

