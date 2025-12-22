'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Save, X, Bold, Italic, List, ListOrdered, Highlighter, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';
import { updateMeetingNoteContent } from '@/server/actions/note-edit';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NoteEditorProps {
    noteId: number;
    initialContent: string;
    onCancel: () => void;
    onSave?: () => void;
}

export function NoteEditor({ noteId, initialContent, onCancel, onSave }: NoteEditorProps) {
    const router = useRouter();
    
    // React 19: useOptimistic for instant UI updates
    const [optimisticContent, updateOptimisticContent] = useOptimistic(
        initialContent,
        (state, newContent: string) => newContent
    );

    // React 19: useTransition for pending state
    const [isPending, startTransition] = useTransition();

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Placeholder.configure({
                placeholder: '議事録を編集...',
            }),
        ],
        content: optimisticContent,
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-cyan max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            // リアルタイムで楽観的更新（自動保存の準備）
            const newContent = editor.getHTML();
            updateOptimisticContent(newContent);
        },
    });

    const handleSave = async () => {
        if (!editor) return;

        const content = editor.getHTML();
        
        // 楽観的更新（即座にUI更新）
        updateOptimisticContent(content);
        
        // サーバーに保存（useTransitionで非同期処理）
        startTransition(async () => {
            try {
                const result = await updateMeetingNoteContent(noteId, content);
                if (result.success) {
                    toast.success('議事録を保存しました');
                    router.refresh();
                    if (onSave) {
                        onSave();
                    }
                } else {
                    // エラー時は自動的にロールバックされる
                    toast.error(result.error || '保存に失敗しました');
                }
            } catch (error) {
                console.error('Failed to save note:', error);
                toast.error('保存中にエラーが発生しました');
            }
        });
    };

    if (!editor) {
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'bg-white/10' : ''}
                        title="見出し1"
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'bg-white/10' : ''}
                        title="見出し2"
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'bg-white/10' : ''}
                        title="見出し3"
                    >
                        <Heading3 className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'bg-white/10' : ''}
                        title="太字"
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'bg-white/10' : ''}
                        title="斜体"
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={editor.isActive('highlight') ? 'bg-white/10' : ''}
                        title="ハイライト"
                    >
                        <Highlighter className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'bg-white/10' : ''}
                        title="箇条書き"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={editor.isActive('orderedList') ? 'bg-white/10' : ''}
                        title="番号付きリスト"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={isPending}
                    >
                        <X className="h-4 w-4 mr-2" />
                        キャンセル
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-primary text-black hover:bg-primary/90"
                    >
                        {isPending ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                保存中...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                保存
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto bg-black/20">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
