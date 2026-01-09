'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface LumiVoiceOptions {
    pitch?: number;      // 0.5 - 2 (default: 1.4 for cute boy voice)
    rate?: number;       // 0.5 - 2 (default: 1.0)
    volume?: number;     // 0 - 1 (default: 1)
    lang?: string;       // default: 'ja-JP'
}

interface UseLumiVoiceReturn {
    speak: (text: string, options?: LumiVoiceOptions) => void;
    stop: () => void;
    isSpeaking: boolean;
    isSupported: boolean;
}

const DEFAULT_OPTIONS: LumiVoiceOptions = {
    pitch: 1.25,     // Natural but slightly bright voice
    rate: 1.1,       // Natural conversation speed
    volume: 1,
    lang: 'ja-JP'
};

export function useLumiVoice(): UseLumiVoiceReturn {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const voicesLoadedRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);

            // Load voices
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    voicesLoadedRef.current = true;
                }
            };

            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;

            return () => {
                window.speechSynthesis.onvoiceschanged = null;
            };
        }
    }, []);

    const getPreferredVoice = useCallback((lang: string) => {
        const voices = window.speechSynthesis.getVoices();

        // Preferred voices for cute Japanese voice (in order of preference)
        const preferredVoiceNames = [
            'Google 日本語',
            'Kyoko',
            'O-Ren',
            'Otoya',
            'Microsoft Nanami Online',
            'Microsoft Haruka',
        ];

        // Try to find preferred voice
        for (const name of preferredVoiceNames) {
            const voice = voices.find(v => v.name.includes(name) && v.lang.startsWith('ja'));
            if (voice) return voice;
        }

        // Fallback to any Japanese voice
        const japaneseVoice = voices.find(v => v.lang.startsWith('ja'));
        if (japaneseVoice) return japaneseVoice;

        // Fallback to default
        return voices.find(v => v.default) || voices[0];
    }, []);

    const speak = useCallback((text: string, options?: LumiVoiceOptions) => {
        if (!isSupported) return;

        // Stop any current speech
        window.speechSynthesis.cancel();

        const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.pitch = mergedOptions.pitch!;
        utterance.rate = mergedOptions.rate!;
        utterance.volume = mergedOptions.volume!;
        utterance.lang = mergedOptions.lang!;

        // Set voice
        const voice = getPreferredVoice(mergedOptions.lang!);
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isSupported, getPreferredVoice]);

    const stop = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    return {
        speak,
        stop,
        isSpeaking,
        isSupported
    };
}

// Lumi's personality-based responses - casual friend style
export const LUMI_PHRASES = {
    greetings: [
        'お疲れ〜！今日どうだった？なんかあった？',
        'やっほー！元気？最近どんな感じ？',
        'おっ、来たね！何してたの？',
        'ねーねー、聞いて聞いて！...あ、まずキミの話聞かせて！',
        'よっ！暇してた？ボクと話そうよ！',
    ],
    encouragement: [
        'おお、いいじゃん！その調子！',
        'マジで？すごいね！',
        'うんうん、それでいいと思う！',
        '大丈夫大丈夫、焦んなくていいよ。',
    ],
    thinking: [
        'ふーん、なるほどね...',
        'えーと、ちょっと待って。',
        'うーん、それって...',
    ],
    curiosity: [
        'え、それどういうこと？もっと聞きたい！',
        'へぇ〜、マジで？初めて聞いた！',
        'ちょっと詳しく教えて！',
    ],
    completion: [
        'やった！終わりだね！',
        'お疲れ〜！よくやったね！',
        'いい感じ！また話そうね！',
    ],
    listening: [
        'うんうん、聞いてるよ。',
        'なるほどね、それで？',
        'うん、続けて。',
    ],
    gentle: [
        '無理すんなよ〜。',
        'ゆっくりでいいからさ。',
        'たまには休もうよ。',
    ],
};

// Helper to get random phrase from category
export function getRandomPhrase(category: keyof typeof LUMI_PHRASES): string {
    const phrases = LUMI_PHRASES[category];
    return phrases[Math.floor(Math.random() * phrases.length)];
}
