'use client';

import { useEffect, useState } from "react";
import { NavLink } from "@/components/navigation/nav-link";
import {
  Star,
  Mic,
  Calendar,
  MessageSquare,
  Settings,
  CheckSquare,
  Sparkles,
  Network,
  HelpCircle,
  Share2,
  Building2,
  Home,
  Sun,
} from "lucide-react";

type Mode = "personal" | "team";

// Stella = Context in Constella terminology
// Lumi = AI navigator that helps organize context through conversation
const personalNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/projects", label: "Stella", icon: Star },
  { href: "/recordings", label: "Record", icon: Mic },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/content", label: "Generate", icon: Sparkles },
  { href: "/graph", label: "Constellation", icon: Network },
  { href: "/lumi", label: "Talk", icon: Sun },
  { href: "/tone", label: "Tone", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

const teamNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/projects", label: "Stella", icon: Star },
  { href: "/recordings", label: "Record", icon: Mic },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/content", label: "Generate", icon: Sparkles },
  { href: "/graph", label: "Constellation", icon: Network },
  { href: "/lumi", label: "Talk", icon: Sun },
  { href: "/tone", label: "Tone", icon: HelpCircle },
  { href: "/sharing", label: "Share", icon: Share2 },
  { href: "/onboarding", label: "Setup", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ModeAwareNav() {
  const [mode, setMode] = useState<Mode>("personal");

  useEffect(() => {
    const saved = localStorage.getItem("constellaMode") as Mode | null;
    if (saved === "personal" || saved === "team") {
      setMode(saved);
    }
    const handler = (event: Event) => {
      if (event instanceof CustomEvent) {
        const val = event.detail as Mode;
        if (val === "personal" || val === "team") setMode(val);
      }
    };
    const storageHandler = () => {
      const next = localStorage.getItem("constellaMode") as Mode | null;
      if (next === "personal" || next === "team") setMode(next);
    };
    window.addEventListener("constella-mode-change", handler as EventListener);
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener("constella-mode-change", handler as EventListener);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const items = mode === "team" ? teamNav : personalNav;

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href + item.label}
            href={item.href}
            className="flex items-center px-3 py-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all duration-200 group"
          >
            <Icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-700 transition-colors" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
