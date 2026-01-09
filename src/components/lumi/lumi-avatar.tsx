'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export type LumiExpression =
    | 'neutral'
    | 'happy'
    | 'thinking'
    | 'curious'
    | 'encouraging'
    | 'surprised'
    | 'listening'
    | 'proud'
    | 'gentle'
    | 'sleepy';

interface LumiAvatarProps {
    expression?: LumiExpression;
    size?: number;
    speaking?: boolean;
    listening?: boolean;
    className?: string;
}

export function LumiAvatar({
    expression = 'neutral',
    size = 120,
    speaking = false,
    listening = false,
    className = ''
}: LumiAvatarProps) {
    const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number; angle: number }>>([]);
    const [floatingStars, setFloatingStars] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

    useEffect(() => {
        // Sparkle particles
        const newSparkles = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 5 + Math.random() * 90,
            delay: i * 0.2,
            size: Math.random() * 3 + 2,
            angle: Math.random() * 360
        }));
        setSparkles(newSparkles);

        // Floating mini stars
        const newStars = Array.from({ length: 5 }, (_, i) => ({
            id: i,
            x: 15 + Math.random() * 70,
            y: 10 + Math.random() * 80,
            delay: i * 0.4
        }));
        setFloatingStars(newStars);
    }, []);

    // Expression configs
    const getExpressionConfig = () => {
        switch (expression) {
            case 'happy': return { eyeType: 'happy', mouthType: 'big-smile', blush: true, sparkle: true };
            case 'thinking': return { eyeType: 'closed', mouthType: 'hmm', blush: false, sparkle: false };
            case 'curious': return { eyeType: 'wide', mouthType: 'open', blush: false, sparkle: true };
            case 'encouraging': return { eyeType: 'wink', mouthType: 'smile', blush: true, sparkle: true };
            case 'surprised': return { eyeType: 'wide', mouthType: 'o', blush: false, sparkle: true };
            case 'listening': return { eyeType: 'soft', mouthType: 'small', blush: false, sparkle: false };
            case 'proud': return { eyeType: 'happy', mouthType: 'grin', blush: true, sparkle: true };
            case 'gentle': return { eyeType: 'soft', mouthType: 'gentle', blush: true, sparkle: false };
            case 'sleepy': return { eyeType: 'sleepy', mouthType: 'yawn', blush: false, sparkle: false };
            default: return { eyeType: 'normal', mouthType: 'smile', blush: false, sparkle: false };
        }
    };

    const config = getExpressionConfig();

    // Render detailed eyes with eyelashes and reflections
    const renderEyes = () => {
        const leftX = 38;
        const rightX = 62;
        const eyeY = 50;

        const renderSingleEye = (cx: number, isWink = false) => {
            if (isWink) {
                return (
                    <g>
                        {/* Wink eye - curved line with lashes */}
                        <path d={`M ${cx - 6} ${eyeY} Q ${cx} ${eyeY + 4} ${cx + 6} ${eyeY}`}
                            fill="none" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Lashes */}
                        <path d={`M ${cx - 5} ${eyeY - 1} L ${cx - 7} ${eyeY - 4}`} stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                        <path d={`M ${cx} ${eyeY - 2} L ${cx} ${eyeY - 5}`} stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                        <path d={`M ${cx + 5} ${eyeY - 1} L ${cx + 7} ${eyeY - 4}`} stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                );
            }

            switch (config.eyeType) {
                case 'happy':
                    return (
                        <g>
                            <path d={`M ${cx - 6} ${eyeY} Q ${cx} ${eyeY - 6} ${cx + 6} ${eyeY}`}
                                fill="none" stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Lashes */}
                            <path d={`M ${cx - 5} ${eyeY - 3} L ${cx - 6} ${eyeY - 6}`} stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
                            <path d={`M ${cx + 5} ${eyeY - 3} L ${cx + 6} ${eyeY - 6}`} stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
                        </g>
                    );
                case 'closed':
                    return (
                        <g>
                            <line x1={cx - 5} y1={eyeY} x2={cx + 5} y2={eyeY} stroke="#4A3728" strokeWidth="2.5" strokeLinecap="round" />
                            <path d={`M ${cx - 4} ${eyeY - 2} L ${cx - 5} ${eyeY - 4}`} stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
                            <path d={`M ${cx + 4} ${eyeY - 2} L ${cx + 5} ${eyeY - 4}`} stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
                        </g>
                    );
                case 'wide':
                    return (
                        <g>
                            {/* Large eye */}
                            <ellipse cx={cx} cy={eyeY} rx="7" ry="8" fill="white" stroke="#4A3728" strokeWidth="1.5" />
                            <circle cx={cx} cy={eyeY} r="5" fill="#4A3728" />
                            <circle cx={cx + 1.5} cy={eyeY - 2} r="2" fill="white" />
                            <circle cx={cx - 1} cy={eyeY + 1} r="1" fill="white" opacity="0.6" />
                            {/* Lashes */}
                            <path d={`M ${cx - 6} ${eyeY - 5} L ${cx - 8} ${eyeY - 8}`} stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                            <path d={`M ${cx} ${eyeY - 7} L ${cx} ${eyeY - 10}`} stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                            <path d={`M ${cx + 6} ${eyeY - 5} L ${cx + 8} ${eyeY - 8}`} stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                        </g>
                    );
                case 'soft':
                    return (
                        <g>
                            <ellipse cx={cx} cy={eyeY} rx="5" ry="4" fill="white" stroke="#4A3728" strokeWidth="1" />
                            <ellipse cx={cx} cy={eyeY + 0.5} rx="3.5" ry="3" fill="#4A3728" />
                            <circle cx={cx + 1} cy={eyeY - 0.5} r="1.2" fill="white" />
                        </g>
                    );
                case 'sleepy':
                    return (
                        <g>
                            <motion.ellipse cx={cx} cy={eyeY} rx="5" ry="2" fill="#4A3728"
                                animate={{ ry: [2, 1.5, 2] }} transition={{ duration: 2, repeat: Infinity }} />
                        </g>
                    );
                default: // normal
                    return (
                        <motion.g animate={speaking ? { y: [0, -0.5, 0] } : {}} transition={{ duration: 0.15, repeat: speaking ? Infinity : 0 }}>
                            {/* Eye white */}
                            <ellipse cx={cx} cy={eyeY} rx="6" ry="6" fill="white" stroke="#4A3728" strokeWidth="1" />
                            {/* Pupil */}
                            <circle cx={cx} cy={eyeY} r="4" fill="#4A3728" />
                            {/* Reflections */}
                            <circle cx={cx + 1.5} cy={eyeY - 1.5} r="1.5" fill="white" />
                            <circle cx={cx - 0.5} cy={eyeY + 1} r="0.8" fill="white" opacity="0.6" />
                            {/* Lashes */}
                            <path d={`M ${cx - 5} ${eyeY - 4} L ${cx - 6} ${eyeY - 6}`} stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
                            <path d={`M ${cx + 5} ${eyeY - 4} L ${cx + 6} ${eyeY - 6}`} stroke="#4A3728" strokeWidth="1" strokeLinecap="round" />
                        </motion.g>
                    );
            }
        };

        return (
            <>
                {config.eyeType === 'wink' ? renderSingleEye(leftX, true) : renderSingleEye(leftX)}
                {renderSingleEye(rightX)}
            </>
        );
    };

    // Render mouth with more detail
    const renderMouth = () => {
        const mouthY = 62;

        switch (config.mouthType) {
            case 'big-smile':
                return (
                    <motion.g animate={speaking ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.1, repeat: speaking ? Infinity : 0 }}>
                        <path d="M 40 60 Q 50 72 60 60" fill="#FF9999" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 43 60 Q 50 68 57 60" fill="#FF6666" />
                    </motion.g>
                );
            case 'grin':
                return (
                    <path d="M 38 58 Q 50 70 62 58" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
                );
            case 'smile':
                return (
                    <motion.path
                        d="M 42 60 Q 50 68 58 60"
                        fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round"
                        animate={speaking ? { d: ["M 42 60 Q 50 68 58 60", "M 42 60 Q 50 72 58 60", "M 42 60 Q 50 68 58 60"] } : {}}
                        transition={{ duration: 0.12, repeat: speaking ? Infinity : 0 }}
                    />
                );
            case 'small':
                return (
                    <path d="M 46 61 Q 50 64 54 61" fill="none" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                );
            case 'hmm':
                return (
                    <path d="M 45 62 Q 50 60 55 62" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
                );
            case 'open':
                return (
                    <ellipse cx={50} cy={62} rx="4" ry="5" fill="#FF9999" stroke="#4A3728" strokeWidth="1.5" />
                );
            case 'o':
                return (
                    <motion.ellipse cx={50} cy={62} rx="6" ry="8" fill="#FF9999" stroke="#4A3728" strokeWidth="1.5"
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} />
                );
            case 'gentle':
                return (
                    <path d="M 44 60 Q 50 65 56 60" fill="none" stroke="#4A3728" strokeWidth="1.5" strokeLinecap="round" />
                );
            case 'yawn':
                return (
                    <motion.ellipse cx={50} cy={62} rx="5" ry="6" fill="#FF9999" stroke="#4A3728" strokeWidth="1.5"
                        animate={{ ry: [6, 8, 6] }} transition={{ duration: 2, repeat: Infinity }} />
                );
            default:
                return (
                    <path d="M 44 60 Q 50 66 56 60" fill="none" stroke="#4A3728" strokeWidth="2" strokeLinecap="round" />
                );
        }
    };

    // Create detailed star path
    const createStarPath = (cx: number, cy: number, outerR: number, innerR: number, points: number = 5): string => {
        const pts: string[] = [];
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / 2) + (i * Math.PI / points);
            pts.push(`${cx + r * Math.cos(angle)},${cy - r * Math.sin(angle)}`);
        }
        return pts.join(' ');
    };

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {/* Listening pulse effect */}
            {listening && (
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(100,200,255,0.3) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />
            )}

            {/* Outer glow */}
            <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle, ${speaking ? 'rgba(255,200,100,0.7)' : 'rgba(255,220,100,0.5)'} 0%, transparent 70%)`,
                    filter: 'blur(15px)',
                }}
                animate={{
                    scale: speaking ? [1, 1.2, 1] : [1, 1.08, 1],
                    opacity: [0.5, 0.9, 0.5]
                }}
                transition={{ duration: speaking ? 0.25 : 2, repeat: Infinity }}
            />

            <svg viewBox="0 0 100 100" width={size} height={size} className="relative z-10">
                <defs>
                    {/* Gradients */}
                    <radialGradient id="starBodyGrad" cx="35%" cy="30%" r="65%">
                        <stop offset="0%" stopColor="#FFFEF5" />
                        <stop offset="40%" stopColor="#FFE896" />
                        <stop offset="80%" stopColor="#FFD54F" />
                        <stop offset="100%" stopColor="#FFC107" />
                    </radialGradient>
                    <radialGradient id="innerGlowGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#FFE082" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFE896" />
                        <stop offset="100%" stopColor="#FFD54F" />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="softShadow">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FFB300" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* Floating animation */}
                <motion.g
                    animate={{
                        y: [0, -3, 0],
                        rotate: speaking ? [0, 2, -2, 0] : [0, 1, -1, 0]
                    }}
                    transition={{
                        y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: speaking ? 0.2 : 4, repeat: Infinity }
                    }}
                    style={{ transformOrigin: '50px 50px' }}
                >
                    {/* Back sparkle effect */}
                    {config.sparkle && (
                        <motion.circle cx="50" cy="50" r="42" fill="url(#innerGlowGrad)"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}

                    {/* Main star body */}
                    <motion.polygon
                        points={createStarPath(50, 52, 40, 22)}
                        fill="url(#starBodyGrad)"
                        filter="url(#softShadow)"
                        stroke="#FFCA28"
                        strokeWidth="1.5"
                        animate={{ scale: speaking ? [1, 1.03, 1] : 1 }}
                        transition={{ duration: 0.12, repeat: speaking ? Infinity : 0 }}
                        style={{ transformOrigin: '50px 52px' }}
                    />

                    {/* Inner star pattern */}
                    <polygon
                        points={createStarPath(50, 52, 28, 16)}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="1"
                    />

                    {/* Body highlight */}
                    <ellipse cx="40" cy="42" rx="12" ry="10" fill="rgba(255,255,255,0.5)" />
                    <circle cx="36" cy="40" r="5" fill="rgba(255,255,255,0.6)" />
                    <circle cx="34" cy="38" r="2" fill="rgba(255,255,255,0.8)" />

                    {/* Left arm */}
                    <motion.g
                        animate={{ rotate: speaking ? [-15, 15, -15] : listening ? [-10, 10, -10] : [-5, 5, -5] }}
                        transition={{ duration: speaking ? 0.25 : listening ? 0.5 : 1.5, repeat: Infinity }}
                        style={{ transformOrigin: '18px 55px' }}
                    >
                        <ellipse cx="12" cy="58" rx="8" ry="5" fill="url(#armGrad)" stroke="#FFCA28" strokeWidth="0.5" />
                        <circle cx="5" cy="58" r="5" fill="url(#armGrad)" stroke="#FFCA28" strokeWidth="0.5" />
                        {/* Finger details */}
                        <circle cx="2" cy="56" r="1.5" fill="#FFE896" />
                        <circle cx="2" cy="60" r="1.5" fill="#FFE896" />
                    </motion.g>

                    {/* Right arm */}
                    <motion.g
                        animate={{ rotate: speaking ? [15, -15, 15] : listening ? [10, -10, 10] : [5, -5, 5] }}
                        transition={{ duration: speaking ? 0.25 : listening ? 0.5 : 1.5, repeat: Infinity }}
                        style={{ transformOrigin: '82px 55px' }}
                    >
                        <ellipse cx="88" cy="58" rx="8" ry="5" fill="url(#armGrad)" stroke="#FFCA28" strokeWidth="0.5" />
                        <circle cx="95" cy="58" r="5" fill="url(#armGrad)" stroke="#FFCA28" strokeWidth="0.5" />
                        <circle cx="98" cy="56" r="1.5" fill="#FFE896" />
                        <circle cx="98" cy="60" r="1.5" fill="#FFE896" />
                    </motion.g>

                    {/* Face */}
                    <g>
                        {/* Eyebrows */}
                        {config.eyeType === 'surprised' && (
                            <>
                                <path d="M 30 40 Q 38 36 46 40" fill="none" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M 54 40 Q 62 36 70 40" fill="none" stroke="#5D4037" strokeWidth="1.5" strokeLinecap="round" />
                            </>
                        )}

                        {/* Eyes */}
                        {renderEyes()}

                        {/* Blush */}
                        <AnimatePresence>
                            {config.blush && (
                                <>
                                    <motion.ellipse cx="28" cy="56" rx="6" ry="3" fill="rgba(255,150,150,0.5)"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                                    <motion.ellipse cx="72" cy="56" rx="6" ry="3" fill="rgba(255,150,150,0.5)"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                                </>
                            )}
                        </AnimatePresence>

                        {/* Mouth */}
                        {renderMouth()}
                    </g>
                </motion.g>

                {/* Floating mini stars */}
                {floatingStars.map((star) => (
                    <motion.polygon
                        key={`star-${star.id}`}
                        points={createStarPath(star.x, star.y, 3, 1.5)}
                        fill="#FFE082"
                        initial={{ opacity: 0, scale: 0, y: star.y }}
                        animate={{
                            opacity: [0, 0.8, 0],
                            scale: [0, 1, 0],
                            y: [star.y, star.y - 10, star.y - 20]
                        }}
                        transition={{ duration: 3, repeat: Infinity, delay: star.delay }}
                    />
                ))}

                {/* Sparkle particles */}
                {sparkles.map((sparkle) => (
                    <motion.g
                        key={sparkle.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], rotate: [0, 180, 360] }}
                        transition={{ duration: 2, repeat: Infinity, delay: sparkle.delay }}
                        style={{ transformOrigin: `${sparkle.x}px ${sparkle.y}px` }}
                    >
                        {/* 4-pointed sparkle */}
                        <path
                            d={`M ${sparkle.x} ${sparkle.y - sparkle.size} L ${sparkle.x + sparkle.size * 0.3} ${sparkle.y} L ${sparkle.x} ${sparkle.y + sparkle.size} L ${sparkle.x - sparkle.size * 0.3} ${sparkle.y} Z`}
                            fill="#FFE082"
                        />
                        <path
                            d={`M ${sparkle.x - sparkle.size * 0.7} ${sparkle.y} L ${sparkle.x} ${sparkle.y + sparkle.size * 0.2} L ${sparkle.x + sparkle.size * 0.7} ${sparkle.y} L ${sparkle.x} ${sparkle.y - sparkle.size * 0.2} Z`}
                            fill="#FFF9C4"
                        />
                    </motion.g>
                ))}
            </svg>
        </div>
    );
}
