'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, User, Users } from "lucide-react";

type Mode = "personal" | "team";

interface SelectionState {
  personal: boolean;
  team: boolean;
  businessName: string;
}

/**
 * Initial login plan selection overlay
 * - Allows selecting Personal / Team modes
 * - If personal is selected, prompts for current business/project name
 * Storage: localStorage `constellaModeSelection`, `constellaMode`
 */
export function PlanGate() {
  const [selection, setSelection] = useState<SelectionState>({
    personal: false,
    team: false,
    businessName: "",
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("constellaModeSelection");
    if (!stored) {
      setShow(true);
      document.body.classList.add("gate-open");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SelectionState;
      if (parsed.personal || parsed.team) {
        setSelection(parsed);
        applyMode(parsed);
      } else {
        setShow(true);
        document.body.classList.add("gate-open");
      }
    } catch {
      setShow(true);
      document.body.classList.add("gate-open");
    }
  }, []);

  const applyMode = (s: SelectionState) => {
    const mode: Mode = s.personal ? "personal" : "team";
    localStorage.setItem("constellaMode", mode);
    document.body.classList.remove("mode-personal", "mode-team");
    document.body.classList.add(mode === "personal" ? "mode-personal" : "mode-team");
    document.body.dataset.constellaMode = mode;
    window.dispatchEvent(new CustomEvent("constella-mode-change", { detail: mode }));
  };

  const toggle = (key: "personal" | "team") => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canSubmit =
    (selection.personal || selection.team) &&
    (!selection.personal || selection.businessName.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    localStorage.setItem("constellaModeSelection", JSON.stringify(selection));
    applyMode(selection);
    setShow(false);
    document.body.classList.remove("gate-open");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="relative w-full max-w-3xl mx-4 rounded-2xl border border-gray-200 bg-white p-10 shadow-2xl">
        <div className="space-y-2 mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-900 flex items-center justify-center">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Constellaへようこそ</h1>
          <p className="text-gray-500">利用プランを選択してください（複数選択可）</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => toggle("personal")}
            className={`rounded-xl border-2 p-6 text-left transition-all ${
              selection.personal
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
              selection.personal ? 'bg-gray-900' : 'bg-gray-100'
            }`}>
              <User className={`w-6 h-6 transition-colors ${selection.personal ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="text-sm text-gray-500">Individual</div>
            <div className="text-xl font-semibold text-gray-900 mt-1">個人向け</div>
            <p className="text-gray-500 text-sm mt-2">
              個人ナレッジを整理し、AIでコンテンツ生成や録音管理を行います。
            </p>
          </button>

          <button
            onClick={() => toggle("team")}
            className={`rounded-xl border-2 p-6 text-left transition-all ${
              selection.team
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
              selection.team ? 'bg-gray-900' : 'bg-gray-100'
            }`}>
              <Users className={`w-6 h-6 transition-colors ${selection.team ? 'text-white' : 'text-gray-600'}`} />
            </div>
            <div className="text-sm text-gray-500">Organization</div>
            <div className="text-xl font-semibold text-gray-900 mt-1">組織向け</div>
            <p className="text-gray-500 text-sm mt-2">
              部署・プロジェクト単位でコンテキストを共有し、メンバー招待や組織セットアップを行います。
            </p>
          </button>
        </div>

        {selection.personal && (
          <div className="mt-6 space-y-2">
            <label className="text-sm text-gray-700 font-medium">現在進行中の事業名（個人用）</label>
            <Input
              placeholder="例: 個人開発SaaS、フリーランス案件A"
              value={selection.businessName}
              onChange={(e) =>
                setSelection((prev) => ({ ...prev, businessName: e.target.value }))
              }
              className="border-gray-200"
            />
          </div>
        )}

        <div className="flex justify-end mt-8">
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            はじめる
          </Button>
        </div>
      </div>
    </div>
  );
}
