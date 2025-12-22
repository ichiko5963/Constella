import { auth } from '@/auth';
import { getSubscription } from '@/server/actions/billing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BillingButton } from '@/components/billing/billing-button';
import { Check } from 'lucide-react';

export default async function BillingPage() {
    const session = await auth();
    if (!session?.user) return null;

    const subscription = await getSubscription();
    const isPro = subscription?.status === 'active';

    // IMPORTANT: Replace this with actual Stripe Price ID
    const PRO_PRICE_ID = 'price_123456789';

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Subscription & Billing</h1>
                <p className="text-gray-400">Manage your subscription plan</p>
            </div>

            <Card className="glass border-white/10 bg-black/40">
                <CardHeader>
                    <CardTitle className="text-white">Current Plan</CardTitle>
                    <CardDescription>
                        You are currently on the <span className="text-primary font-bold">{isPro ? 'Pro' : 'Free'}</span> plan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isPro ? (
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-3">
                            <div className="bg-green-500 text-black rounded-full p-1">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-green-400 font-medium">Pro Subscription Active</h3>
                                <p className="text-sm text-gray-400">Next renewal: {subscription.currentPeriodEnd?.toLocaleDateString()}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8 mt-8">
                            <div className="border border-white/10 rounded-xl p-6 flex flex-col">
                                <h3 className="text-xl font-bold text-white">Free</h3>
                                <div className="text-3xl font-bold text-white mt-2 mb-6">$0<span className="text-sm text-gray-500 font-normal">/month</span></div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-gray-500" /> 3 Projects</li>
                                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-gray-500" /> Basic Transcription</li>
                                </ul>
                                <button disabled className="w-full py-2 rounded-lg bg-white/5 text-gray-400 cursor-not-allowed">Current Plan</button>
                            </div>

                            <div className="border border-primary/30 bg-primary/5 rounded-xl p-6 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
                                <h3 className="text-xl font-bold text-white">Pro</h3>
                                <div className="text-3xl font-bold text-white mt-2 mb-6">$29<span className="text-sm text-gray-500 font-normal">/month</span></div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-primary" /> Unlimited Projects</li>
                                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-primary" /> Advanced AI Analysis</li>
                                    <li className="flex items-center gap-2 text-sm text-gray-300"><Check className="w-4 h-4 text-primary" /> Prioritized Support</li>
                                </ul>
                                <BillingButton priceId={PRO_PRICE_ID} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
