'use client';

import { useEffect, useState } from "react";

type Mode = "personal" | "team";

/**
 * Top bar with mode switcher only.
 * Quick actions removed (available in sidebar).
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
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-end">
      {/* Mode Switcher - Right aligned, minimal design */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-900">Mode</span>
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
      </div>
    </div>
  );
}
