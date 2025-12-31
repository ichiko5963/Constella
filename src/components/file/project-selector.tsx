/**
 * プロジェクト選択モーダル（録音時）
 * P1-2: AI自動フォルダ管理
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FolderTree } from './folder-tree';
import { suggestFolderStructure } from '@/server/actions/ai-folder-classification';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  description?: string | null;
}

interface ProjectSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projectId: number, folderPath: string[]) => void;
  onSkip: () => void;
  projects: Project[];
  recordingContent?: string; // 録音内容（プレビュー用）
}

export function ProjectSelector({
  open,
  onClose,
  onSelect,
  onSkip,
  projects,
  recordingContent,
}: ProjectSelectorProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  const handleAISuggestion = async () => {
    if (!selectedProjectId || !recordingContent) {
      toast.error('プロジェクトを選択してください');
      return;
    }

    setIsGeneratingSuggestion(true);
    try {
      const suggestion = await suggestFolderStructure(recordingContent, selectedProjectId);
      setAiSuggestion(suggestion);
      setSelectedPath(suggestion.suggestedPath);
      toast.success(`AI提案: ${suggestion.suggestedPath.join(' > ')}`);
    } catch (error) {
      toast.error('AI提案の生成に失敗しました');
      console.error(error);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedProjectId) {
      toast.error('プロジェクトを選択してください');
      return;
    }
    onSelect(selectedProjectId, selectedPath);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>プロジェクトとフォルダを選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* プロジェクト選択 */}
          <div>
            <h3 className="font-semibold mb-3">プロジェクト</h3>
            <div className="grid grid-cols-2 gap-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedProjectId === project.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-muted-foreground mt-1">{project.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* フォルダツリー */}
          {selectedProjectId && (
            <div>
              <h3 className="font-semibold mb-3">フォルダ</h3>
              <FolderTree
                projectId={selectedProjectId}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            </div>
          )}

          {/* AI提案 */}
          {aiSuggestion && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🤖</div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">AI提案</div>
                  <div className="text-sm mb-2">
                    {aiSuggestion.suggestedPath.join(' > ')}
                  </div>
                  {aiSuggestion.reasoning && (
                    <div className="text-sm text-muted-foreground">
                      理由: {aiSuggestion.reasoning}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    信頼度: {aiSuggestion.confidence}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onSkip} className="flex-1">
              スキップ（後で分類）
            </Button>
            {selectedProjectId && recordingContent && (
              <Button
                variant="outline"
                onClick={handleAISuggestion}
                disabled={isGeneratingSuggestion}
                className="flex-1"
              >
                {isGeneratingSuggestion ? 'AI提案生成中...' : '🤖 AI提案'}
              </Button>
            )}
            <Button onClick={handleConfirm} disabled={!selectedProjectId} className="flex-1">
              確定
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

