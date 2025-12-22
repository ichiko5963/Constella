'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
    getCalendarIntegrations, 
    syncCalendar, 
    disconnectCalendar,
    type CalendarIntegration 
} from '@/server/actions/calendar';
import { useRouter } from 'next/navigation';

export function CalendarSync() {
    const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setIsLoading(true);
        try {
            const result = await getCalendarIntegrations();
            if (result.success && result.integrations) {
                setIntegrations(result.integrations);
            } else {
                toast.error(result.error || '統合情報の取得に失敗しました');
            }
        } catch (error) {
            console.error('Failed to load integrations:', error);
            toast.error('統合情報の読み込み中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGoogle = () => {
        window.location.href = '/api/calendar/google/connect';
    };

    const handleSync = async (integrationId: number) => {
        setSyncingId(integrationId);
        try {
            const result = await syncCalendar(integrationId);
            if (result.success) {
                toast.success(`同期完了: ${result.eventsCount || 0}件のイベントを取得しました`);
                router.refresh();
            } else {
                toast.error(result.error || '同期に失敗しました');
            }
        } catch (error) {
            console.error('Failed to sync calendar:', error);
            toast.error('同期中にエラーが発生しました');
        } finally {
            setSyncingId(null);
        }
    };

    const handleDisconnect = async (integrationId: number) => {
        if (!confirm('カレンダー連携を解除しますか？')) {
            return;
        }

        try {
            const result = await disconnectCalendar(integrationId);
            if (result.success) {
                toast.success('連携を解除しました');
                setIntegrations(integrations.filter(i => i.id !== integrationId));
                router.refresh();
            } else {
                toast.error(result.error || '解除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to disconnect calendar:', error);
            toast.error('解除中にエラーが発生しました');
        }
    };

    const googleIntegration = integrations.find(i => i.provider === 'google');
    const microsoftIntegration = integrations.find(i => i.provider === 'microsoft');

    if (isLoading) {
        return (
            <Card className="glass border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle>カレンダー連携</CardTitle>
                    <CardDescription>Google CalendarやOutlookと連携して会議情報を自動取得</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass border-white/10 bg-black/40">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5 text-primary" />
                    カレンダー連携
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Google CalendarやOutlookと連携して会議情報を自動取得します
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Google Calendar */}
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden flex items-center justify-center bg-white p-1">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" fill="#4285F4"/>
                                    <path d="M7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" fill="#34A853"/>
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Google Calendar</h3>
                                {googleIntegration && (
                                    <div className="flex items-center gap-2 mt-1">
                                        {googleIntegration.enabled ? (
                                            <span className="flex items-center gap-1 text-xs text-green-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                連携済み
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <XCircle className="h-3 w-3" />
                                                無効
                                            </span>
                                        )}
                                        {googleIntegration.lastSyncAt && (
                                            <span className="text-xs text-gray-400">
                                                最終同期: {new Date(googleIntegration.lastSyncAt).toLocaleString('ja-JP')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {googleIntegration ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSync(googleIntegration.id)}
                                        disabled={syncingId === googleIntegration.id}
                                        className="border-white/10 text-white hover:bg-white/10"
                                    >
                                        {syncingId === googleIntegration.id ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                同期中...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                同期
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDisconnect(googleIntegration.id)}
                                        className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        解除
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    onClick={handleConnectGoogle}
                                    className="bg-primary text-black hover:bg-primary/90"
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    連携する
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Microsoft Outlook (将来実装) */}
                <div className="p-4 rounded-lg border border-white/10 bg-white/5 opacity-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                                M
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Microsoft Outlook</h3>
                                <p className="text-xs text-gray-400 mt-1">準備中</p>
                            </div>
                        </div>
                        <Button disabled variant="outline" size="sm" className="border-white/10 text-gray-500">
                            準備中
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
