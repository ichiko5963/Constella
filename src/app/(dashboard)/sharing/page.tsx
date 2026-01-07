/**
 * 組織共有ページ
 * P3-5: 組織共有機能
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SharingManager } from '@/components/sharing/sharing-manager';

export default async function SharingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id));

  const projectsSafe = userProjects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">組織共有</h1>
        <p className="text-sm text-muted-foreground">
          プロジェクトやフォルダをチームメンバーと共有し、権限を管理します。
        </p>
      </div>
      <SharingManager projects={projectsSafe} />
    </div>
  );
}
