# Actory 機能仕様書 - 完全版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**参照**: [最強要件定義書](../最強要件定義書.md)

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [コア機能仕様](#2-コア機能仕様)
3. [AI機能仕様](#3-ai機能仕様)
4. [統合機能仕様](#4-統合機能仕様)
5. [モバイル機能仕様](#5-モバイル機能仕様)
6. [実装詳細](#6-実装詳細)

---

## 1. エグゼクティブサマリー

### 1.1 機能概要

Actoryは、音声録音から議事録生成、タスク管理、ナレッジ蓄積までを統合したAIファーストプロダクティビティプラットフォームです。

### 1.2 主要機能カテゴリ

1. **録音・文字起こし機能**
2. **議事録生成機能**
3. **タスク管理機能**
4. **ナレッジ管理機能**
5. **AIチャット機能**
6. **外部サービス連携機能**
7. **コンテンツ生成機能**
8. **モバイルアプリ機能**

---

## 2. コア機能仕様

### 2.1 録音・文字起こし機能

#### 2.1.1 Web録音機能

**要件**:
- MediaRecorder APIを使用したブラウザ録音
- リアルタイム波形表示
- 録音の一時停止・再開
- 録音データのS3への自動アップロード

**実装仕様**:
```typescript
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}

interface RecordingService {
  startRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  uploadRecording(blob: Blob, projectId: number): Promise<string>;
}
```

#### 2.1.2 モバイル録音機能

**要件**:
- Capacitorを使用したネイティブ録音
- バックグラウンド録音（9:00-20:00自動録音）
- 画面ロック時も継続録音
- 録音データの自動アップロード

**実装仕様**:
```typescript
interface MobileRecordingService {
  startBackgroundRecording(): Promise<void>;
  stopBackgroundRecording(): Promise<void>;
  getRecordingStatus(): Promise<RecordingStatus>;
  uploadRecordings(): Promise<void>;
}
```

#### 2.1.3 文字起こし機能

**要件**:
- OpenAI Whisper APIを使用した高精度文字起こし
- 25MB制限対応（FFmpeg分割）
- 無音検知によるスマート分割
- 話者分離（Speaker Diarization）

**実装仕様**:
```typescript
interface TranscriptionService {
  transcribe(audioFileId: string): Promise<TranscriptionResult>;
  splitAudioBySilence(audioBuffer: Buffer): Promise<AudioChunk[]>;
  identifySpeakers(transcription: string): Promise<SpeakerSegment[]>;
}
```

### 2.2 議事録生成機能

#### 2.2.1 自動議事録生成

**要件**:
- GPT-4を使用した構造化議事録生成
- Structured Outputsによる型安全な出力
- 議題、議論内容、決定事項、アクションアイテムの抽出

**実装仕様**:
```typescript
interface MeetingNote {
  title: string;
  summary: string;
  agendaItems: string[];
  discussionDetails: string;
  decisions: Decision[];
  actionItems: ActionItem[];
  formattedMinutes: string;
}

interface MeetingNoteService {
  generate(transcriptionId: number): Promise<MeetingNote>;
  formatAsMarkdown(note: MeetingNote): string;
}
```

### 2.3 タスク管理機能

#### 2.3.1 タスク抽出機能

**要件**:
- 議事録から自動タスク抽出
- Function Callingによる構造化抽出
- 優先度・期限の自動推定
- タスク候補として保存

**実装仕様**:
```typescript
interface TaskCandidate {
  title: string;
  description: string;
  suggestedDueDate: Date | null;
  suggestedPriority: 'high' | 'medium' | 'low';
  sourceRecordingId: number;
}

interface TaskExtractionService {
  extractTasks(meetingNoteId: number): Promise<TaskCandidate[]>;
  approveTask(candidateId: number): Promise<Task>;
  rejectTask(candidateId: number): Promise<void>;
}
```

---

## 3. AI機能仕様

### 3.1 AIチャット機能

#### 3.1.1 RAG統合チャット

**要件**:
- 過去の議事録・ナレッジから関連情報を検索
- ハイブリッド検索（ベクトル + 全文検索）
- コンテキストを構築してLLMに送信
- 会話履歴の保存

**実装仕様**:
```typescript
interface ChatService {
  sendMessage(message: string, userId: number): Promise<ChatResponse>;
  searchRelevantKnowledge(query: string): Promise<Knowledge[]>;
  buildContext(relevantDocs: Knowledge[]): string;
}
```

### 3.2 コンテキスト管理機能

#### 3.2.1 AI質問機能

**要件**:
- 毎日自動でAIが質問
- 新規追加された議事録・ファイルに対して質問
- ユーザーの回答を学習
- RAGに蓄積

**実装仕様**:
```typescript
interface ContextManagementService {
  generateDailyQuestions(userId: number): Promise<Question[]>;
  askAboutNewContent(contentId: number): Promise<Question[]>;
  learnFromUserResponse(questionId: number, answer: string): Promise<void>;
}
```

---

## 4. 統合機能仕様

### 4.1 外部サービス連携

#### 4.1.1 Notion連携

**要件**:
- Notion APIを使用したページインポート
- AIによる再構成
- フォルダ構造の維持

**実装仕様**:
```typescript
interface NotionIntegrationService {
  importPages(notionToken: string): Promise<ImportedPage[]>;
  reconfigureWithAI(pages: ImportedPage[]): Promise<ReorganizedContent>;
  syncChanges(): Promise<void>;
}
```

#### 4.1.2 Slack連携

**要件**:
- Slackメッセージのインポート
- 関係性プロファイルの学習（口調管理）
- メッセージ返信生成

**実装仕様**:
```typescript
interface SlackIntegrationService {
  importMessages(channelId: string): Promise<Message[]>;
  learnRelationshipProfile(userId: string, messages: Message[]): Promise<void>;
  generateReply(messageId: string, draft: string): Promise<string>;
}
```

---

## 5. モバイル機能仕様

### 5.1 自動録音機能

**要件**:
- 毎日9:00-20:00自動録音
- バックグラウンド実行
- バッテリー最適化

**実装仕様**:
```typescript
interface AutoRecordingService {
  scheduleDailyRecording(): Promise<void>;
  startRecordingAt9AM(): Promise<void>;
  stopRecordingAt8PM(): Promise<void>;
  optimizeBatteryUsage(): Promise<void>;
}
```

### 5.2 Apple Watch連携

**要件**:
- Apple Watchでの録音開始・停止
- iPhoneとの同期
- バッテリー管理

**実装仕様**:
```typescript
interface AppleWatchService {
  startRecordingFromWatch(): Promise<void>;
  stopRecordingFromWatch(): Promise<void>;
  syncWithiPhone(): Promise<void>;
}
```

---

## 6. 実装詳細

### 6.1 データベーススキーマ

詳細は [最強要件定義書](../最強要件定義書.md) を参照。

### 6.2 API仕様

詳細は各APIドキュメントを参照。

---

## 🌐 必須参照リソース

1. [最強要件定義書](../最強要件定義書.md)
2. [requirements.md](../requirements.md)
3. [ENTERPRISE_SYSTEM_DESIGN.md](../00_MASTER_ARCHITECTURE/ENTERPRISE_SYSTEM_DESIGN.md)
4. [RAG_IMPLEMENTATION_GUIDE.md](../04_AI_ML_INNOVATION/RAG_IMPLEMENTATION_GUIDE.md)

---

**推定実装時間**: 12-16週間（全機能実装）

