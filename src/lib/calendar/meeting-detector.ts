/**
 * 会議リンクのタイプを判定するユーティリティ
 * クライアントサイドでも使用可能
 */

/**
 * 会議リンクのタイプを判定
 */
export function detectMeetingType(url: string): 'google-meet' | 'zoom' | 'teams' | 'unknown' {
    if (url.includes('meet.google.com')) {
        return 'google-meet';
    } else if (url.includes('zoom.us') || url.includes('zoom.com')) {
        return 'zoom';
    } else if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
        return 'teams';
    }
    return 'unknown';
}

