'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Lumi Video Avatar
 *
 * 仕様準拠:
 * - idle が全体の 80-90% を占める
 * - 表情は約3秒で自動的に idle に戻る
 * - 表情動画は1回だけ再生される
 */

export type LumiEmotion = 'idle' | 'happy' | 'sad' | 'angry' | 'surprised';

interface LumiVideoAvatarProps {
    emotion?: LumiEmotion | string;
    size?: number;
    className?: string;
    onEmotionComplete?: () => void;
}

export function LumiVideoAvatar({
    emotion = 'idle',
    size = 200,
    className = '',
    onEmotionComplete
}: LumiVideoAvatarProps) {
    const idleVideoRef = useRef<HTMLVideoElement>(null);
    const emotionVideoRef = useRef<HTMLVideoElement>(null);
    const [isPlayingEmotion, setIsPlayingEmotion] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState<string>('idle');
    const lastEmotionRef = useRef<string>('idle');

    // Play idle video on loop
    useEffect(() => {
        const idleVideo = idleVideoRef.current;
        if (idleVideo) {
            idleVideo.loop = true;
            idleVideo.muted = true;
            idleVideo.play().catch(() => {});
        }
    }, []);

    // Handle emotion change
    useEffect(() => {
        const normalizedEmotion = emotion === 'neutral' ? 'idle' : emotion;

        // Skip if same emotion or idle
        if (normalizedEmotion === lastEmotionRef.current) return;
        if (normalizedEmotion === 'idle') {
            setIsPlayingEmotion(false);
            setCurrentEmotion('idle');
            lastEmotionRef.current = 'idle';
            return;
        }

        // Already playing - don't interrupt
        if (isPlayingEmotion) return;

        // Trigger new emotion
        lastEmotionRef.current = normalizedEmotion;
        setCurrentEmotion(normalizedEmotion);
        setIsPlayingEmotion(true);

        const emotionVideo = emotionVideoRef.current;
        if (emotionVideo) {
            emotionVideo.currentTime = 0;
            emotionVideo.play().catch(() => {
                // Fallback if video fails
                setIsPlayingEmotion(false);
                setCurrentEmotion('idle');
                lastEmotionRef.current = 'idle';
            });
        }
    }, [emotion, isPlayingEmotion]);

    // Handle emotion video end - return to idle
    const handleEmotionEnd = useCallback(() => {
        setIsPlayingEmotion(false);
        setCurrentEmotion('idle');
        lastEmotionRef.current = 'idle';
        onEmotionComplete?.();
    }, [onEmotionComplete]);

    // Get video source for emotion
    const getEmotionVideoSrc = (em: string) => {
        switch (em) {
            case 'happy': return '/lumi/happy.mp4';
            case 'sad': return '/lumi/sad.mp4';
            case 'angry': return '/lumi/angry.mp4';
            case 'surprised': return '/lumi/surprised.mp4';
            default: return '/lumi/idle.mp4';
        }
    };

    return (
        <div
            className={`relative overflow-hidden rounded-full ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Idle video (always playing in background) */}
            <video
                ref={idleVideoRef}
                src="/lumi/idle.mp4"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                    isPlayingEmotion ? 'opacity-0' : 'opacity-100'
                }`}
                muted
                playsInline
                autoPlay
                loop
            />

            {/* Emotion video (plays once then hides) */}
            {currentEmotion !== 'idle' && (
                <video
                    ref={emotionVideoRef}
                    key={currentEmotion}
                    src={getEmotionVideoSrc(currentEmotion)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isPlayingEmotion ? 'opacity-100' : 'opacity-0'
                    }`}
                    muted
                    playsInline
                    onEnded={handleEmotionEnd}
                />
            )}
        </div>
    );
}
