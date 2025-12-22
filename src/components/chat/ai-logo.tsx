'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function AILogo() {
    const [hasError, setHasError] = useState(false);

    return (
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,212,170,0.2)] overflow-hidden relative">
            {!hasError ? (
                <Image
                    src="/logo-square.png"
                    alt="AI"
                    fill
                    className="object-contain"
                    unoptimized
                    style={{ mixBlendMode: 'normal' }}
                    onError={() => setHasError(true)}
                />
            ) : (
                <Sparkles className="h-5 w-5 text-primary" />
            )}
        </div>
    );
}

