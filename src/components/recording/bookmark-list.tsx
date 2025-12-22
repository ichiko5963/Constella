'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getBookmarks, deleteBookmark, type Bookmark as BookmarkType } from '@/server/actions/bookmark';
import { formatTime } from '@/lib/utils';

interface BookmarkListProps {
    recordingId: number;
    onJumpToTime?: (timestamp: number) => void;
}

export function BookmarkList({ recordingId, onJumpToTime }: BookmarkListProps) {
    const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        loadBookmarks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recordingId]);

    const loadBookmarks = async () => {
        setIsLoading(true);
        try {
            const result = await getBookmarks(recordingId);
            if (result.success && result.bookmarks) {
                setBookmarks(result.bookmarks);
            } else {
                toast.error(result.error || 'ブックマークの取得に失敗しました');
            }
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
            toast.error('ブックマークの読み込み中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (bookmarkId: number) => {
        setDeletingId(bookmarkId);
        try {
            const result = await deleteBookmark(bookmarkId);
            if (result.success) {
                setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
                toast.success('ブックマークを削除しました');
            } else {
                toast.error(result.error || 'ブックマークの削除に失敗しました');
            }
        } catch (error) {
            console.error('Failed to delete bookmark:', error);
            toast.error('ブックマークの削除中にエラーが発生しました');
        } finally {
            setDeletingId(null);
        }
    };

    const handleJumpToTime = (timestamp: number) => {
        if (onJumpToTime) {
            onJumpToTime(timestamp);
        }
    };

    if (isLoading) {
        return (
            <Card className="glass border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <Bookmark className="h-4 w-4 text-primary" /> ブックマーク
                    </CardTitle>
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
        <Card className="glass border-white/10">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Bookmark className="h-4 w-4 text-primary" /> ブックマーク ({bookmarks.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {bookmarks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>ブックマークがありません</p>
                    </div>
                ) : (
                    bookmarks.map(bookmark => (
                        <div
                            key={bookmark.id}
                            className="flex items-start justify-between gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                    <button
                                        onClick={() => handleJumpToTime(bookmark.timestamp)}
                                        className="text-sm font-mono text-primary hover:text-primary/80 transition-colors"
                                    >
                                        {formatTime(bookmark.timestamp)}
                                    </button>
                                </div>
                                {bookmark.note && (
                                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                                        {bookmark.note}
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={() => handleDelete(bookmark.id)}
                                disabled={deletingId === bookmark.id}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                            >
                                {deletingId === bookmark.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
