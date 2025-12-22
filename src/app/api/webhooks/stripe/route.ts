import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new NextResponse('Webhook signature missing', { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err);
        return new NextResponse('Webhook Error', { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as any;
            console.log('Payment successful for session:', session.id);

            // Upsert subscription
            await db.insert(subscriptions).values({
                userId: session.metadata.userId,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                stripePriceId: null, // Can fetch if needed
                status: 'active',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Mock if needed or fetch from subscription object
            }).onConflictDoUpdate({
                target: subscriptions.userId,
                set: {
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    status: 'active',
                    updatedAt: new Date(),
                }
            });
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse('Received', { status: 200 });
}
