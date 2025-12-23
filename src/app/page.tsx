import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  // 認証エラーが発生しても、ログインページにリダイレクト
  // データベース接続エラーが発生している可能性があるため、エラーを無視してログインページにリダイレクト
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error('Auth error in home page:', error);
    // エラーが発生してもログインページにリダイレクト
    redirect("/login");
  }

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
