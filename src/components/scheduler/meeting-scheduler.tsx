'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Mail, MessageSquare } from 'lucide-react';
import { getAvailableTimeSlots, createBookingRequest } from '@/server/actions/meeting-scheduler';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

export function MeetingScheduler() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [slots, setSlots] = useState<any[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [bookingForm, setBookingForm] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadSlots = async (date: Date) => {
        setIsLoadingSlots(true);
        try {
            const result = await getAvailableTimeSlots(date, 30);
            if (result.success && result.slots) {
                setSlots(result.slots);
            } else {
                toast.error(result.error || '時間スロットの取得に失敗しました');
            }
        } catch (error) {
            console.error('Failed to load slots:', error);
            toast.error('エラーが発生しました');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedSlot(null);
        loadSlots(date);
    };

    const handleSlotSelect = (slot: any) => {
        if (slot.available) {
            setSelectedSlot(slot.start);
        }
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSlot) {
            toast.error('時間を選択してください');
            return;
        }

        if (!bookingForm.name.trim() || !bookingForm.email.trim()) {
            toast.error('名前とメールアドレスを入力してください');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createBookingRequest({
                name: bookingForm.name,
                email: bookingForm.email,
                message: bookingForm.message || undefined,
                selectedSlot: selectedSlot,
                duration: 30,
            });

            if (result.success) {
                toast.success('予約リクエストを送信しました');
                setBookingForm({ name: '', email: '', message: '' });
                setSelectedSlot(null);
                loadSlots(selectedDate);
            } else {
                toast.error(result.error || '予約に失敗しました');
            }
        } catch (error) {
            console.error('Failed to create booking:', error);
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 週の日付を生成
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 月曜日開始
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        予約可能な日時を選択
                    </CardTitle>
                    <CardDescription>
                        希望する日付と時間を選択してください
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 週表示 */}
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day) => (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleDateSelect(day)}
                                className={`p-4 rounded-lg border transition-all ${
                                    isSameDay(day, selectedDate)
                                        ? 'bg-primary/20 border-primary text-primary'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                <div className="text-xs font-medium mb-1">
                                    {format(day, 'EEE')}
                                </div>
                                <div className="text-lg font-bold">
                                    {format(day, 'd')}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 時間スロット */}
                    {isLoadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-3">
                                {format(selectedDate, 'yyyy年M月d日')}
                            </h3>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                {slots.map((slot, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSlotSelect(slot)}
                                        disabled={!slot.available}
                                        className={`p-3 rounded-lg border text-sm transition-all ${
                                            selectedSlot && selectedSlot.getTime() === slot.start.getTime()
                                                ? 'bg-primary/20 border-primary text-primary'
                                                : slot.available
                                                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-primary/30'
                                                : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                                        }`}
                                    >
                                        {format(slot.start, 'HH:mm')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 予約フォーム */}
            {selectedSlot && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            予約情報を入力
                        </CardTitle>
                        <CardDescription>
                            {format(selectedSlot, 'yyyy年M月d日 HH:mm')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBooking} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    お名前
                                </Label>
                                <Input
                                    value={bookingForm.name}
                                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                                    placeholder="山田 太郎"
                                    className="bg-black/40 border-white/10 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    メールアドレス
                                </Label>
                                <Input
                                    type="email"
                                    value={bookingForm.email}
                                    onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                                    placeholder="example@email.com"
                                    className="bg-black/40 border-white/10 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    メッセージ（任意）
                                </Label>
                                <Textarea
                                    value={bookingForm.message}
                                    onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                                    placeholder="会議の目的や質問事項など"
                                    rows={4}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedSlot(null);
                                        setBookingForm({ name: '', email: '', message: '' });
                                    }}
                                    disabled={isSubmitting}
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary hover:bg-primary/90 text-black"
                                >
                                    {isSubmitting ? '送信中...' : '予約を確定'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
