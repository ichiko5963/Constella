import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    // In development, we can allow this to be undefined strictly for build time,
    // but it will throw at runtime if used.
    console.warn('STRIPE_SECRET_KEY is missing');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    // apiVersion removed to use SDK default
    typescript: true,
});
