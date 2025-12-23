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
    console.error('Error in home page:', error);
    // エラーが発生した場合はログインページにリダイレクト（リダイレクトループを避けるため）
    // ただし、リダイレクトが失敗する可能性があるため、直接ログインページのコンテンツを返す
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white mb-4">認証エラーが発生しました</p>
          <a href="/login" className="text-primary hover:underline">ログインページに移動</a>
        </div>
      </div>
    );
  }
}
