'use client';

import { useRecording } from "@/lib/recording-context";
import { Mic } from "lucide-react";
import { AuroraVisualizer } from "./aurora-visualizer";

export function RecorderTriggerCard({ projectId }: { projectId?: number }) {
    const { openImmersive } = useRecording();

    return (
        <div className="w-full h-full min-h-[300px] relative overflow-hidden rounded-3xl bg-black border border-white/10 group cursor-pointer transition-all hover:border-primary/50 shadow-2xl"
            onClick={() => openImmersive(projectId)}>

            <AuroraVisualizer analyser={null} /> {/* Idle Viz */}

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-6 space-y-6">
                <div className="text-center space-y-2">
                    <p className="text-xs font-mono text-primary/80 tracking-[0.2em] uppercase">Neural Interface</p>
                    <h3 className="text-2xl font-light text-white tracking-wide">Tap to Record</h3>
                </div>

                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                    <Mic className="text-primary w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
