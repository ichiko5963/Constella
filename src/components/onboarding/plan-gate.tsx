'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "personal" | "team";

interface SelectionState {
  personal: boolean;
  team: boolean;
  businessName: string;
}

/**
 * 初回ログイン時にプラン選択を促すフルスクリーンオーバーレイ
 * - 個人 / チーム の両選択を許可
 * - 個人を選んだ場合は現在進行中の事業名を入力
 * - いずれか選択 + 必須入力が揃ったら「はじめる」で保存
 * 保存先: localStorage `actoryModeSelection`, `actoryMode`
 */
export function PlanGate() {
  const [selection, setSelection] = useState<SelectionState>({
    personal: false,
    team: false,
    businessName: "",
  });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("actoryModeSelection");
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
    localStorage.setItem("actoryMode", mode);
    document.body.classList.remove("mode-personal", "mode-team");
    document.body.classList.add(mode === "personal" ? "mode-personal" : "mode-team");
    document.body.dataset.actoryMode = mode;
    window.dispatchEvent(new CustomEvent("actory-mode-change", { detail: mode }));
  };

  const toggle = (key: "personal" | "team") => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canSubmit =
    (selection.personal || selection.team) &&
    (!selection.personal || selection.businessName.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    localStorage.setItem("actoryModeSelection", JSON.stringify(selection));
    applyMode(selection);
    setShow(false);
    document.body.classList.remove("gate-open");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="animated-gradient" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-white/5" />
      <div className="relative w-full max-w-3xl mx-4 rounded-3xl border border-white/10 bg-black/70 p-10 shadow-2xl shadow-primary/20">
        <div className="space-y-2 mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Actory</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Actoryへようこそ</h1>
          <p className="text-gray-400">最初に利用プランを選択してください（複数選択可）</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => toggle("personal")}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selection.personal
                ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/20"
                : "border-white/10 hover:border-primary/30"
            }`}
          >
            <div className="text-sm text-gray-400">Individual</div>
            <div className="text-xl font-semibold text-white mt-1">個人向け</div>
            <p className="text-gray-400 text-sm mt-2">
              個人ナレッジを整理し、AIでコンテンツ生成や録音管理を行います。
            </p>
          </button>

          <button
            onClick={() => toggle("team")}
            className={`rounded-2xl border p-4 text-left transition-all ${
              selection.team
                ? "border-blue-400/60 bg-blue-400/10 shadow-lg shadow-blue-400/20"
                : "border-white/10 hover:border-blue-400/30"
            }`}
          >
            <div className="text-sm text-gray-400">Organization</div>
            <div className="text-xl font-semibold text-white mt-1">組織向け</div>
            <p className="text-gray-400 text-sm mt-2">
              部署・プロジェクト単位でコンテキストを共有し、メンバー招待や組織セットアップを行います。
            </p>
          </button>
        </div>

        {selection.personal && (
          <div className="mt-6 space-y-2">
            <label className="text-sm text-gray-300">現在進行中の事業名（個人用）</label>
            <Input
              placeholder="例: 個人開発SaaS、フリーランス案件A"
              value={selection.businessName}
              onChange={(e) =>
                setSelection((prev) => ({ ...prev, businessName: e.target.value }))
              }
            />
          </div>
        )}

        <div className="flex justify-end mt-8">
          <Button size="lg" disabled={!canSubmit} onClick={handleSubmit}>
            はじめる
          </Button>
        </div>
      </div>
    </div>
  );
}

