'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileAudio, Loader2, X, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RecordingImportProps {
    projectId?: number;
    onImportComplete?: (recordingId: number) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'transcribing' | 'processing' | 'completed' | 'error';

export function RecordingImport({ projectId, onImportComplete }: RecordingImportProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [fileName, setFileName] = useState<string | null>(null);
    const [recordingId, setRecordingId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFile = useCallback(async (file: File) => {
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg'];
        const validExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];

        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);

        if (!isValidType) {
            toast.error('対応していないファイル形式です。MP3, WAV, M4A, WebM, OGG をサポートしています。');
            return;
        }

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('ファイルサイズが大きすぎます。最大50MBまで対応しています。');
            return;
        }

        setFileName(file.name);
        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (projectId) {
                formData.append('projectId', projectId.toString());
            }

            const xhr = new XMLHttpRequest();

            await new Promise<void>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        setUploadProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        try {
                            const result = JSON.parse(xhr.responseText);
                            if (result.success && result.recordingId) {
                                setRecordingId(result.recordingId);
                                resolve();
                            } else {
                                reject(new Error(result.error || 'アップロードに失敗しました'));
                            }
                        } catch (parseError) {
                            reject(new Error('レスポンスの解析に失敗しました'));
                        }
                    } else {
                        console.error('Upload failed with status:', xhr.status, xhr.statusText, xhr.responseText);
                        reject(new Error(`アップロードに失敗しました (ステータス: ${xhr.status})`));
                    }
                });

                xhr.addEventListener('error', () => {
                    console.error('Upload XHR error:', xhr.status, xhr.statusText, xhr.responseText);
                    reject(new Error('アップロード中にエラーが発生しました。ネットワーク接続を確認してください。'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('アップロードが中断されました'));
                });

                xhr.open('POST', '/api/recordings/upload');
                xhr.send(formData);
            });

            setUploadStatus('completed');
            toast.success('アップロード完了。文字起こしと議事録生成を開始しました。');
            router.refresh();

            if (onImportComplete && recordingId) {
                onImportComplete(recordingId);
            }

        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            toast.error('アップロードに失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }, [projectId, router, onImportComplete, recordingId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const reset = () => {
        setUploadStatus('idle');
        setUploadProgress(0);
        setFileName(null);
        setRecordingId(null);
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileAudio className="h-5 w-5 text-gray-600" />
                            音声ファイルをインポート
                        </h3>
                        {uploadStatus !== 'idle' && uploadStatus !== 'completed' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={reset}
                                className="text-gray-400 hover:text-gray-900"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {uploadStatus === 'idle' && (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl p-8 text-center transition-all
                                ${isDragging
                                    ? 'border-gray-900 bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploadStatus !== 'idle'}
                            />
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className={`
                                        w-16 h-16 rounded-full flex items-center justify-center
                                        ${isDragging ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}
                                        transition-all
                                    `}>
                                        <Upload className="h-8 w-8" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-900 font-medium mb-1">
                                        {isDragging ? 'ファイルをドロップしてください' : '音声ファイルをドラッグ&ドロップ'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        または
                                    </p>
                                </div>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="border-gray-200 text-gray-700 hover:bg-gray-100"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    ファイルを選択
                                </Button>
                                <p className="text-xs text-gray-400 mt-2">
                                    対応形式: MP3, WAV, M4A, WebM, OGG（最大50MB）
                                </p>
                            </div>
                        </div>
                    )}

                    {(uploadStatus === 'uploading' || uploadStatus === 'transcribing' || uploadStatus === 'processing') && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                        {uploadStatus === 'uploading' && 'アップロード中...'}
                                        {uploadStatus === 'transcribing' && '文字起こし中...'}
                                        {uploadStatus === 'processing' && '議事録を生成中...'}
                                    </span>
                                    <span className="text-gray-900 font-medium">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gray-900 h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                            {fileName && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <FileAudio className="h-4 w-4" />
                                    <span className="truncate">{fileName}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-900" />
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'completed' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="flex justify-center">
                                <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium mb-1">インポート完了</p>
                                <p className="text-sm text-gray-500">
                                    文字起こしと議事録生成を開始しました
                                </p>
                            </div>
                            {recordingId && (
                                <Button
                                    onClick={() => router.push(`/recordings/${recordingId}`)}
                                    className="bg-gray-900 text-white hover:bg-gray-800"
                                >
                                    <Star className="h-4 w-4 mr-2" />
                                    録音を確認
                                </Button>
                            )}
                            <Button
                                onClick={reset}
                                variant="outline"
                                size="sm"
                                className="border-gray-200 text-gray-600 hover:text-gray-900"
                            >
                                新しいファイルをインポート
                            </Button>
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="flex justify-center">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <X className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium mb-1">エラーが発生しました</p>
                                <p className="text-sm text-gray-500">
                                    もう一度お試しください
                                </p>
                            </div>
                            <Button
                                onClick={reset}
                                variant="outline"
                                className="border-gray-200 text-gray-700 hover:bg-gray-100"
                            >
                                再試行
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
