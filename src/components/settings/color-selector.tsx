'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getUserSettings, updateColorSettings, type ColorSettings } from '@/server/actions/user-settings';
import { useRouter } from 'next/navigation';

const PRESET_COLORS = [
    { name: 'アクア', primary: '#00D4AA', accent: '#0D7377' },
    { name: 'ブルー', primary: '#3B82F6', accent: '#1E40AF' },
    { name: 'パープル', primary: '#8B5CF6', accent: '#6D28D9' },
    { name: 'ピンク', primary: '#EC4899', accent: '#BE185D' },
    { name: 'オレンジ', primary: '#F97316', accent: '#C2410C' },
    { name: 'グリーン', primary: '#10B981', accent: '#047857' },
];

export function ColorSelector() {
    const [colors, setColors] = useState<ColorSettings>({ primaryColor: '#00D4AA', accentColor: '#0D7377' });
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        // CSS変数を更新して色を適用
        if (typeof document !== 'undefined') {
            document.documentElement.style.setProperty('--primary', colors.primaryColor);
            document.documentElement.style.setProperty('--accent', colors.accentColor);
        }
    }, [colors]);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const result = await getUserSettings();
            if (result.success && result.settings) {
                setColors({
                    primaryColor: result.settings.primaryColor || '#00D4AA',
                    accentColor: result.settings.accentColor || '#0D7377',
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleColorChange = async (newColors: ColorSettings) => {
        setIsUpdating(true);
        try {
            const result = await updateColorSettings(newColors);
            if (result.success) {
                setColors(newColors);
                toast.success('色設定を更新しました');
                router.refresh();
            } else {
                toast.error(result.error || '色設定の更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to update colors:', error);
            toast.error('色設定の更新中にエラーが発生しました');
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePresetSelect = (preset: typeof PRESET_COLORS[0]) => {
        handleColorChange({
            primaryColor: preset.primary,
            accentColor: preset.accent,
        });
    };

    const handleCustomColorChange = (type: 'primary' | 'accent', value: string) => {
        const newColors = {
            ...colors,
            [type === 'primary' ? 'primaryColor' : 'accentColor']: value,
        };
        setColors(newColors);
    };

    const handleCustomColorSave = () => {
        handleColorChange(colors);
    };

    if (isLoading) {
        return (
            <Card className="glass border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Palette className="h-5 w-5 text-primary" />
                        色設定
                    </CardTitle>
                    <CardDescription className="text-gray-400">アプリケーションの色をカスタマイズ</CardDescription>
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
                    色設定
                </CardTitle>
                <CardDescription className="text-gray-400">アプリケーションのプライマリカラーとアクセントカラーをカスタマイズします</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* プリセットカラー */}
                <div>
                    <Label className="text-white mb-3 block">プリセットカラー</Label>
                    <div className="grid grid-cols-3 gap-3">
                        {PRESET_COLORS.map((preset) => {
                            const isSelected = colors.primaryColor === preset.primary && colors.accentColor === preset.accent;
                            return (
                                <button
                                    key={preset.name}
                                    onClick={() => handlePresetSelect(preset)}
                                    disabled={isUpdating}
                                    className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                                        isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div
                                            className="w-8 h-8 rounded-full border-2 border-white/20"
                                            style={{ backgroundColor: preset.primary }}
                                        />
                                        <div
                                            className="w-8 h-8 rounded-full border-2 border-white/20"
                                            style={{ backgroundColor: preset.accent }}
                                        />
                                    </div>
                                    <p className="text-sm text-white font-medium">{preset.name}</p>
                                    {isSelected && (
                                        <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* カスタムカラー */}
                <div className="space-y-4">
                    <Label className="text-white">カスタムカラー</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">プライマリカラー</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={colors.primaryColor}
                                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                                    className="w-16 h-10 p-1 border border-white/10 rounded cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={colors.primaryColor}
                                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                                    placeholder="#00D4AA"
                                    className="flex-1 bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">アクセントカラー</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={colors.accentColor}
                                    onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                                    className="w-16 h-10 p-1 border border-white/10 rounded cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={colors.accentColor}
                                    onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                                    placeholder="#0D7377"
                                    className="flex-1 bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleCustomColorSave}
                        disabled={isUpdating}
                        className="w-full bg-primary hover:bg-primary/90 text-black"
                    >
                        {isUpdating ? '保存中...' : 'カスタムカラーを保存'}
                    </Button>
                </div>

                {/* プレビュー */}
                <div className="space-y-2">
                    <Label className="text-white">プレビュー</Label>
                    <div className="p-4 rounded-lg border border-white/10 bg-white/5 space-y-3">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: colors.primaryColor }}
                            >
                                A
                            </div>
                            <div>
                                <p className="text-white font-medium">プライマリカラー</p>
                                <p className="text-xs text-gray-400">{colors.primaryColor}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: colors.accentColor }}
                            >
                                A
                            </div>
                            <div>
                                <p className="text-white font-medium">アクセントカラー</p>
                                <p className="text-xs text-gray-400">{colors.accentColor}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
