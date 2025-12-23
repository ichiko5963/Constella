'use client';

import { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { BookmarkButton } from './bookmark-button';
import { BookmarkList } from './bookmark-list';
import { WaveformVisualizer } from './waveform-visualizer';

interface AudioPlayerWithBookmarksProps {
    recordingId: number;
    audioUrl: string;
    onAudioRefReady?: (audioRef: React.RefObject<HTMLAudioElement>) => void;
}

export function AudioPlayerWithBookmarks({ recordingId, audioUrl, onAudioRefReady }: AudioPlayerWithBookmarksProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (onAudioRefReady) {
            onAudioRefReady(audioRef);
        }
    }, [onAudioRefReady]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        audio.addEventListener('timeupdate', updateTime);
        return () => audio.removeEventListener('timeupdate', updateTime);
    }, []);

    const handleJumpToTime = (timestamp: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = timestamp;
            audio.play().catch(() => {
                // ignore play errors (user gesture requirement)
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="glass border-white/10 shrink-0">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <Play className="h-4 w-4 text-primary" /> Audio Player
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <audio
                        ref={audioRef}
                        controls
                        className="w-full invert hue-rotate-180 opacity-90"
                        src={audioUrl}
                    >
                        Your browser does not support the audio element.
                    </audio>
                    {audioUrl && (
                        <WaveformVisualizer
                            audioRef={audioRef}
                            audioUrl={audioUrl}
                            onSeek={handleJumpToTime}
                            height={80}
                        />
                    )}
                    <div className="flex justify-end">
                        <BookmarkButton
                            recordingId={recordingId}
                            currentTime={currentTime}
                            disabled={!audioUrl}
                        />
                    </div>
                </CardContent>
            </Card>

            <BookmarkList recordingId={recordingId} onJumpToTime={handleJumpToTime} />
        </div>
    );
}
