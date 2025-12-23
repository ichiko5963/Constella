/**
 * 音声とテキストの同期エンジン（カラオケ効果）
 * 
 * このエンジンは、requestAnimationFrameを使用して60fpsの滑らかな同期を実現します。
 * Reactのステート更新を避け、Refを通じた直接的なDOM操作またはCSS変数の更新を行います。
 */

export interface TranscriptSegment {
    id: number;
    word: string;
    start: number; // ミリ秒
    end: number; // ミリ秒
    speaker?: string | null;
    wordIndex: number;
}

export class TranscriptSyncEngine {
    private animationFrameId: number | null = null;
    private audioRef: React.RefObject<HTMLAudioElement | null>;
    private segments: TranscriptSegment[];
    private highlightedIndex: number = -1;
    private onHighlightChange?: (index: number) => void;
    private isRunning: boolean = false;

    constructor(
        audioRef: React.RefObject<HTMLAudioElement | null>,
        segments: TranscriptSegment[],
        onHighlightChange?: (index: number) => void
    ) {
        this.audioRef = audioRef;
        this.segments = segments;
        this.onHighlightChange = onHighlightChange;
    }

    /**
     * 同期エンジンを開始
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        const update = () => {
            if (!this.isRunning) return;

            const currentTime = this.audioRef.current?.currentTime;
            if (currentTime !== undefined) {
                const currentTimeMs = currentTime * 1000; // 秒をミリ秒に変換
                const index = this.findSegmentIndex(currentTimeMs);

                if (index !== this.highlightedIndex && index >= 0) {
                    this.highlightSegment(index);
                    this.highlightedIndex = index;
                }
            }

            this.animationFrameId = requestAnimationFrame(update);
        };

        update();
    }

    /**
     * 同期エンジンを停止
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * セグメントを更新
     */
    updateSegments(segments: TranscriptSegment[]) {
        this.segments = segments;
        this.highlightedIndex = -1; // リセット
    }

    /**
     * 現在の再生時間に基づいて、該当するセグメントのインデックスを検索
     */
    private findSegmentIndex(currentTimeMs: number): number {
        if (this.segments.length === 0) return -1;

        // 二分探索で該当するセグメントを検索
        let left = 0;
        let right = this.segments.length - 1;
        let result = -1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const segment = this.segments[mid];

            if (currentTimeMs >= segment.start && currentTimeMs <= segment.end) {
                result = mid;
                break;
            } else if (currentTimeMs < segment.start) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        // 見つからない場合は、最も近いセグメントを返す
        if (result === -1) {
            // 現在時刻より前の最後のセグメントを探す
            for (let i = this.segments.length - 1; i >= 0; i--) {
                if (this.segments[i].start <= currentTimeMs) {
                    result = i;
                    break;
                }
            }
            // まだ見つからない場合は最初のセグメント
            if (result === -1) {
                result = 0;
            }
        }

        return result;
    }

    /**
     * セグメントをハイライト（コールバックを呼び出す）
     */
    private highlightSegment(index: number) {
        if (this.onHighlightChange) {
            this.onHighlightChange(index);
        }
    }

    /**
     * 特定の時間にジャンプ
     */
    jumpToTime(timeMs: number) {
        if (this.audioRef.current) {
            this.audioRef.current.currentTime = timeMs / 1000; // ミリ秒を秒に変換
        }
    }

    /**
     * 特定のセグメントにジャンプ
     */
    jumpToSegment(index: number) {
        if (index >= 0 && index < this.segments.length) {
            const segment = this.segments[index];
            this.jumpToTime(segment.start);
        }
    }
}

