'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bot, Video, Loader2 } from 'lucide-react';
import { toggleAutoJoin } from '@/server/actions/auto-join';
import { toast } from 'sonner';
import { detectMeetingType } from '@/lib/calendar/meeting-detector';

interface AutoJoinButtonProps {
    eventId: number;
    meetingLink: string;
    autoJoinEnabled: boolean;
    autoRecordEnabled: boolean;
    joinStatus: 'pending' | 'joining' | 'joined' | 'failed' | 'completed';
    startTime: Date;
}

export function AutoJoinButton({
    eventId,
    meetingLink,
    autoJoinEnabled: initialAutoJoinEnabled,
    autoRecordEnabled: initialAutoRecordEnabled,
    joinStatus,
    startTime,
}: AutoJoinButtonProps) {
    const [autoJoinEnabled, setAutoJoinEnabled] = useState(initialAutoJoinEnabled);
    const [autoRecordEnabled, setAutoRecordEnabled] = useState(initialAutoRecordEnabled);
    const [isUpdating, setIsUpdating] = useState(false);

    const meetingType = detectMeetingType(meetingLink);
    const isSupported = meetingType !== 'unknown';

    const handleToggleAutoJoin = async (enabled: boolean) => {
        setIsUpdating(true);
        try {
            const result = await toggleAutoJoin(eventId, enabled, autoRecordEnabled);
            if (result.success) {
                setAutoJoinEnabled(enabled);
                toast.success(enabled ? '自動参加を有効にしました' : '自動参加を無効にしました');
            } else {
                toast.error(result.error || '設定の更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to toggle auto join:', error);
            toast.error('設定の更新中にエラーが発生しました');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleToggleAutoRecord = async (enabled: boolean) => {
        setIsUpdating(true);
        try {
            const result = await toggleAutoJoin(eventId, autoJoinEnabled, enabled);
            if (result.success) {
                setAutoRecordEnabled(enabled);
                toast.success(enabled ? '自動録音を有効にしました' : '自動録音を無効にしました');
            } else {
                toast.error(result.error || '設定の更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to toggle auto record:', error);
            toast.error('設定の更新中にエラーが発生しました');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isSupported) {
        return (
            <div className="text-xs text-gray-500">
                未対応の会議形式
            </div>
        );
    }

    const timeUntilStart = startTime.getTime() - Date.now();
    const minutesUntilStart = Math.floor(timeUntilStart / (1000 * 60));

    return (
        <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`auto-join-${eventId}`} className="text-xs text-gray-400 flex items-center gap-2">
                    <Bot className="h-3 w-3" />
                    自動参加
                </Label>
                <Switch
                    id={`auto-join-${eventId}`}
                    checked={autoJoinEnabled}
                    onCheckedChange={handleToggleAutoJoin}
                    disabled={isUpdating}
                />
            </div>
            {autoJoinEnabled && (
                <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`auto-record-${eventId}`} className="text-xs text-gray-400 flex items-center gap-2">
                        <Video className="h-3 w-3" />
                        自動録音
                    </Label>
                    <Switch
                        id={`auto-record-${eventId}`}
                        checked={autoRecordEnabled}
                        onCheckedChange={handleToggleAutoRecord}
                        disabled={isUpdating}
                    />
                </div>
            )}
            {autoJoinEnabled && (
                <div className="text-xs text-gray-500 mt-1">
                    {joinStatus === 'pending' && minutesUntilStart > 0 && (
                        <span>あと{minutesUntilStart}分で参加</span>
                    )}
                    {joinStatus === 'joining' && (
                        <span className="text-primary flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            参加中...
                        </span>
                    )}
                    {joinStatus === 'joined' && (
                        <span className="text-green-400">参加済み</span>
                    )}
                    {joinStatus === 'failed' && (
                        <span className="text-red-400">参加失敗</span>
                    )}
                </div>
            )}
        </div>
    );
}

