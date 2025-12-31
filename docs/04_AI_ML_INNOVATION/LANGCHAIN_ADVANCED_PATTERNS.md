# LangChain 高度パターン完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: LangChain.js + OpenAI + Turso Vector Search

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [LangChainアーキテクチャ詳解](#2-langchainアーキテクチャ詳解)
3. [高度パターン実装](#3-高度パターン実装)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)

---

## 1. エグゼクティブサマリー

### 1.1 LangChainとは

LangChainは、LLMアプリケーションを構築するためのフレームワークです。Actoryでは、RAG、エージェント、チェーンなどの高度なパターンを実装します。

### 1.2 Actoryでの適用

- **RAGチェーン**: ナレッジベースからの情報検索と回答生成
- **エージェント**: 自律的なタスク実行
- **チェーン**: 複数のLLM呼び出しを組み合わせた処理
- **メモリ**: 会話履歴の管理

---

## 2. LangChainアーキテクチャ詳解

### 2.1 RAGチェーン実装

```typescript
// server/lib/langchain/rag-chain.ts
import { ChatOpenAI } from '@langchain/openai';
import { TursoVectorStore } from '@/server/lib/vector-store';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

export class RAGChain {
  private llm: ChatOpenAI;
  private vectorStore: TursoVectorStore;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
    });
    this.vectorStore = new TursoVectorStore();
  }

  async createChain() {
    const prompt = PromptTemplate.fromTemplate(`
以下のコンテキストを参考にして、ユーザーの質問に答えてください。

コンテキスト:
{context}

質問: {question}

回答:
`);

    const chain = RunnableSequence.from([
      {
        context: async (input: { question: string }) => {
          // ベクトル検索で関連情報を取得
          const docs = await this.vectorStore.similaritySearch(
            input.question,
            5
          );
          return docs.map((doc) => doc.pageContent).join('\n\n');
        },
        question: (input: { question: string }) => input.question,
      },
      prompt,
      this.llm,
      new StringOutputParser(),
    ]);

    return chain;
  }

  async invoke(question: string): Promise<string> {
    const chain = await this.createChain();
    return chain.invoke({ question });
  }
}
```

### 2.2 エージェント実装

```typescript
// server/lib/langchain/agent.ts
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createRetrieverTool } from 'langchain/tools/retriever';
import { TursoVectorStore } from '@/server/lib/vector-store';

export class ActoryAgent {
  private llm: ChatOpenAI;
  private vectorStore: TursoVectorStore;
  private agentExecutor: AgentExecutor;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
    });
    this.vectorStore = new TursoVectorStore();
  }

  async initialize() {
    // ツールを定義
    const retrieverTool = createRetrieverTool(this.vectorStore.asRetriever(), {
      name: 'search_knowledge_base',
      description: 'ナレッジベースから関連情報を検索します',
    });

    const tools = [retrieverTool];

    // プロンプトテンプレート
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'あなたはActoryのAIアシスタントです。'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    // エージェントを作成
    const agent = await createOpenAIFunctionsAgent({
      llm: this.llm,
      tools,
      prompt,
    });

    this.agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
    });
  }

  async invoke(input: string): Promise<string> {
    const result = await this.agentExecutor.invoke({ input });
    return result.output;
  }
}
```

---

## 3. 高度パターン実装

### 3.1 メモリ管理

```typescript
// server/lib/langchain/memory.ts
import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';

export class ConversationMemory {
  private memory: BufferMemory;

  constructor(conversationId: string) {
    this.memory = new BufferMemory({
      chatHistory: new ChatMessageHistory(),
      returnMessages: true,
      memoryKey: 'history',
    });
  }

  async saveMessage(role: 'human' | 'ai', content: string) {
    if (role === 'human') {
      await this.memory.chatHistory.addUserMessage(content);
    } else {
      await this.memory.chatHistory.addAIChatMessage(content);
    }
  }

  async getHistory() {
    return await this.memory.chatHistory.getMessages();
  }

  async clear() {
    await this.memory.clear();
  }
}
```

### 3.2 チェーン合成

```typescript
// server/lib/langchain/chain-composition.ts
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';

export class ChainComposition {
  async createMeetingNoteChain() {
    // 1. 文字起こしを要約
    const summarizeChain = RunnableSequence.from([
      (input: { transcription: string }) => input.transcription,
      this.summarizePrompt,
      this.llm,
      this.stringParser,
    ]);

    // 2. 要約から議事録を生成
    const generateChain = RunnableSequence.from([
      (input: { summary: string }) => input.summary,
      this.meetingNotePrompt,
      this.llm,
      this.jsonParser,
    ]);

    // チェーンを合成
    const composedChain = RunnableSequence.from([
      {
        transcription: new RunnablePassthrough(),
      },
      {
        summary: summarizeChain,
        transcription: (input: { transcription: string }) => input.transcription,
      },
      {
        meetingNote: generateChain,
        summary: (input: { summary: string }) => input.summary,
      },
    ]);

    return composedChain;
  }
}
```

---

## 4. 詳細なコード実装例

### 4.1 Actoryでの実装

```typescript
// server/services/ai-chat-service.ts
import { RAGChain } from '@/server/lib/langchain/rag-chain';
import { ConversationMemory } from '@/server/lib/langchain/memory';

export class AIChatService {
  private ragChain: RAGChain;
  private memories: Map<string, ConversationMemory> = new Map();

  constructor() {
    this.ragChain = new RAGChain();
  }

  async sendMessage(
    userId: number,
    conversationId: string,
    message: string
  ): Promise<string> {
    // メモリを取得または作成
    let memory = this.memories.get(conversationId);
    if (!memory) {
      memory = new ConversationMemory(conversationId);
      this.memories.set(conversationId, memory);
    }

    // 会話履歴を取得
    const history = await memory.getHistory();

    // RAGチェーンで回答を生成
    const response = await this.ragChain.invoke(message);

    // メモリに保存
    await memory.saveMessage('human', message);
    await memory.saveMessage('ai', response);

    return response;
  }
}
```

---

## 🌐 必須参照リソース

1. [LangChain.js Documentation](https://js.langchain.com/docs/) - LangChain公式
2. [LangChain RAG](https://js.langchain.com/docs/use_cases/question_answering/) - RAG実装
3. [LangChain Agents](https://js.langchain.com/docs/modules/agents/) - エージェント
4. [LangChain Memory](https://js.langchain.com/docs/modules/memory/) - メモリ管理

---

**推定実装時間**: 3-4週間（LangChain完全実装）

