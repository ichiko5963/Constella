import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  try {
    const session = await auth();
    if (session) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  } catch (error) {
    console.error('Error in home page (auth failed):', error);
    // 認証エラーが発生した場合は、ログインページにリダイレクト
    // redirect()はエラーをスローするため、try-catchで処理
    try {
      redirect("/login");
    } catch (redirectError) {
      // リダイレクトが失敗した場合（既にリダイレクト中など）、エラーページを表示
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">認証エラーが発生しました</h1>
            <p className="text-gray-400">データベース接続を確認してください</p>
            <a href="/login" className="text-primary hover:underline block">ログインページに移動</a>
          </div>
        </div>
      );
    }
  }
}
