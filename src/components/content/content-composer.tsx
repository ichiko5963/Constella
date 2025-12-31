'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, Folder, ListChecks, Upload } from "lucide-react";

type ContentType = "x" | "note" | "newsletter" | "line" | "pdf" | "youtube";

interface Project {
  id: number;
  name: string;
  description?: string | null;
}

interface ContentComposerProps {
  projects: Project[];
}

export function ContentComposer({ projects }: ContentComposerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(projects[0]?.id ?? null);
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(["x", "note", "newsletter", "line"]);
  const [prompt, setPrompt] = useState("");
  const [sources, setSources] = useState("");
  const [oldNotes, setOldNotes] = useState("");

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const toggleType = (t: ContentType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleGenerate = () => {
    alert("コンテンツ生成リクエストを送信しました（サンプルUI）");
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="p-4 xl:col-span-1 space-y-4">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">コンテキスト選択</h3>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {projects.map((p) => (
            <label
              key={p.id}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:border-primary transition ${
                selectedProjectId === p.id ? "border-primary bg-primary/5" : "border-white/10"
              }`}
              onClick={() => setSelectedProjectId(p.id)}
            >
              <input
                type="radio"
                name="project"
                checked={selectedProjectId === p.id}
                onChange={() => setSelectedProjectId(p.id)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{p.name}</div>
                {p.description && (
                  <div className="text-sm text-gray-500">{p.description}</div>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-400">過去のNote記事や外部ソース（任意）</div>
          <Textarea
            placeholder="過去のNote記事URLやテキストを貼り付け（改行区切りで複数可）"
            value={oldNotes}
            onChange={(e) => setOldNotes(e.target.value)}
            className="min-h-[90px]"
          />
        </div>
      </Card>

      <Card className="p-4 xl:col-span-2 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">コンテンツ生成</h3>
          <div className="text-xs text-gray-500">
            {selectedProjectId ? projectMap.get(selectedProjectId) : "コンテキスト未選択"}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { value: "x", label: "X投稿" },
            { value: "note", label: "Note記事" },
            { value: "newsletter", label: "メルマガ" },
            { value: "line", label: "公式LINE" },
            { value: "pdf", label: "PDFマニュアル" },
            { value: "youtube", label: "YouTube台本" },
          ].map((item) => (
            <Button
              key={item.value}
              variant={selectedTypes.includes(item.value as ContentType) ? "default" : "outline"}
              size="sm"
              className="justify-start"
              onClick={() => toggleType(item.value as ContentType)}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            コンテンツ生成プロンプト（任意でカスタムプロンプトを記入）
          </div>
          <Textarea
            placeholder="例: 重要な意思決定を強調し、カジュアルなトーンでX投稿を3件生成。Note記事は見出しを3つ以上含める。"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm text-gray-400">追加ソース（議事録抜粋や外部リンクなど）</div>
          <Textarea
            placeholder="議事録の重要箇所、参考リンク、キーメッセージなどを貼り付け"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Upload className="h-3 w-3" />
            ドラッグ&ドロップで優先順位を決めるUIは準備中です。現状は貼り付け順で優先扱いします。
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleGenerate} disabled={!selectedProjectId}>
            コンテンツ生成を依頼する
          </Button>
        </div>
      </Card>
    </div>
  );
}

