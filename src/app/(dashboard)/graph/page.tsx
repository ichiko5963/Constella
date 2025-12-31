/**
 * グラフビューページ
 * P2-1: WebGL Graph View
 */

'use client';

import { useState, useEffect } from 'react';
import { SigmaGraphView } from '@/components/graph/sigma-graph-view';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProjectGraph } from '@/server/actions/graph';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
}

export default function GraphPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: プロジェクト一覧を取得
    // 仮のデータ
    setProjects([
      { id: 1, name: 'プロジェクト1' },
      { id: 2, name: 'プロジェクト2' },
    ]);
  }, []);

  const loadGraphData = async (projectId: number) => {
    setIsLoading(true);
    try {
      const data = await getProjectGraph(projectId);
      setGraphData(data);
    } catch (error) {
      toast.error('グラフデータの読み込みに失敗しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      loadGraphData(selectedProjectId);
    }
  }, [selectedProjectId]);

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ナレッジグラフ</h1>
          <p className="text-sm text-muted-foreground">
            プロジェクト内のファイルとその関連性を可視化
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedProjectId?.toString()}
            onValueChange={(value) => setSelectedProjectId(parseInt(value))}
          >
            <SelectTrigger className="w-64">
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

          <Button
            onClick={() => selectedProjectId && loadGraphData(selectedProjectId)}
            disabled={!selectedProjectId || isLoading}
          >
            {isLoading ? '読み込み中...' : '更新'}
          </Button>
        </div>
      </div>

      {/* グラフビュー */}
      <div className="flex-1">
        {selectedProjectId ? (
          <SigmaGraphView projectId={selectedProjectId} data={graphData} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-4">📊</div>
              <div>プロジェクトを選択してグラフを表示</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

