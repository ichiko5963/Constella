'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Plus } from 'lucide-react';
import { ManualJoinDialog } from './manual-join-dialog';

interface ManualJoinButtonProps {
    projectId?: number;
    showCard?: boolean;
}

export function ManualJoinButton({ projectId, showCard = true }: ManualJoinButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!showCard) {
        return (
            <>
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white h-10"
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

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                        <Plus className="h-4 w-4 text-gray-600" />
                        会議を追加
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-gray-500 mb-3">
                        Google MeetやZoomのURLを入力して手動で会議を追加
                    </p>
                    <Button
                        onClick={() => setIsOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                        <Video className="h-4 w-4" />
                        会議を追加
                    </Button>
                </CardContent>
            </Card>
            <ManualJoinDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                projectId={projectId}
            />
        </>
    );
}
