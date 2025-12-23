'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { getFolderTree, moveFile } from '@/server/actions/folder';
import { toast } from 'sonner';

interface FileNode {
    id: number;
    name: string;
    fileType: string;
    parentFileId: number | null;
    children: FileNode[];
}

interface MoveFileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileId: number;
    projectId: number;
    currentParentId: number | null;
    onMoveComplete?: () => void;
}

export function MoveFileDialog({
    open,
    onOpenChange,
    fileId,
    projectId,
    currentParentId,
    onMoveComplete,
}: MoveFileDialogProps) {
    const [tree, setTree] = useState<FileNode[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentParentId);
    const [isLoading, setIsLoading] = useState(true);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        if (open) {
            loadTree();
            setSelectedFolderId(currentParentId);
        }
    }, [open, projectId]);

    const loadTree = async () => {
        setIsLoading(true);
        try {
            const result = await getFolderTree(projectId);
            if (result.success && result.tree) {
                setTree(result.tree);
            }
        } catch (error) {
            console.error('Failed to load folder tree:', error);
            toast.error('フォルダーツリーの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFolder = (folderId: number) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
    };

    const handleMove = async () => {
        if (selectedFolderId === currentParentId) {
            toast.info('同じ場所に移動することはできません');
            return;
        }

        setIsMoving(true);
        try {
            const result = await moveFile(fileId, selectedFolderId);
            if (result.success) {
                toast.success('ファイルを移動しました');
                onOpenChange(false);
                onMoveComplete?.();
            } else {
                toast.error(result.error || '移動に失敗しました');
            }
        } catch (error) {
            console.error('Failed to move file:', error);
            toast.error('移動中にエラーが発生しました');
        } finally {
            setIsMoving(false);
        }
    };

    const renderNode = (node: FileNode, level: number = 0) => {
        if (node.fileType !== 'folder') return null;

        const isExpanded = expandedFolders.has(node.id);
        const isSelected = selectedFolderId === node.id;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 ${
                        isSelected ? 'bg-primary/20 border border-primary/50' : ''
                    }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => setSelectedFolderId(node.id)}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFolder(node.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                    >
                        {node.children.length > 0 ? (
                            isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )
                        ) : (
                            <span className="w-4 h-4" />
                        )}
                    </button>
                    {isExpanded ? (
                        <FolderOpen className="h-4 w-4 text-primary" />
                    ) : (
                        <Folder className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-sm text-white">{node.name}</span>
                </div>
                {isExpanded && node.children.length > 0 && (
                    <div>
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass border-white/10 max-w-md">
                <DialogHeader>
                    <DialogTitle>ファイルを移動</DialogTitle>
                    <DialogDescription>
                        移動先のフォルダーを選択してください
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="max-h-[400px] overflow-y-auto border border-white/10 rounded-lg p-4 bg-black/20">
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                読み込み中...
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 ${
                                        selectedFolderId === null ? 'bg-primary/20 border border-primary/50' : ''
                                    }`}
                                    onClick={() => setSelectedFolderId(null)}
                                >
                                    <Folder className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-white">ルート</span>
                                </div>
                                {tree.map(node => renderNode(node))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isMoving}
                        >
                            キャンセル
                        </Button>
                        <Button
                            onClick={handleMove}
                            disabled={isMoving || selectedFolderId === currentParentId}
                            className="bg-primary hover:bg-primary/90 text-black"
                        >
                            {isMoving ? '移動中...' : '移動'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
