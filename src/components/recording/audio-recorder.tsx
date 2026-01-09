'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { StarryVisualizer } from './starry-visualizer';
import { motion } from 'framer-motion';
import { useRecording } from '@/lib/recording-context';

export function AudioRecorder({ projectId }: { projectId?: number }) {
    const { isImmersiveOpen, closeImmersive, activeProjectId } = useRecording();
    const effectiveProjectId = projectId || activeProjectId;

    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    const router = useRouter();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            setAnalyser(analyserRef.current);

            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const originalBlob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });

                if (stream) stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) audioContextRef.current.close();
                setAnalyser(null);

                setAudioBlob(originalBlob);
                toast.success('録音が完了しました');
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error('マイクにアクセスできません。権限を確認してください。');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setElapsedTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
        toast.info('録音がキャンセルされました');
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Use server-side upload to avoid CORS issues
            const formData = new FormData();

            // Create a file from blob with proper extension
            const mimeType = audioBlob.type || 'audio/webm';
            const extension = mimeType.split('/')[1] || 'webm';
            const file = new File([audioBlob], `recording.${extension}`, { type: mimeType });

            formData.append('file', file);
            if (effectiveProjectId) {
                formData.append('projectId', effectiveProjectId.toString());
            }

            // Upload via server API with progress tracking
            const xhr = new XMLHttpRequest();

            const result = await new Promise<{ success: boolean; recordingId?: number; error?: string }>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress((e.loaded / e.total) * 100);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve(response);
                        } catch {
                            reject(new Error('レスポンスの解析に失敗しました'));
                        }
                    } else {
                        try {
                            const errorResponse = JSON.parse(xhr.responseText);
                            reject(new Error(errorResponse.error || `アップロード失敗 (${xhr.status})`));
                        } catch {
                            reject(new Error(`アップロード失敗 (${xhr.status})`));
                        }
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('ネットワークエラーが発生しました'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('アップロードが中断されました'));
                });

                xhr.open('POST', '/api/recordings/upload');
                xhr.send(formData);
            });

            if (!result.success || !result.recordingId) {
                throw new Error(result.error || 'アップロードに失敗しました');
            }

            toast.success('アップロード完了！文字起こし中...');
            closeImmersive();
            setAudioBlob(null);
            setElapsedTime(0);
            router.refresh();
            router.push(`/recordings/${result.recordingId}`);

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error instanceof Error ? error.message : 'アップロードに失敗しました');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isImmersiveOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-gray-900 text-white overflow-hidden"
        >
            <StarryVisualizer analyser={analyser} />

            {/* UI Layer */}
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-12 pointer-events-none">
                {/* Header */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-pulse shadow-[0_0_10px_#fff]' : 'bg-white/60'}`} />
                            <h2 className="text-xs font-medium text-white/80 tracking-[0.3em] uppercase">
                                {isRecording ? 'Recording Active' : isUploading ? 'Uploading...' : 'System Ready'}
                            </h2>
                        </div>
                        <p className="text-white/40 text-[10px] tracking-widest uppercase font-light flex items-center gap-2">
                            <Star className="w-3 h-3" />
                            {effectiveProjectId ? `Stella ID: ${effectiveProjectId}` : 'Quick Memo Mode'}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isRecording) {
                                stopRecording();
                            }
                            closeImmersive();
                        }}
                        className="rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white backdrop-blur-md border border-white/10 w-12 h-12 cursor-pointer z-50"
                        type="button"
                        disabled={isUploading}
                    >
                        <X className="w-6 h-6 pointer-events-none" />
                    </Button>
                </div>

                {/* Center Content */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-12 pointer-events-auto">
                    {/* Timer */}
                    <div className="text-center space-y-2">
                        <div className="text-7xl md:text-9xl font-extralight tracking-tighter text-white tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            {formatTime(elapsedTime)}
                        </div>
                        <p className="text-white/30 text-xs tracking-[0.5em] uppercase">Duration</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {!isRecording && !audioBlob && !isUploading && (
                            <Button
                                onClick={startRecording}
                                className="start-btn h-24 px-12 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 backdrop-blur-md text-white tracking-[0.2em] uppercase transition-all duration-500 hover:scale-105 hover:border-white/40 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] text-lg font-light"
                            >
                                <Mic className="w-5 h-5 mr-3" />
                                録音をする
                            </Button>
                        )}

                        {isRecording && (
                            <div className="flex items-center gap-8">
                                <Button
                                    onClick={cancelRecording}
                                    variant="ghost"
                                    className="h-16 w-16 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300"
                                    title="Cancel"
                                >
                                    <X className="w-8 h-8" />
                                </Button>

                                <Button
                                    onClick={stopRecording}
                                    className="h-24 w-24 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 flex items-center justify-center group shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                >
                                    <Square className="w-8 h-8 fill-current group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                </Button>
                            </div>
                        )}

                        {isUploading && (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                                <Loader2 className="w-12 h-12 animate-spin text-white" />
                                <div className="text-center space-y-2">
                                    <p className="text-white/80 text-sm tracking-widest uppercase">アップロード中...</p>
                                    <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-white/40 text-xs">{uploadProgress.toFixed(0)}%</p>
                                </div>
                            </div>
                        )}

                        {audioBlob && !isUploading && (
                            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                                <div className="flex gap-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setAudioBlob(null); setElapsedTime(0); startRecording(); }}
                                        className="h-14 px-8 border-white/20 text-white/60 hover:text-white hover:bg-white/5 rounded-full uppercase tracking-widest text-xs bg-transparent"
                                    >
                                        再録音
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="h-14 px-10 bg-white hover:bg-white/90 text-gray-900 font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.5)] transition-all duration-300"
                                    >
                                        処理開始
                                    </Button>
                                </div>
                                <p className="text-white/40 text-[10px] tracking-widest uppercase">文字起こしと議事録を生成します</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end text-[10px] text-white/20 font-mono tracking-widest uppercase pointer-events-auto">
                    <div>
                        <span className="block">Audio Stream: 48kHz</span>
                        <span className="block">Format: WebM/Opus</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="w-3 h-3" />
                        Constella Recording Engine
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
