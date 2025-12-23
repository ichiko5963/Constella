'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    audioUrl: string;
    className?: string;
    height?: number;
    onSeek?: (time: number) => void;
}

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
    const animationFrameRef = useRef<number>();
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // Generate peaks from audio file
    useEffect(() => {
        if (!audioUrl) return;

        const loadPeaks = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();
                
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                const channelData = audioBuffer.getChannelData(0);
                const sampleRate = audioBuffer.sampleRate;
                const duration = audioBuffer.duration;
                setDuration(duration);

                // Downsample to ~2000 points for performance
                const samplesPerPixel = Math.floor(channelData.length / 2000);
                const peaks: number[] = [];

                for (let i = 0; i < 2000; i++) {
                    const start = i * samplesPerPixel;
                    const end = Math.min(start + samplesPerPixel, channelData.length);
                    
                    let max = 0;
                    for (let j = start; j < end; j++) {
                        const abs = Math.abs(channelData[j]);
                        if (abs > max) max = abs;
                    }
                    peaks.push(max);
                }

                setPeaks(peaks);
            } catch (error) {
                console.error('Failed to load audio for waveform:', error);
                // Generate placeholder peaks
                setPeaks(Array(2000).fill(0.1));
            } finally {
                setIsLoading(false);
            }
        };

        loadPeaks();
    }, [audioUrl]);

    // Setup audio context for real-time visualization
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        const setupAudioContext = () => {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.8;

                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                sourceRef.current = source;
            } catch (error) {
                console.error('Failed to setup audio context:', error);
            }
        };

        setupAudioContext();

        return () => {
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [audioRef, audioUrl]);

    // Draw waveform
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || peaks.length === 0 || isLoading) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            const barWidth = width / peaks.length;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(0, 212, 170, 0.3)'; // Primary color with transparency

            const audio = audioRef.current;
            const currentTime = audio?.currentTime || 0;
            const progress = duration > 0 ? currentTime / duration : 0;
            const progressX = width * progress;

            peaks.forEach((peak, index) => {
                const x = index * barWidth;
                const barHeight = peak * height * 0.8;
                const y = (height - barHeight) / 2;

                // Highlight current position
                const isActive = x <= progressX && x + barWidth >= progressX;
                ctx.fillStyle = isActive
                    ? 'rgba(0, 212, 170, 0.8)'
                    : 'rgba(0, 212, 170, 0.3)';

                ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
            });

            // Draw progress line
            ctx.strokeStyle = 'rgba(0, 212, 170, 1)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(progressX, 0);
            ctx.lineTo(progressX, height);
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
            height={height * window.devicePixelRatio || 1}
        />
    );
}
