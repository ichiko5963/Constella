'use client';

import Image from 'next/image';
import { useState } from 'react';

export function Logo({ className = 'w-10 h-10' }: { className?: string }) {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return null; // エラー時は何も表示しない（テキストロゴにフォールバック）
    }

    return (
        <div className={`relative ${className} flex-shrink-0`}>
            <Image
                src="/logo-horizontal.png"
                alt="Actory"
                fill
                className="object-contain"
                priority
                unoptimized
                style={{ mixBlendMode: 'normal' }}
                onError={() => setHasError(true)}
            />
        </div>
    );
}

