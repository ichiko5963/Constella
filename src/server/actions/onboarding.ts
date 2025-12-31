/**
 * オンボーディング機能
 * P1-1: オンボーディング機能（事業・部門入力 + 自動フォルダ生成）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { onboardingResponses } from '@/db/schema-extensions';
import { projects, files } from '@/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface OnboardingData {
  planType: 'one' | 'company';
  businessCount?: number;
  businessNames?: string[];
  departmentCounts?: Record<number, number>;
  departmentNames?: Record<number, string[]>;
  mainPurpose?: string[];
}

interface FolderStructure {
  name: string;
  children?: FolderStructure[];
}

/**
 * AIでフォルダ構造を生成
 */
export async function generateFolderStructure(data: OnboardingData): Promise<FolderStructure[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  let prompt = '';

  if (data.planType === 'one') {
    prompt = `個人用のナレッジ管理システムのフォルダ構造を生成してください。
    
主な用途: ${data.mainPurpose?.join(', ') || '一般的なナレッジ管理'}

以下のような階層構造を提案してください（最大3階層）:
- プロジェクト別
- 日付別
- カテゴリ別

JSON形式で返してください。各フォルダは {name: string, children?: FolderStructure[]} の形式です。`;
  } else {
    prompt = `企業用のナレッジ管理システムのフォルダ構造を生成してください。

事業数: ${data.businessCount}
事業名: ${data.businessNames?.join(', ')}

${data.businessNames?.map((businessName, index) => {
  const deptCount = data.departmentCounts?.[index] || 0;
  const deptNames = data.departmentNames?.[index] || [];
  return `${businessName}: ${deptCount}部門 (${deptNames.join(', ')})`;
}).join('\n')}

主な用途: ${data.mainPurpose?.join(', ')}

以下のような階層構造を提案してください（最大4階層）:
- 事業 > 部門 > プロジェクト/カテゴリ > 日付/トピック

JSON形式で返してください。各フォルダは {name: string, children?: FolderStructure[]} の形式です。`;
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'あなたはナレッジ管理システムのフォルダ構造を設計するAIです。実用的で分かりやすい階層構造を提案してください。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'folder_structure',
        schema: {
          type: 'object',
          properties: {
            folders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  children: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        children: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              children: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    name: { type: 'string' },
                                  },
                                  required: ['name'],
                                  additionalProperties: false,
                                },
                              },
                            },
                            required: ['name'],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ['name'],
                      additionalProperties: false,
                    },
                  },
                },
                required: ['name'],
                additionalProperties: false,
              },
            },
          },
          required: ['folders'],
          additionalProperties: false,
        },
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"folders":[]}');
  return result.folders;
}

/**
 * フォルダ構造を実際に作成
 */
async function createFoldersRecursively(
  userId: string,
  projectId: number,
  folders: FolderStructure[],
  parentFileId: number | null = null
): Promise<void> {
  for (const folder of folders) {
    const [file] = await db
      .insert(files)
      .values({
        userId,
        projectId,
        name: folder.name,
        fileType: 'folder',
        parentFileId,
        aiGenerated: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (folder.children && folder.children.length > 0) {
      await createFoldersRecursively(userId, projectId, folder.children, file.id);
    }
  }
}

/**
 * オンボーディングを完了
 */
export async function completeOnboarding(data: OnboardingData, folderStructure: FolderStructure[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // オンボーディング情報を保存
    await db.insert(onboardingResponses).values({
      userId: session.user.id,
      planType: data.planType,
      businessCount: data.businessCount || null,
      businessNames: data.businessNames ? JSON.stringify(data.businessNames) : null,
      departmentCounts: data.departmentCounts ? JSON.stringify(data.departmentCounts) : null,
      departmentNames: data.departmentNames ? JSON.stringify(data.departmentNames) : null,
      mainPurpose: data.mainPurpose ? JSON.stringify(data.mainPurpose) : null,
      folderStructure: JSON.stringify(folderStructure),
      isCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // デフォルトプロジェクトを作成
    const [project] = await db
      .insert(projects)
      .values({
        userId: session.user.id,
        name: data.planType === 'one' ? '個人プロジェクト' : '全社プロジェクト',
        description: data.planType === 'one' ? '個人用のメインプロジェクト' : '全社共有プロジェクト',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // フォルダ構造を実際に作成
    await createFoldersRecursively(session.user.id, project.id, folderStructure);

    return { success: true, projectId: project.id };
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    throw new Error('Failed to complete onboarding');
  }
}

/**
 * オンボーディング状況を取得
 */
export async function getOnboardingStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const response = await db.query.onboardingResponses.findFirst({
    where: eq(onboardingResponses.userId, session.user.id),
  });

  return response;
}

/**
 * フォルダ構造を更新
 */
export async function updateFolderStructure(
  projectId: number,
  updatedStructure: FolderStructure[]
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // 既存のAI生成フォルダを削除
    await db
      .delete(files)
      .where(eq(files.projectId, projectId));

    // 新しいフォルダ構造を作成
    await createFoldersRecursively(session.user.id, projectId, updatedStructure);

    return { success: true };
  } catch (error) {
    console.error('Failed to update folder structure:', error);
    throw new Error('Failed to update folder structure');
  }
}

