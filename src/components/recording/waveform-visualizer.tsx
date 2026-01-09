'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    audioUrl: string;
    className?: string;
    height?: number;
    onSeek?: (time: number) => void;
}

// Track which audio elements already have a source connected
const connectedAudioElements = new WeakSet<HTMLAudioElement>();

export function WaveformVisualizer({
    audioRef,
    audioUrl,
    className,
    height = 80,
    onSeek,
}: WaveformVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [peaks, setPeaks] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [duration, setDuration] = useState(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // Get duration from audio element instead of fetching
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            // Generate placeholder peaks based on duration
            const numPeaks = Math.min(2000, Math.max(100, Math.floor(audio.duration * 10)));
            // Create random-looking but consistent peaks
            const generatedPeaks: number[] = [];
            for (let i = 0; i < numPeaks; i++) {
                // Use sine waves for natural-looking waveform
                const base = 0.3 + Math.sin(i * 0.1) * 0.2 + Math.sin(i * 0.03) * 0.15;
                const noise = Math.random() * 0.3;
                generatedPeaks.push(Math.min(1, base + noise));
            }
            setPeaks(generatedPeaks);
            setIsLoading(false);
        };

        if (audio.duration && !isNaN(audio.duration)) {
            handleLoadedMetadata();
        } else {
            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
    }, [audioRef]);

    // Setup audio context for real-time visualization (only once per audio element)
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        // Check if this audio element already has a source connected
        if (connectedAudioElements.has(audio)) {
            return;
        }

        const setupAudioContext = () => {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;

                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);

                // Mark this audio element as connected
                connectedAudioElements.add(audio);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                sourceRef.current = source;
            } catch (error) {
                // Silently handle - audio will still play, just no visualization
                console.warn('Audio context setup skipped:', error);
            }
        };

        setupAudioContext();

        // Don't disconnect on cleanup - the connection persists for the audio element's lifetime
    }, [audioRef, audioUrl]);

    // Draw waveform
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || peaks.length === 0 || isLoading) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const canvasHeight = canvas.height;
            const barWidth = width / peaks.length;

            ctx.clearRect(0, 0, width, canvasHeight);

            const audio = audioRef.current;
            const currentTime = audio?.currentTime || 0;
            const progress = duration > 0 ? currentTime / duration : 0;
            const progressX = width * progress;

            peaks.forEach((peak, index) => {
                const x = index * barWidth;
                const barHeight = peak * canvasHeight * 0.8;
                const y = (canvasHeight - barHeight) / 2;

                // Color based on progress
                if (x < progressX) {
                    ctx.fillStyle = 'rgba(0, 212, 170, 0.7)'; // Played portion
                } else {
                    ctx.fillStyle = 'rgba(0, 212, 170, 0.3)'; // Unplayed portion
                }

                ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
            });

            // Draw progress line
            ctx.strokeStyle = 'rgba(0, 212, 170, 1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(progressX, 0);
            ctx.lineTo(progressX, canvasHeight);
            ctx.stroke();
        };

        draw();

        // Update on timeupdate
        const audio = audioRef.current;
        if (audio) {
            const updateProgress = () => {
                draw();
            };
            audio.addEventListener('timeupdate', updateProgress);
            return () => audio.removeEventListener('timeupdate', updateProgress);
        }
    }, [peaks, isLoading, duration, audioRef]);

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onSeek || !duration) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / canvas.width;
        const time = progress * duration;

        onSeek(time);
    };

    if (isLoading) {
        return (
            <div className={cn('flex items-center justify-center', className)} style={{ height }}>
                <div className="animate-pulse text-gray-500 text-sm">Loading waveform...</div>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={cn('w-full cursor-pointer hover:opacity-90 transition-opacity', className)}
            style={{ height }}
            onClick={handleClick}
            width={2000}
            height={height * (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || height}
        />
    );
}
