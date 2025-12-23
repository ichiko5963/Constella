'use client';

import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AILogo } from '@/components/chat/ai-logo';

export default function ChatPage() {
    const chatHelpers = useChat({
        api: '/api/chat',
    } as any);
    
    // useChatの戻り値から必要なプロパティを取得（型安全に）
    const messages = chatHelpers.messages || [];
    const isLoading = ('isLoading' in chatHelpers ? (chatHelpers as any).isLoading : false) || 
                      (chatHelpers.status === 'streaming' || chatHelpers.status === 'submitted');
    const handleSubmit = chatHelpers.sendMessage ? 
        ((e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const message = formData.get('message') as string;
            if (message && message.trim()) {
                (chatHelpers.sendMessage as any)({ content: message } as any);
            }
        }) : 
        ('handleSubmit' in chatHelpers ? (chatHelpers as any).handleSubmit : undefined);
    
    // inputプロパティが存在しない場合は、ローカルstateを使用
    const [localInput, setLocalInput] = useState('');
    const input = 'input' in chatHelpers ? (chatHelpers as any).input : localInput;
    const setInput = 'setInput' in chatHelpers ? (chatHelpers as any).setInput : setLocalInput;
    const handleInputChange = 'handleInputChange' in chatHelpers 
        ? (chatHelpers as any).handleInputChange 
        : ((e: React.ChangeEvent<HTMLInputElement>) => setLocalInput(e.target.value));
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // 入力値が有効かチェック
    const isValidInput = input && typeof input === 'string' && input.trim().length > 0;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const quickQuestions = [
        '私に割り当てられたタスク全て出して',
        '今回の定例のアジェンダを作って',
        '前回の会議を要約して？',
        '今週までのタスクは？',
    ];

    const handleQuickQuestion = (question: string) => {
        // setInputが利用可能な場合はそれを使用
        if (setInput && typeof setInput === 'function') {
            setInput(question);
        } else if (handleInputChange && inputRef.current) {
            // handleInputChangeを使用して入力値を設定
            const syntheticEvent = {
                target: { value: question },
                currentTarget: { value: question },
            } as React.ChangeEvent<HTMLInputElement>;
            handleInputChange(syntheticEvent);
        } else if (inputRef.current) {
            // フォールバック: inputRefを直接操作
            inputRef.current.value = question;
        }
        // Wait for state update before focusing so caret lands at end
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(question.length, question.length);
            }
        }, 0);
    };

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
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
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
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleQuickQuestion(question)}
                                        className="text-xs text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all text-gray-400 hover:text-white"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map(message => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-4 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border mt-1 ${message.role === 'user'
                                        ? 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_10px_rgba(0,212,170,0.1)]'
                                        : 'bg-white/10 border-white/10 text-white'
                                        }`}
                                >
                                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>

                                <div className={`flex flex-col space-y-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`p-5 rounded-2xl text-sm leading-7 backdrop-blur-sm border shadow-sm ${message.role === 'user'
                                            ? 'bg-primary/10 text-white border-primary/20 rounded-tr-none'
                                            : 'bg-white/5 text-gray-200 border-white/10 rounded-tl-none'
                                            }`}
                                    >
                                        {message.role === 'user' ? (
                                            <p>{(message as any).content || (message as any).text || String(message)}</p>
                                        ) : (
                                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-headings:text-primary prose-a:text-primary hover:prose-a:underline">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {/* @ts-ignore - content type depends on ai-sdk version */}
                                                    {(message as any).content || (message as any).text || String(message)}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-600 px-2">
                                            {message.role === 'user' ? 'あなた' : 'AIアシスタント'}
                                        </span>
                                        {message.role === 'assistant' && !isLoading && (
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
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </CardContent>

                <CardFooter className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                    <form onSubmit={handleSubmit} className="flex w-full gap-3 relative">
                        <Input
                            ref={inputRef}
                            name="message"
                            value={input ?? ''}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                // Enterキーで送信（Shift+Enterは改行）
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (isValidInput && !isLoading && handleSubmit) {
                                        handleSubmit(e as any);
                                    }
                                }
                            }}
                            placeholder="質問を入力してください..."
                            className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-white/70 focus-visible:ring-primary/50 focus-visible:border-primary/50 h-14 pl-6 rounded-2xl backdrop-blur-xl transition-all"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !isValidInput}
                            className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(0,212,170,0.3)] hover:shadow-[0_0_25px_rgba(0,212,170,0.5)] transition-all duration-300 flex items-center justify-center p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-5 w-5 ml-0.5" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
