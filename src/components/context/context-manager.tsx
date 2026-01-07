/**
 * コンテキスト管理コンポーネント
 * P2-2: コンテキスト管理UI
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  getActiveContextSession,
  generateContextSession,
  answerContextQuestion,
  completeContextSession,
  skipContextSession,
} from '@/server/actions/context-management';
import { toast } from 'sonner';
import { Sparkles, CheckCircle, SkipForward, MessageCircle } from 'lucide-react';

interface ContextSession {
  id: number;
  questions: string[];
  responses: Record<number, string>;
  status: string;
}

export function ContextManager() {
  const [session, setSession] = useState<ContextSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const activeSession = await getActiveContextSession();
      if (activeSession) {
        setSession({
          id: activeSession.id,
          questions: JSON.parse(activeSession.questions || '[]'),
          responses: JSON.parse(activeSession.responses || '{}'),
          status: activeSession.status || 'active',
        });
        // 回答済みの質問数を取得して次の質問に進む
        const answeredCount = Object.keys(JSON.parse(activeSession.responses || '{}')).length;
        setCurrentQuestionIndex(answeredCount);
      }
    } catch (error) {
      console.error('Failed to load context session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSession = async () => {
    setIsGenerating(true);
    try {
      const newSession = await generateContextSession();
      if (newSession) {
        setSession({
          id: newSession.id,
          questions: JSON.parse(newSession.questions || '[]'),
          responses: {},
          status: 'active',
        });
        setCurrentQuestionIndex(0);
        toast.success('コンテキスト質問を生成しました');
      } else {
        toast.info('今日追加されたデータがありません');
      }
    } catch (error) {
      toast.error('質問の生成に失敗しました');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = async () => {
    if (!session || !answer.trim()) return;

    setIsSubmitting(true);
    try {
      await answerContextQuestion(session.id, currentQuestionIndex, answer);

      const newResponses = { ...session.responses, [currentQuestionIndex]: answer };
      setSession({ ...session, responses: newResponses });

      if (currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setAnswer('');
        toast.success('回答を保存しました');
      } else {
        // 全ての質問に回答完了
        await completeContextSession(session.id);
        setSession({ ...session, status: 'completed', responses: newResponses });
        toast.success('全ての質問に回答しました！');
      }
    } catch (error) {
      toast.error('回答の保存に失敗しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!session) return;

    try {
      await skipContextSession(session.id);
      setSession({ ...session, status: 'skipped' });
      toast.info('今日の質問をスキップしました');
    } catch (error) {
      toast.error('スキップに失敗しました');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // セッションがない、または完了/スキップ済みの場合
  if (!session || session.status !== 'active') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            コンテキスト質問
          </CardTitle>
          <CardDescription>
            {session?.status === 'completed'
              ? '今日の質問は完了しました！明日また新しい質問が届きます。'
              : session?.status === 'skipped'
              ? '今日の質問はスキップしました。'
              : 'AIがあなたのナレッジを整理するための質問を生成します。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {session?.status === 'completed' ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium">お疲れ様でした！</p>
              <p className="text-sm text-muted-foreground">
                回答した内容はAIの学習に活用されます。
              </p>
            </div>
          ) : (
            <Button
              onClick={handleGenerateSession}
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? '生成中...' : '質問を生成する'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // 質問セッション中
  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            質問 {currentQuestionIndex + 1} / {session.questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 質問カード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            質問 {currentQuestionIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-lg">{currentQuestion}</p>
          </div>

          <div className="space-y-2">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="回答を入力してください..."
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleSkip} className="gap-2">
              <SkipForward className="h-4 w-4" />
              今日はスキップ
            </Button>

            <Button onClick={handleAnswer} disabled={isSubmitting || !answer.trim()}>
              {isSubmitting
                ? '送信中...'
                : currentQuestionIndex < session.questions.length - 1
                ? '次へ'
                : '完了'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 過去の回答 */}
      {Object.keys(session.responses).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">回答済みの質問</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(session.responses).map(([index, response]) => (
              <div key={index} className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground">
                  Q{parseInt(index) + 1}: {session.questions[parseInt(index)]}
                </p>
                <p className="text-sm">{response}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
