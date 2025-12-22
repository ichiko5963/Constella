import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingAutoJoinEvents, detectMeetingType } from '@/lib/calendar/meeting-joiner';
import { updateEventJoinStatus } from '@/server/actions/auto-join';
import { createRecordingUploadUrl, updateRecordingStatus } from '@/server/actions/recording';

/**
 * 自動参加が必要なイベントをチェックし、参加処理を開始
 * 
 * このエンドポイントは、Vercel Cronまたは外部スケジューラーから
 * 定期的に呼び出されることを想定しています。
 */
export async function GET(request: NextRequest) {
    try {
        const events = await getUpcomingAutoJoinEvents();
        
        const results = await Promise.allSettled(
            events.map(async (event) => {
                const meetingType = detectMeetingType(event.meetingLink);
                
                if (meetingType === 'unknown') {
                    await updateEventJoinStatus(event.id, 'failed');
                    return { eventId: event.id, status: 'failed', reason: 'Unsupported meeting type' };
                }

                // 参加ステータスを「参加中」に更新
                await updateEventJoinStatus(event.id, 'joining');

                // TODO: 実際の会議参加処理を実装
                // 現在は、録音の準備のみを行う
                try {
                    // 録音URLを作成（自動録音が有効な場合）
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

        return NextResponse.json({
            success: true,
            processed: results.length,
            results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason }),
        });
    } catch (error) {
        console.error('Auto-join check failed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process auto-join events' },
            { status: 500 }
        );
    }
}
