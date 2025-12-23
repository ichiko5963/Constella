import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MeetingScheduler } from '@/components/scheduler/meeting-scheduler';
import { BookingSettingsManager } from '@/components/scheduler/booking-settings-manager';

export default async function SchedulerPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ミーティングスケジューラー</h1>
                <p className="text-gray-400">予約可能な時間を設定し、他のユーザーに予約してもらえます。Spearのような予約URLも発行できます。</p>
            </div>
            
            {/* 予約URL管理（Spear機能） */}
            <BookingSettingsManager />
            
            {/* 従来のスケジューラー */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">直接予約</h2>
                <MeetingScheduler />
            </div>
        </div>
    );
}

