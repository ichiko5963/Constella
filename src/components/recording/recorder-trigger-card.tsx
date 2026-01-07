'use client';

import { useRecording } from "@/lib/recording-context";
import { Mic, Star } from "lucide-react";
import { StarryVisualizer } from "./starry-visualizer";

export function RecorderTriggerCard({ projectId }: { projectId?: number }) {
    const { openImmersive } = useRecording();

    return (
        <div
            className="w-full h-full min-h-[300px] relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 group cursor-pointer transition-all hover:border-gray-700 shadow-xl"
            onClick={() => openImmersive(projectId)}
        >
            <StarryVisualizer analyser={null} />

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-6 space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-white/60 tracking-[0.2em] uppercase">
                        <Star className="w-3 h-3" />
                        Constella Recording
                    </div>
                    <h3 className="text-2xl font-light text-white tracking-wide">
                        Tap to Record
                    </h3>
                    <p className="text-sm text-white/40">
                        思考を星として記録しましょう
                    </p>
                </div>

                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    <Mic className="text-white w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
