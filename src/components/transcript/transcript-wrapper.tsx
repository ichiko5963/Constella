'use client';

import { useRef, useState, useEffect } from 'react';
import { VirtualizedTranscript } from './virtualized-transcript';

interface TranscriptWrapperProps {
    recordingId: number;
    audioUrl: string;
}

export function TranscriptWrapper({ recordingId, audioUrl }: TranscriptWrapperProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 音声要素が読み込まれたら準備完了
        if (audioRef.current) {
            setIsReady(true);
        }
    }, [audioUrl]);

    return (
        <div className="h-full flex flex-col">
            {/* 音声要素を非表示で配置（同期エンジン用） */}
            <audio
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                className="hidden"
            />
            {isReady && audioRef.current ? (
                <VirtualizedTranscript 
                    recordingId={recordingId} 
                    audioRef={audioRef}
                    className="flex-1"
                />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>トランスクリプトを読み込み中...</p>
                </div>
            )}
        </div>
    );
}

