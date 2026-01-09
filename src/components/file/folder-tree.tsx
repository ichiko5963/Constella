'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Plus, MoreVertical, X, Upload, FileUp, PenLine } from 'lucide-react';
import { getFolderTree, createFolder, moveFile, createNote, importMarkdown } from '@/server/actions/folder';
import { MoveFileDialog } from './move-file-dialog';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface FileNode {
    id: number;
    name: string;
    fileType: string;
    parentFileId: number | null;
    children: FileNode[];
}

interface FolderTreeProps {
    projectId: number;
    onFileSelect?: (fileId: number) => void;
}

export function FolderTree({ projectId, onFileSelect }: FolderTreeProps) {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [parentFolderId, setParentFolderId] = useState<number | null>(null);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [fileToMove, setFileToMove] = useState<{ id: number; parentId: number | null } | null>(null);

    // Note creation state
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [noteParentId, setNoteParentId] = useState<number | null>(null);
    const [isCreatingNote, setIsCreatingNote] = useState(false);

    // Markdown import
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importTargetFolderId, setImportTargetFolderId] = useState<number | null>(null);

    useEffect(() => {
        loadTree();
    }, [projectId]);

    const loadTree = async () => {
        setIsLoading(true);
        try {
            const result = await getFolderTree(projectId);
            if (result.success && result.tree) {
                setTree(result.tree);
            }
        } catch (error) {
            console.error('Failed to load folder tree:', error);
            toast.error('フォルダツリーの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFolder = (folderId: number) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const handleCreateFolder = async (parentId: number | null = null) => {
        if (!newFolderName.trim()) {
            toast.error('フォルダ名を入力してください');
            return;
        }

        try {
            const result = await createFolder(projectId, newFolderName, parentId);
            if (result.success) {
                toast.success('フォルダを作成しました');
                setNewFolderName('');
                setIsCreatingFolder(false);
                setParentFolderId(null);
                loadTree();
            } else {
                toast.error(result.error || 'フォルダの作成に失敗しました');
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
            toast.error('フォルダ作成中にエラーが発生しました');
        }
    };

    const handleCreateNote = async () => {
        if (!noteTitle.trim()) {
            toast.error('タイトルを入力してください');
            return;
        }

        setIsCreatingNote(true);
        try {
            const result = await createNote(projectId, noteTitle, noteContent, noteParentId);
            if (result.success) {
                toast.success('ノートを作成しました');
                setNoteDialogOpen(false);
                setNoteTitle('');
                setNoteContent('');
                setNoteParentId(null);
                loadTree();
            } else {
                toast.error(result.error || 'ノート作成に失敗しました');
            }
        } catch (error) {
            console.error('Failed to create note:', error);
            toast.error('ノート作成中にエラーが発生しました');
        } finally {
            setIsCreatingNote(false);
        }
    };

    const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const importPromises = Array.from(files).map(async (file) => {
            if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
                return { success: false, name: file.name, error: 'Markdownファイルではありません' };
            }

            const content = await file.text();
            const name = file.name.replace(/\.(md|markdown)$/, '');
            const result = await importMarkdown(projectId, name, content, importTargetFolderId);
            return { ...result, name: file.name };
        });

        const results = await Promise.all(importPromises);
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        if (successCount > 0) {
            toast.success(`${successCount}件のファイルをインポートしました`);
            loadTree();
        }
        if (failCount > 0) {
            toast.error(`${failCount}件のインポートに失敗しました`);
        }

        // Reset
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setImportTargetFolderId(null);
    };

    const renderNode = (node: FileNode, level: number = 0): React.ReactNode => {
        const isFolder = node.fileType === 'folder';
        const isExpanded = expandedFolders.has(node.id);
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 cursor-pointer group ${
                        level > 0 ? 'ml-4' : ''
                    }`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                >
                    {isFolder ? (
                        <>
                            <button
                                onClick={() => toggleFolder(node.id)}
                                className="flex items-center gap-1 text-gray-500 hover:text-gray-900"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                {isExpanded ? (
                                    <FolderOpen className="h-4 w-4 text-amber-500" />
                                ) : (
                                    <Folder className="h-4 w-4 text-amber-500" />
                                )}
                            </button>
                            <span
                                className="flex-1 text-sm text-gray-700 hover:text-gray-900"
                                onClick={() => toggleFolder(node.id)}
                            >
                                {node.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4 text-gray-400 ml-5" />
                            <span
                                className="flex-1 text-sm text-gray-700 hover:text-gray-900 cursor-pointer"
                                onClick={() => onFileSelect?.(node.id)}
                            >
                                {node.name}
                            </span>
                        </>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isFolder && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setParentFolderId(node.id);
                                                setIsCreatingFolder(true);
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            サブフォルダを作成
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setNoteParentId(node.id);
                                                setNoteDialogOpen(true);
                                            }}
                                        >
                                            <PenLine className="h-4 w-4 mr-2" />
                                            ノートを追加
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                setImportTargetFolderId(node.id);
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            <FileUp className="h-4 w-4 mr-2" />
                                            Markdownをインポート
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem
                                    onClick={() => {
                                        setFileToMove({ id: node.id, parentId: node.parentFileId });
                                        setMoveDialogOpen(true);
                                    }}
                                >
                                    移動
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {isFolder && isExpanded && (
                    <div>
                        {hasChildren ? (
                            node.children.map(child => renderNode(child, level + 1))
                        ) : (
                            <div
                                className="text-xs text-gray-400 px-2 py-1"
                                style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
                            >
                                空のフォルダ
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>フォルダ</CardTitle>
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
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">フォルダ</CardTitle>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    追加
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setParentFolderId(null);
                                        setIsCreatingFolder(true);
                                    }}
                                >
                                    <Folder className="h-4 w-4 mr-2" />
                                    新規フォルダ
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setNoteParentId(null);
                                        setNoteDialogOpen(true);
                                    }}
                                >
                                    <PenLine className="h-4 w-4 mr-2" />
                                    ノートを追加
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => {
                                        setImportTargetFolderId(null);
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <FileUp className="h-4 w-4 mr-2" />
                                    Markdownをインポート
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isCreatingFolder && (
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                            <Input
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="フォルダ名"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateFolder(parentFolderId);
                                    } else if (e.key === 'Escape') {
                                        setIsCreatingFolder(false);
                                        setNewFolderName('');
                                        setParentFolderId(null);
                                    }
                                }}
                                autoFocus
                            />
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsCreatingFolder(false);
                                        setNewFolderName('');
                                        setParentFolderId(null);
                                    }}
                                >
                                    キャンセル
                                </Button>
                                <Button size="sm" onClick={() => handleCreateFolder(parentFolderId)}>
                                    作成
                                </Button>
                            </div>
                        </div>
                    )}

                    {tree.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-gray-600">フォルダがありません</p>
                            <p className="text-sm mt-2">上の「追加」ボタンから作成してください</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {tree.map(node => renderNode(node))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Hidden file input for Markdown import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown"
                multiple
                className="hidden"
                onChange={handleMarkdownImport}
            />

            {/* Move file dialog */}
            {fileToMove && (
                <MoveFileDialog
                    open={moveDialogOpen}
                    onOpenChange={setMoveDialogOpen}
                    fileId={fileToMove.id}
                    projectId={projectId}
                    currentParentId={fileToMove.parentId}
                    onMoveComplete={() => {
                        loadTree();
                        setFileToMove(null);
                    }}
                />
            )}

            {/* Note creation dialog */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>ノートを作成</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">タイトル</label>
                            <Input
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                                placeholder="ノートのタイトル"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">内容</label>
                            <Textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="ノートの内容（Markdown対応）"
                                rows={8}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setNoteDialogOpen(false);
                                setNoteTitle('');
                                setNoteContent('');
                                setNoteParentId(null);
                            }}
                        >
                            キャンセル
                        </Button>
                        <Button onClick={handleCreateNote} disabled={isCreatingNote}>
                            {isCreatingNote ? '作成中...' : '作成'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

