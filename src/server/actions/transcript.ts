'use server';

import { db } from '@/db';
import { transcriptSegments } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { auth } from '@/auth';

export interface TranscriptSegment {
    id: number;
    word: string;
    start: number; // ミリ秒
    end: number; // ミリ秒
    speaker?: string | null;
    wordIndex: number;
}

/**
 * 録音IDに基づいてトランスクリプトセグメント（単語ごとのタイムスタンプ）を取得
 */
export async function getTranscriptSegments(
    recordingId: number,
    startTime?: number, // ミリ秒
    endTime?: number // ミリ秒
): Promise<TranscriptSegment[]> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }

    try {
        // 時間範囲でフィルタリング（オプション）
        if (startTime !== undefined || endTime !== undefined) {
            const conditions = [eq(transcriptSegments.recordingId, recordingId)];
            
            if (startTime !== undefined) {
                conditions.push(gte(transcriptSegments.end, startTime));
            }
            if (endTime !== undefined) {
                conditions.push(lte(transcriptSegments.start, endTime));
            }

            const segments = await db.query.transcriptSegments.findMany({
                where: and(...conditions),
                orderBy: (segments, { asc }) => [asc(segments.wordIndex)],
            });

            return segments.map(seg => ({
                id: seg.id,
                word: seg.word,
                start: seg.start,
                end: seg.end,
                speaker: seg.speaker,
                wordIndex: seg.wordIndex,
            }));
        }

        const segments = await db.query.transcriptSegments.findMany({
            where: eq(transcriptSegments.recordingId, recordingId),
            orderBy: (segments, { asc }) => [asc(segments.wordIndex)],
        });

        return segments.map(seg => ({
            id: seg.id,
            word: seg.word,
            start: seg.start,
            end: seg.end,
            speaker: seg.speaker,
            wordIndex: seg.wordIndex,
        }));
    } catch (error) {
        console.error('Failed to get transcript segments:', error);
        return [];
    }
}

/**
 * 現在の再生時間に基づいて、該当するトランスクリプトセグメントのインデックスを取得
 */
export async function getSegmentIndexByTime(
    recordingId: number,
    currentTime: number // ミリ秒
): Promise<number> {
    const segments = await getTranscriptSegments(recordingId);
    
    // 二分探索で該当するセグメントを検索
    let left = 0;
    let right = segments.length - 1;
    let result = -1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const segment = segments[mid];

        if (currentTime >= segment.start && currentTime <= segment.end) {
            result = mid;
            break;
        } else if (currentTime < segment.start) {
            right = mid - 1;
        } else {
            left = mid + 1;
        }
    }

    // 見つからない場合は、最も近いセグメントを返す
    if (result === -1 && segments.length > 0) {
        // 現在時刻より前の最後のセグメントを探す
        for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i].start <= currentTime) {
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
