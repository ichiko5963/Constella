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
        const { priceId } = body;

        const finalPriceId = priceId || process.env.STRIPE_PRICE_ID || '';
        if (!finalPriceId) {
            return NextResponse.json(
                { error: 'Price ID is required' },
                { status: 400 }
            );
        }

        // createCheckoutSessionは内部でredirectするため、try-catchで処理
        try {
            await createCheckoutSession(finalPriceId);
            // redirectが実行されるため、ここには到達しない
            return NextResponse.json({ success: true });
        } catch (redirectError: any) {
            // redirectエラーは正常な動作
            if (redirectError?.digest?.startsWith('NEXT_REDIRECT')) {
                throw redirectError;
            }
            throw redirectError;
        }
    } catch (error) {
        console.error('Failed to create checkout session:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}

