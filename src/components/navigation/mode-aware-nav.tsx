'use client';

import { useEffect, useState } from "react";
import { NavLink } from "@/components/navigation/nav-link";
import {
  LayoutDashboard,
  Folder,
  Mic,
  Calendar,
  MessageSquare,
  Settings,
  CheckSquare,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";

type Mode = "personal" | "team";

const personalNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/projects", label: "コンテキスト", icon: Folder },
  { href: "/recordings", label: "録音", icon: Mic },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/tasks", label: "タスク管理", icon: CheckSquare },
  { href: "/chat", label: "AIチャット", icon: MessageSquare },
  { href: "/content", label: "コンテンツ生成", icon: Sparkles },
  { href: "/settings", label: "設定", icon: Settings },
];

const teamNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/projects", label: "コンテキスト", icon: Folder },
  { href: "/recordings", label: "録音", icon: Mic },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/tasks", label: "タスク管理", icon: CheckSquare },
  { href: "/chat", label: "AIチャット", icon: MessageSquare },
  { href: "/content", label: "コンテンツ生成", icon: Sparkles },
  // 組織専用導線
  { href: "/onboarding", label: "組織セットアップ", icon: Building2 },
  { href: "/settings", label: "メンバー招待", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

export function ModeAwareNav() {
  const [mode, setMode] = useState<Mode>("personal");

  useEffect(() => {
    const saved = localStorage.getItem("actoryMode") as Mode | null;
    if (saved === "personal" || saved === "team") {
      setMode(saved);
    }
    // 変更イベントを監視（TopBarからのカスタムイベント + storageイベント）
    const handler = (event: Event) => {
      if (event instanceof CustomEvent) {
        const val = event.detail as Mode;
        if (val === "personal" || val === "team") setMode(val);
      }
    };
    const storageHandler = () => {
      const next = localStorage.getItem("actoryMode") as Mode | null;
      if (next === "personal" || next === "team") setMode(next);
    };
    window.addEventListener("actory-mode-change", handler as EventListener);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("actory-mode-change", handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const items = mode === "team" ? teamNav : personalNav;

  return (
    <nav className="flex-1 px-4 space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href + item.label}
            href={item.href}
            className="flex items-center px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200 group"
          >
            <Icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary transition-colors" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

