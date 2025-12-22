'use server';

import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function createCheckoutSession(priceId: string) {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
        throw new Error('Unauthorized');
    }

    const { url } = await stripe.checkout.sessions.create({
        customer_email: session.user.email,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
        metadata: {
            userId: session.user.id,
        },
    });

    if (url) {
        redirect(url);
    }
}

export async function getSubscription() {
    const session = await auth();
    if (!session?.user?.id) return null;

    return db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, session.user.id),
    });
}
