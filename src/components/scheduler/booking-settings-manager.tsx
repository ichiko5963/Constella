'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    createBookingSetting,
    getBookingSettings,
    updateBookingSetting,
    deleteBookingSetting
} from '@/server/actions/booking';
import { toast } from 'sonner';
import { Copy, ExternalLink, Trash2, Edit, Plus, Check, X, Clock, Calendar } from 'lucide-react';

interface BookingSettingsManagerProps {
    compact?: boolean;
}

export function BookingSettingsManager({ compact = false }: BookingSettingsManagerProps) {
    const [settings, setSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '予約可能な時間',
        description: '',
        duration: 30,
        bufferTime: 0,
        businessHoursStart: 9,
        businessHoursEnd: 18,
        availableDays: [1, 2, 3, 4, 5] as number[],
        timezone: 'Asia/Tokyo',
        autoGenerateMeetLink: true,
        autoJoinActory: true,
        autoRecord: false,
    });
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const result = await getBookingSettings();
            if (result.success && result.settings) {
                setSettings(result.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const result = await createBookingSetting(formData);
            if (result.success) {
                toast.success('予約設定を作成しました');
                setShowCreateForm(false);
                setFormData({
                    title: '予約可能な時間',
                    description: '',
                    duration: 30,
                    bufferTime: 0,
                    businessHoursStart: 9,
                    businessHoursEnd: 18,
                    availableDays: [1, 2, 3, 4, 5],
                    timezone: 'Asia/Tokyo',
                    autoGenerateMeetLink: true,
                    autoJoinActory: true,
                    autoRecord: false,
                });
                loadSettings();
            } else {
                toast.error(result.error || '作成に失敗しました');
            }
        } catch (error) {
            console.error('Failed to create setting:', error);
            toast.error('エラーが発生しました');
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            const result = await updateBookingSetting(id, formData);
            if (result.success) {
                toast.success('予約設定を更新しました');
                setEditingId(null);
                loadSettings();
            } else {
                toast.error(result.error || '更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
            toast.error('エラーが発生しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('この予約設定を削除しますか？')) return;

        try {
            const result = await deleteBookingSetting(id);
            if (result.success) {
                toast.success('予約設定を削除しました');
                loadSettings();
            } else {
                toast.error(result.error || '削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete setting:', error);
            toast.error('エラーが発生しました');
        }
    };

    const copyBookingUrl = (token: string) => {
        const url = `${window.location.origin}/book/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        toast.success('予約URLをコピーしました');
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const getBookingUrl = (token: string) => {
        return `${window.location.origin}/book/${token}`;
    };

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500">読み込み中...</div>;
    }

    // Compact view for sidebar
    if (compact) {
        return (
            <div className="space-y-3">
                {/* Create Button */}
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    size="sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    新しい予約URL
                </Button>

                {/* Create Form - Compact */}
                {showCreateForm && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-600">タイトル</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="予約可能な時間"
                                className="h-8 text-sm bg-white border-gray-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-600">時間(分)</Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                    className="h-8 text-sm bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-gray-600">開始時間</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursStart}
                                    onChange={(e) => setFormData({ ...formData, businessHoursStart: parseInt(e.target.value) || 9 })}
                                    className="h-8 text-sm bg-white border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="compact-meet"
                                    checked={formData.autoGenerateMeetLink}
                                    onCheckedChange={(checked) => setFormData({ ...formData, autoGenerateMeetLink: checked })}
                                />
                                <Label htmlFor="compact-meet" className="text-xs text-gray-600">Meet自動生成</Label>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} size="sm" className="flex-1 bg-gray-900 hover:bg-gray-800 text-white">
                                作成
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Settings List - Compact */}
                {settings.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                        予約URLがありません
                    </p>
                ) : (
                    <div className="space-y-2">
                        {settings.map((setting) => (
                            <div key={setting.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">{setting.title}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{setting.duration}分</span>
                                            <span>{setting.businessHoursStart}:00-{setting.businessHoursEnd}:00</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(setting.id)}
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyBookingUrl(setting.token)}
                                        className="flex-1 h-7 text-xs"
                                    >
                                        {copiedToken === setting.token ? (
                                            <>
                                                <Check className="w-3 h-3 mr-1 text-green-500" />
                                                コピー済み
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3 mr-1" />
                                                URLをコピー
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(getBookingUrl(setting.token), '_blank')}
                                        className="h-7 w-7 p-0"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Full view
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">予約URL管理</h2>
                    <p className="text-gray-500 text-sm mt-1">予約URLを発行・管理できます</p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    新しい予約URL
                </Button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">新しい予約設定</CardTitle>
                        <CardDescription>予約可能な時間を設定し、URLを発行します</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-700">タイトル</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="予約可能な時間"
                                className="bg-white border-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700">説明</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="予約ページに表示される説明文"
                                className="bg-white border-gray-200"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">会議時間（分）</Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">営業開始</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursStart}
                                    onChange={(e) => setFormData({ ...formData, businessHoursStart: parseInt(e.target.value) || 9 })}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">営業終了</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursEnd}
                                    onChange={(e) => setFormData({ ...formData, businessHoursEnd: parseInt(e.target.value) || 18 })}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="meet-link"
                                checked={formData.autoGenerateMeetLink}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoGenerateMeetLink: checked })}
                            />
                            <Label htmlFor="meet-link" className="text-gray-700">Google Meetリンクを自動生成</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="ai-join"
                                checked={formData.autoJoinActory}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoJoinActory: checked })}
                            />
                            <Label htmlFor="ai-join" className="text-gray-700">Constella AIを自動参加</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} className="bg-gray-900 hover:bg-gray-800 text-white">
                                作成
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                キャンセル
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Settings List */}
            {settings.length === 0 ? (
                <Card className="border-gray-200">
                    <CardContent className="py-12 text-center text-gray-500">
                        予約設定がありません。上記のボタンから作成してください。
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {settings.map((setting) => (
                        <Card key={setting.id} className="border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{setting.title}</h3>
                                        {setting.description && (
                                            <p className="text-gray-500 text-sm mb-3">{setting.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {setting.duration}分
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {setting.businessHoursStart}:00 - {setting.businessHoursEnd}:00
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 truncate max-w-md">
                                                {getBookingUrl(setting.token)}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyBookingUrl(setting.token)}
                                                className="h-8"
                                            >
                                                {copiedToken === setting.token ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(getBookingUrl(setting.token), '_blank')}
                                                className="h-8"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            {setting.autoGenerateMeetLink && (
                                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100">
                                                    Google Meet自動生成
                                                </span>
                                            )}
                                            {setting.autoJoinActory && (
                                                <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded border border-purple-100">
                                                    Constella AI自動参加
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setEditingId(setting.id);
                                                setFormData({
                                                    title: setting.title,
                                                    description: setting.description || '',
                                                    duration: setting.duration,
                                                    bufferTime: setting.bufferTime || 0,
                                                    businessHoursStart: setting.businessHoursStart,
                                                    businessHoursEnd: setting.businessHoursEnd,
                                                    availableDays: setting.availableDays ? JSON.parse(setting.availableDays) : [1, 2, 3, 4, 5],
                                                    timezone: setting.timezone || 'Asia/Tokyo',
                                                    autoGenerateMeetLink: setting.autoGenerateMeetLink,
                                                    autoJoinActory: setting.autoJoinActory,
                                                    autoRecord: setting.autoRecord || false,
                                                });
                                            }}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            編集
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(setting.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Form */}
            {editingId && (
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">予約設定を編集</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-700">タイトル</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-white border-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-700">説明</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-white border-gray-200"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">会議時間（分）</Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">営業開始</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursStart}
                                    onChange={(e) => setFormData({ ...formData, businessHoursStart: parseInt(e.target.value) || 9 })}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">営業終了</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursEnd}
                                    onChange={(e) => setFormData({ ...formData, businessHoursEnd: parseInt(e.target.value) || 18 })}
                                    className="bg-white border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-meet"
                                checked={formData.autoGenerateMeetLink}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoGenerateMeetLink: checked })}
                            />
                            <Label htmlFor="edit-meet" className="text-gray-700">Google Meetリンクを自動生成</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-ai"
                                checked={formData.autoJoinActory}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoJoinActory: checked })}
                            />
                            <Label htmlFor="edit-ai" className="text-gray-700">Constella AIを自動参加</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => handleUpdate(editingId)} className="bg-gray-900 hover:bg-gray-800 text-white">
                                更新
                            </Button>
                            <Button variant="outline" onClick={() => setEditingId(null)}>
                                キャンセル
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
