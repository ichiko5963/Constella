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
    // エラーが発生した場合はログインページにリダイレクト
    redirect("/login");
  }
}
