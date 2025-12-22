'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Plus, MoreVertical, Share2, X } from 'lucide-react';
import { getFolderTree, createFolder, moveFile } from '@/server/actions/folder';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

    const renderNode = (node: FileNode, level: number = 0): React.ReactNode => {
        const isFolder = node.fileType === 'folder';
        const isExpanded = expandedFolders.has(node.id);
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer group ${
                        level > 0 ? 'ml-4' : ''
                    }`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                >
                    {isFolder ? (
                        <>
                            <button
                                onClick={() => toggleFolder(node.id)}
                                className="flex items-center gap-1 text-gray-400 hover:text-white"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                                {isExpanded ? (
                                    <FolderOpen className="h-4 w-4 text-primary" />
                                ) : (
                                    <Folder className="h-4 w-4 text-primary" />
                                )}
                            </button>
                            <span
                                className="flex-1 text-sm text-gray-300 hover:text-white"
                                onClick={() => toggleFolder(node.id)}
                            >
                                {node.name}
                            </span>
                        </>
                    ) : (
                        <>
                            <FileText className="h-4 w-4 text-gray-500 ml-5" />
                            <span
                                className="flex-1 text-sm text-gray-300 hover:text-white cursor-pointer"
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
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setParentFolderId(node.id);
                                            setIsCreatingFolder(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        サブフォルダを作成
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={async () => {
                                        // TODO: ファイル移動ダイアログ
                                        toast.info('ファイル移動機能は実装中です');
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
                                className="text-xs text-gray-500 px-2 py-1"
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
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>フォルダ</CardTitle>
                    <Button
                        onClick={() => {
                            setParentFolderId(null);
                            setIsCreatingFolder(true);
                        }}
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        新規フォルダ
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isCreatingFolder && (
                    <div className="p-3 rounded-lg bg-white/5 border border-primary/20 space-y-2">
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
                                <X className="h-4 w-4 mr-2" />
                                キャンセル
                            </Button>
                            <Button size="sm" onClick={() => handleCreateFolder(parentFolderId)}>
                                作成
                            </Button>
                        </div>
                    </div>
                )}

                {tree.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>フォルダがありません</p>
                        <p className="text-sm mt-2">新規フォルダボタンからフォルダを作成してください</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {tree.map(node => renderNode(node))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
