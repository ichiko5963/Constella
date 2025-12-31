/**
 * グラフデータ取得
 * P2-1: WebGL Graph View
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { files, meetingNotes } from '@/db/schema';
import { fileLinks } from '@/db/schema-extensions';
import { eq, and } from 'drizzle-orm';

interface GraphNode {
  id: string;
  label: string;
  size?: number;
  color?: string;
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

/**
 * プロジェクトのグラフデータを取得
 */
export async function getProjectGraph(projectId: number): Promise<GraphData> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // プロジェクトのファイルを取得
    const projectFiles = await db
      .select()
      .from(files)
      .where(and(
        eq(files.projectId, projectId),
        eq(files.userId, session.user.id)
      ));

    // ファイル間のリンクを取得
    const links = await db
      .select()
      .from(fileLinks)
      .where(and(
        // sourceFileIdまたはtargetFileIdがprojectFilesに含まれる
      ));

    // ノードを作成
    const nodes: GraphNode[] = projectFiles.map(file => ({
      id: `file-${file.id}`,
      label: file.name,
      size: file.fileType === 'folder' ? 15 : 10,
      color: file.fileType === 'folder' ? '#00D4AA' : '#0D7377',
    }));

    // エッジを作成
    const edges: GraphEdge[] = links.map(link => ({
      source: `file-${link.sourceFileId}`,
      target: `file-${link.targetFileId}`,
      size: link.strength || 1,
      color: '#666',
    }));

    return { nodes, edges };
  } catch (error) {
    console.error('Failed to get project graph:', error);
    throw new Error('Failed to get project graph');
  }
}

/**
 * ファイル間のリンクを作成
 */
export async function createFileLink(
  sourceFileId: number,
  targetFileId: number,
  linkType: string = 'related',
  strength: number = 0.5
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db.insert(fileLinks).values({
      sourceFileId,
      targetFileId,
      linkType,
      strength,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to create file link:', error);
    throw new Error('Failed to create file link');
  }
}

/**
 * ファイル間のリンクを削除
 */
export async function deleteFileLink(linkId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db.delete(fileLinks).where(eq(fileLinks.id, linkId));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete file link:', error);
    throw new Error('Failed to delete file link');
  }
}

/**
 * AIが自動的にファイル間のリンクを生成
 */
export async function generateAutoLinks(projectId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // プロジェクトのすべての議事録を取得
    const notes = await db
      .select()
      .from(meetingNotes)
      .where(and(
        eq(meetingNotes.projectId, projectId),
        eq(meetingNotes.userId, session.user.id)
      ));

    // ベクトル検索で類似度の高い議事録ペアを見つけてリンクを作成
    // TODO: ベクトル検索を使用した自動リンク生成

    return { success: true, linksCreated: 0 };
  } catch (error) {
    console.error('Failed to generate auto links:', error);
    throw new Error('Failed to generate auto links');
  }
}

