'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { toast } from 'sonner';

interface BookingSetting {
    id: number;
    title: string;
    description: string | null;
    duration: number;
    businessHoursStart: number | null;
    businessHoursEnd: number | null;
    timezone: string | null;
}

interface BookingPageClientProps {
    setting: BookingSetting;
    availableDays: number[];
    createBooking: (token: string, name: string, email: string, slot: Date, message?: string) => Promise<any>;
    getAvailableTimeSlots: (token: string, date: Date) => Promise<any>;
    token: string;
}

export function BookingPageClient({ setting, availableDays, createBooking, getAvailableTimeSlots, token }: BookingPageClientProps) {
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
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // 利用可能な日付をフィルタリング
    const isDateAvailable = (date: Date) => {
        const dayOfWeek = date.getDay();
        return availableDays.includes(dayOfWeek);
    };

    const loadSlots = async (date: Date) => {
        if (!isDateAvailable(date)) {
            setSlots([]);
            return;
        }

        setIsLoadingSlots(true);
        try {
            const result = await getAvailableTimeSlots(token, date);
            if (result.success && result.slots) {
                setSlots(result.slots);
            } else {
                toast.error(result.error || '時間スロットの取得に失敗しました');
                setSlots([]);
            }
        } catch (error) {
            console.error('Failed to load slots:', error);
            toast.error('エラーが発生しました');
            setSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        loadSlots(selectedDate);
    }, [selectedDate]);

    const handleDateSelect = (date: Date) => {
        if (isDateAvailable(date)) {
            setSelectedDate(date);
            setSelectedSlot(null);
        }
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
            // トークンを取得（settingから）
            const token = (setting as any).token;
            const result = await createBooking(
                token,
                bookingForm.name,
                bookingForm.email,
                selectedSlot,
                bookingForm.message || undefined
            );

            if (result.success) {
                setBookingSuccess(true);
                toast.success('予約が確定しました！確認メールをお送りします。');
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
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    if (bookingSuccess) {
        return (
            <Card className="glass border-white/5 shadow-2xl backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">予約が確定しました！</h2>
                    <p className="text-gray-400 mb-6">
                        確認メールをお送りしました。Google Meetのリンクも含まれています。
                    </p>
                    <Button
                        onClick={() => {
                            setBookingSuccess(false);
                            setSelectedDate(new Date());
                            setSelectedSlot(null);
                            setBookingForm({ name: '', email: '', message: '' });
                        }}
                        className="bg-primary hover:bg-primary/90 text-black"
                    >
                        新しい予約を作成
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">{setting.title}</h1>
                {setting.description && (
                    <p className="text-gray-400 text-lg">{setting.description}</p>
                )}
                <p className="text-gray-500 text-sm mt-2">
                    会議時間: {setting.duration}分
                </p>
            </div>

            <Card className="glass border-white/5 shadow-2xl backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Calendar className="h-5 w-5 text-primary" />
                        予約可能な日時を選択
                    </CardTitle>
                    <CardDescription>
                        希望する日付と時間を選択してください
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 週ナビゲーション */}
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                            className="border-white/10"
                        >
                            前の週
                        </Button>
                        <span className="text-white font-medium">
                            {format(weekStart, 'yyyy年M月d日')} - {format(addDays(weekStart, 6), 'M月d日')}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                            className="border-white/10"
                        >
                            次の週
                        </Button>
                    </div>

                    {/* 週表示 */}
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day) => {
                            const isAvailable = isDateAvailable(day);
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => handleDateSelect(day)}
                                    disabled={!isAvailable}
                                    className={`p-4 rounded-lg border transition-all ${
                                        isSelected
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : isAvailable
                                            ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                            : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="text-xs font-medium mb-1">
                                        {format(day, 'EEE')}
                                    </div>
                                    <div className="text-lg font-bold">
                                        {format(day, 'd')}
                                    </div>
                                </button>
                            );
                        })}
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
                            {slots.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    {isDateAvailable(selectedDate)
                                        ? 'この日の利用可能な時間がありません'
                                        : 'この日は予約を受け付けていません'}
                                </p>
                            ) : (
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
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 予約フォーム */}
            {selectedSlot && (
                <Card className="glass border-white/5 shadow-2xl backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Clock className="h-5 w-5 text-primary" />
                            予約情報を入力
                        </CardTitle>
                        <CardDescription>
                            {format(selectedSlot, 'yyyy年M月d日 HH:mm')} - {format(new Date(selectedSlot.getTime() + setting.duration * 60000), 'HH:mm')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBooking} className="space-y-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-white">
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
                                <Label className="flex items-center gap-2 text-white">
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
                                <Label className="flex items-center gap-2 text-white">
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
                                    className="border-white/10"
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary hover:bg-primary/90 text-black"
                                >
                                    {isSubmitting ? '予約中...' : '予約を確定'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
