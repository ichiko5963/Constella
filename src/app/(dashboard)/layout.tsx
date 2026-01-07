import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/navigation/logo';
import { TopBar } from '@/components/navigation/topbar';
import { ModeAwareNav } from '@/components/navigation/mode-aware-nav';
import { PlanGate } from '@/components/onboarding/plan-gate';
import { Star } from 'lucide-react';

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
        return (
            <div className="flex items-center justify-center min-h-screen bg-white text-gray-900">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold">Authentication Error</h1>
                    <p className="text-gray-500">Please check your database connection</p>
                    <a href="/login" className="text-gray-900 hover:underline">Return to login</a>
                </div>
            </div>
        );
    }

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="app-shell flex h-screen overflow-hidden bg-white">
            <PlanGate />

            <div className="content-layer flex h-full w-full">
                {/* Sidebar - Clean White Design */}
                <aside className="w-64 bg-gray-50 border-r border-gray-200 hidden md:flex flex-col z-20">
                    {/* Logo Section */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Constella</h1>
                        </div>
                    </div>

                    {/* Navigation */}
                    <ModeAwareNav />

                    {/* User Section */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex items-center px-2 py-2">
                            <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium mr-3">
                                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {session.user?.name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {session.user?.email || ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content - Clean White Background */}
                <main className="flex-1 overflow-auto relative z-10 bg-white">
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
