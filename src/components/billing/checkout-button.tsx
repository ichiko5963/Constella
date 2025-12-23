'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutButtonProps {
    priceId: string;
    planName: string;
    className?: string;
}

export function CheckoutButton({ priceId, planName, className }: CheckoutButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleCheckout = () => {
        startTransition(async () => {
            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        priceId,
                        successUrl: `${window.location.origin}/settings/billing?success=true`,
                        cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
                    }),
                });

                const data = await response.json();

                if (data.url) {
                    window.location.href = data.url;
                } else {
                    toast.error(data.error || 'チェックアウトセッションの作成に失敗しました');
                }
            } catch (error) {
                console.error('Failed to create checkout session:', error);
                toast.error('エラーが発生しました');
            }
        });
    };

    return (
        <Button
            onClick={handleCheckout}
            disabled={isPending}
            className={className}
        >
            {isPending ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    処理中...
                </>
            ) : (
                <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {planName}を購入
                </>
            )}
        </Button>
    );
}

