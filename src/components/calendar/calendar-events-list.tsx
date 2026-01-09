'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Clock, MapPin, Users } from 'lucide-react';
import { getCalendarEvents } from '@/server/actions/calendar';
import { AutoJoinButton } from './auto-join-button';

export function CalendarEventsList() {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setIsLoading(true);
        try {
            const result = await getCalendarEvents();
            if (result.success && result.events) {
                setEvents(result.events);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const upcomingEvents = events
        .filter(event => new Date(event.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 10);

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-gray-900">今後の会議</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-gray-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    今後の会議
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                    カレンダーから同期された会議イベント
                </CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">今後の会議はありません</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <h3 className="font-medium text-gray-900 text-sm truncate">{event.title}</h3>
                                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>
                                                    {new Date(event.startTime).toLocaleString('ja-JP', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="truncate">{event.location}</span>
                                                </div>
                                            )}
                                            {event.attendees && (
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>{JSON.parse(event.attendees).length}名</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {event.meetingLink && (
                                            <AutoJoinButton
                                                eventId={event.id}
                                                meetingLink={event.meetingLink}
                                                autoJoinEnabled={event.autoJoinEnabled || false}
                                                autoRecordEnabled={event.autoRecordEnabled || false}
                                                joinStatus={event.joinStatus || 'pending'}
                                                startTime={new Date(event.startTime)}
                                            />
                                        )}
                                        {event.meetingLink && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(event.meetingLink!, '_blank')}
                                                className="flex items-center gap-1.5 h-7 text-xs border-gray-200 text-gray-600 hover:bg-gray-100"
                                            >
                                                <Video className="h-3.5 w-3.5" />
                                                参加
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            {/* カレンダー連携ボタン */}
            <div className="px-6 pb-4 pt-2 border-t border-gray-100 space-y-2">
                <CalendarIntegrationButtons />
            </div>
        </Card>
    );
}

// カレンダー連携ボタンコンポーネント
function CalendarIntegrationButtons() {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        try {
            const { getCalendarIntegrations } = await import('@/server/actions/calendar');
            const result = await getCalendarIntegrations();
            if (result.success && result.integrations) {
                setIntegrations(result.integrations);
            }
        } catch (error) {
            console.error('Failed to load integrations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGoogle = () => {
        window.location.href = '/api/calendar/google/connect';
    };

    const handleConnectZoom = () => {
        window.location.href = '/api/calendar/zoom/connect';
    };

    const googleIntegration = integrations.find(i => i.provider === 'google');
    const zoomIntegration = integrations.find(i => i.provider === 'zoom');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-gray-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Google Calendar連携 */}
            <Button
                onClick={handleConnectGoogle}
                variant="outline"
                size="sm"
                className={`w-full justify-start text-xs h-8 ${
                    googleIntegration
                        ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                        : "border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
            >
                <Calendar className="h-3.5 w-3.5 mr-2" />
                {googleIntegration ? 'Google連携済み' : 'Googleカレンダー'}
            </Button>

            {/* Zoom連携 */}
            <Button
                onClick={handleConnectZoom}
                variant="outline"
                size="sm"
                className={`w-full justify-start text-xs h-8 ${
                    zoomIntegration
                        ? "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        : "border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
            >
                <Video className="h-3.5 w-3.5 mr-2" />
                {zoomIntegration ? 'Zoom連携済み' : 'Zoom'}
            </Button>
        </div>
    );
}

