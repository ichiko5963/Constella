'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { OpeningLogo } from './opening-logo';

const COLORS = [
    { r: 24, g: 24, b: 48 },
    { r: 88, g: 28, b: 135 },
    { r: 192, g: 38, b: 211 },
    { r: 59, g: 130, b: 246 },
    { r: 6, g: 182, b: 212 },
    { r: 236, g: 72, b: 153 }
];

class OpeningOrb {
    index: number;
    seed: number;
    color: { r: number, g: number, b: number };
    x: number = 0;
    y: number = 0;
    vx: number = 0;
    vy: number = 0;
    baseRadius: number = 0;
    currentRadius: number = 0;

    constructor(index: number) {
        this.index = index;
        this.seed = Math.random() * 100;
        this.color = COLORS[index % COLORS.length];
    }

    reset(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        const minDim = Math.min(width, height);
        this.baseRadius = minDim * (0.4 + Math.random() * 0.5);
    }

    update(width: number, height: number, t: number) {
        const speedMultiplier = 0.15;

        const noiseX = Math.sin(t * 0.001 + this.seed) * Math.cos(t * 0.002 + this.index);
        const noiseY = Math.cos(t * 0.001 + this.seed) * Math.sin(t * 0.003 + this.index);

        this.x += this.vx * speedMultiplier + noiseX * speedMultiplier;
        this.y += this.vy * speedMultiplier + noiseY * speedMultiplier;

        const margin = this.baseRadius * 0.5;
        if (this.x < -margin) this.x = width + margin;
        if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin;
        if (this.y > height + margin) this.y = -margin;

        this.currentRadius = this.baseRadius + Math.sin(t * 0.5 + this.index) * (this.baseRadius * 0.1);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentRadius);
        const { r, g, b } = this.color;

        gradient.addColorStop(0, `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, 0.6)`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.4)`);
        gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.15)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function OpeningScreen({ onComplete }: { onComplete: () => void }) {
    const [opacity, setOpacity] = useState(1);
    const [showContent, setShowContent] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const orbsRef = useRef<OpeningOrb[]>([]);
    const timeRef = useRef(0);
    const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSkip = useCallback(() => {
        if (fadeOutTimerRef.current) {
            clearTimeout(fadeOutTimerRef.current);
        }
        setOpacity(0);
        setTimeout(() => {
            onComplete();
        }, 300);
    }, [onComplete]);

    useEffect(() => {
        // アニメーション開始
        setTimeout(() => setShowContent(true), 300);

        // Escキーでスキップ
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleSkip();
            }
        };
        window.addEventListener('keydown', handleKeyPress);

        // 3秒後にフェードアウト開始
        fadeOutTimerRef.current = setTimeout(() => {
            setOpacity(0);
            setTimeout(() => {
                onComplete();
            }, 500);
        }, 2500);

        const resize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                orbsRef.current.forEach(orb => orb.reset(window.innerWidth, window.innerHeight));
            }
        };

        window.addEventListener('resize', resize);
        resize();

        // Initialize Orbs
        if (orbsRef.current.length === 0) {
            const numOrbs = 8;
            for (let i = 0; i < numOrbs; i++) {
                orbsRef.current.push(new OpeningOrb(i));
            }
            orbsRef.current.forEach(orb => orb.reset(window.innerWidth, window.innerHeight));
        }

        const animate = () => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            timeRef.current += 0.01;

            // Clear Background
            ctx.fillStyle = '#020205';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw Orbs
            ctx.filter = 'blur(80px)';
            orbsRef.current.forEach(orb => {
                orb.update(canvasRef.current!.width, canvasRef.current!.height, timeRef.current);
                orb.draw(ctx);
            });
            ctx.filter = 'none';

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (fadeOutTimerRef.current) {
                clearTimeout(fadeOutTimerRef.current);
            }
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', handleKeyPress);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [onComplete, handleSkip]);

    return (
        <div 
            className="fixed inset-0 z-[9999] transition-opacity duration-500"
            style={{ opacity }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />
            {/* Noise Overlay */}
            <div 
                className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                }}
            />
            {/* Skip Button */}
            <button
                onClick={handleSkip}
                className="absolute top-6 right-6 z-50 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
                スキップ (Esc)
            </button>

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div 
                    className={`text-center transition-all duration-1000 ${
                        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                >
                    <div className="relative mb-8 mx-auto flex flex-col items-center gap-4">
                        <OpeningLogo />
                        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary">
                            Actory
                        </h1>
                    </div>
                    <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto opacity-60" />
                </div>
            </div>
        </div>
    );
}


