'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { ManualJoinDialog } from './manual-join-dialog';

export function ManualJoinButton({ projectId }: { projectId?: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black"
            >
                <Video className="h-4 w-4" />
                会議を手動で追加
            </Button>
            <ManualJoinDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                projectId={projectId}
            />
        </>
    );
}
