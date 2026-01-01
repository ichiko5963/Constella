import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/navigation/logo';
import { TopBar } from '@/components/navigation/topbar';
import { ModeAwareNav } from '@/components/navigation/mode-aware-nav';
import { PlanGate } from '@/components/onboarding/plan-gate';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let session;
    try {
        session = await auth();
    } catch (error) {
        console.error('Auth error in dashboard layout:', error);
        // 認証エラーが発生した場合は、エラーページを表示するのではなく、ログインページにリダイレクト
        // ただし、リダイレクトループを避けるため、エラーメッセージを表示
        return (
            <div className="flex items-center justify-center min-h-screen bg-black text-white">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">認証エラーが発生しました</h1>
                    <p className="text-gray-400">データベース接続を確認してください</p>
                    <a href="/login" className="text-primary hover:underline">ログインページに戻る</a>
                </div>
            </div>
        );
    }

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="app-shell flex h-screen overflow-hidden">
            <PlanGate />

            <div className="content-layer flex h-full w-full">
                {/* Sidebar */}
                <aside className="w-64 glass border-r border-white/5 hidden md:flex flex-col z-20">
                    <div className="p-6">
                        <div className="flex items-center gap-3">
                            <Logo className="w-10 h-10" />
                            <h1 className="text-2xl font-bold text-white">Actory</h1>
                        </div>
                    </div>

                    <ModeAwareNav />

                    <div className="p-4 border-t border-white/5 bg-black/20">
                        <div className="flex items-center px-2 py-2">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-black font-bold mr-3 shadow-lg shadow-primary/20">
                                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{session.user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{session.user?.email || ''}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-auto relative z-10">
                    <div className="p-8 pt-4">
                        <TopBar />
                        <div className="pt-2">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
