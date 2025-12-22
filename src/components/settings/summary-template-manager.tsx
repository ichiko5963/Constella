'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, Save, X, FileText } from 'lucide-react';
import { getSummaryTemplates, createSummaryTemplate, updateSummaryTemplate, deleteSummaryTemplate } from '@/server/actions/summary-template';
import { toast } from 'sonner';

interface SummaryTemplate {
    id: number;
    userId: string | null;
    name: string;
    description: string | null;
    prompt: string;
    outputFormat: string;
    variables: string[];
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export function SummaryTemplateManager() {
    const [templates, setTemplates] = useState<SummaryTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
        outputFormat: 'markdown',
        variables: [] as string[],
        isDefault: false,
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const result = await getSummaryTemplates();
            if (result.success && result.templates) {
                setTemplates(result.templates);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('テンプレートの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setIsCreating(true);
        setFormData({
            name: '',
            description: '',
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
            isDefault: false,
        });
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.prompt.trim()) {
            toast.error('名前とプロンプトを入力してください');
            return;
        }

        try {
            if (editingId) {
                const result = await updateSummaryTemplate(
                    editingId,
                    formData.name,
                    formData.description || null,
                    formData.prompt,
                    formData.outputFormat,
                    formData.variables,
                    formData.isDefault
                );
                if (result.success) {
                    toast.success('テンプレートを更新しました');
                    setEditingId(null);
                    loadTemplates();
                } else {
                    toast.error(result.error || '更新に失敗しました');
                }
            } else {
                const result = await createSummaryTemplate(
                    formData.name,
                    formData.description || null,
                    formData.prompt,
                    formData.outputFormat,
                    formData.variables,
                    formData.isDefault
                );
                if (result.success) {
                    toast.success('テンプレートを作成しました');
                    setIsCreating(false);
                    setFormData({ name: '', description: '', prompt: '', outputFormat: 'markdown', variables: [], isDefault: false });
                    loadTemplates();
                } else {
                    toast.error(result.error || '作成に失敗しました');
                }
            }
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('保存中にエラーが発生しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このテンプレートを削除しますか？')) return;

        try {
            const result = await deleteSummaryTemplate(id);
            if (result.success) {
                toast.success('テンプレートを削除しました');
                loadTemplates();
            } else {
                toast.error(result.error || '削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('削除中にエラーが発生しました');
        }
    };

    const handleEdit = (template: SummaryTemplate) => {
        setEditingId(template.id);
        setFormData({
            name: template.name,
            description: template.description || '',
            prompt: template.prompt,
            outputFormat: template.outputFormat,
            variables: template.variables || [],
            isDefault: template.isDefault,
        });
        setIsCreating(false);
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({ name: '', description: '', prompt: '', outputFormat: 'markdown', variables: [], isDefault: false });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>AI要約テンプレート</CardTitle>
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
                            <FileText className="h-5 w-5 text-primary" />
                            AI要約テンプレート
                        </CardTitle>
                        <CardDescription>
                            会議要約の生成に使用するプロンプトテンプレートを管理
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
                                <Label>テンプレート名</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="例: 標準議事録テンプレート"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>説明</Label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="テンプレートの説明"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>プロンプト</Label>
                                <Textarea
                                    value={formData.prompt}
                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                    placeholder="プロンプトテンプレート（{{変数名}}で変数を指定）"
                                    rows={10}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>出力形式</Label>
                                    <Select
                                        value={formData.outputFormat}
                                        onValueChange={(value) => setFormData({ ...formData, outputFormat: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="markdown">Markdown</SelectItem>
                                            <SelectItem value="json">JSON</SelectItem>
                                            <SelectItem value="plain">プレーンテキスト</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex items-end">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={formData.isDefault}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                                        />
                                        <Label>デフォルトとして設定</Label>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={handleCancel}>
                                    <X className="h-4 w-4 mr-2" />
                                    キャンセル
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                    <Save className="h-4 w-4 mr-2" />
                                    保存
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {templates.length === 0 && !isCreating ? (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>テンプレートがありません</p>
                        <p className="text-sm mt-2">新規作成ボタンからテンプレートを作成してください</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {templates.map((template) => (
                            <Card key={template.id}>
                                <CardContent className="p-4">
                                    {editingId === template.id ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>テンプレート名</Label>
                                                <Input
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>説明</Label>
                                                <Input
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>プロンプト</Label>
                                                <Textarea
                                                    value={formData.prompt}
                                                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                                    rows={10}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>出力形式</Label>
                                                    <Select
                                                        value={formData.outputFormat}
                                                        onValueChange={(value) => setFormData({ ...formData, outputFormat: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="markdown">Markdown</SelectItem>
                                                            <SelectItem value="json">JSON</SelectItem>
                                                            <SelectItem value="plain">プレーンテキスト</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2 flex items-end">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={formData.isDefault}
                                                            onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                                                        />
                                                        <Label>デフォルト</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end">
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
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-white">{template.name}</h3>
                                                        {template.isDefault && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary border border-primary/30">
                                                                デフォルト
                                                            </span>
                                                        )}
                                                        {!template.userId && (
                                                            <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-gray-400 border border-white/10">
                                                                システム
                                                            </span>
                                                        )}
                                                    </div>
                                                    {template.description && (
                                                        <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                                                    )}
                                                    <div className="text-xs text-gray-500">
                                                        出力形式: {template.outputFormat}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {template.userId && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEdit(template)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(template.id)}
                                                                className="text-red-400 hover:text-red-300"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
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
