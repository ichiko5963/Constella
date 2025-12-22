'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Loader2 } from 'lucide-react';
import { createManualJoinEvent } from '@/server/actions/meeting-join';
import { toast } from 'sonner';
import { detectMeetingType } from '@/lib/calendar/meeting-detector';

interface ManualJoinDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId?: number;
}

export function ManualJoinDialog({ open, onOpenChange, projectId }: ManualJoinDialogProps) {
    const [meetingUrl, setMeetingUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const meetingType = meetingUrl ? detectMeetingType(meetingUrl) : 'unknown';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!meetingUrl.trim()) {
            toast.error('会議URLを入力してください');
            return;
        }

        if (!title.trim()) {
            toast.error('会議タイトルを入力してください');
            return;
        }

        if (!startTime) {
            toast.error('開始時間を入力してください');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createManualJoinEvent({
                meetingUrl: meetingUrl.trim(),
                title: title.trim(),
                description: description.trim() || null,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 60 * 60 * 1000), // デフォルト1時間後
                projectId: projectId || null,
            });

            if (result.success) {
                toast.success('会議参加をスケジュールしました');
                onOpenChange(false);
                // フォームをリセット
                setMeetingUrl('');
                setTitle('');
                setDescription('');
                setStartTime('');
                setEndTime('');
            } else {
                toast.error(result.error || '会議参加のスケジュールに失敗しました');
            }
        } catch (error) {
            console.error('Failed to create manual join event:', error);
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-black/40 border-white/10 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Video className="h-5 w-5 text-primary" />
                        オンライン会議を手動で追加
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        会議URLを入力して、自動参加と録音をスケジュールします
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>会議URL</Label>
                        <Input
                            value={meetingUrl}
                            onChange={(e) => setMeetingUrl(e.target.value)}
                            placeholder="https://meet.google.com/xxx-yyyy-zzz または https://zoom.us/j/..."
                            className="bg-black/40 border-white/10 text-white"
                        />
                        {meetingUrl && (
                            <p className="text-xs text-gray-500">
                                検出されたタイプ: {meetingType === 'google-meet' ? 'Google Meet' : 
                                                   meetingType === 'zoom' ? 'Zoom' : 
                                                   meetingType === 'teams' ? 'Microsoft Teams' : 
                                                   '不明'}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>会議タイトル</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="例: 定例ミーティング"
                            className="bg-black/40 border-white/10 text-white"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>説明（任意）</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="会議の説明やアジェンダ"
                            rows={3}
                            className="bg-black/40 border-white/10 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>開始日時</Label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>終了日時（任意）</Label>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            キャンセル
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !meetingUrl.trim() || !title.trim() || !startTime}
                            className="bg-primary hover:bg-primary/90 text-black"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    処理中...
                                </>
                            ) : (
                                <>
                                    <Video className="h-4 w-4 mr-2" />
                                    スケジュール
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
