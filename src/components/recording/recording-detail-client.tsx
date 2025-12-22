'use client';

import { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { AudioPlayerWithBookmarks } from './audio-player-with-bookmarks';
import { VirtualizedTranscript } from '@/components/transcript/virtualized-transcript';
import { SnippetManager } from '@/components/snippet/snippet-manager';

interface RecordingDetailClientProps {
    recordingId: number;
    audioUrl: string;
    hasTranscription: boolean;
    status: string;
    noteId?: number | null;
}

export function RecordingDetailClient({ 
    recordingId, 
    audioUrl, 
    hasTranscription,
    status,
    noteId
}: RecordingDetailClientProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioRefReady, setAudioRefReady] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const handleAudioRefReady = (ref: React.RefObject<HTMLAudioElement>) => {
        if (ref.current) {
            audioRef.current = ref.current;
            setAudioRefReady(true);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        audio.addEventListener('timeupdate', updateTime);
        return () => audio.removeEventListener('timeupdate', updateTime);
    }, [audioRefReady]);

    const handleJumpToTime = (time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
            audio.play().catch(() => {
                // ignore play errors (user gesture requirement)
            });
        }
    };

    return (
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
            <AudioPlayerWithBookmarks 
                recordingId={recordingId} 
                audioUrl={audioUrl}
                onAudioRefReady={handleAudioRefReady}
            />

            {/* Transcript Card */}
            <Card className="glass border-white/10 flex-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-4 border-b border-white/5">
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <FileText className="h-4 w-4 text-primary" /> Transcript
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-4">
                    {hasTranscription && audioRefReady && audioRef.current ? (
                        <VirtualizedTranscript 
                            recordingId={recordingId} 
                            audioRef={audioRef}
                            className="h-full"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <p>{status === 'processing' ? 'Transcribing audio...' : 'Waiting for audio...'}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Snippet Manager */}
            {noteId && (
                <div className="shrink-0 max-h-[400px] overflow-hidden">
                    <SnippetManager 
                        noteId={noteId}
                        currentTime={currentTime}
                        onJumpToTime={handleJumpToTime}
                    />
                </div>
            )}
        </div>
    );
}
