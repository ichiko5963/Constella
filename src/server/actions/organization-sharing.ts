/**
 * 組織共有機能
 * P3-5: 組織共有機能（権限管理 + 自動アーカイブ）
 */

'use server';

import { db } from '@/db';
import { auth } from '@/auth';
import { files, projects, users } from '@/db/schema';
import { folderPermissions, userRoles } from '@/db/schema-extensions';
import { eq, and, sql, lt } from 'drizzle-orm';

/**
 * ファイル/フォルダを共有
 */
export async function shareFileWithUser(
  fileId: number,
  targetUserEmail: string,
  permission: 'read' | 'write' | 'admin'
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
      throw new Error('File not found or unauthorized');
    }

    // 対象ユーザーを取得
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, targetUserEmail),
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // 既存の権限を確認
    const existingPermission = await db.query.folderPermissions.findFirst({
      where: and(
        eq(folderPermissions.fileId, fileId),
        eq(folderPermissions.userId, targetUser.id)
      ),
    });

    if (existingPermission) {
      // 権限を更新
      await db
        .update(folderPermissions)
        .set({ permission })
        .where(eq(folderPermissions.id, existingPermission.id));
    } else {
      // 新しい権限を作成
      await db.insert(folderPermissions).values({
        fileId,
        userId: targetUser.id,
        permission,
        grantedBy: session.user.id,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to share file with user:', error);
    throw new Error('Failed to share file with user');
  }
}

/**
 * ファイル/フォルダの共有を解除
 */
export async function revokeFileAccess(fileId: number, targetUserId: string) {
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
      throw new Error('File not found or unauthorized');
    }

    await db
      .delete(folderPermissions)
      .where(and(
        eq(folderPermissions.fileId, fileId),
        eq(folderPermissions.userId, targetUserId)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to revoke file access:', error);
    throw new Error('Failed to revoke file access');
  }
}

/**
 * ファイル/フォルダの共有ユーザー一覧を取得
 */
export async function getFileSharedUsers(fileId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const permissions = await db
      .select({
        permission: folderPermissions,
        user: users,
      })
      .from(folderPermissions)
      .leftJoin(users, eq(folderPermissions.userId, users.id))
      .where(eq(folderPermissions.fileId, fileId));

    return permissions;
  } catch (error) {
    console.error('Failed to get file shared users:', error);
    throw new Error('Failed to get file shared users');
  }
}

/**
 * プロジェクトにユーザーを追加
 */
export async function addUserToProject(
  projectId: number,
  targetUserEmail: string,
  role: 'owner' | 'admin' | 'member' | 'participant'
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // プロジェクトの所有者確認
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.userId !== session.user.id) {
      throw new Error('Project not found or unauthorized');
    }

    // 対象ユーザーを取得
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, targetUserEmail),
    });

    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // 既存のロールを確認
    const existingRole = await db.query.userRoles.findFirst({
      where: and(
        eq(userRoles.projectId, projectId),
        eq(userRoles.userId, targetUser.id)
      ),
    });

    if (existingRole) {
      // ロールを更新
      await db
        .update(userRoles)
        .set({ role })
        .where(eq(userRoles.id, existingRole.id));
    } else {
      // 新しいロールを作成
      await db.insert(userRoles).values({
        userId: targetUser.id,
        projectId,
        role,
        createdAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add user to project:', error);
    throw new Error('Failed to add user to project');
  }
}

/**
 * プロジェクトからユーザーを削除
 */
export async function removeUserFromProject(projectId: number, targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // プロジェクトの所有者確認
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project || project.userId !== session.user.id) {
      throw new Error('Project not found or unauthorized');
    }

    await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.projectId, projectId),
        eq(userRoles.userId, targetUserId)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to remove user from project:', error);
    throw new Error('Failed to remove user from project');
  }
}

/**
 * プロジェクトのメンバー一覧を取得
 */
export async function getProjectMembers(projectId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const members = await db
      .select({
        role: userRoles,
        user: users,
      })
      .from(userRoles)
      .leftJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.projectId, projectId));

    return members;
  } catch (error) {
    console.error('Failed to get project members:', error);
    throw new Error('Failed to get project members');
  }
}

/**
 * 古いデータを自動アーカイブ（1年以上前）
 */
export async function archiveOldData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const timestamp = Math.floor(oneYearAgo.getTime() / 1000);

    // 1年以上前のファイルをアーカイブ
    const result = await db
      .update(files)
      .set({ isArchived: true })
      .where(and(
        eq(files.userId, session.user.id),
        lt(files.createdAt, new Date(timestamp * 1000)),
        eq(files.isArchived, false)
      ));

    return { success: true, archivedCount: result.rowsAffected || 0 };
  } catch (error) {
    console.error('Failed to archive old data:', error);
    throw new Error('Failed to archive old data');
  }
}

/**
 * アーカイブされたファイルを復元
 */
export async function unarchiveFile(fileId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(files)
      .set({ isArchived: false })
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, session.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to unarchive file:', error);
    throw new Error('Failed to unarchive file');
  }
}

/**
 * アーカイブされたファイル一覧を取得
 */
export async function getArchivedFiles(projectId?: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const archivedFiles = await db
      .select()
      .from(files)
      .where(
        projectId
          ? and(
              eq(files.userId, session.user.id),
              eq(files.projectId, projectId),
              eq(files.isArchived, true)
            )
          : and(
              eq(files.userId, session.user.id),
              eq(files.isArchived, true)
            )
      );

    return archivedFiles;
  } catch (error) {
    console.error('Failed to get archived files:', error);
    throw new Error('Failed to get archived files');
  }
}

/**
 * ファイル/フォルダをチームと共有
 */
export async function shareFileWithTeam(fileId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(files)
      .set({ sharedToTeam: true })
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, session.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to share file with team:', error);
    throw new Error('Failed to share file with team');
  }
}

/**
 * チーム共有を解除
 */
export async function unshareFileFromTeam(fileId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    await db
      .update(files)
      .set({ sharedToTeam: false })
      .where(and(
        eq(files.id, fileId),
        eq(files.userId, session.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error('Failed to unshare file from team:', error);
    throw new Error('Failed to unshare file from team');
  }
}

