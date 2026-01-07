/**
 * 口調管理コンポーネント
 * P3-3: 口調管理機能
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getRelationshipProfiles,
  upsertRelationshipProfile,
  deleteRelationshipProfile,
  generateReplyWithTone,
} from '@/server/actions/tone-management';
import { toast } from 'sonner';
import { Users, UserPlus, Trash2, MessageSquare, Sparkles, Loader2 } from 'lucide-react';

interface RelationshipProfile {
  id: number;
  contactName: string | null;
  contactEmail: string | null;
  contactSlackId: string | null;
  relationshipType: string;
  tone: { examples: string[]; patterns?: any } | null;
}

const relationshipTypeLabels: Record<string, string> = {
  superior: '最上級の目上（敬語）',
  boss: '上司（丁寧+親しみ）',
  peer: '仲間・友人（カジュアル）',
  subordinate: '部下（やや上から）',
};

export function ToneManager() {
  const [profiles, setProfiles] = useState<RelationshipProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    contactName: '',
    contactEmail: '',
    relationshipType: 'peer' as 'superior' | 'boss' | 'peer' | 'subordinate',
    toneExamples: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 返信生成用
  const [showReplyGenerator, setShowReplyGenerator] = useState(false);
  const [replyForm, setReplyForm] = useState({
    recipientEmail: '',
    originalMessage: '',
    replyContent: '',
  });
  const [generatedReply, setGeneratedReply] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await getRelationshipProfiles();
      setProfiles(data);
    } catch (error) {
      toast.error('プロフィールの読み込みに失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProfile = async () => {
    if (!newProfile.contactName && !newProfile.contactEmail) {
      toast.error('名前またはメールアドレスを入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertRelationshipProfile({
        contactName: newProfile.contactName || undefined,
        contactEmail: newProfile.contactEmail || undefined,
        relationshipType: newProfile.relationshipType,
        toneExamples: newProfile.toneExamples
          ? newProfile.toneExamples.split('\n').filter(Boolean)
          : [],
      });

      toast.success('プロフィールを追加しました');
      setShowAddForm(false);
      setNewProfile({
        contactName: '',
        contactEmail: '',
        relationshipType: 'peer',
        toneExamples: '',
      });
      loadProfiles();
    } catch (error) {
      toast.error('プロフィールの追加に失敗しました');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!confirm('このプロフィールを削除しますか？')) return;

    try {
      await deleteRelationshipProfile(profileId);
      toast.success('プロフィールを削除しました');
      loadProfiles();
    } catch (error) {
      toast.error('プロフィールの削除に失敗しました');
      console.error(error);
    }
  };

  const handleGenerateReply = async () => {
    if (!replyForm.originalMessage || !replyForm.replyContent) {
      toast.error('元のメッセージと返信内容を入力してください');
      return;
    }

    setIsGeneratingReply(true);
    try {
      const result = await generateReplyWithTone(
        replyForm.recipientEmail,
        replyForm.originalMessage,
        replyForm.replyContent
      );

      setGeneratedReply(result.generatedReply || '');
      toast.success('返信を生成しました');
    } catch (error) {
      toast.error('返信の生成に失敗しました');
      console.error(error);
    } finally {
      setIsGeneratingReply(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 操作ボタン */}
      <div className="flex gap-4">
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          連絡先を追加
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowReplyGenerator(!showReplyGenerator)}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          口調で返信を生成
        </Button>
      </div>

      {/* 新規追加フォーム */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              連絡先を追加
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>名前</Label>
                <Input
                  value={newProfile.contactName}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, contactName: e.target.value })
                  }
                  placeholder="山田太郎"
                />
              </div>
              <div className="space-y-2">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={newProfile.contactEmail}
                  onChange={(e) =>
                    setNewProfile({ ...newProfile, contactEmail: e.target.value })
                  }
                  placeholder="yamada@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>関係性</Label>
              <Select
                value={newProfile.relationshipType}
                onValueChange={(value) =>
                  setNewProfile({
                    ...newProfile,
                    relationshipType: value as any,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(relationshipTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>口調の例文（1行に1つ）</Label>
              <Textarea
                value={newProfile.toneExamples}
                onChange={(e) =>
                  setNewProfile({ ...newProfile, toneExamples: e.target.value })
                }
                placeholder="お疲れ様です！&#10;ありがとうございます！&#10;了解しました〜"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddProfile} disabled={isSubmitting}>
                {isSubmitting ? '追加中...' : '追加'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 返信生成フォーム */}
      {showReplyGenerator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              口調で返信を生成
            </CardTitle>
            <CardDescription>
              相手との関係性に合わせた口調で返信を生成します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>相手のメールアドレス（任意）</Label>
              <Input
                value={replyForm.recipientEmail}
                onChange={(e) =>
                  setReplyForm({ ...replyForm, recipientEmail: e.target.value })
                }
                placeholder="yamada@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>元のメッセージ</Label>
              <Textarea
                value={replyForm.originalMessage}
                onChange={(e) =>
                  setReplyForm({ ...replyForm, originalMessage: e.target.value })
                }
                placeholder="相手から受け取ったメッセージ"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>返信したい内容</Label>
              <Textarea
                value={replyForm.replyContent}
                onChange={(e) =>
                  setReplyForm({ ...replyForm, replyContent: e.target.value })
                }
                placeholder="伝えたい内容を簡単に"
                rows={3}
              />
            </div>

            <Button
              onClick={handleGenerateReply}
              disabled={isGeneratingReply}
              className="gap-2"
            >
              {isGeneratingReply ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  返信を生成
                </>
              )}
            </Button>

            {generatedReply && (
              <div className="space-y-2">
                <Label>生成された返信</Label>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="whitespace-pre-wrap">{generatedReply}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedReply);
                    toast.success('コピーしました');
                  }}
                >
                  コピー
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* プロフィール一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            登録済みの連絡先
          </CardTitle>
          <CardDescription>
            {profiles.length}件の連絡先が登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              連絡先がまだ登録されていません
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {profile.contactName || profile.contactEmail || '名前なし'}
                    </div>
                    {profile.contactEmail && (
                      <div className="text-sm text-muted-foreground">
                        {profile.contactEmail}
                      </div>
                    )}
                    <div className="text-sm mt-1">
                      <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                        {relationshipTypeLabels[profile.relationshipType] ||
                          profile.relationshipType}
                      </span>
                    </div>
                    {profile.tone?.examples && profile.tone.examples.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        例文: {profile.tone.examples.length}件
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
