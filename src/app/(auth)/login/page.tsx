import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Star } from "lucide-react";

export default async function LoginPage() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        console.error('Auth error in login page:', error);
        session = null;
    }

    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 bg-white overflow-hidden">
            {/* Subtle star pattern background */}
            <div className="absolute inset-0 opacity-[0.03]">
                <svg className="w-full h-full">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <circle
                            key={i}
                            cx={`${Math.random() * 100}%`}
                            cy={`${Math.random() * 100}%`}
                            r="2"
                            fill="#000"
                        />
                    ))}
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Card className="border border-gray-200 shadow-xl bg-white">
                    <CardHeader className="space-y-2 text-center pb-8 pt-10">
                        {/* Logo */}
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
                            <Star className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
                            Welcome to Constella
                        </CardTitle>
                        <CardDescription className="text-gray-500 text-base">
                            Connect context, like stars.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-10 px-8">
                        <form
                            action={async () => {
                                "use server"
                                await signIn("google", { redirectTo: "/dashboard" })
                            }}
                            className="w-full"
                        >
                            <Button
                                variant="outline"
                                className="w-full h-12 text-base font-medium border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-200 group"
                            >
                                <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Continue with Google
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-400 mt-8">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-gray-600 underline hover:text-gray-900 transition-colors">
                        Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-gray-600 underline hover:text-gray-900 transition-colors">
                        Privacy Policy
                    </a>.
                </p>
            </div>
        </div>
    );
}
