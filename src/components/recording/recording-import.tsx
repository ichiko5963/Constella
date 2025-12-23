'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileAudio, Loader2, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRecordingUploadUrl } from '@/server/actions/recording';
import { processRecording } from '@/server/actions/process-audio';
import { useRouter } from 'next/navigation';
// import { normalizeAudioFormat } from '@/lib/audio-converter'; // 必要に応じて使用

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
        // ファイル形式チェック
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'audio/ogg'];
        const validExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg'];
        
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);
        
        if (!isValidType) {
            toast.error('対応していないファイル形式です。MP3, WAV, M4A, WebM, OGG をサポートしています。');
            return;
        }

        // ファイルサイズチェック（50MB制限）
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            toast.error('ファイルサイズが大きすぎます。最大50MBまで対応しています。');
            return;
        }

        setFileName(file.name);
        setUploadStatus('uploading');
        setUploadProgress(0);

        try {
            // 音声フォーマットを正規化（必要に応じて）
            let processedFile = file;
            const needsConversion = !file.type.includes('webm') && !file.type.includes('wav');
            
            if (needsConversion && file.size < 25 * 1024 * 1024) {
                // 25MB未満の場合はクライアントサイドで変換を試みる（オプション）
                // 現在はサーバーサイドで処理するため、そのままアップロード
            }

            // 1. アップロードURLを取得
            // ファイルタイプを適切に設定（拡張子から推測）
            let fileType = file.type;
            if (!fileType || fileType === 'application/octet-stream') {
                const extension = file.name.split('.').pop()?.toLowerCase();
                const mimeTypes: Record<string, string> = {
                    'mp3': 'audio/mpeg',
                    'wav': 'audio/wav',
                    'm4a': 'audio/mp4',
                    'webm': 'audio/webm',
                    'ogg': 'audio/ogg',
                };
                fileType = mimeTypes[extension || ''] || 'audio/mpeg';
            }

            const { success, url, recordingId: newRecordingId, error } = await createRecordingUploadUrl(
                projectId,
                fileType
            );

            if (!success || !url || !newRecordingId) {
                console.error('Upload URL creation failed:', { success, url, recordingId: newRecordingId, error });
                throw new Error(error || 'アップロードURLの取得に失敗しました。S3の設定を確認してください。');
            }

            setRecordingId(newRecordingId);

            // 2. S3にアップロード（プログレスバー付き）
            const xhr = new XMLHttpRequest();
            
            await new Promise<void>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        setUploadProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 204) {
                        resolve();
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

                xhr.open('PUT', url);
                xhr.setRequestHeader('Content-Type', fileType);
                // S3へのアップロードでは、追加のヘッダーは不要（presigned URLに含まれている）
                xhr.send(file);
            });

            // アップロード完了を確認
            setUploadStatus('transcribing');
            setUploadProgress(100);
            toast.success('アップロード完了。文字起こしを開始します...');

            // 3. 文字起こしと議事録生成を開始（非同期）
            // バックグラウンドで処理（タイムアウトを避けるため）
            // 少し待ってから処理を開始（S3への反映を待つ）
            setTimeout(() => {
                processRecording(newRecordingId).then(() => {
                    setUploadStatus('completed');
                    toast.success('文字起こしと議事録生成が完了しました！');
                    router.refresh();
                    if (onImportComplete) {
                        onImportComplete(newRecordingId);
                    }
                }).catch((error) => {
                    console.error('Processing failed:', error);
                    setUploadStatus('error');
                    toast.error('処理中にエラーが発生しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
                });
            }, 1000); // 1秒待ってから処理を開始

        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            toast.error('アップロードに失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }, [projectId, router, onImportComplete]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
        // リセットして同じファイルを再度選択できるように
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
        <Card className="glass border-white/10 bg-black/40">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileAudio className="h-5 w-5 text-primary" />
                            音声ファイルをインポート
                        </h3>
                        {uploadStatus !== 'idle' && uploadStatus !== 'completed' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={reset}
                                className="text-gray-400 hover:text-white"
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
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 hover:border-primary/30 bg-white/5'
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
                                        ${isDragging ? 'bg-primary/20' : 'bg-white/5'}
                                        transition-all
                                    `}>
                                        <Upload className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white font-medium mb-1">
                                        {isDragging ? 'ファイルをドロップしてください' : '音声ファイルをドラッグ&ドロップ'}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        または
                                    </p>
                                </div>
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="border-white/10 text-white hover:bg-white/10"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    ファイルを選択
                                </Button>
                                <p className="text-xs text-gray-500 mt-2">
                                    対応形式: MP3, WAV, M4A, WebM, OGG（最大50MB）
                                </p>
                            </div>
                        </div>
                    )}

                    {(uploadStatus === 'uploading' || uploadStatus === 'transcribing' || uploadStatus === 'processing') && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">
                                        {uploadStatus === 'uploading' && 'アップロード中...'}
                                        {uploadStatus === 'transcribing' && '文字起こし中...'}
                                        {uploadStatus === 'processing' && '議事録を生成中...'}
                                    </span>
                                    <span className="text-white font-medium">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-primary h-full transition-all duration-300 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                            {fileName && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <FileAudio className="h-4 w-4" />
                                    <span className="truncate">{fileName}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        </div>
                    )}

                    {uploadStatus === 'completed' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-12 w-12 text-green-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium mb-1">インポート完了</p>
                                <p className="text-sm text-gray-400">
                                    文字起こしと議事録生成が完了しました
                                </p>
                            </div>
                            {recordingId && (
                                <Button
                                    onClick={() => router.push(`/recordings/${recordingId}`)}
                                    className="bg-primary text-black hover:bg-primary/90"
                                >
                                    録音を確認
                                </Button>
                            )}
                            <Button
                                onClick={reset}
                                variant="outline"
                                size="sm"
                                className="border-white/10 text-gray-400 hover:text-white"
                            >
                                新しいファイルをインポート
                            </Button>
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="flex justify-center">
                                <X className="h-12 w-12 text-red-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium mb-1">エラーが発生しました</p>
                                <p className="text-sm text-gray-400">
                                    もう一度お試しください
                                </p>
                            </div>
                            <Button
                                onClick={reset}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/10"
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
