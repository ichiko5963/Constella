'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LumiVideoAvatar } from './lumi-video-avatar';
import { useAvatarController, Emotion } from '@/lib/avatar/avatarController';
import { X, Mic, Sparkles } from 'lucide-react';

// Fixed star positions to avoid hydration mismatch
const STAR_POSITIONS = [
    { x: 5, y: 12 }, { x: 15, y: 85 }, { x: 25, y: 32 }, { x: 35, y: 67 },
    { x: 45, y: 18 }, { x: 55, y: 91 }, { x: 65, y: 44 }, { x: 75, y: 73 },
    { x: 85, y: 28 }, { x: 95, y: 56 }, { x: 8, y: 41 }, { x: 18, y: 94 },
    { x: 28, y: 7 }, { x: 38, y: 62 }, { x: 48, y: 35 }, { x: 58, y: 88 },
    { x: 68, y: 15 }, { x: 78, y: 52 }, { x: 88, y: 79 }, { x: 98, y: 23 },
    { x: 3, y: 58 }, { x: 13, y: 26 }, { x: 23, y: 71 }, { x: 33, y: 4 },
    { x: 43, y: 83 }, { x: 53, y: 49 }, { x: 63, y: 96 }, { x: 73, y: 11 },
    { x: 83, y: 66 }, { x: 93, y: 39 }, { x: 11, y: 77 }, { x: 21, y: 45 },
    { x: 31, y: 92 }, { x: 41, y: 19 }, { x: 51, y: 64 }, { x: 61, y: 31 },
    { x: 71, y: 86 }, { x: 81, y: 8 }, { x: 91, y: 53 }, { x: 2, y: 37 },
];

interface Message {
    id: string;
    role: 'user' | 'lumi';
    content: string;
    timestamp: Date;
}

interface LumiChatProps {
    projectId?: number;
}

const LUMI_GREETINGS = [
    'お疲れ〜！今日どうだった？',
    'やっほー！何してたの？',
    'おっ、来たね！話そうよ！',
    'よっ！暇してた？',
];

