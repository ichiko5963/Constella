'use client';

import { useChat } from '@ai-sdk/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Sparkles, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        '前回の会議を要約して',
        '今週までのタスクは？',
    ];

    const handleQuickQuestion = (question: string) => {
        if (setInput && typeof setInput === 'function') {
            setInput(question);
        } else if (handleInputChange && inputRef.current) {
            const syntheticEvent = {
                target: { value: question },
                currentTarget: { value: question },
            } as React.ChangeEvent<HTMLInputElement>;
            handleInputChange(syntheticEvent);
        } else if (inputRef.current) {
            inputRef.current.value = question;
        }
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(question.length, question.length);
            }
        }, 0);
    };

    return (
        <div className="p-4 md:p-8 h-[calc(100vh-theme(spacing.16))] flex flex-col max-w-4xl mx-auto">
            <Card className="flex-1 flex flex-col h-full border-gray-200 bg-white overflow-hidden shadow-sm rounded-xl">
                <CardHeader className="border-b border-gray-100 bg-gray-50 py-4 px-6">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                        <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold">Constella AI</span>
                            <span className="text-xs text-gray-500 font-normal">コンテキスト検索アクティブ</span>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-6">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                                <Star className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-center max-w-md space-y-2">
                                <h3 className="text-gray-900 text-lg font-medium">何かお手伝いできることはありますか？</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    会議の議事録、タスク、プロジェクトのコンテキストにアクセスできます。
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                                {quickQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleQuickQuestion(question)}
                                        className="text-xs text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors text-gray-600 hover:text-gray-900"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map(message => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 border border-gray-200 text-gray-600'
                                        }`}
                                >
                                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                </div>

                                <div className={`flex flex-col space-y-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`p-4 rounded-xl text-sm leading-relaxed ${message.role === 'user'
                                            ? 'bg-gray-900 text-white rounded-tr-sm'
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 rounded-tl-sm'
                                            }`}
                                    >
                                        {message.role === 'user' ? (
                                            <p>{(message as any).content || (message as any).text || String(message)}</p>
                                        ) : (
                                            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200 prose-headings:text-gray-900 prose-a:text-gray-900 hover:prose-a:underline prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {/* @ts-ignore - content type depends on ai-sdk version */}
                                                    {(message as any).content || (message as any).text || String(message)}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 px-1">
                                        {message.role === 'user' ? 'あなた' : 'Constella AI'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[85%] flex-row">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <Sparkles className="h-4 w-4 text-gray-400 animate-pulse" />
                                </div>
                                <div className="p-4 rounded-xl rounded-tl-sm bg-gray-50 border border-gray-200 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </CardContent>

                <CardFooter className="p-4 border-t border-gray-100 bg-gray-50">
                    <form onSubmit={handleSubmit} className="flex w-full gap-2">
                        <Input
                            ref={inputRef}
                            name="message"
                            value={input ?? ''}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (isValidInput && !isLoading && handleSubmit) {
                                        handleSubmit(e as any);
                                    }
                                }
                            }}
                            placeholder="質問を入力してください..."
                            className="flex-1 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400 focus-visible:border-gray-400 h-11 rounded-lg"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading || !isValidInput}
                            className="h-11 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
