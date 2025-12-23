import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

/**
 * FFmpegインスタンスを初期化（シングルトン）
 */
async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance && isLoaded) {
        return ffmpegInstance;
    }

    const ffmpeg = new FFmpeg();
    
    // ログ出力を無効化（オプション）
    ffmpeg.on('log', ({ message }) => {
        // console.log(message);
    });

    // プログレスコールバック（オプション）
    ffmpeg.on('progress', ({ progress }) => {
        // console.log(`FFmpeg progress: ${(progress * 100).toFixed(1)}%`);
    });

    try {
        // CDNからFFmpeg.wasmをロード
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });

        ffmpegInstance = ffmpeg;
        isLoaded = true;
        return ffmpeg;
    } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        throw new Error('Failed to initialize FFmpeg. Please try again.');
    }
}

/**
 * 音声フォーマットを正規化（Safari問題対応）
 * 
 * @param blob 録音された音声Blob
 * @param targetFormat 変換先フォーマット（'wav' または 'mp3'）
 * @param onProgress 進捗コールバック（0-1の値）
 * @returns 正規化された音声Blob
 */
export async function normalizeAudioFormat(
    blob: Blob,
    targetFormat: 'wav' | 'mp3' = 'wav',
    onProgress?: (progress: number) => void
): Promise<Blob> {
    try {
        const ffmpeg = await getFFmpeg();

        // 入力ファイル名を決定（MIMEタイプから推測）
        const inputFileName = blob.type.includes('webm') ? 'input.webm' :
                              blob.type.includes('mp4') ? 'input.mp4' :
                              blob.type.includes('m4a') ? 'input.m4a' :
                              'input.webm'; // デフォルト

        // 入力ファイルを書き込み
        await ffmpeg.writeFile(inputFileName, await fetchFile(blob));

        // 出力ファイル名
        const outputFileName = `output.${targetFormat}`;

        // 変換実行
        const args = [
            '-i', inputFileName,
            '-acodec', targetFormat === 'wav' ? 'pcm_s16le' : 'libmp3lame',
            '-ar', '44100', // サンプリングレート
            '-ac', '2', // ステレオ
            '-y', // 上書き許可
            outputFileName
        ];

        if (onProgress) {
            ffmpeg.on('progress', ({ progress }) => {
                onProgress(progress);
            });
        }

        await ffmpeg.exec(args);

        // 出力ファイルを読み込み
        const data = await ffmpeg.readFile(outputFileName);

        // 一時ファイルを削除
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);

        // Blobに変換
        const mimeType = targetFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';
        // FileDataをBlobPartに変換
        if (typeof data === 'string') {
            // 文字列の場合はそのまま使用
            return new Blob([data], { type: mimeType });
        } else if (data instanceof Uint8Array) {
            // Uint8Arrayの場合はArrayBufferに変換（ArrayBufferLikeをArrayBufferに変換）
            const buffer = data.buffer instanceof ArrayBuffer ? data.buffer : new Uint8Array(data).buffer;
            return new Blob([buffer], { type: mimeType });
        } else {
            // その他の場合はUint8Arrayに変換してから使用
            const uint8Array = new Uint8Array(data as ArrayLike<number>);
            return new Blob([uint8Array.buffer], { type: mimeType });
        }

    } catch (error) {
        console.error('Audio conversion failed:', error);
        throw new Error(`Failed to convert audio format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * FFmpegインスタンスをクリーンアップ（メモリ解放）
 */
export async function cleanupFFmpeg() {
    if (ffmpegInstance) {
        try {
            await ffmpegInstance.terminate();
        } catch (error) {
            console.error('Failed to terminate FFmpeg:', error);
        }
        ffmpegInstance = null;
        isLoaded = false;
    }
}

