'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
                <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                <Button onClick={() => reset()}>Try again</Button>
            </body>
        </html>
    );
}
