/**
 * AI自動フォルダ管理
 * P1-2: AI自動フォルダ管理（LLM分類 + 学習機能）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { files, projects } from '@/db/schema';
import { folderCorrections } from '@/db/schema-extensions';
import { eq, and } from 'drizzle-orm';
import { suggestFolderClassification } from './structured-generation';
import { vectorSearch } from './vector-search';

/**
 * コンテンツから適切なフォルダ構造を提案
 */
export async function suggestFolderStructure(
  content: string,
  projectId: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 1. 既存のフォルダ構造を取得
    const existingFolders = await db
      .select()
      .from(files)
      .where(and(
        eq(files.projectId, projectId),
        eq(files.fileType, 'folder')
      ));

    // 2. 類似コンテンツをベクトル検索
    const similarContent = await vectorSearch(content, 5);

    // 3. 過去の修正履歴を取得（学習データ）
    const corrections = await db
      .select()
      .from(folderCorrections)
      .where(and(
        eq(folderCorrections.userId, session.user.id),
        eq(folderCorrections.projectId, projectId)
      ))
      .limit(10);

    // 4. LLMに提案を生成させる
    const suggestion = await suggestFolderClassification(
      content,
      JSON.stringify(existingFolders.map(f => ({
        id: f.id,
        name: f.name,
        parentId: f.parentFileId,
      }))),
      JSON.stringify({
        similarContent: similarContent.map(s => ({
          content: s.content,
          note: s.note,
        })),
        corrections: corrections.map(c => ({
          original: JSON.parse(c.originalPath),
          corrected: JSON.parse(c.correctedPath),
        })),
      })
    );

    return suggestion;
  } catch (error) {
    console.error('Failed to suggest folder structure:', error);
    throw new Error('Failed to suggest folder structure');
  }
}

/**
 * ユーザーの修正を学習
 */
export async function applyFolderCorrection(
  projectId: number,
  originalPath: string[],
  correctedPath: string[],
  content: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 修正履歴を保存
    await db.insert(folderCorrections).values({
      userId: session.user.id,
      projectId,
      originalPath: JSON.stringify(originalPath),
      correctedPath: JSON.stringify(correctedPath),
      content,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to apply folder correction:', error);
    throw new Error('Failed to apply folder correction');
  }
}

/**
 * ファイルを指定されたフォルダに移動
 */
export async function moveFileToFolder(
  fileId: number,
  targetFolderId: number | null
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // ファイルの所有者確認
    const file = await db.query.files.findFirst({
      where: eq(files.id, fileId),
    });

    if (!file || file.userId !== session.user.id) {
      throw new Error('Unauthorized');
    }

    // ファイルを移動
    await db
      .update(files)
      .set({ parentFileId: targetFolderId })
      .where(eq(files.id, fileId));

    return { success: true };
  } catch (error) {
    console.error('Failed to move file:', error);
    throw new Error('Failed to move file');
  }
}

/**
 * フォルダツリーを取得
 */
export async function getFolderTree(projectId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const allFiles = await db
      .select()
      .from(files)
      .where(and(
        eq(files.projectId, projectId),
        eq(files.userId, session.user.id)
      ));

    // ツリー構造に変換
    const buildTree = (parentId: number | null): any[] => {
      return allFiles
        .filter(f => f.parentFileId === parentId)
        .map(f => ({
          ...f,
          children: buildTree(f.id),
        }));
    };

    return buildTree(null);
  } catch (error) {
    console.error('Failed to get folder tree:', error);
    throw new Error('Failed to get folder tree');
  }
}

/**
 * 新しいフォルダを作成
 */
export async function createFolder(
  projectId: number,
  name: string,
  parentFolderId: number | null = null
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const [folder] = await db
      .insert(files)
      .values({
        userId: session.user.id,
        projectId,
        name,
        fileType: 'folder',
        parentFileId: parentFolderId,
        aiGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return folder;
  } catch (error) {
    console.error('Failed to create folder:', error);
    throw new Error('Failed to create folder');
  }
}

