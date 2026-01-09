/**
 * Avatar Controller - Strict State Machine
 *
 * 最重要思想：
 * - 表情は「結果」であり「プロセス」ではない
 * - idle が全体の 80-90% を占める
 * - 表情は 1レスポンスにつき最大1回
 * - 表情は約3秒で必ず idle に戻る
 *
 * 禁止事項：
 * - ユーザー発話中に表情を出す
 * - AI思考中に表情を出す
 * - 沈黙中に表情を出す
 * - 複数の表情を連続再生する
 */

export type AvatarState =
    | 'idle'           // デフォルト（最重要）
    | 'playing_emotion'; // 表情動画再生中

export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';

// Map emotion to video file (neutral = idle)
export const EMOTION_TO_VIDEO: Record<Emotion, string> = {
    happy: '/lumi/happy.mp4',
    sad: '/lumi/sad.mp4',
    angry: '/lumi/angry.mp4',
    surprised: '/lumi/surprised.mp4',
    neutral: '/lumi/idle.mp4', // neutral = stay idle
};

export interface AvatarControllerCallbacks {
    onStateChange?: (state: AvatarState) => void;
    onPlayEmotion?: (emotion: Emotion) => void;
    onReturnToIdle?: () => void;
}

/**
 * Avatar Controller Class
 * Explicit state machine for avatar control
 */
export class AvatarController {
    private state: AvatarState = 'idle';
    private emotionLocked: boolean = false; // Prevents multiple emotions per response
    private callbacks: AvatarControllerCallbacks;

    constructor(callbacks: AvatarControllerCallbacks = {}) {
        this.callbacks = callbacks;
    }

    /**
     * Get current state
     */
    getState(): AvatarState {
        return this.state;
    }

    /**
     * Called when user starts speaking
     * Avatar should be idle
     */
    onUserSpeaking(): void {
        // Do nothing - stay idle
        // NEVER show expression during user speech
        this.ensureIdle();
    }

    /**
     * Called during user silence
     * Avatar should be idle
     */
    onUserSilence(): void {
        // Do nothing - stay idle
        // NEVER show expression during silence
        this.ensureIdle();
    }

    /**
     * Called when AI starts thinking/processing
     * Avatar should be idle (NOT thinking expression)
     */
    onAiThinking(): void {
        // Do nothing - stay idle
        // NEVER show expression during AI processing
        // thinking expression is prohibited per spec
        this.ensureIdle();
    }

    /**
     * Called when AI response is FULLY finalized
     * This is the ONLY place where expression can be triggered
     *
     * @param finalText - The complete AI response text
     * @param emotion - Server-classified emotion
     */
    onAiResponseFinalized(finalText: string, emotion: Emotion): void {
        // Don't trigger if already locked (already showed expression this response)
        if (this.emotionLocked) {
            console.log('Avatar: emotion locked, skipping');
            return;
        }

        // Don't trigger if currently playing an emotion
        if (this.state === 'playing_emotion') {
            console.log('Avatar: already playing emotion, skipping');
            return;
        }

        // Don't trigger for neutral - stay idle
        if (emotion === 'neutral') {
            console.log('Avatar: neutral emotion, staying idle');
            return;
        }

        // Lock emotion for this response cycle
        this.emotionLocked = true;

        // Trigger emotion
        this.state = 'playing_emotion';
        this.callbacks.onStateChange?.(this.state);
        this.callbacks.onPlayEmotion?.(emotion);

        console.log(`Avatar: playing emotion "${emotion}"`);
    }

    /**
     * Called when emotion video finishes playing
     * Must return to idle
     */
    onExpressionEnd(): void {
        this.state = 'idle';
        this.callbacks.onStateChange?.(this.state);
        this.callbacks.onReturnToIdle?.();
        console.log('Avatar: returned to idle');
    }

    /**
     * Reset emotion lock for new conversation turn
     * Call this when starting a new user->AI cycle
     */
    resetEmotionLock(): void {
        this.emotionLocked = false;
    }

    /**
     * Force return to idle (for error cases)
     */
    forceIdle(): void {
        this.state = 'idle';
        this.emotionLocked = false;
        this.callbacks.onStateChange?.(this.state);
        this.callbacks.onReturnToIdle?.();
    }

    /**
     * Ensure we're in idle state
     */
    private ensureIdle(): void {
        if (this.state !== 'idle' && this.state !== 'playing_emotion') {
            this.state = 'idle';
            this.callbacks.onStateChange?.(this.state);
        }
    }
}

/**
 * React Hook for Avatar Controller
 */
import { useCallback, useRef, useState } from 'react';

export function useAvatarController() {
    const [state, setState] = useState<AvatarState>('idle');
    const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
    const controllerRef = useRef<AvatarController | null>(null);

    // Initialize controller once
    if (!controllerRef.current) {
        controllerRef.current = new AvatarController({
            onStateChange: setState,
            onPlayEmotion: setCurrentEmotion,
            onReturnToIdle: () => setCurrentEmotion(null),
        });
    }

    const controller = controllerRef.current;

    const onUserSpeaking = useCallback(() => {
        controller.onUserSpeaking();
    }, [controller]);

    const onUserSilence = useCallback(() => {
        controller.onUserSilence();
    }, [controller]);

    const onAiThinking = useCallback(() => {
        controller.onAiThinking();
    }, [controller]);

    const onAiResponseFinalized = useCallback((text: string, emotion: Emotion) => {
        controller.onAiResponseFinalized(text, emotion);
    }, [controller]);

    const onExpressionEnd = useCallback(() => {
        controller.onExpressionEnd();
    }, [controller]);

    const resetEmotionLock = useCallback(() => {
        controller.resetEmotionLock();
    }, [controller]);

    const forceIdle = useCallback(() => {
        controller.forceIdle();
    }, [controller]);

    return {
        state,
        currentEmotion,
        onUserSpeaking,
        onUserSilence,
        onAiThinking,
        onAiResponseFinalized,
        onExpressionEnd,
        resetEmotionLock,
        forceIdle,
    };
}
