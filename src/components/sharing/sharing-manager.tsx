/**
 * 組織共有マネージャーコンポーネント
 * P3-5: 組織共有機能
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getProjectMembers,
  addUserToProject,
  removeUserFromProject,
  getArchivedFiles,
  unarchiveFile,
  archiveOldData,
} from '@/server/actions/organization-sharing';
import { toast } from 'sonner';
import { Users, UserPlus, Trash2, Archive, ArchiveRestore, Shield, Loader2 } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  description?: string | null;
}

interface ProjectMember {
  role: {
    id: number;
    userId: string;
    projectId: number;
    role: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface ArchivedFile {
  id: number;
  name: string;
  fileType: string;
  createdAt: Date;
}

interface SharingManagerProps {
  projects: Project[];
}

const roleLabels: Record<string, string> = {
  owner: 'オーナー',
  admin: '管理者',
  member: 'メンバー',
  participant: '参加者',
};

export function SharingManager({ projects }: SharingManagerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    projects[0]?.id || null
  );
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [archivedFiles, setArchivedFiles] = useState<ArchivedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member' | 'participant',
  });
  const [isInviting, setIsInviting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData();
    }
  }, [selectedProjectId]);

  const loadProjectData = async () => {
    if (!selectedProjectId) return;

    setIsLoading(true);
    try {
      const [membersData, archivedData] = await Promise.all([
        getProjectMembers(selectedProjectId),
        getArchivedFiles(selectedProjectId),
      ]);

      setMembers(membersData as ProjectMember[]);
      setArchivedFiles(archivedData as ArchivedFile[]);
    } catch (error) {
      console.error('Failed to load project data:', error);
      toast.error('データの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!selectedProjectId || !inviteForm.email) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setIsInviting(true);
    try {
      await addUserToProject(selectedProjectId, inviteForm.email, inviteForm.role);
      toast.success('ユーザーを招待しました');
      setShowInviteForm(false);
      setInviteForm({ email: '', role: 'member' });
      loadProjectData();
    } catch (error: any) {
      if (error.message.includes('not found')) {
        toast.error('指定されたユーザーが見つかりません');
      } else {
        toast.error('招待に失敗しました');
      }
      console.error(error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedProjectId) return;
    if (!confirm('このユーザーをプロジェクトから削除しますか？')) return;

    try {
      await removeUserFromProject(selectedProjectId, userId);
      toast.success('ユーザーを削除しました');
      loadProjectData();
    } catch (error) {
      toast.error('ユーザーの削除に失敗しました');
      console.error(error);
    }
  };

  const handleUnarchiveFile = async (fileId: number) => {
    try {
      await unarchiveFile(fileId);
      toast.success('ファイルを復元しました');
      loadProjectData();
    } catch (error) {
      toast.error('ファイルの復元に失敗しました');
      console.error(error);
    }
  };

  const handleAutoArchive = async () => {
    if (!confirm('1年以上前のファイルをアーカイブしますか？')) return;

    setIsArchiving(true);
    try {
      const result = await archiveOldData();
      toast.success(`${result.archivedCount}件のファイルをアーカイブしました`);
      loadProjectData();
    } catch (error) {
      toast.error('アーカイブに失敗しました');
      console.error(error);
    } finally {
      setIsArchiving(false);
    }
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          プロジェクトがありません。先にプロジェクトを作成してください。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* プロジェクト選択 */}
      <Card>
        <CardHeader>
          <CardTitle>プロジェクト選択</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProjectId?.toString()}
            onValueChange={(value) => setSelectedProjectId(parseInt(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="プロジェクトを選択" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              メンバー
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Archive className="h-4 w-4" />
              アーカイブ
            </TabsTrigger>
          </TabsList>

          {/* メンバータブ */}
          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>プロジェクトメンバー</CardTitle>
                  <CardDescription>
                    {members.length}名のメンバーが参加しています
                  </CardDescription>
                </div>
                <Button onClick={() => setShowInviteForm(!showInviteForm)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  メンバーを招待
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 招待フォーム */}
                {showInviteForm && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>メールアドレス</Label>
                          <Input
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) =>
                              setInviteForm({ ...inviteForm, email: e.target.value })
                            }
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ロール</Label>
                          <Select
                            value={inviteForm.role}
                            onValueChange={(value) =>
                              setInviteForm({ ...inviteForm, role: value as any })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleInviteUser} disabled={isInviting}>
                          {isInviting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              招待中...
                            </>
                          ) : (
                            '招待する'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowInviteForm(false)}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* メンバー一覧 */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    まだメンバーが追加されていません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.role.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {member.user?.name?.[0] || member.user?.email?.[0] || '?'}
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.user?.name || member.user?.email || '名前なし'}
                            </div>
                            {member.user?.email && (
                              <div className="text-sm text-muted-foreground">
                                {member.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-xs">
                            <Shield className="h-3 w-3" />
                            {roleLabels[member.role.role || ''] || member.role.role}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(member.role.userId)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* アーカイブタブ */}
          <TabsContent value="archive" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>アーカイブ管理</CardTitle>
                  <CardDescription>
                    古いファイルを自動アーカイブして整理します
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAutoArchive}
                  disabled={isArchiving}
                  className="gap-2"
                >
                  {isArchiving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      アーカイブ中...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      自動アーカイブ
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : archivedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    アーカイブされたファイルはありません
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.fileType} -{' '}
                            {new Date(file.createdAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnarchiveFile(file.id)}
                          className="gap-2"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                          復元
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
