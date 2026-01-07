/**
 * コンテキスト管理ページ
 * P2-2: コンテキスト管理UI（AIによる日次質問とコンテキスト整理）
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ContextManager } from '@/components/context/context-manager';

export default async function ContextPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">コンテキスト管理</h1>
        <p className="text-sm text-muted-foreground">
          AIがあなたのナレッジを整理するための質問をします。
          回答することで、より正確なフォルダ分類と関連付けが可能になります。
        </p>
      </div>
      <ContextManager />
    </div>
  );
}
