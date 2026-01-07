'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface Star {
    id: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    size: number;
    opacity: number;
    delay: number;
    isLogoStar: boolean;
}

interface ConstellationLine {
    from: number;
    to: number;
    opacity: number;
}

// Constella logo points (normalized 0-1)
const LOGO_POINTS = [
    { x: 0.5, y: 0.2 },   // Top
    { x: 0.3, y: 0.35 },  // Upper left
    { x: 0.7, y: 0.35 },  // Upper right
    { x: 0.2, y: 0.5 },   // Middle left
    { x: 0.8, y: 0.5 },   // Middle right
    { x: 0.35, y: 0.65 }, // Lower left
    { x: 0.65, y: 0.65 }, // Lower right
    { x: 0.5, y: 0.8 },   // Bottom
];

// Connections between logo points
const LOGO_CONNECTIONS: [number, number][] = [
    [0, 1], [0, 2],           // Top to upper sides
    [1, 3], [2, 4],           // Upper to middle sides
    [1, 2],                    // Connect upper left to right
    [3, 5], [4, 6],           // Middle to lower sides
    [5, 7], [6, 7],           // Lower to bottom
    [5, 6],                    // Connect lower left to right
    [0, 7],                    // Top to bottom (center line)
];

export function OpeningScreen({ onComplete }: { onComplete: () => void }) {
    const [phase, setPhase] = useState<'scatter' | 'converge' | 'connect' | 'logo' | 'fadeout'>('scatter');
    const [opacity, setOpacity] = useState(1);
    const [stars, setStars] = useState<Star[]>([]);
    const [lines, setLines] = useState<ConstellationLine[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const handleSkip = useCallback(() => {
        setOpacity(0);
        setTimeout(() => {
            onComplete();
        }, 300);
    }, [onComplete]);

    // Initialize stars
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const logoSize = Math.min(rect.width, rect.height) * 0.4;

        // Create background stars
        const bgStars: Star[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            targetX: Math.random() * rect.width,
            targetY: Math.random() * rect.height,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
            delay: Math.random() * 500,
            isLogoStar: false,
        }));

        // Create logo stars
        const logoStars: Star[] = LOGO_POINTS.map((point, i) => ({
            id: 50 + i,
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            targetX: centerX + (point.x - 0.5) * logoSize,
            targetY: centerY + (point.y - 0.5) * logoSize,
            size: 6,
            opacity: 0,
            delay: i * 100,
            isLogoStar: true,
        }));

        setStars([...bgStars, ...logoStars]);

        // Keyboard listener
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleSkip();
        };
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleSkip]);

    // Animation phases
    useEffect(() => {
        startTimeRef.current = Date.now();

        const timers = [
            setTimeout(() => setPhase('converge'), 500),
            setTimeout(() => setPhase('connect'), 1500),
            setTimeout(() => setPhase('logo'), 2200),
            setTimeout(() => setPhase('fadeout'), 3000),
            setTimeout(() => {
                setOpacity(0);
                setTimeout(onComplete, 500);
            }, 3500),
        ];

        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    // Animate stars
    useEffect(() => {
        if (phase === 'converge' || phase === 'connect' || phase === 'logo') {
            setStars(prev => prev.map(star => {
                if (star.isLogoStar) {
                    const progress = Math.min(1, (Date.now() - startTimeRef.current - 500 - star.delay) / 800);
                    const easeProgress = 1 - Math.pow(1 - Math.max(0, progress), 3);
                    return {
                        ...star,
                        x: star.x + (star.targetX - star.x) * easeProgress,
                        y: star.y + (star.targetY - star.y) * easeProgress,
                        opacity: Math.min(1, progress * 2),
                    };
                }
                return star;
            }));
        }
    }, [phase]);

    // Draw constellation lines
    useEffect(() => {
        if (phase === 'connect' || phase === 'logo' || phase === 'fadeout') {
            const newLines: ConstellationLine[] = LOGO_CONNECTIONS.map(([from, to], i) => ({
                from: 50 + from,
                to: 50 + to,
                opacity: Math.min(1, (Date.now() - startTimeRef.current - 1500 - i * 50) / 300),
            }));
            setLines(newLines);
        }
    }, [phase]);

    // Animation loop
    useEffect(() => {
        const animate = () => {
            setStars(prev => prev.map(star => {
                if (star.isLogoStar && (phase === 'converge' || phase === 'connect')) {
                    const elapsed = Date.now() - startTimeRef.current - 500 - star.delay;
                    const progress = Math.min(1, Math.max(0, elapsed / 800));
                    const easeProgress = 1 - Math.pow(1 - progress, 3);

                    const startX = star.x;
                    const startY = star.y;

                    return {
                        ...star,
                        x: startX + (star.targetX - startX) * 0.1,
                        y: startY + (star.targetY - startY) * 0.1,
                        opacity: Math.min(1, progress * 2),
                    };
                }
                // Twinkle background stars
                if (!star.isLogoStar) {
                    return {
                        ...star,
                        opacity: star.opacity + (Math.random() - 0.5) * 0.05,
                    };
                }
                return star;
            }));

            if (phase !== 'fadeout') {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [phase]);

    const logoStars = stars.filter(s => s.isLogoStar);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-white transition-opacity duration-500"
            style={{ opacity }}
        >
            {/* Skip Button */}
            <button
                onClick={handleSkip}
                className="absolute top-6 right-6 z-50 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
                Skip (Esc)
            </button>

            {/* Stars */}
            <svg className="absolute inset-0 w-full h-full">
                {/* Background stars */}
                {stars.filter(s => !s.isLogoStar).map(star => (
                    <circle
                        key={star.id}
                        cx={star.x}
                        cy={star.y}
                        r={star.size}
                        fill="#000"
                        opacity={Math.max(0.1, Math.min(0.4, star.opacity))}
                        className="animate-twinkle"
                        style={{ animationDelay: `${star.delay}ms` }}
                    />
                ))}

                {/* Constellation lines */}
                {lines.map((line, i) => {
                    const fromStar = stars.find(s => s.id === line.from);
                    const toStar = stars.find(s => s.id === line.to);
                    if (!fromStar || !toStar || line.opacity <= 0) return null;

                    return (
                        <line
                            key={`line-${i}`}
                            x1={fromStar.targetX}
                            y1={fromStar.targetY}
                            x2={toStar.targetX}
                            y2={toStar.targetY}
                            stroke="#000"
                            strokeWidth="1"
                            opacity={Math.min(0.3, line.opacity * 0.3)}
                            className="animate-constellation-draw"
                            style={{ animationDelay: `${i * 50}ms` }}
                        />
                    );
                })}

                {/* Logo stars */}
                {logoStars.map(star => (
                    <g key={star.id}>
                        {/* Glow */}
                        <circle
                            cx={star.targetX}
                            cy={star.targetY}
                            r={star.size * 2}
                            fill="url(#starGlow)"
                            opacity={star.opacity * 0.5}
                        />
                        {/* Star */}
                        <circle
                            cx={star.targetX}
                            cy={star.targetY}
                            r={star.size}
                            fill="#000"
                            opacity={star.opacity}
                        />
                    </g>
                ))}

                {/* Gradient definitions */}
                <defs>
                    <radialGradient id="starGlow">
                        <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </svg>

            {/* Logo Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                    className={`text-center transition-all duration-1000 ${
                        phase === 'logo' || phase === 'fadeout'
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                    }`}
                >
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-4">
                        Constella
                    </h1>
                    <p className="text-lg text-gray-500 font-light tracking-wide">
                        Connect context, like stars.
                    </p>
                </div>
            </div>
        </div>
    );
}
