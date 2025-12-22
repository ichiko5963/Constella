'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Save, X, Tag, Clock } from 'lucide-react';
import { getSnippets, createSnippet, updateSnippet, deleteSnippet } from '@/server/actions/snippet';
import { toast } from 'sonner';

interface Snippet {
    id: number;
    noteId: number | null;
    title: string;
    content: string;
    tags: string[];
    startTime: number | null;
    endTime: number | null;
    createdAt: Date;
    updatedAt: Date;
}

interface SnippetManagerProps {
    noteId?: number;
    currentTime?: number; // 現在の再生時間（秒）
    onJumpToTime?: (time: number) => void; // 時間にジャンプするコールバック
}

export function SnippetManager({ noteId, currentTime, onJumpToTime }: SnippetManagerProps) {
    const [snippets, setSnippets] = useState<Snippet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: [] as string[],
        startTime: currentTime || undefined,
        endTime: undefined as number | undefined,
    });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        loadSnippets();
    }, [noteId]);

    const loadSnippets = async () => {
        setIsLoading(true);
        try {
            const result = await getSnippets(noteId);
            if (result.success && result.snippets) {
                setSnippets(result.snippets);
            }
        } catch (error) {
            console.error('Failed to load snippets:', error);
            toast.error('スニペットの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setIsCreating(true);
        setFormData({
            title: '',
            content: '',
            tags: [],
            startTime: currentTime || undefined,
            endTime: undefined,
        });
        setTagInput('');
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            toast.error('タイトルと内容を入力してください');
            return;
        }

        try {
            if (editingId) {
                const result = await updateSnippet(
                    editingId,
                    formData.title,
                    formData.content,
                    formData.tags
                );
                if (result.success) {
                    toast.success('スニペットを更新しました');
                    setEditingId(null);
                    loadSnippets();
                } else {
                    toast.error(result.error || '更新に失敗しました');
                }
            } else {
                const result = await createSnippet(
                    noteId || null,
                    formData.title,
                    formData.content,
                    formData.tags,
                    formData.startTime,
                    formData.endTime
                );
                if (result.success) {
                    toast.success('スニペットを作成しました');
                    setIsCreating(false);
                    setFormData({ title: '', content: '', tags: [], startTime: undefined, endTime: undefined });
                    setTagInput('');
                    loadSnippets();
                } else {
                    toast.error(result.error || '作成に失敗しました');
                }
            }
        } catch (error) {
            console.error('Failed to save snippet:', error);
            toast.error('保存中にエラーが発生しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このスニペットを削除しますか？')) return;

        try {
            const result = await deleteSnippet(id);
            if (result.success) {
                toast.success('スニペットを削除しました');
                loadSnippets();
            } else {
                toast.error(result.error || '削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete snippet:', error);
            toast.error('削除中にエラーが発生しました');
        }
    };

    const handleEdit = (snippet: Snippet) => {
        setEditingId(snippet.id);
        setFormData({
            title: snippet.title,
            content: snippet.content,
            tags: snippet.tags,
            startTime: snippet.startTime || undefined,
            endTime: snippet.endTime || undefined,
        });
        setIsCreating(false);
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData({ title: '', content: '', tags: [], startTime: undefined, endTime: undefined });
        setTagInput('');
    };

    const formatTime = (seconds: number | null | undefined) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>スニペット</CardTitle>
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
                    <CardTitle>スニペット</CardTitle>
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
                                <Label>タイトル</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="スニペットのタイトル"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>内容</Label>
                                <Textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="スニペットの内容"
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>開始時間（秒）</Label>
                                    <Input
                                        type="number"
                                        value={formData.startTime || ''}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>終了時間（秒）</Label>
                                    <Input
                                        type="number"
                                        value={formData.endTime || ''}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>タグ</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                        placeholder="タグを追加"
                                    />
                                    <Button type="button" onClick={handleAddTag} size="sm">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="hover:text-red-400"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
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

                {snippets.length === 0 && !isCreating ? (
                    <div className="text-center py-8 text-gray-500">
                        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>スニペットがありません</p>
                        <p className="text-sm mt-2">新規作成ボタンからスニペットを作成してください</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {snippets.map((snippet) => (
                            <Card key={snippet.id}>
                                <CardContent className="p-4">
                                    {editingId === snippet.id ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>タイトル</Label>
                                                <Input
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>内容</Label>
                                                <Textarea
                                                    value={formData.content}
                                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                    rows={4}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>タグ</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={tagInput}
                                                        onChange={(e) => setTagInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddTag();
                                                            }
                                                        }}
                                                        placeholder="タグを追加"
                                                    />
                                                    <Button type="button" onClick={handleAddTag} size="sm">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {formData.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {formData.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1"
                                                            >
                                                                {tag}
                                                                <button
                                                                    onClick={() => handleRemoveTag(tag)}
                                                                    className="hover:text-red-400"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
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
                                                    <h3 className="font-semibold text-white mb-2">{snippet.title}</h3>
                                                    <p className="text-sm text-gray-400 mb-2">{snippet.content}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        {snippet.startTime !== null && (
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTime(snippet.startTime)}
                                                                {snippet.endTime !== null && ` - ${formatTime(snippet.endTime)}`}
                                                            </div>
                                                        )}
                                                        {snippet.tags.length > 0 && (
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                <Tag className="h-3 w-3" />
                                                                {snippet.tags.map((tag) => (
                                                                    <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {snippet.startTime !== null && onJumpToTime && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onJumpToTime(snippet.startTime!)}
                                                            title="この時間にジャンプ"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(snippet)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(snippet.id)}
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