export function LumiChat({ projectId }: LumiChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const isSessionActiveRef = useRef(false);
    const messagesRef = useRef<Message[]>([]);
    const recognitionRef = useRef<any>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const interimTextRef = useRef('');

    const avatar = useAvatarController();

    useEffect(() => { isSessionActiveRef.current = isSessionActive; }, [isSessionActive]);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { interimTextRef.current = interimText; }, [interimText]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, interimText]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (audioElementRef.current) audioElementRef.current.pause();
        };
    }, []);

    const processUserMessage = useCallback(async (userText: string) => {
        if (!userText.trim()) return;

        setIsProcessing(true);
        setInterimText('');
        avatar.onAiThinking();
        avatar.resetEmotionLock();

        const userMessage: Message = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: userText.trim(),
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const chatResponse = await fetch('/api/lumi/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    history: messagesRef.current.slice(-10),
                    projectId,
                }),
            });

            if (!chatResponse.ok) {
                const errorData = await chatResponse.json().catch(() => ({}));
                throw new Error(errorData.error || 'Chat failed');
            }

            const { text: lumiText, emotion } = await chatResponse.json();

            const lumiMessage: Message = {
                id: 'lumi-' + Date.now(),
                role: 'lumi',
                content: lumiText,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, lumiMessage]);
            avatar.onAiResponseFinalized(lumiText, emotion as Emotion);

            // TTS
            const ttsResponse = await fetch('/api/lumi/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: lumiText }),
            });

            if (ttsResponse.ok) {
                const audioBlob = await ttsResponse.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.playbackRate = 1.5;
                audioElementRef.current = audio;
                setIsSpeaking(true);

                audio.onended = () => {
                    setIsSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
                    avatar.onExpressionEnd();
                    if (isSessionActiveRef.current) startListening();
                };

                audio.onerror = () => {
                    setIsSpeaking(false);
                    if (isSessionActiveRef.current) startListening();
                };

                audio.play().catch(() => {
                    setIsSpeaking(false);
                    if (isSessionActiveRef.current) startListening();
                });
            } else {
                if (isSessionActiveRef.current) startListening();
            }

        } catch (error) {
            console.error('Processing error:', error);
            setErrorMessage(error instanceof Error ? error.message : 'エラーが発生しました');
            avatar.forceIdle();
            if (isSessionActiveRef.current) setTimeout(() => startListening(), 1000);
        } finally {
            setIsProcessing(false);
        }
    }, [avatar, projectId]);

    const startListening = useCallback(() => {
        if (!isSessionActiveRef.current) return;
        if (recognitionRef.current) return; // Already listening

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setErrorMessage('このブラウザは音声認識に対応していません');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        let finalTranscript = '';
        let silenceTimer: NodeJS.Timeout | null = null;

        recognition.onstart = () => {
            setIsListening(true);
            setInterimText('');
            finalTranscript = '';
            avatar.onUserSpeaking();
        };

        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interim += transcript;
                }
            }

            const currentText = finalTranscript + interim;
            setInterimText(currentText);

            if (silenceTimer) clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                if (currentText.trim()) {
                    recognition.stop();
                }
            }, 2000);

            avatar.onUserSpeaking();
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
            if (silenceTimer) clearTimeout(silenceTimer);

            const textToProcess = finalTranscript.trim() || interimTextRef.current.trim();

            if (textToProcess && isSessionActiveRef.current) {
                processUserMessage(textToProcess);
            } else if (isSessionActiveRef.current && !isProcessing && !isSpeaking) {
                setTimeout(() => startListening(), 500);
            }
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            recognitionRef.current = null;

            if (event.error === 'no-speech') {
                if (isSessionActiveRef.current) setTimeout(() => startListening(), 500);
            } else if (event.error !== 'aborted') {
                setErrorMessage(`音声認識エラー: ${event.error}`);
                if (isSessionActiveRef.current) setTimeout(() => startListening(), 1000);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [avatar, processUserMessage, isProcessing, isSpeaking]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    // Start session - IMMEDIATE start, no waiting
    const startSession = async () => {
        setIsSessionActive(true);
        isSessionActiveRef.current = true;
        setMessages([]);
        setErrorMessage('');
        setInterimText('');
        avatar.forceIdle();

        const greeting = LUMI_GREETINGS[Math.floor(Math.random() * LUMI_GREETINGS.length)];
        const greetingMessage: Message = {
            id: 'greeting-' + Date.now(),
            role: 'lumi',
            content: greeting,
            timestamp: new Date(),
        };
        setMessages([greetingMessage]);

        // Start listening IMMEDIATELY - don't wait for TTS
        avatar.resetEmotionLock();
        avatar.onAiResponseFinalized(greeting, 'happy');

        // Play TTS in background (non-blocking)
        fetch('/api/lumi/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: greeting }),
        }).then(async (ttsResponse) => {
            if (ttsResponse.ok && isSessionActiveRef.current) {
                const audioBlob = await ttsResponse.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.playbackRate = 1.5;
                audioElementRef.current = audio;

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    avatar.onExpressionEnd();
                };

                audio.play().catch(() => {});
            }
        }).catch(() => {});

        // Start listening immediately
        setTimeout(() => startListening(), 100);
    };

    const endSession = async () => {
        isSessionActiveRef.current = false;
        stopListening();
        if (audioElementRef.current) audioElementRef.current.pause();
        avatar.forceIdle();
        setIsSpeaking(false);
        setInterimText('');

        const meaningfulMessages = messagesRef.current.filter(m => !m.id.startsWith('greeting-'));
        if (meaningfulMessages.length >= 1) {
            try {
                await fetch('/api/lumi/save-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: meaningfulMessages, projectId }),
                });
            } catch (e) {
                console.error('Auto-save failed:', e);
            }
        }

        setIsSessionActive(false);
        setMessages([]);
    };

    const getVideoEmotion = () => {
        if (avatar.currentEmotion && avatar.currentEmotion !== 'neutral') {
            return avatar.currentEmotion;
        }
        return 'idle';
    };

    // Idle screen - FULL WIDTH
    if (!isSessionActive) {
        return (
            <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
                {/* Stars */}
                <div className="absolute inset-0 opacity-30">
                    {STAR_POSITIONS.map((pos, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                            }}
                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                            transition={{
                                duration: 2 + (i % 5) * 0.6,
                                repeat: Infinity,
                                delay: (i % 8) * 0.25,
                            }}
                        />
                    ))}
                </div>

                {/* Gradient orbs */}
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl" />

                {/* Content - centered */}
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                    <motion.div
                        className="cursor-pointer"
                        onClick={startSession}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="relative">
                            <LumiVideoAvatar
                                emotion="idle"
                                size={300}
                                className="shadow-2xl shadow-amber-500/20"
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-2 border-amber-400/30"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-4xl font-light text-white tracking-wide">Lumi</h1>
                        <p className="mt-3 text-white/50 text-base">タップして話しかけてね</p>
                    </motion.div>

                    <motion.div
                        className="mt-10 flex items-center gap-2 text-amber-400/70"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm tracking-wider uppercase">Ready to chat</span>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Active session - FULL WIDTH layout
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            {/* Background stars */}
            <div className="absolute inset-0 opacity-20">
                {STAR_POSITIONS.map((pos, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-0.5 h-0.5 bg-white rounded-full"
                        style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                        }}
                        animate={{ opacity: [0.1, 0.6, 0.1] }}
                        transition={{
                            duration: 3 + (i % 4) * 0.5,
                            repeat: Infinity,
                            delay: (i % 10) * 0.2,
                        }}
                    />
                ))}
            </div>

            {/* Gradient orbs */}
            <motion.div
                className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl"
                animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
            />

            {/* Main layout - FULL WIDTH */}
            <div className="relative z-10 w-full h-full flex">
                {/* Left: Avatar - takes remaining space */}
                <div className="flex-1 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <LumiVideoAvatar
                            emotion={getVideoEmotion()}
                            size={280}
                            onEmotionComplete={() => avatar.onExpressionEnd()}
                            className="shadow-2xl shadow-amber-500/20"
                        />
                    </motion.div>

                    <h2 className="mt-8 text-3xl font-light text-white">Lumi</h2>

                    {/* Status */}
                    <div className="mt-6 h-10 flex items-center">
                        {isListening && (
                            <motion.div
                                className="flex items-center gap-3 text-emerald-400"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <Mic className="w-5 h-5" />
                                <span className="text-base font-light">聞いてるよ...</span>
                            </motion.div>
                        )}
                        {isProcessing && (
                            <motion.span
                                className="text-base text-blue-400 font-light"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            >
                                考え中...
                            </motion.span>
                        )}
                        {isSpeaking && (
                            <motion.div
                                className="flex items-center gap-1.5"
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                            >
                                {[...Array(4)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-5 bg-amber-400 rounded-full"
                                        animate={{ scaleY: [0.4, 1, 0.4] }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.1,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </div>

                    {/* End button */}
                    <motion.button
                        onClick={endSession}
                        className="mt-10 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center gap-2 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <X className="w-4 h-4 text-white/60" />
                        <span className="text-white/80 text-sm font-light tracking-wide">相談終わる</span>
                    </motion.button>

                    {errorMessage && (
                        <p className="mt-4 text-sm text-red-400">{errorMessage}</p>
                    )}
                </div>

                {/* Right: Conversation - wider panel */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-[500px] bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/10">
                        <h3 className="text-lg text-white/80 font-light tracking-wide">会話</h3>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-5 py-3 rounded-2xl text-base ${
                                            msg.role === 'user'
                                                ? 'bg-white/10 text-white rounded-br-sm'
                                                : 'bg-amber-500/20 text-amber-50 rounded-bl-sm'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Real-time transcription - ALWAYS show when there's interim text */}
                        {interimText && (
                            <motion.div
                                key="interim"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-end"
                            >
                                <div className="max-w-[85%] px-5 py-3 rounded-2xl rounded-br-sm text-base bg-white/5 text-white/60 border border-white/10">
                                    {interimText}
                                    <motion.span
                                        className="ml-0.5 text-amber-400"
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.6, repeat: Infinity }}
                                    >
                                        |
                                    </motion.span>
                                </div>
                            </motion.div>
                        )}

                        {/* Processing indicator */}
                        {isProcessing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="px-5 py-3 rounded-2xl rounded-bl-sm bg-amber-500/10 text-amber-400 text-base">
                                    <motion.span
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        ・・・
                                    </motion.span>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-5 border-t border-white/10">
                        <p className="text-sm text-white/40 text-center">
                            {isListening ? '話し終わったら自動で送信されます' : ''}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
