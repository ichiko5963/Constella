'use client';

import { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    radius: number;
    opacity: number;
    twinkleSpeed: number;
    twinkleOffset: number;
    baseOpacity: number;
}

interface ConstellationLine {
    from: number;
    to: number;
    opacity: number;
}

class StarField {
    stars: Star[] = [];
    constellationStars: Star[] = [];
    constellationLines: ConstellationLine[] = [];
    width: number = 0;
    height: number = 0;

    reset(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.stars = [];
        this.constellationStars = [];
        this.constellationLines = [];

        // Background stars (many small dim stars)
        const numStars = Math.floor((width * height) / 3000);
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
                baseOpacity: Math.random() * 0.5 + 0.2
            });
        }

        // Constellation stars (brighter, form the central pattern)
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.25;

        // Create a simple constellation pattern
        const constellationPoints = [
            { angle: 0, dist: 0.3 },
            { angle: Math.PI / 3, dist: 0.8 },
            { angle: Math.PI * 2 / 3, dist: 0.6 },
            { angle: Math.PI, dist: 0.9 },
            { angle: Math.PI * 4 / 3, dist: 0.5 },
            { angle: Math.PI * 5 / 3, dist: 0.7 },
            { angle: Math.PI / 6, dist: 0.5 },
            { angle: Math.PI * 11 / 6, dist: 0.4 },
        ];

        for (const point of constellationPoints) {
            this.constellationStars.push({
                x: centerX + Math.cos(point.angle) * radius * point.dist,
                y: centerY + Math.sin(point.angle) * radius * point.dist,
                radius: 3,
                opacity: 0.9,
                twinkleSpeed: 0.015,
                twinkleOffset: Math.random() * Math.PI * 2,
                baseOpacity: 0.9
            });
        }

        // Constellation lines
        this.constellationLines = [
            { from: 0, to: 1, opacity: 0 },
            { from: 0, to: 6, opacity: 0 },
            { from: 0, to: 7, opacity: 0 },
            { from: 1, to: 2, opacity: 0 },
            { from: 2, to: 3, opacity: 0 },
            { from: 3, to: 4, opacity: 0 },
            { from: 4, to: 5, opacity: 0 },
            { from: 5, to: 0, opacity: 0 },
            { from: 6, to: 2, opacity: 0 },
            { from: 7, to: 5, opacity: 0 },
        ];
    }

    update(t: number, volume: number) {
        // Update twinkling for background stars
        for (const star of this.stars) {
            star.opacity = star.baseOpacity +
                Math.sin(t * star.twinkleSpeed + star.twinkleOffset) * 0.2 +
                volume * 0.3;
        }

        // Update constellation stars (react more to volume)
        for (const star of this.constellationStars) {
            star.opacity = star.baseOpacity +
                Math.sin(t * star.twinkleSpeed + star.twinkleOffset) * 0.1 +
                volume * 0.5;
            star.radius = 3 + volume * 4;
        }

        // Update constellation lines (appear when recording/active)
        for (const line of this.constellationLines) {
            line.opacity = Math.min(1, line.opacity + (volume > 0.1 ? 0.02 : -0.01));
        }
    }

    draw(ctx: CanvasRenderingContext2D, volume: number) {
        // Draw background stars
        for (const star of this.stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, star.opacity)})`;
            ctx.fill();
        }

        // Draw constellation lines
        ctx.lineCap = 'round';
        for (const line of this.constellationLines) {
            if (line.opacity > 0.01) {
                const from = this.constellationStars[line.from];
                const to = this.constellationStars[line.to];
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity * 0.4})`;
                ctx.lineWidth = 1 + volume * 2;
                ctx.stroke();
            }
        }

        // Draw constellation stars with glow
        for (const star of this.constellationStars) {
            // Outer glow
            const gradient = ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.radius * 4
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity * 0.8})`);
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${star.opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, star.opacity)})`;
            ctx.fill();
        }
    }
}

class WaveCircle {
    rotation: number = 0;

    draw(ctx: CanvasRenderingContext2D, width: number, height: number, volume: number, t: number) {
        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);
        const baseRadius = minDim * 0.15;

        this.rotation += 0.0003 + volume * 0.01;

        ctx.globalCompositeOperation = 'source-over';

        const layers = 3;

        for (let i = 0; i < layers; i++) {
            ctx.beginPath();

            const frequency = 6 + i * 4;
            const amplitude = minDim * 0.01 + volume * minDim * 0.05;
            const speed = t * (1.5 + i * 0.5);
            const direction = i % 2 === 0 ? 1 : -1;

            const segments = 180;

            for (let j = 0; j <= segments; j++) {
                const angle = (j / segments) * Math.PI * 2;
                const wave = Math.sin(angle * frequency + speed + this.rotation * direction * 5) * amplitude;
                const breathing = Math.sin(t * 0.3) * 3;
                const r = baseRadius + wave + volume * minDim * 0.04 + i * 4 + breathing;

                const x = cx + Math.cos(angle + this.rotation * direction) * r;
                const y = cy + Math.sin(angle + this.rotation * direction) * r;

                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            const opacity = 0.6 - i * 0.15;
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 1.5 - i * 0.3;

            if (i === 0) {
                ctx.shadowBlur = 8 + volume * 20;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
            } else {
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            }

            ctx.stroke();
        }

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 2 + volume * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + volume * 0.4})`;
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

export function StarryVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const starFieldRef = useRef<StarField | null>(null);
    const waveCircleRef = useRef<WaveCircle | null>(null);
    const stateRef = useRef({ time: 0, volume: 0, smoothVol: 0 });

    useEffect(() => {
        const resize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                if (starFieldRef.current) {
                    starFieldRef.current.reset(window.innerWidth, window.innerHeight);
                }
            }
        };

        window.addEventListener('resize', resize);
        resize();

        // Initialize
        if (!starFieldRef.current) {
            starFieldRef.current = new StarField();
            starFieldRef.current.reset(window.innerWidth, window.innerHeight);
        }
        if (!waveCircleRef.current) {
            waveCircleRef.current = new WaveCircle();
        }

        const animate = () => {
            if (!canvasRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            let currentVol = 0;

            if (analyser) {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                const range = Math.floor(dataArray.length * 0.6);
                for (let i = 0; i < range; i++) {
                    sum += dataArray[i];
                }
                const average = sum / range;
                const target = Math.min(1, Math.pow(average / 110, 1.8));

                stateRef.current.volume += (target - stateRef.current.volume) * 0.15;
                stateRef.current.smoothVol += (target - stateRef.current.smoothVol) * 0.05;
                stateRef.current.time += 0.01 + stateRef.current.volume * 0.5;
                currentVol = stateRef.current.volume;
            } else {
                stateRef.current.volume *= 0.95;
                stateRef.current.smoothVol *= 0.95;
                stateRef.current.time += 0.005;
            }

            const { time, volume, smoothVol } = stateRef.current;

            // Clear with dark background
            ctx.fillStyle = '#0A0A0A';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw star field
            if (starFieldRef.current) {
                starFieldRef.current.update(time * 100, smoothVol);
                starFieldRef.current.draw(ctx, volume);
            }

            // Draw wave circle
            if (waveCircleRef.current) {
                waveCircleRef.current.draw(ctx, canvasRef.current.width, canvasRef.current.height, volume, time * 100);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [analyser]);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 0 }}
            />
            {/* Subtle vignette overlay */}
            <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
                    zIndex: 5
                }}
            />
        </>
    );
}
