'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Upload, Play, Loader2, ArrowLeft, Maximize2, Minimize2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createRecordingUploadUrl, updateRecordingStatus } from '@/server/actions/recording';
import { processRecording } from '@/server/actions/process-audio';
import { useRouter } from 'next/navigation';
import { AuroraVisualizer } from './aurora-visualizer';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useRecording } from '@/lib/recording-context';

export function AudioRecorder({ projectId }: { projectId?: number }) {
    const { isImmersiveOpen, closeImmersive, activeProjectId } = useRecording();
    const effectiveProjectId = projectId || activeProjectId;

    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // Audio Context for Visualizer
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // State to trigger re-render for visualizer to pick up analyser
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    const router = useRouter();

    // Auto-start visualizer when immersive opens if recording/blob exists? 
    // Or just rely on user interaction.
    // Ideally, if the user opens the recorder, they want to record.

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Context & Analyser
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            setAnalyser(analyserRef.current);

            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                // Stop audio context streams to save resources, but keep visualizer if we want post-viz?
                // Usually better to stop mic stream.
                if (stream) stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
                setAnalyser(null);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('Cannot access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setElapsedTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
        toast.info('Recording cancelled');
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setIsUploading(true);

        try {
            // Pass effectiveProjectId (can be undefined)
            const result = await createRecordingUploadUrl(effectiveProjectId, audioBlob.type);

            if (!result.success || !result.url) {
                throw new Error(result.error || 'Failed to get upload URL');
            }

            await fetch(result.url, {
                method: 'PUT',
                body: audioBlob,
                headers: { 'Content-Type': audioBlob.type },
            });

            await updateRecordingStatus(result.recordingId!, 'transcribing');

            processRecording(result.recordingId!).catch(console.error);

            toast.success('Upload complete! Processing in background.');
            closeImmersive();
            router.refresh();
            router.push(`/recordings/${result.recordingId}`);

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed: ' + error); // Show specific error
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // If not open, don't render anything (global instance)
    if (!isImmersiveOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#020205] via-[#050510] to-[#0a101f] text-white overflow-hidden"
        >
            <AuroraVisualizer analyser={analyser} />

            {/* UI Layer */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12 pointer-events-none">
                {/* Header */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse shadow-[0_0_10px_#EF4444]' : 'bg-primary shadow-[0_0_10px_#00D4AA]'}`} />
                            <h2 className="text-xs font-mono text-primary tracking-[0.3em] uppercase opacity-80">
                                {isRecording ? 'Recording Active' : 'System Ready'}
                            </h2>
                        </div>
                        <p className="text-white/40 text-[10px] tracking-widest uppercase font-light">
                            {effectiveProjectId ? `Project ID: ${effectiveProjectId}` : 'Quick Memo Mode'}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isRecording) {
                                stopRecording();
                            }
                            closeImmersive();
                        }}
                        className="rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white backdrop-blur-md border border-white/5 w-12 h-12 cursor-pointer z-50"
                        type="button"
                    >
                        <X className="w-6 h-6 pointer-events-none" />
                    </Button>
                </div>

                {/* Center Content */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-12 pointer-events-auto">
                    {/* Timer */}
                    <div className="text-center space-y-2">
                        <div className="text-7xl md:text-9xl font-extralight tracking-tighter text-white tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            {formatTime(elapsedTime)}
                        </div>
                        <p className="text-white/30 text-xs tracking-[0.5em] uppercase">Duration</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {!isRecording && !audioBlob && (
                            <Button onClick={startRecording} className="start-btn h-24 px-12 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md text-white tracking-[0.2em] uppercase transition-all duration-500 hover:scale-105 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(200,162,200,0.3)] text-lg font-light">
                                録音をする
                            </Button>
                        )}

                        {isRecording && (
                            <div className="flex items-center gap-8">
                                <Button
                                    onClick={cancelRecording}
                                    variant="ghost"
                                    className="h-16 w-16 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300"
                                    title="Cancel"
                                >
                                    <X className="w-8 h-8" />
                                </Button>

                                <Button
                                    onClick={stopRecording}
                                    className="h-24 w-24 rounded-full bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 backdrop-blur-md transition-all duration-300 hover:scale-110 flex items-center justify-center group shadow-[0_0_40px_rgba(239,68,68,0.2)]"
                                >
                                    <Square className="w-8 h-8 fill-current group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                </Button>
                            </div>
                        )}

                        {audioBlob && (
                            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                                <div className="flex gap-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setAudioBlob(null); setElapsedTime(0); startRecording(); }}
                                        className="h-14 px-8 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-full uppercase tracking-widest text-xs"
                                    >
                                        Retry
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="h-14 px-10 bg-primary hover:bg-primary/90 text-black font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(0,212,170,0.4)] hover:shadow-[0_0_35px_rgba(0,212,170,0.6)] transition-all duration-300"
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        {isUploading ? 'Processing...' : 'Process'}
                                    </Button>
                                </div>
                                <p className="text-white/40 text-[10px] tracking-widest uppercase">Review content before processing</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end text-[10px] text-white/20 font-mono tracking-widest uppercase pointer-events-auto">
                    <div>
                        <span className="block">Audio Stream: 48kHz</span>
                        <span className="block">Encoding: WebM/Opus</span>
                    </div>
                    <div>
                        Neural Engine: Ready
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
