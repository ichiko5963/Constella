'use client';

import { useRecording } from "@/lib/recording-context";
import { AudioRecorder } from "./audio-recorder";
import { Mic } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalRecorderManager() {
    const { isRecording, isImmersiveOpen, openImmersive } = useRecording();

    return (
        <>
            {/* The Recorder Component */}
            <AudioRecorder />

            {/* Floating Action Button - Constella Design */}
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
                            className="h-14 w-14 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center p-0 border border-gray-700"
                        >
                            <Mic className="w-6 h-6" />
                            {isRecording && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-gray-600 opacity-75"></span>
                            )}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
