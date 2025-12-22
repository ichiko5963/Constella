'use client';

import { useState } from 'react';
import { NoteViewer } from './note-viewer';
import { NoteEditor } from './note-editor';
import { ShareButton } from './share-button';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';

interface NoteViewerWithEditorProps {
    noteId: number;
    title: string;
    content: string;
    shareToken?: string | null;
}

export function NoteViewerWithEditor({ noteId, title, content, shareToken }: NoteViewerWithEditorProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="h-full flex flex-col">
                <NoteEditor
                    noteId={noteId}
                    initialContent={content}
                    onCancel={() => setIsEditing(false)}
                    onSave={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative group">
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <ShareButton noteId={noteId} shareToken={shareToken || null} />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-black/50 backdrop-blur-sm border-white/20"
                >
                    <Edit2 className="h-4 w-4 mr-2" />
                    編集
                </Button>
            </div>
            <NoteViewer 
                title={title} 
                content={content}
            />
        </div>
    );
}
