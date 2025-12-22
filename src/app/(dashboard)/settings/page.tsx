import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { CalendarSync } from '@/components/settings/calendar-sync';
import { BackgroundThemeSelector } from '@/components/settings/background-theme-selector';
import { CustomPromptManager } from '@/components/settings/custom-prompt-manager';
import { SummaryTemplateManager } from '@/components/settings/summary-template-manager';
import { Settings } from 'lucide-react';

export default async function SettingsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    設定
                </h1>
                <p className="text-gray-400">アプリケーションの設定を管理します</p>
            </div>

            <div className="space-y-6">
                {/* 背景テーマ */}
                <BackgroundThemeSelector />
                
                {/* カレンダー連携 */}
                <CalendarSync />

                {/* カスタムAIプロンプト */}
                <CustomPromptManager />

                {/* AI要約テンプレート */}
                <SummaryTemplateManager />
            </div>
        </div>
    );
}
