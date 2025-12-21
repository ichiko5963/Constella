import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Folder, Mic } from 'lucide-react';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-indigo-600">Actory</h1>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <Link href="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md group">
                        <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/projects" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md group">
                        <Folder className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                        Projects
                    </Link>
                    <Link href="/dashboard/recordings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md group">
                        <Mic className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                        Recordings
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center px-4 py-2 text-gray-700">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                            {session.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium">{session.user.name}</p>
                            <p className="text-xs text-gray-500 overflow-hidden text-ellipsis w-32">{session.user.email}</p>
                        </div>
                    </div>
                    <div className="mt-4 px-2">
                        {/* Logout logic would go here, client component needed for onClick usually */}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
