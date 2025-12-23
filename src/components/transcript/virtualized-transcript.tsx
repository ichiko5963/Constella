'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useEffect, useState, useCallback } from 'react';
import { TranscriptSyncEngine, TranscriptSegment } from '@/lib/transcript-sync';
import { getTranscriptSegments } from '@/server/actions/transcript';

interface VirtualizedTranscriptProps {
    recordingId: number;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    className?: string;
}

export function VirtualizedTranscript({ 
    recordingId, 
    audioRef,
    className = '' 
}: VirtualizedTranscriptProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const syncEngineRef = useRef<TranscriptSyncEngine | null>(null);
    const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

    // セグメントを取得
    useEffect(() => {
        getTranscriptSegments(recordingId)
            .then(setSegments)
            .catch(console.error);
    }, [recordingId]);

    // 同期エンジンの初期化
    useEffect(() => {
        if (segments.length === 0 || !audioRef.current) return;

        const syncEngine = new TranscriptSyncEngine(
            audioRef,
            segments,
            (index) => {
                setHighlightedIndex(index);
                // スクロール位置を調整
                if (index >= 0 && wordRefs.current.has(index)) {
                    const element = wordRefs.current.get(index);
                    if (element && parentRef.current) {
                        element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }
                }
            }
        );

        syncEngineRef.current = syncEngine;
        syncEngine.start();

        return () => {
            syncEngine.stop();
        };
    }, [segments, audioRef]);

    // 仮想化の設定
    const virtualizer = useVirtualizer({
        count: segments.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 30, // 各単語の推定高さ（ピクセル）
        overscan: 10, // 上下に余分にレンダリングする数
    });

    // 単語をクリックしたときにその時間にジャンプ
    const handleWordClick = useCallback((segment: TranscriptSegment) => {
        if (audioRef.current) {
            audioRef.current.currentTime = segment.start / 1000; // ミリ秒を秒に変換
        }
    }, [audioRef]);

    if (segments.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full text-gray-500 ${className}`}>
                <p>トランスクリプトセグメントを読み込み中...</p>
            </div>
        );
    }

    return (
        <div 
            ref={parentRef}
            className={`h-full overflow-auto ${className}`}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const segment = segments[virtualItem.index];
                    const isHighlighted = highlightedIndex === virtualItem.index;

                    return (
                        <div
                            key={virtualItem.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualItem.size}px`,
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            <span
                                ref={(el) => {
                                    if (el) {
                                        wordRefs.current.set(virtualItem.index, el);
                                    } else {
                                        wordRefs.current.delete(virtualItem.index);
                                    }
                                }}
                                onClick={() => handleWordClick(segment)}
                                className={`
                                    inline-block px-2 py-1 mx-1 rounded cursor-pointer transition-all duration-150
                                    ${isHighlighted 
                                        ? 'bg-primary/30 text-primary border border-primary/50 shadow-lg' 
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                {segment.word}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

