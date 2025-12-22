'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, Save, X, Sparkles } from 'lucide-react';
import { getCustomPrompts, createCustomPrompt, updateCustomPrompt, deleteCustomPrompt } from '@/server/actions/custom-prompt';
import { toast } from 'sonner';

interface CustomPrompt {
    id: number;
    name: string;
    prompt: string;
    variables?: Record<string, any> | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function CustomPromptManager() {
    const [prompts, setPrompts] = useState<CustomPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        prompt: '',
        isDefault: false,
    });

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        setIsLoading(true);
        try {
            const result = await getCustomPrompts();
            if (result.success && result.prompts) {
                setPrompts(result.prompts);
            }
        } catch (error) {
            console.error('Failed to load prompts:', error);
            toast.error('プロンプトの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setIsCreating(true);
        setFormData({ name: '', prompt: '', isDefault: false });
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.prompt.trim()) {
            toast.error('名前とプロンプトを入力してください');
            return;
        }

        try {
            if (editingId) {
                const result = await updateCustomPrompt(
                    editingId,
                    formData.name,
                    formData.prompt,
                    undefined,
                    formData.isDefault
                );
                if (result.success) {
                    toast.success('プロンプトを更新しました');
                    setEditingId(null);
                    loadPrompts();
                } else {
                    toast.error(result.error || '更新に失敗しました');
                }
            } else {
                const result = await createCustomPrompt(
                    formData.name,
                    formData.prompt,
                    undefined,
                    formData.isDefault
                );
                if (result.success) {
                    toast.success('プロンプトを作成しました');
                    setIsCreating(false);
                    setFormData({ name: '', prompt: '', isDefault: false });
                    loadPrompts();
                } else {
                    toast.error(result.error || '作成に失敗しました');
                }
            }
        } catch (error) {
            console.error('Failed to save prompt:', error);
            toast.error('保存中にエラーが発生しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このプロンプトを削除しますか？')) return;

        try {
            const result = await deleteCustomPrompt(id);
            if (result.success) {
                toast.success('プロンプトを削除しました');
                loadPrompts();
            } else {
                toast.error(result.error || '削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete prompt:', error);
            toast.error('削除中にエラーが発生しました');
        }
    };

    const handleEdit = (prompt: CustomPrompt) => {
        setEditingId(prompt.id);
        setFormData({
            name: prompt.name,
            prompt: prompt.prompt,
            isDefault: prompt.isDefault,
        });
        setIsCreating(false);
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({ name: '', prompt: '', isDefault: false });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>カスタムAIプロンプト</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            カスタムAIプロンプト
                        </CardTitle>
                        <CardDescription>
                            AIチャットで使用するカスタムプロンプトを管理
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleCreate}
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        新規作成
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isCreating && (
                    <Card className="border-primary/50 bg-primary/5">
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-name">名前</Label>
                                <Input
                                    id="new-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="例: 技術会議用プロンプト"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-prompt">プロンプト</Label>
                                <Textarea
                                    id="new-prompt"
                                    value={formData.prompt}
                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                    placeholder="あなたはActory AIです..."
                                    rows={6}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="new-default"
                                        checked={formData.isDefault}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                                    />
                                    <Label htmlFor="new-default">デフォルトプロンプトとして設定</Label>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                        <X className="h-4 w-4 mr-2" />
                                        キャンセル
                                    </Button>
                                    <Button size="sm" onClick={handleSave}>
                                        <Save className="h-4 w-4 mr-2" />
                                        保存
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {prompts.length === 0 && !isCreating ? (
                    <div className="text-center py-8 text-gray-500">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>カスタムプロンプトがありません</p>
                        <p className="text-sm mt-2">新規作成ボタンからプロンプトを作成してください</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {prompts.map((prompt) => (
                            <Card
                                key={prompt.id}
                                className={prompt.isDefault ? 'border-primary/50 bg-primary/5' : ''}
                            >
                                <CardContent className="p-4">
                                    {editingId === prompt.id ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>名前</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>プロンプト</Label>
                                                <Textarea
                                                    value={formData.prompt}
                                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                                    rows={6}
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={formData.isDefault}
                                                        onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                                                    />
                                                    <Label>デフォルトプロンプト</Label>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={handleCancel}>
                                                        <X className="h-4 w-4 mr-2" />
                                                        キャンセル
                                                    </Button>
                                                    <Button size="sm" onClick={handleSave}>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        保存
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-white">{prompt.name}</h3>
                                                        {prompt.isDefault && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary border border-primary/30">
                                                                デフォルト
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-400 line-clamp-3 font-mono">
                                                        {prompt.prompt}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(prompt)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(prompt.id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
