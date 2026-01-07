/**
 * 口調管理ページ
 * P3-3: 口調管理機能
 */

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ToneManager } from '@/components/tone/tone-manager';

export default async function TonePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">口調管理</h1>
        <p className="text-sm text-muted-foreground">
          連絡先ごとの関係性と口調を管理し、AIが適切な口調で返信を生成します。
        </p>
      </div>
      <ToneManager />
    </div>
  );
}
