'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export function NoteViewer({ content, title }: { content: string; title: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="glass border-white/10 w-full bg-black/20 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                    <FileText className="w-5 h-5 text-primary" />
                    {title}
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="hover:bg-white/5 text-gray-400 hover:text-white"
                >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied' : 'Copy MD'}
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="prose prose-invert prose-cyan max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </CardContent>
        </Card>
    );
}
