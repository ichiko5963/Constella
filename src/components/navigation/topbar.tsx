'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Stars, Mic, Network } from "lucide-react";

type Mode = "personal" | "team";

/**
 * Top bar for switching between personal/team modes and quick context actions.
 * Updated for Constella design system.
 */
export function TopBar() {
  const [mode, setMode] = useState<Mode>("personal");

  useEffect(() => {
    const saved = localStorage.getItem("constellaMode") as Mode | null;
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
      document.body.dataset.constellaMode = value;
      window.dispatchEvent(new CustomEvent("constella-mode-change", { detail: value }));
    }
  };

  const handleModeChange = (value: string) => {
    if (value === "personal" || value === "team") {
      setMode(value);
      localStorage.setItem("constellaMode", value);
      applyBodyMode(value);
    }
  };

  return (
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {/* Mode Switcher */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Mode</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "personal"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => handleModeChange("personal")}
          >
            Personal
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "team"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => handleModeChange("team")}
          >
            Team
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          <Star className="h-3 w-3" />
          {mode === "personal" ? "Your Constellation" : "Team Constellation"}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Link href="/chat">
          <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50">
            <Stars className="h-4 w-4" />
            AI Chat
          </Button>
        </Link>
        <Link href="/graph">
          <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50">
            <Network className="h-4 w-4" />
            Constellation
          </Button>
        </Link>
        <Link href="/projects">
          <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50">
            <Star className="h-4 w-4" />
            Stella
          </Button>
        </Link>
        <Link href="/recordings">
          <Button size="sm" className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
            <Mic className="h-4 w-4" />
            Record
          </Button>
        </Link>
      </div>
    </div>
  );
}
