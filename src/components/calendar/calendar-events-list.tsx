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
                <CardHeader>
                    <CardTitle>今後の会議</CardTitle>
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
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    今後の会議
                </CardTitle>
                <CardDescription>
                    カレンダーから同期された会議イベント
                </CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>今後の会議はありません</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {upcomingEvents.map((event) => (
                            <div
                                key={event.id}
                                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="font-semibold text-white">{event.title}</h3>
                                        <div className="flex flex-col gap-1 text-sm text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
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
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{event.location}</span>
                                                </div>
                                            )}
                                            {event.attendees && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    <span>{JSON.parse(event.attendees).length}名</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
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
                                                className="flex items-center gap-2"
                                            >
                                                <Video className="h-4 w-4" />
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
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Google Calendar連携 */}
            <Button
                onClick={handleConnectGoogle}
                variant={googleIntegration ? "outline" : "default"}
                size="sm"
                className={`w-full justify-start ${
                    googleIntegration 
                        ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                        : "bg-primary text-black hover:bg-primary/90"
                }`}
            >
                <Calendar className="h-4 w-4 mr-2" />
                {googleIntegration ? 'Googleカレンダー連携済み' : 'Googleカレンダーと連携'}
            </Button>

            {/* Zoom連携 */}
            <Button
                onClick={handleConnectZoom}
                variant={zoomIntegration ? "outline" : "default"}
                size="sm"
                className={`w-full justify-start ${
                    zoomIntegration 
                        ? "border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-500/10" 
                        : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
                <Video className="h-4 w-4 mr-2" />
                {zoomIntegration ? 'Zoom連携済み' : 'Zoomと連携'}
            </Button>
        </div>
    );
}

