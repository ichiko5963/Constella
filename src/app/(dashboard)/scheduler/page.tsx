import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { MeetingScheduler } from '@/components/scheduler/meeting-scheduler';

export default async function SchedulerPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">ミーティングスケジューラー</h1>
                <p className="text-gray-400">予約可能な時間を設定し、他のユーザーに予約してもらえます</p>
            </div>
            <MeetingScheduler />
        </div>
    );
}
