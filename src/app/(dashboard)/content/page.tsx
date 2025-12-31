import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ContentComposer } from "@/components/content/content-composer";

export default async function ContentPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const list = await db.select().from(projects).where(eq(projects.userId, session.user.id));
  const projectsSafe = list.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">コンテンツ生成</h1>
        <p className="text-sm text-gray-400">
          コンテキストを選び、出力先（X/Note/メルマガ/LINE/YouTube等）をまとめて生成できます。
          過去のNote記事や外部ソースも貼り付け可能です。
        </p>
      </div>
      <ContentComposer projects={projectsSafe} />
    </div>
  );
}

