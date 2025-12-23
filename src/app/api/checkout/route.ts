import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createCheckoutSession } from '@/server/actions/billing';

/**
 * Stripe Checkoutセッションを作成
 */
export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { priceId, successUrl, cancelUrl } = body;

        const checkoutSession = await createCheckoutSession({
            userId: session.user.id,
            priceId: priceId || process.env.STRIPE_PRICE_ID || '',
            successUrl: successUrl || `${req.nextUrl.origin}/settings/billing?success=true`,
            cancelUrl: cancelUrl || `${req.nextUrl.origin}/settings/billing?canceled=true`,
        });

        if (checkoutSession.success && checkoutSession.url) {
            return NextResponse.json({ url: checkoutSession.url });
        } else {
            return NextResponse.json(
                { error: checkoutSession.error || 'Failed to create checkout session' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Failed to create checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

