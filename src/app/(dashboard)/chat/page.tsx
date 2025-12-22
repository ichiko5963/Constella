'use client';

import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AILogo } from '@/components/chat/ai-logo';

export default function ChatPage() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        streamProtocol: 'text',
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-theme(spacing.16))] flex flex-col max-w-5xl mx-auto">
            <Card className="flex-1 flex flex-col h-full glass border-white/10 bg-black/40 overflow-hidden shadow-2xl rounded-2xl">
                <CardHeader className="border-b border-white/5 bg-black/20 backdrop-blur-md py-4">
                    <CardTitle className="flex items-center gap-3 text-white font-light tracking-wide">
                        <AILogo />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Actory Intelligence</span>
                            <span className="text-xs text-gray-500 font-normal">RAG有効 • ベクトル検索アクティブ</span>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                                <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <Bot className="h-10 w-10 text-primary/80" />
                                </div>
                            </div>
                            <div className="text-center max-w-md space-y-2">
                                <h3 className="text-white text-lg font-light">何かお手伝いできることはありますか？</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    会議の議事録、タスク、プロジェクトのコンテキストにアクセスできます。例えば以下のような質問ができます：
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                                {[
                                    "最後の実装会議を要約して",
                                    "私に割り当てられたタスクは？",
                                    "UIに関する決定事項は？",
                                    "最後の会議に基づいてメールを下書きして"
                                ].map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleInputChange({ target: { value: q } } as any)}
                                        className="text-xs text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all text-gray-400 hover:text-white"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border mt-1 ${m.role === 'user'
                                    ? 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_10px_rgba(0,212,170,0.1)]'
                                    : 'bg-white/10 border-white/10 text-white'
                                    }`}>
                                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>

                                <div className={`flex flex-col space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-5 rounded-2xl text-sm leading-7 backdrop-blur-sm border shadow-sm ${m.role === 'user'
                                        ? 'bg-primary/10 text-white border-primary/20 rounded-tr-none'
                                        : 'bg-white/5 text-gray-200 border-white/10 rounded-tl-none'
                                        }`}>
                                        {m.role === 'user' ? (
                                            <p>{m.content}</p>
                                        ) : (
                                            <>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-primary prose-a:text-primary hover:prose-a:underline"
                                                >
                                                    {m.content}
                                                </ReactMarkdown>
                                                {/* RAGソース表示（将来的に実装） */}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 px-2">
                                            {m.role === 'user' ? 'あなた' : 'AIアシスタント'}
                                        </span>
                                        {m.role === 'assistant' && !isLoading && (
                                            <span className="text-[10px] text-primary/60 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                RAG検索済み
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-4 max-w-[85%] flex-row">
                                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <Sparkles className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="p-5 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>

                <CardFooter className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="flex w-full gap-3 relative">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="質問を入力してください..."
                            className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-14 pl-6 rounded-2xl backdrop-blur-xl transition-all"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(0,212,170,0.3)] hover:shadow-[0_0_25px_rgba(0,212,170,0.5)] transition-all duration-300 flex items-center justify-center p-0"
                        >
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
