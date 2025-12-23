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
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                        <Palette className="h-4 w-4 text-primary" />
                        色設定
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/10 bg-black/40">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Palette className="h-4 w-4 text-primary" />
                    色設定
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
                {/* プリセットカラー */}
                <div>
                    <Label className="text-gray-400 text-xs mb-2 block">プリセットカラー</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {PRESET_COLORS.map((preset) => {
                            const isSelected = colors.primaryColor === preset.primary && colors.accentColor === preset.accent;
                            return (
                                <button
                                    key={preset.name}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePresetSelect(preset);
                                    }}
                                    disabled={isUpdating}
                                    className={`relative p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-white/10 bg-white/5 hover:border-white/20'
                                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                                        <div
                                            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                                            style={{ backgroundColor: preset.primary }}
                                        />
                                        <div
                                            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                                            style={{ backgroundColor: preset.accent }}
                                        />
                                    </div>
                                    <p className="text-xs text-white font-medium text-center">{preset.name}</p>
                                    {isSelected && (
                                        <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* カスタムカラー */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                    <Label className="text-gray-400 text-xs">カスタムカラー</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-gray-500 text-xs">プライマリ</Label>
                            <div className="flex gap-1.5">
                                <Input
                                    type="color"
                                    value={colors.primaryColor}
                                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                                    className="w-12 h-8 p-0.5 border border-white/10 rounded cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={colors.primaryColor}
                                    onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                                    placeholder="#00D4AA"
                                    className="flex-1 h-8 text-xs bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-500 text-xs">アクセント</Label>
                            <div className="flex gap-1.5">
                                <Input
                                    type="color"
                                    value={colors.accentColor}
                                    onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                                    className="w-12 h-8 p-0.5 border border-white/10 rounded cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={colors.accentColor}
                                    onChange={(e) => handleCustomColorChange('accent', e.target.value)}
                                    placeholder="#0D7377"
                                    className="flex-1 h-8 text-xs bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCustomColorSave();
                        }}
                        disabled={isUpdating}
                        className="w-full h-8 text-xs bg-primary hover:bg-primary/90 text-black"
                    >
                        {isUpdating ? '保存中...' : '保存'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
