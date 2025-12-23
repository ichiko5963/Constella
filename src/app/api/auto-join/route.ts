import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingAutoJoinEvents, getCompletedAutoJoinEvents } from '@/lib/calendar/meeting-joiner';
import { detectMeetingType } from '@/lib/calendar/meeting-detector';
import { updateEventJoinStatus } from '@/server/actions/auto-join';
import { createRecordingUploadUrl, updateRecordingStatus } from '@/server/actions/recording';
import { processRecording } from '@/server/actions/process-audio';

/**
 * 自動参加が必要なイベントをチェックし、参加処理を開始
 * また、会議終了後の録音を自動処理（文字起こし・議事録化）
 * 
 * このエンドポイントは、Vercel Cronまたは外部スケジューラーから
 * 定期的に呼び出されることを想定しています。
 */
export async function GET(request: NextRequest) {
    try {
        // 1. 会議開始前のイベントを処理（自動参加準備）
        const upcomingEvents = await getUpcomingAutoJoinEvents();
        
        const joinResults = await Promise.allSettled(
            upcomingEvents.map(async (event) => {
                const meetingType = detectMeetingType(event.meetingLink);
                
                if (meetingType === 'unknown') {
                    await updateEventJoinStatus(event.id, 'failed');
                    return { eventId: event.id, status: 'failed', reason: 'Unsupported meeting type' };
                }

                // 参加ステータスを「参加中」に更新
                await updateEventJoinStatus(event.id, 'joining');

                try {
                    // 録音URLを作成（自動録音が有効な場合）
                    // 予約URLから予約された会議は必ず自動録音が有効
                    const result = await createRecordingUploadUrl(event.projectId || undefined, 'audio/wav');
                    
                    if (result.success && result.recordingId) {
                        await updateEventJoinStatus(event.id, 'joined', result.recordingId);
                        return { eventId: event.id, status: 'joined', recordingId: result.recordingId };
                    } else {
                        await updateEventJoinStatus(event.id, 'failed');
                        return { eventId: event.id, status: 'failed', reason: 'Failed to create recording' };
                    }
                } catch (error) {
                    console.error(`Failed to join meeting ${event.id}:`, error);
                    await updateEventJoinStatus(event.id, 'failed');
                    return { eventId: event.id, status: 'failed', reason: error instanceof Error ? error.message : 'Unknown error' };
                }
            })
        );

        // 2. 会議終了後のイベントを処理（録音の文字起こし・議事録化）
        const completedEvents = await getCompletedAutoJoinEvents();
        
        const processResults = await Promise.allSettled(
            completedEvents.map(async (event) => {
                if (!event.recordingId) {
                    return { eventId: event.id, status: 'skipped', reason: 'No recording ID' };
                }

                try {
                    // 録音の処理（文字起こし・議事録化）を開始
                    // 予約URLから予約された会議の自動処理のため、認証をスキップ
                    const processResult = await processRecording(event.recordingId, true);
                    
                    if (processResult.success) {
                        // ステータスを「完了」に更新
                        await updateEventJoinStatus(event.id, 'completed');
                        return { eventId: event.id, status: 'completed', recordingId: event.recordingId };
                    } else {
                        console.error(`Failed to process recording ${event.recordingId}:`, processResult.error);
                        return { eventId: event.id, status: 'error', reason: processResult.error };
                    }
                } catch (error) {
                    console.error(`Failed to start processing for event ${event.id}:`, error);
                    return { eventId: event.id, status: 'error', reason: error instanceof Error ? error.message : 'Unknown error' };
                }
            })
        );

        return NextResponse.json({
            success: true,
            joinProcessed: joinResults.length,
            processProcessed: processResults.length,
            joinResults: joinResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
            processResults: processResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
        });
    } catch (error) {
        console.error('Auto-join check failed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process auto-join events' },
            { status: 500 }
        );
    }
}

