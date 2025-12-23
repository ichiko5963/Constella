'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getUserSettings, updateBackgroundTheme, type BackgroundTheme } from '@/server/actions/user-settings';
import { useRouter } from 'next/navigation';

const themes: { id: BackgroundTheme; name: string; description: string; preview: string }[] = [
    {
        id: 'default',
        name: 'デフォルト',
        description: '現在のグラデーション背景',
        preview: 'bg-gradient-to-br from-[#020205] via-[#050510] to-[#0a101f]',
    },
    {
        id: 'white',
        name: '白背景',
        description: 'クリーンな白背景',
        preview: 'bg-white',
    },
    {
        id: 'gradient-cool',
        name: 'クールグラデーション',
        description: '青系のクールなグラデーション',
        preview: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900',
    },
    {
        id: 'gradient-warm',
        name: 'ウォームグラデーション',
        description: 'オレンジ・ピンク系の暖かいグラデーション',
        preview: 'bg-gradient-to-br from-orange-900 via-pink-900 to-rose-900',
    },
];

export function BackgroundThemeSelector() {
    const [selectedTheme, setSelectedTheme] = useState<BackgroundTheme>('default');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        // 選択されたテーマをbodyに適用
        applyTheme(selectedTheme);
    }, [selectedTheme]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const result = await getUserSettings();
            if (result.success && result.settings) {
                setSelectedTheme(result.settings.backgroundTheme || 'default');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyTheme = (theme: BackgroundTheme) => {
        const body = document.body;
        // 既存のテーマクラスを削除
        body.classList.remove('theme-default', 'theme-white', 'theme-gradient-cool', 'theme-gradient-warm');
        // 新しいテーマクラスを追加
        body.classList.add(`theme-${theme}`);
    };

    const handleThemeChange = async (theme: BackgroundTheme) => {
        setIsUpdating(true);
        try {
            const result = await updateBackgroundTheme(theme);
            if (result.success) {
                setSelectedTheme(theme);
                toast.success('背景テーマを更新しました');
                router.refresh();
            } else {
                toast.error(result.error || 'テーマの更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to update theme:', error);
            toast.error('テーマの更新中にエラーが発生しました');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="glass border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Palette className="h-5 w-5 text-primary" />
                        背景テーマ
                    </CardTitle>
                    <CardDescription className="text-gray-400">アプリケーションの背景をカスタマイズ</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/10 bg-black/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Palette className="h-5 w-5 text-primary" />
                    背景テーマ
                </CardTitle>
                <CardDescription className="text-gray-400">アプリケーションの背景をカスタマイズします</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            disabled={isUpdating}
                            className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                                selectedTheme === theme.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-white mb-1">{theme.name}</h3>
                                    <p className="text-xs text-gray-400">{theme.description}</p>
                                </div>
                                {selectedTheme === theme.id && (
                                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                )}
                            </div>
                            <div className={`w-full h-16 rounded ${theme.preview} border border-white/10`} />
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

