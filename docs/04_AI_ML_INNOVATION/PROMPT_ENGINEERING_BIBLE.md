# プロンプトエンジニアリング完全ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: GPT-4 + Structured Outputs + Function Calling

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [プロンプト設計原則](#2-プロンプト設計原則)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 プロンプトエンジニアリングとは

LLMに対して適切な指示を与え、期待する出力を得るための技術です。Actoryでは、議事録生成、タスク抽出、コンテンツ生成などで使用します。

### 1.2 Actoryでの適用

- **議事録生成**: 構造化された議事録の生成
- **タスク抽出**: Function Callingによるタスク抽出
- **コンテンツ生成**: ユーザーのトーンに合わせたコンテンツ生成
- **RAG**: コンテキストを活用した回答生成

---

## 2. プロンプト設計原則

### 2.1 構造化プロンプト

```typescript
// server/prompts/meeting-note-prompt.ts
export const MEETING_NOTE_PROMPT = `
あなたはプロフェッショナルな議事録生成AIです。
以下の文字起こしから、構造化された議事録を生成してください。

## 要件
1. 議題を明確に抽出する
2. 議論の要点をまとめる
3. 決定事項を明確に記載する
4. アクションアイテムを抽出する

## 出力形式
以下のJSON形式で出力してください：
{
  "title": "議事録タイトル",
  "summary": "要約（200文字以内）",
  "agendaItems": ["議題1", "議題2"],
  "discussionDetails": "議論の詳細",
  "decisions": [
    {
      "item": "決定事項",
      "details": "詳細"
    }
  ],
  "actionItems": [
    {
      "title": "タスク名",
      "priority": "high|medium|low",
      "assignee": "担当者"
    }
  ]
}

## 文字起こし
{transcription}
`;
```

### 2.2 Few-Shot Learning

```typescript
// server/prompts/few-shot-prompt.ts
export const FEW_SHOT_PROMPT = `
以下の例を参考にして、タスクを抽出してください。

## 例1
入力: "来週までにプロジェクト計画書を作成する必要があります"
出力: {
  "title": "プロジェクト計画書を作成",
  "dueDate": "2024-12-28",
  "priority": "high"
}

## 例2
入力: "会議室の予約を確認しておいてください"
出力: {
  "title": "会議室の予約を確認",
  "dueDate": null,
  "priority": "medium"
}

## 実際の入力
{input}
`;
```

---

## 3. 実装パターン

### 3.1 Structured Outputs

```typescript
// server/services/ai-service.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generateMeetingNote(transcription: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: MEETING_NOTE_PROMPT,
      },
      {
        role: 'user',
        content: transcription,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'meeting_note',
        schema: meetingNoteSchema,
        strict: true,
      },
    },
  });

  return JSON.parse(completion.choices[0].message.content!);
}
```

### 3.2 Function Calling

```typescript
// server/services/task-extraction.ts
export async function extractTasks(meetingNote: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: meetingNote,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'create_task',
          description: 'タスクを作成します',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string', format: 'date' },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
              },
            },
            required: ['title', 'description'],
          },
        },
      },
    ],
    tool_choice: 'required',
  });

  const toolCalls = completion.choices[0].message.tool_calls || [];
  return toolCalls.map((call) => JSON.parse(call.function.arguments));
}
```

---

## 🌐 必須参照リソース

1. [OpenAI Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering) - OpenAI公式
2. [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) - Structured Outputs
3. [Function Calling](https://platform.openai.com/docs/guides/function-calling) - Function Calling

---

**推定実装時間**: 2-3週間（プロンプトエンジニアリング完全実装）

