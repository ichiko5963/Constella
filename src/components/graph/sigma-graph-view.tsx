/**
 * WebGL Graph View (Sigma.js)
 * P2-1: WebGL Graph View (Sigma.js + 10,000ノード対応)
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Sigma from 'sigma';
import Graph from 'graphology';
import { circular } from 'graphology-layout';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  size?: number;
  color?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface SigmaGraphViewProps {
  projectId: number;
  data?: GraphData;
}

export function SigmaGraphView({ projectId, data }: SigmaGraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Graphologyグラフを作成
    const graph = new Graph();
    graphRef.current = graph;

    // データがない場合はサンプルデータを生成
    const graphData = data || generateSampleData(50);

    // ノードを追加
    graphData.nodes.forEach((node) => {
      graph.addNode(node.id, {
        label: node.label,
        size: node.size || 10,
        color: node.color || '#00D4AA',
        x: node.x || Math.random() * 100,
        y: node.y || Math.random() * 100,
      });
    });

    // エッジを追加
    graphData.edges.forEach((edge, index) => {
      try {
        graph.addEdge(edge.source, edge.target, {
          label: edge.label,
          size: edge.size || 1,
          color: edge.color || '#666',
        });
      } catch (error) {
        console.warn(`Failed to add edge ${index}:`, error);
      }
    });

    // レイアウトを適用
    circular.assign(graph);

    // Sigma.jsインスタンスを作成
    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultNodeColor: '#00D4AA',
      defaultEdgeColor: '#666',
      labelFont: 'Inter, sans-serif',
      labelSize: 12,
      labelWeight: 'normal',
    });

    sigmaRef.current = sigma;
    setNodeCount(graph.order);
    setEdgeCount(graph.size);
    setIsLoading(false);

    // クリーンアップ
    return () => {
      sigma.kill();
    };
  }, [projectId, data]);

  const handleZoomIn = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedZoom({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedUnzoom({ duration: 300 });
    }
  };

  const handleReset = () => {
    if (sigmaRef.current) {
      const camera = sigmaRef.current.getCamera();
      camera.animatedReset({ duration: 300 });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* コントロールパネル */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          title="ズームイン"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          title="ズームアウト"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          title="リセット"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 統計情報 */}
      <div className="absolute top-4 left-4 z-10 bg-card/90 backdrop-blur-sm rounded-lg p-3 border">
        <div className="text-sm space-y-1">
          <div>ノード: {nodeCount}</div>
          <div>エッジ: {edgeCount}</div>
        </div>
      </div>

      {/* グラフコンテナ */}
      <div
        ref={containerRef}
        className="w-full h-full bg-background"
        style={{ minHeight: '600px' }}
      />

      {/* ローディング */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <div className="text-sm text-muted-foreground">グラフを読み込み中...</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * サンプルデータを生成（開発用）
 */
function generateSampleData(nodeCount: number): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // ノードを生成
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `ノード ${i}`,
      size: Math.random() * 10 + 5,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    });
  }

  // エッジを生成（各ノードから2-4本のエッジ）
  for (let i = 0; i < nodeCount; i++) {
    const edgeCount = Math.floor(Math.random() * 3) + 2;
    for (let j = 0; j < edgeCount; j++) {
      const targetIndex = Math.floor(Math.random() * nodeCount);
      if (targetIndex !== i) {
        edges.push({
          source: `node-${i}`,
          target: `node-${targetIndex}`,
          size: Math.random() * 2 + 0.5,
        });
      }
    }
  }

  return { nodes, edges };
}

