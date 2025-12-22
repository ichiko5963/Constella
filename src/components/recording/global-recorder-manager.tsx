'use client';

import { useRecording } from "@/lib/recording-context";
import { AudioRecorder } from "./audio-recorder";
import { Mic } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalRecorderManager() {
    const { isRecording, isImmersiveOpen, openImmersive } = useRecording();

    // If immersive is open, the FAB should probably be hidden or transformed?
    // Actually, if immersive is open, the full screen overlay covers everything, so z-index will handle it.
    // But let's hide the FAB when immersive is open to be clean.

    return (
        <>
            {/* The Recorder Component (Controlled by Context for visibility) */}
            <AudioRecorder />

            {/* Floating Action Button */}
            <AnimatePresence>
                {!isImmersiveOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-8 right-8 z-50"
                    >
                        <Button
                            onClick={() => openImmersive()}
                            size="lg"
                            className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-emerald-400 hover:from-primary/90 hover:to-emerald-400/90 text-black shadow-[0_0_20px_rgba(0,212,170,0.4)] hover:shadow-[0_0_35px_rgba(0,212,170,0.6)] transition-all duration-300 hover:scale-110 flex items-center justify-center p-0"
                        >
                            <Mic className="w-8 h-8" />
                            {/* Pulse effect if recording is handled in background? (Not yet implemented fully but placeholder) */}
                            {isRecording && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
