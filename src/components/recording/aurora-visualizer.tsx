'use client';

import { useEffect, useRef } from 'react';

const COLORS = [
    { r: 24, g: 24, b: 48 },
    { r: 88, g: 28, b: 135 },
    { r: 192, g: 38, b: 211 },
    { r: 59, g: 130, b: 246 },
    { r: 6, g: 182, b: 212 },
    { r: 236, g: 72, b: 153 }
];

class Orb {
    index: number;
    seed: number;
    color: { r: number, g: number, b: number };
    x: number = 0;
    y: number = 0;
    vx: number = 0;
    vy: number = 0;
    baseRadius: number = 0;
    currentRadius: number = 0;

    constructor(index: number, total: number) {
        this.index = index;
        this.seed = Math.random() * 100;
        this.color = COLORS[index % COLORS.length];
    }

    reset(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        const minDim = Math.min(width, height);
        this.baseRadius = minDim * (0.5 + Math.random() * 0.4);
    }

    update(width: number, height: number, vol: number, t: number) {
        // 背景の動きも少し落ち着かせる
        const speedMultiplier = 0.1 + (vol * 5.0);

        const noiseX = Math.sin(t * 0.002 + this.seed) * Math.cos(t * 0.003 + this.index);
        const noiseY = Math.cos(t * 0.002 + this.seed) * Math.sin(t * 0.004 + this.index);

        this.x += this.vx * speedMultiplier + noiseX * speedMultiplier;
        this.y += this.vy * speedMultiplier + noiseY * speedMultiplier;

        const margin = this.baseRadius * 0.5;
        if (this.x < -margin) this.x = width + margin;
        if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin;
        if (this.y > height + margin) this.y = -margin;

        this.currentRadius = this.baseRadius + (vol * this.baseRadius * 0.5);
    }

    draw(ctx: CanvasRenderingContext2D, volume: number) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.currentRadius);
        const intensity = 0.5 + (volume * 0.5);
        const { r, g, b } = this.color;

        // グラデーションのステップを調整して、より滑らかに色が溶け込むように変更
        gradient.addColorStop(0, `rgba(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)}, ${0.5 * intensity})`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${0.3 * intensity})`); // 中間点を少し手前に
        gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${0.1 * intensity})`); // フェードアウト区間を長く
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class WaveRing {
    hue: number = 0;
    rotation: number = 0;

    draw(ctx: CanvasRenderingContext2D, width: number, height: number, vol: number, t: number) {
        const cx = width / 2;
        const cy = height / 2;
        const minDim = Math.min(width, height);

        const baseRadius = minDim * 0.2;

        this.hue = (t * 15) % 360;

        // 回転速度の調整:
        // base: 0.0002 (極めてゆっくり)
        // active: vol * 0.015 (喋っても急加速しすぎない)
        this.rotation += 0.0002 + (vol * 0.015);

        ctx.globalCompositeOperation = 'source-over';

        const layers = 3;

        for (let i = 0; i < layers; i++) {
            ctx.beginPath();

            const frequency = 8 + (i * 5);
            const amplitude = (minDim * 0.015) + (vol * minDim * 0.08);

            const speed = t * (2 + i);
            const direction = i % 2 === 0 ? 1 : -1;

            const segments = 200;

            for (let j = 0; j <= segments; j++) {
                const angle = (j / segments) * Math.PI * 2;

                const wave = Math.sin(angle * frequency + speed + this.rotation * direction * 5) * amplitude;

                // ゆらぎの速度も少し落とす
                const breathing = Math.sin(t * 0.4) * 5;

                const r = baseRadius + wave + (vol * minDim * 0.06) + (i * 6) + breathing;

                const x = cx + Math.cos(angle + this.rotation * direction) * r;
                const y = cy + Math.sin(angle + this.rotation * direction) * r;

                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            ctx.lineWidth = 1.2;

            const layerHue = (this.hue + i * 40) % 360;

            ctx.strokeStyle = `hsla(${layerHue}, 90%, 80%, ${0.9 - (i * 0.2)})`;

            if (i === 0) {
                ctx.shadowBlur = 10 + (vol * 30);
                ctx.shadowColor = `hsla(${layerHue}, 80%, 60%, 0.8)`;
            } else {
                ctx.shadowBlur = 5;
                ctx.shadowColor = `hsla(${layerHue}, 80%, 60%, 0.4)`;
            }

            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 3 + vol * 5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 100%, 90%, ${0.5 + vol * 0.5})`;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

export function AuroraVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const orbsRef = useRef<Orb[]>([]);
    const waveRingRef = useRef<WaveRing | null>(null);

    // Timing and volume tracking across frames
    const stateRef = useRef({ time: 0, volume: 0, smoothVol: 0 });

    useEffect(() => {
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
            const numOrbs = 7;
            for (let i = 0; i < numOrbs; i++) {
                orbsRef.current.push(new Orb(i, numOrbs));
            }
            orbsRef.current.forEach(orb => orb.reset(window.innerWidth, window.innerHeight));
        }
        if (!waveRingRef.current) {
            waveRingRef.current = new WaveRing();
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

                // Active mode time progression
                stateRef.current.time += 0.01 + (stateRef.current.volume * 0.8);
                currentVol = stateRef.current.volume;
            } else {
                // Idle mode (slow movement)
                stateRef.current.volume *= 0.95; // Decay volume
                stateRef.current.smoothVol *= 0.95;
                stateRef.current.time += 0.005; // Slow time
            }

            const { time, volume, smoothVol } = stateRef.current;

            // Clear Background
            ctx.fillStyle = '#020205';
            ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            // Draw Orbs
            ctx.filter = 'blur(60px)';
            orbsRef.current.forEach(orb => {
                orb.update(canvasRef.current!.width, canvasRef.current!.height, smoothVol, time);
                orb.draw(ctx, volume); // Pass volume for intensity
            });
            ctx.filter = 'none';

            // Draw WaveRing
            if (waveRingRef.current) {
                waveRingRef.current.draw(ctx, canvasRef.current.width, canvasRef.current.height, volume, time);
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
            {/* Simple Noise Overlay */}
            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.08] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                    zIndex: 10
                }}
            ></div>
        </>
    );
}
