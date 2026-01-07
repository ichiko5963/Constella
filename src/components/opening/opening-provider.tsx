'use client';

import { useEffect, useState } from 'react';
import { OpeningScreen } from './opening-screen';

export function OpeningProvider({ children }: { children: React.ReactNode }) {
    const [showOpening, setShowOpening] = useState(false);
    const [hasShown, setHasShown] = useState(false);

    useEffect(() => {
        // 初回訪問時のみオープニングを表示
        const hasSeenOpening = sessionStorage.getItem('constella-opening-seen');
        if (!hasSeenOpening) {
            setShowOpening(true);
        } else {
            setHasShown(true);
        }
    }, []);

    const handleComplete = () => {
        sessionStorage.setItem('constella-opening-seen', 'true');
        setShowOpening(false);
        setHasShown(true);
    };

    if (showOpening) {
        return <OpeningScreen onComplete={handleComplete} />;
    }

    return <>{children}</>;
}

