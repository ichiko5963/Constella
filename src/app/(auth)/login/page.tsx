import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function LoginPage() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        console.error('Auth error in login page:', error);
        // 認証エラーが発生してもログインページは表示する
        session = null;
    }
    
    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

            <div className="relative z-10 w-full max-w-md">
                <Card className="glass border-white/5 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-2 text-center pb-8 pt-10">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                            <span className="text-3xl font-bold text-white">A</span>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-gray-400 text-base">
                            Sign in to continue to Actory
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
                            <Button variant="outline" className="w-full h-12 text-base font-medium border-white/10 hover:bg-white/5 hover:text-white transition-all duration-300 group z-50 relative overscroll-auto">
                                <svg className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Continue with Google
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-500 mt-8">
                    By clicking continue, you agree to our <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-primary transition-colors">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
}
