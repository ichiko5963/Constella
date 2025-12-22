'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { addBookmark } from '@/server/actions/bookmark';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
    recordingId: number;
    currentTime: number;
    disabled?: boolean;
}

export function BookmarkButton({ recordingId, currentTime, disabled }: BookmarkButtonProps) {
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

    const handleAddBookmark = async () => {
        if (disabled || isAdding) return;

        setIsAdding(true);
        try {
            const result = await addBookmark(recordingId, Math.floor(currentTime));
            if (result.success) {
                toast.success('ブックマークを追加しました');
                router.refresh();
            } else {
                toast.error(result.error || 'ブックマークの追加に失敗しました');
            }
        } catch (error) {
            console.error('Failed to add bookmark:', error);
            toast.error('ブックマークの追加中にエラーが発生しました');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Button
            onClick={handleAddBookmark}
            disabled={disabled || isAdding}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            {isAdding ? (
                <>
                    <BookmarkCheck className="h-4 w-4 animate-pulse" />
                    追加中...
                </>
            ) : (
                <>
                    <Bookmark className="h-4 w-4" />
                    ブックマーク
                </>
            )}
        </Button>
    );
}
