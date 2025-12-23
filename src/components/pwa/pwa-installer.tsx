'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app was installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <Card className="glass border-white/10 fixed bottom-4 right-4 z-50 max-w-sm shadow-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Actoryをインストール</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPrompt(false)}
                        className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <CardDescription>
                    ホーム画面に追加して、オフラインでも使用できます
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    onClick={handleInstall}
                    className="w-full bg-primary hover:bg-primary/90 text-black"
                >
                    <Download className="h-4 w-4 mr-2" />
                    インストール
                </Button>
            </CardContent>
        </Card>
    );
}
