import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Folder, Mic, Calendar, MessageSquare, Settings, Clock } from 'lucide-react';
import { NavLink } from '@/components/navigation/nav-link';
import { Logo } from '@/components/navigation/logo';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 glass border-r border-white/5 hidden md:flex flex-col z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <Logo className="w-10 h-10" />
                        <h1 className="text-2xl font-bold text-white">Actory</h1>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavLink href="/dashboard" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <LayoutDashboard className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        ダッシュボード
                    </NavLink>
                    <NavLink href="/projects" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <Folder className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        プロジェクト
                    </NavLink>
                    <NavLink href="/recordings" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <Mic className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        録音
                    </NavLink>
                    <NavLink href="/calendar" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <Calendar className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        カレンダー
                    </NavLink>
                    <NavLink href="/scheduler" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <Clock className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        スケジューラー
                    </NavLink>
                    <NavLink href="/chat" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <MessageSquare className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        AIチャット
                    </NavLink>
                    <NavLink href="/settings" className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group">
                        <Settings className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
                        設定
                    </NavLink>
                </nav>

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
                {/* Header/Top Bar could go here if needed, for now just children */}
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
