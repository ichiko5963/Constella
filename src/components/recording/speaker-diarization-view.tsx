'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Edit2, Save, X } from 'lucide-react';
import { getRecordingSegments, updateSpeakerName, performDiarization } from '@/server/actions/diarization';
import { toast } from 'sonner';

interface RecordingSegment {
    id: number;
    recordingId: number;
    speakerId: number;
    speakerLabel: string | null;
    startTime: number;
    endTime: number;
    confidence: number | null;
}

interface SpeakerDiarizationViewProps {
    recordingId: number;
}

export function SpeakerDiarizationView({ recordingId }: SpeakerDiarizationViewProps) {
    const [segments, setSegments] = useState<RecordingSegment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSpeakerId, setEditingSpeakerId] = useState<number | null>(null);
    const [speakerName, setSpeakerName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadSegments();
    }, [recordingId]);

    const loadSegments = async () => {
        setIsLoading(true);
        try {
            const result = await getRecordingSegments(recordingId);
            if (result.success && result.segments) {
                setSegments(result.segments);
            }
        } catch (error) {
            console.error('Failed to load segments:', error);
            toast.error('話者セグメントの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartDiarization = async () => {
        setIsProcessing(true);
        try {
            const result = await performDiarization(recordingId);
            if (result.success) {
                toast.success('話者識別を開始しました');
                loadSegments();
            } else {
                toast.error(result.error || '話者識別に失敗しました');
            }
        } catch (error) {
            console.error('Failed to start diarization:', error);
            toast.error('エラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditSpeaker = (segment: RecordingSegment) => {
        setEditingSpeakerId(segment.speakerId);
        setSpeakerName(segment.speakerLabel || `Speaker ${segment.speakerId + 1}`);
    };

    const handleSaveSpeaker = async (segmentId: number) => {
        try {
            const result = await updateSpeakerName(segmentId, speakerName);
            if (result.success) {
                toast.success('話者名を更新しました');
                setEditingSpeakerId(null);
                setSpeakerName('');
                loadSegments();
            } else {
                toast.error(result.error || '更新に失敗しました');
            }
        } catch (error) {
            console.error('Failed to save speaker name:', error);
            toast.error('エラーが発生しました');
        }
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // 話者ごとにグループ化
    const speakers = segments.reduce((acc, segment) => {
        if (!acc[segment.speakerId]) {
            acc[segment.speakerId] = {
                speakerId: segment.speakerId,
                speakerLabel: segment.speakerLabel || `Speaker ${segment.speakerId + 1}`,
                segments: [],
            };
        }
        acc[segment.speakerId].segments.push(segment);
        return acc;
    }, {} as Record<number, { speakerId: number; speakerLabel: string; segments: RecordingSegment[] }>);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        話者識別
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            話者識別
                        </CardTitle>
                        <CardDescription>
                            会議の参加者を自動識別し、発言者を色分け表示
                        </CardDescription>
                    </div>
                    {segments.length === 0 && (
                        <Button
                            onClick={handleStartDiarization}
                            disabled={isProcessing}
                            className="bg-primary hover:bg-primary/90 text-black"
                        >
                            {isProcessing ? '処理中...' : '話者識別を開始'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {segments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>話者識別がまだ実行されていません</p>
                        <p className="text-sm mt-2">「話者識別を開始」ボタンをクリックして実行してください</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.values(speakers).map((speaker) => (
                            <div key={speaker.speakerId} className="border border-white/10 rounded-lg p-4 bg-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                            {speaker.speakerId + 1}
                                        </div>
                                        {editingSpeakerId === speaker.speakerId ? (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={speakerName}
                                                    onChange={(e) => setSpeakerName(e.target.value)}
                                                    className="bg-black/40 border-white/10 text-white w-48"
                                                    placeholder="話者名"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSaveSpeaker(speaker.segments[0].id)}
                                                    className="bg-primary hover:bg-primary/90 text-black"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingSpeakerId(null);
                                                        setSpeakerName('');
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-semibold text-white">{speaker.speakerLabel}</h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditSpeaker(speaker.segments[0])}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {speaker.segments.length}セグメント
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {speaker.segments.map((segment) => (
                                        <div
                                            key={segment.id}
                                            className="text-sm text-gray-300 bg-white/5 p-2 rounded"
                                        >
                                            {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                            {segment.confidence && (
                                                <span className="ml-2 text-xs text-gray-500">
                                                    (信頼度: {Math.round(segment.confidence * 100)}%)
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

