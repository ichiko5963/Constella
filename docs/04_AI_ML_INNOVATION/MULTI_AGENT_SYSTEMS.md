# マルチエージェントシステム完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: LangChain Multi-Agent + OpenAI Function Calling

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [マルチエージェントアーキテクチャ](#2-マルチエージェントアーキテクチャ)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 マルチエージェントシステムとは

複数のAIエージェントが協調してタスクを実行するシステムです。Actoryでは、議事録生成、タスク抽出、コンテンツ生成などを専門エージェントが担当します。

### 1.2 Actoryでのエージェント構成

- **議事録エージェント**: 文字起こしから議事録を生成
- **タスク抽出エージェント**: 議事録からタスクを抽出
- **コンテンツ生成エージェント**: ナレッジからコンテンツを生成
- **検索エージェント**: ナレッジベースから情報を検索

---

## 2. マルチエージェントアーキテクチャ

### 2.1 エージェント定義

```typescript
// server/agents/meeting-note-agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export class MeetingNoteAgent {
  private llm: ChatOpenAI;
  private executor: AgentExecutor;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
    });
  }

  async initialize() {
    const tools = [
      // ツール定義
    ];

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'あなたは議事録生成の専門家です。'],
      ['human', '{input}'],
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools,
      prompt,
    });

    this.executor = new AgentExecutor({
      agent,
      tools,
    });
  }

  async generate(transcription: string): Promise<MeetingNote> {
    const result = await this.executor.invoke({
      input: `以下の文字起こしから議事録を生成してください:\n\n${transcription}`,
    });

    return JSON.parse(result.output);
  }
}
```

### 2.2 エージェントオーケストレーター

```typescript
// server/agents/orchestrator.ts
export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();

  constructor() {
    this.agents.set('meeting_note', new MeetingNoteAgent());
    this.agents.set('task_extraction', new TaskExtractionAgent());
    this.agents.set('content_generation', new ContentGenerationAgent());
  }

  async execute(workflow: Workflow) {
    const results: Record<string, any> = {};

    for (const step of workflow.steps) {
      const agent = this.agents.get(step.agent);
      if (!agent) {
        throw new Error(`Agent ${step.agent} not found`);
      }

      const input = this.buildInput(step, results);
      const output = await agent.execute(input);
      results[step.id] = output;
    }

    return results;
  }

  private buildInput(step: WorkflowStep, results: Record<string, any>): any {
    // 前のステップの結果を入力として構築
    return step.input.map((ref) => results[ref]).join('\n\n');
  }
}
```

---

## 🌐 必須参照リソース

1. [LangChain Multi-Agent](https://js.langchain.com/docs/modules/agents/multi_agent/) - LangChain公式
2. [Agent Patterns](https://www.patterns.dev/posts/ai-agents) - エージェントパターン
3. [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling) - Function Calling

---

**推定実装時間**: 3-4週間（マルチエージェントシステム完全実装）

