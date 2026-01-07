'use client';

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Folder, ListChecks, Upload, Loader2, Copy, Download, CheckCircle } from "lucide-react";
import { generateContent } from "@/server/actions/content-generation";
import { toast } from "sonner";

type ContentType = "x" | "note" | "newsletter" | "line" | "pdf" | "youtube";

const contentTypeMapping: Record<ContentType, 'x_post' | 'note_article' | 'youtube_script' | 'pdf_manual' | 'diagram'> = {
  x: 'x_post',
  note: 'note_article',
  newsletter: 'note_article',
  line: 'x_post',
  pdf: 'pdf_manual',
  youtube: 'youtube_script',
};

interface Project {
  id: number;
  name: string;
  description?: string | null;
}

interface ContentComposerProps {
  projects: Project[];
}

interface GeneratedContent {
  type: ContentType;
  content: string;
  title: string;
}

export function ContentComposer({ projects }: ContentComposerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(projects[0]?.id ?? null);
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(["x", "note", "newsletter", "line"]);
  const [prompt, setPrompt] = useState("");
  const [sources, setSources] = useState("");
  const [oldNotes, setOldNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const toggleType = (t: ContentType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleGenerate = async () => {
    if (!selectedProjectId || selectedTypes.length === 0) {
      toast.error("プロジェクトとコンテンツタイプを選択してください");
      return;
    }

    setIsGenerating(true);
    setGeneratedContents([]);

    try {
      const results: GeneratedContent[] = [];

      for (const type of selectedTypes) {
        const apiType = contentTypeMapping[type];
        const instructions = `${prompt}\n\n追加ソース:\n${sources}\n\n過去のNote記事:\n${oldNotes}`;

        const result = await generateContent(
          apiType,
          null,
          `${projectMap.get(selectedProjectId)} - ${type}`,
          instructions
        );

        results.push({
          type,
          content: result.content,
          title: `${projectMap.get(selectedProjectId)} - ${type}`,
        });
      }

      setGeneratedContents(results);
      toast.success(`${results.length}件のコンテンツを生成しました`);
    } catch (error) {
      console.error("Failed to generate content:", error);
      toast.error("コンテンツ生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("クリップボードにコピーしました");
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
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedProjectId || isGenerating || selectedTypes.length === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              'コンテンツ生成を依頼する'
            )}
          </Button>
        </div>
      </Card>

      {/* 生成結果表示エリア */}
      {generatedContents.length > 0 && (
        <Card className="p-4 xl:col-span-3 space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold">生成されたコンテンツ</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {generatedContents.map((item, index) => (
              <Card key={index} className="p-4 border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">
                    {item.type === 'x' && 'X投稿'}
                    {item.type === 'note' && 'Note記事'}
                    {item.type === 'newsletter' && 'メルマガ'}
                    {item.type === 'line' && '公式LINE'}
                    {item.type === 'pdf' && 'PDFマニュアル'}
                    {item.type === 'youtube' && 'YouTube台本'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 max-h-64 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap text-gray-300">
                    {item.content}
                  </pre>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

