'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Check, X } from 'lucide-react';
import { generateShareToken, revokeShareToken } from '@/server/actions/folder';
import { toast } from 'sonner';

interface ShareButtonProps {
    noteId: number;
    shareToken: string | null;
}

export function ShareButton({ noteId, shareToken: initialShareToken }: ShareButtonProps) {
    const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateShareToken(noteId);
            if (result.success && result.shareToken) {
                setShareToken(result.shareToken);
                toast.success('共有リンクを生成しました');
            } else {
                toast.error(result.error || '共有リンクの生成に失敗しました');
            }
        } catch (error) {
            console.error('Failed to generate share token:', error);
            toast.error('共有リンク生成中にエラーが発生しました');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRevoke = async () => {
        try {
            const result = await revokeShareToken(noteId);
            if (result.success) {
                setShareToken(null);
                toast.success('共有を無効化しました');
            } else {
                toast.error(result.error || '共有の無効化に失敗しました');
            }
        } catch (error) {
            console.error('Failed to revoke share token:', error);
            toast.error('共有無効化中にエラーが発生しました');
        }
    };

    const handleCopy = async () => {
        if (!shareToken) return;

        const shareUrl = `${window.location.origin}/share/${shareToken}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('共有リンクをコピーしました');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            toast.error('コピーに失敗しました');
        }
    };

    if (shareToken) {
        const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareToken}`;
        
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="text-xs text-primary bg-transparent border-none outline-none flex-1 min-w-0"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-6 w-6 p-0"
                    >
                        {copied ? (
                            <Check className="h-3 w-3 text-green-400" />
                        ) : (
                            <Copy className="h-3 w-3 text-primary" />
                        )}
                    </Button>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevoke}
                    className="text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
                >
                    <X className="h-4 w-4 mr-2" />
                    無効化
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
        >
            <Share2 className="h-4 w-4" />
            {isGenerating ? '生成中...' : '共有'}
        </Button>
    );
}

