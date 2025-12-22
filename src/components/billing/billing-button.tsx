'use client';

import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/server/actions/billing';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function BillingButton({ priceId }: { priceId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            await createCheckoutSession(priceId);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <Button onClick={handleSubscribe} disabled={isLoading} className="w-full bg-primary text-black hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Subscribe
        </Button>
    );
}
