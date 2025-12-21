import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    // In development, we can allow this to be undefined strictly for build time,
    // but it will throw at runtime if used.
    console.warn('STRIPE_SECRET_KEY is missing');
}

// Fallback to a dummy key for build/CI if not set. 
// Note: This will fail at runtime if authentication is actually attempted without a real key.
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build_12345';

export const stripe = new Stripe(stripeKey, {
    // apiVersion removed to use SDK default
    typescript: true,
});
