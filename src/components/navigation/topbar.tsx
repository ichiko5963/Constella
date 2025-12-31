'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, FolderKanban, Workflow, Bot } from "lucide-react";

type Mode = "personal" | "team";

/**
 * Top bar for switching between personal/team modes and quick context actions.
 * Keeps the selected mode in localStorage (`actoryMode`).
 */
export function TopBar() {
  const [mode, setMode] = useState<Mode>("personal");

  useEffect(() => {
    const saved = localStorage.getItem("actoryMode") as Mode | null;
    if (saved === "personal" || saved === "team") {
      setMode(saved);
      applyBodyMode(saved);
    } else {
      applyBodyMode("personal");
      setMode("personal");
    }
  }, []);

  const applyBodyMode = (value: Mode) => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("mode-personal", "mode-team");
      document.body.classList.add(value === "personal" ? "mode-personal" : "mode-team");
      document.body.dataset.actoryMode = value;
    }
  };

  const handleModeChange = (value: string) => {
    if (value === "personal" || value === "team") {
      setMode(value);
      localStorage.setItem("actoryMode", value);
      applyBodyMode(value);
    }
  };

  return (
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-black/30 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400">モード</span>
        <div className="flex rounded-xl border border-white/5 bg-white/5 overflow-hidden">
          <Button
            variant={mode === "personal" ? "default" : "ghost"}
            size="sm"
            className="rounded-none px-3"
            onClick={() => handleModeChange("personal")}
          >
            個人
          </Button>
          <Button
            variant={mode === "team" ? "default" : "ghost"}
            size="sm"
            className="rounded-none px-3"
            onClick={() => handleModeChange("team")}
          >
            組織
          </Button>
        </div>
        <div className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">
          {mode === "personal" ? "Actory for One" : "Actory for Company"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/chat">
          <Button variant="secondary" size="sm" className="gap-2">
            <Bot className="h-4 w-4" />
            コンテキストAI
          </Button>
        </Link>
        <Link href="/graph">
          <Button variant="secondary" size="sm" className="gap-2">
            <Workflow className="h-4 w-4" />
            グラフビュー
          </Button>
        </Link>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            コンテキスト
          </Button>
        </Link>
        <Link href="/recordings">
          <Button size="sm" className="gap-2">
            <Brain className="h-4 w-4" />
            録音/議事録
          </Button>
        </Link>
      </div>
    </div>
  );
}

