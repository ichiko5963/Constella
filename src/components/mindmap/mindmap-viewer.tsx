'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Network } from 'lucide-react';
import { parseMarkdownToMindMap, flattenMindMap, type MindMapNode } from '@/lib/mindmap-parser';
import { exportMindMapToPNG, exportMindMapToSVG } from './mindmap-export';
import { toast } from 'sonner';

interface MindMapViewerProps {
    markdown: string;
    noteId: number;
}

export function MindMapViewer({ markdown, noteId }: MindMapViewerProps) {
    const nodes = useMemo(() => {
        return parseMarkdownToMindMap(markdown);
    }, [markdown]);

    const flatNodes = useMemo(() => {
        return flattenMindMap(nodes);
    }, [nodes]);

    const handleExportPNG = async () => {
        try {
            const blob = await exportMindMapToPNG(nodes, `Mind Map - Note ${noteId}`);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mindmap-note-${noteId}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('PNG形式でエクスポートしました');
        } catch (error) {
            console.error('Failed to export PNG:', error);
            toast.error('PNGエクスポートに失敗しました');
        }
    };

    const handleExportSVG = async () => {
        try {
            const svg = exportMindMapToSVG(nodes, `Mind Map - Note ${noteId}`);
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mindmap-note-${noteId}.svg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('SVG形式でエクスポートしました');
        } catch (error) {
            console.error('Failed to export SVG:', error);
            toast.error('SVGエクスポートに失敗しました');
        }
    };

    if (nodes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        マインドマップ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>見出しが見つかりませんでした</p>
                        <p className="text-sm mt-2">議事録に見出し（# タイトル）を追加すると、マインドマップが生成されます</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        マインドマップ
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPNG}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            PNG
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportSVG}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            SVG
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* 簡易的なツリービュー */}
                    {nodes.map((node, index) => (
                        <div key={node.id} className="space-y-2">
                            <div
                                className={`p-3 rounded-lg border ${
                                    node.level === 1
                                        ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                                        : node.level === 2
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-white/5 border-white/10 text-gray-300'
                                }`}
                                style={{ marginLeft: `${(node.level - 1) * 24}px` }}
                            >
                                {node.label}
                            </div>
                            {node.children.length > 0 && (
                                <div className="ml-6">
                                    {node.children.map((child) => (
                                        <div
                                            key={child.id}
                                            className={`p-2 rounded border mb-2 ${
                                                child.level === 2
                                                    ? 'bg-white/10 border-white/20 text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-300'
                                            }`}
                                            style={{ marginLeft: `${(child.level - node.level - 1) * 24}px` }}
                                        >
                                            {child.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-xs text-gray-500">
                    {flatNodes.length}個のノードが検出されました
                </div>
            </CardContent>
        </Card>
    );
}

