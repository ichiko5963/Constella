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
import { Copy, ExternalLink, Trash2, Edit, Plus, Check } from 'lucide-react';

export function BookingSettingsManager() {
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
        return <div className="text-center py-8 text-gray-400">読み込み中...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">予約URL管理</h2>
                    <p className="text-gray-400 mt-1">Spearのような予約URLを発行・管理できます</p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-primary hover:bg-primary/90 text-black"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    新しい予約URLを作成
                </Button>
            </div>

            {/* 作成フォーム */}
            {showCreateForm && (
                <Card className="glass border-white/5">
                    <CardHeader>
                        <CardTitle>新しい予約設定</CardTitle>
                        <CardDescription>予約可能な時間を設定し、URLを発行します</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>タイトル</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="予約可能な時間"
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>説明</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="予約ページに表示される説明文"
                                className="bg-black/40 border-white/10"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>会議時間（分）</Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                    className="bg-black/40 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>営業時間開始</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursStart}
                                    onChange={(e) => setFormData({ ...formData, businessHoursStart: parseInt(e.target.value) || 9 })}
                                    className="bg-black/40 border-white/10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>営業時間終了</Label>
                            <Input
                                type="number"
                                value={formData.businessHoursEnd}
                                onChange={(e) => setFormData({ ...formData, businessHoursEnd: parseInt(e.target.value) || 18 })}
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.autoGenerateMeetLink}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoGenerateMeetLink: checked })}
                            />
                            <Label>Google Meetリンクを自動生成</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.autoJoinActory}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoJoinActory: checked })}
                            />
                            <Label>Actory AIを自動参加</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-black">
                                作成
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                キャンセル
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 設定一覧 */}
            {settings.length === 0 ? (
                <Card className="glass border-white/5">
                    <CardContent className="py-12 text-center text-gray-400">
                        予約設定がありません。上記のボタンから作成してください。
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {settings.map((setting) => (
                        <Card key={setting.id} className="glass border-white/5">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white mb-1">{setting.title}</h3>
                                        {setting.description && (
                                            <p className="text-gray-400 text-sm mb-3">{setting.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                                            <span>会議時間: {setting.duration}分</span>
                                            <span>営業時間: {setting.businessHoursStart}:00 - {setting.businessHoursEnd}:00</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-xs text-gray-500 font-mono bg-black/40 px-2 py-1 rounded">
                                                {getBookingUrl(setting.token)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyBookingUrl(setting.token)}
                                                className="h-8 w-8 p-0"
                                            >
                                                {copiedToken === setting.token ? (
                                                    <Check className="w-4 h-4 text-primary" />
                                                ) : (
                                                    <Copy className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(getBookingUrl(setting.token), '_blank')}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {setting.autoGenerateMeetLink && (
                                                <span className="px-2 py-1 bg-primary/20 text-primary rounded">Google Meet自動生成</span>
                                            )}
                                            {setting.autoJoinActory && (
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Actory AI自動参加</span>
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
                                            className="text-red-400 hover:text-red-300"
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

            {/* 編集フォーム */}
            {editingId && (
                <Card className="glass border-white/5">
                    <CardHeader>
                        <CardTitle>予約設定を編集</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>タイトル</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>説明</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-black/40 border-white/10"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>会議時間（分）</Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                                    className="bg-black/40 border-white/10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>営業時間開始</Label>
                                <Input
                                    type="number"
                                    value={formData.businessHoursStart}
                                    onChange={(e) => setFormData({ ...formData, businessHoursStart: parseInt(e.target.value) || 9 })}
                                    className="bg-black/40 border-white/10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>営業時間終了</Label>
                            <Input
                                type="number"
                                value={formData.businessHoursEnd}
                                onChange={(e) => setFormData({ ...formData, businessHoursEnd: parseInt(e.target.value) || 18 })}
                                className="bg-black/40 border-white/10"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.autoGenerateMeetLink}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoGenerateMeetLink: checked })}
                            />
                            <Label>Google Meetリンクを自動生成</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={formData.autoJoinActory}
                                onCheckedChange={(checked) => setFormData({ ...formData, autoJoinActory: checked })}
                            />
                            <Label>Actory AIを自動参加</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => handleUpdate(editingId)} className="bg-primary hover:bg-primary/90 text-black">
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
