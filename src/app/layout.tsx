import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RecordingProvider } from "@/lib/recording-context";
import { OpeningProvider } from "@/components/opening/opening-provider";
import { ThemeProvider } from "@/components/settings/theme-provider";
import { GlobalRecorderManager } from "@/components/recording/global-recorder-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Actory | AI-Powered Meeting Minutes & Task Management",
    template: "%s | Actory"
  },
  description: "Automate your meetings with Actory. Record, transcribe, summarize, and extract tasks instantly.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        suppressHydrationWarning={true}
      >
        <OpeningProvider>
          <RecordingProvider>
            <ThemeProvider>
              {children}
              <GlobalRecorderManager />
              <Toaster />
            </ThemeProvider>
          </RecordingProvider>
        </OpeningProvider>
      </body>
    </html>
  );
}
