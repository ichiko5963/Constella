'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slack, FileText, Building2, Trash2, ExternalLink } from 'lucide-react';
import { getIntegrations, upsertIntegration, disableIntegration, deleteIntegration } from '@/server/actions/integration';
import { toast } from 'sonner';

interface Integration {
    id: number;
    provider: 'slack' | 'notion' | 'hubspot' | 'salesforce';
    enabled: boolean;
    webhookUrl?: string;
    settings: Record<string, any>;
    lastSyncAt?: Date;
}

const PROVIDER_INFO = {
    slack: {
        name: 'Slack',
        icon: Slack,
        color: 'text-purple-400',
        description: '議事録完了時にSlackチャンネルに通知を送信',
    },
    notion: {
        name: 'Notion',
        icon: FileText,
        color: 'text-gray-400',
        description: '議事録をNotionデータベースに自動同期',
    },
    hubspot: {
        name: 'HubSpot',
        icon: Building2,
        color: 'text-orange-400',
        description: '議事録をHubSpotに連携',
    },
    salesforce: {
        name: 'Salesforce',
        icon: Building2,
        color: 'text-blue-400',
        description: '議事録をSalesforceに連携',
    },
};

export function IntegrationManager() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        webhookUrl: '',
        accessToken: '',
    });

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setIsLoading(true);
        try {
            const result = await getIntegrations();
            if (result.success && result.integrations) {
                setIntegrations(result.integrations);
            }
        } catch (error) {
            console.error('Failed to load integrations:', error);
            toast.error('統合の読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async (provider: string) => {
        // OAuth認証フローを開始（実装は簡略化）
        toast.info(`${PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO].name}のOAuth認証を開始します`);
        // TODO: OAuth認証フローを実装
    };

    const handleSave = async (provider: string) => {
        try {
            const result = await upsertIntegration(
                provider as any,
                formData.accessToken,
                undefined,
                undefined,
                formData.webhookUrl
            );
            if (result.success) {
                toast.success('統合を保存しました');
                setEditingProvider(null);
                setFormData({ webhookUrl: '', accessToken: '' });
                loadIntegrations();
            } else {
                toast.error(result.error || '保存に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save integration:', error);
            toast.error('保存中にエラーが発生しました');
        }
    };

    const handleToggle = async (integration: Integration) => {
        try {
            const result = await disableIntegration(integration.id);
            if (result.success) {
                toast.success('統合を更新しました');
                loadIntegrations();
            } else {
                toast.error(result.error || '更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to toggle integration:', error);
            toast.error('エラーが発生しました');
        }
    };

    const handleDelete = async (integrationId: number) => {
        if (!confirm('この統合を削除しますか？')) return;

        try {
            const result = await deleteIntegration(integrationId);
            if (result.success) {
                toast.success('統合を削除しました');
                loadIntegrations();
            } else {
                toast.error(result.error || '削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete integration:', error);
            toast.error('削除中にエラーが発生しました');
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>統合</CardTitle>
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
                <CardTitle>統合</CardTitle>
                <CardDescription>
                    Slack、Notion、CRMなどの外部サービスと連携
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
                    const Icon = info.icon;
                    const integration = integrations.find(i => i.provider === provider);
                    const isEditing = editingProvider === provider;

                    return (
                        <Card key={provider} className="border-white/10">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${info.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white mb-1">{info.name}</h3>
                                            <p className="text-sm text-gray-400 mb-3">{info.description}</p>
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <div className="space-y-2">
                                                        <Label>Webhook URL（Slack用）</Label>
                                                        <Input
                                                            value={formData.webhookUrl}
                                                            onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                                            placeholder="https://hooks.slack.com/services/..."
                                                            className="bg-black/40 border-white/10 text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Access Token</Label>
                                                        <Input
                                                            type="password"
                                                            value={formData.accessToken}
                                                            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                                            placeholder="アクセストークン"
                                                            className="bg-black/40 border-white/10 text-white"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSave(provider)}
                                                            className="bg-primary hover:bg-primary/90 text-black"
                                                        >
                                                            保存
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingProvider(null);
                                                                setFormData({ webhookUrl: '', accessToken: '' });
                                                            }}
                                                        >
                                                            キャンセル
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : integration ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={integration.enabled}
                                                            onCheckedChange={() => handleToggle(integration)}
                                                        />
                                                        <span className="text-sm text-gray-400">
                                                            {integration.enabled ? '有効' : '無効'}
                                                        </span>
                                                    </div>
                                                    {integration.webhookUrl && (
                                                        <p className="text-xs text-gray-500">
                                                            Webhook: {integration.webhookUrl.substring(0, 50)}...
                                                        </p>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {integration ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingProvider(provider);
                                                        setFormData({
                                                            webhookUrl: integration.webhookUrl || '',
                                                            accessToken: '',
                                                        });
                                                    }}
                                                >
                                                    編集
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(integration.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleConnect(provider)}
                                                className="bg-primary hover:bg-primary/90 text-black"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                接続
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </CardContent>
        </Card>
    );
}

