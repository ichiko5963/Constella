'use client';

import Image from 'next/image';
import { useState } from 'react';

export function OpeningLogo() {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return null; // エラー時は何も表示しない（テキストロゴにフォールバック）
    }

    return (
        <div className="relative w-32 h-32">
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

