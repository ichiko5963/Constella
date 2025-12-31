# Actory完全実装タスクリスト v3.0

**作成日**: 2024年12月21日  
**ベース**: 最強要件定義書 v3.0.0  
**目的**: 全ての未実装機能を体系的に実装する

---

## 📊 実装状況サマリー

### 現在実装済み
- ✅ 基本認証（BetterAuth）
- ✅ プロジェクト管理
- ✅ 録音機能（基本）
- ✅ 議事録生成（基本）
- ✅ タスク管理
- ✅ カレンダー連携
- ✅ チャット機能
- ✅ 設定画面

### 未実装（要件定義書より）
- ❌ オンボーディング機能
- ❌ AI自動フォルダ管理
- ❌ Capacitorモバイルアプリ
- ❌ サーバーサイドFFmpeg処理
- ❌ Structured Outputs実装
- ❌ WebGL Graph View (Sigma.js)
- ❌ コンテキスト管理AI
- ❌ 外部サービス連携（Notion, Slack）
- ❌ コンテンツ生成機能
- ❌ 口調管理機能
- ❌ 組織共有機能
- ❌ Apple Watch録音
- ❌ Turso Vector Search最適化

---

## 🎯 実装優先順位

### Priority 0: 技術基盤の安定化（Week 1-2）

#### P0-1: Next.js/React バージョン確認と調整
**現状**: Next.js 16.1.0 + React 19.2.3  
**要件**: Next.js 14 + React 18推奨（安定性のため）

- [ ] 現在のNext.js 16.1.0 + React 19.2.3での動作確認
- [ ] Better Auth 1.4.7との互換性確認
- [ ] 問題がある場合はダウングレード検討
- [ ] エラーログの確認と修正

**推定時間**: 2-3日  
**リスク**: 高（既存機能への影響）  
**依存**: なし

#### P0-2: Turso Vector Search環境構築
**説明**: DiskANNインデックスを使用したベクトル検索の実装

- [ ] Turso接続の動作確認
- [ ] DiskANNインデックスの作成スクリプト実装
- [ ] ベクトル埋め込み生成の実装（OpenAI Embeddings）
- [ ] ハイブリッド検索（Vector + FTS5）の実装
- [ ] データベーススキーマ拡張
  - [ ] `knowledgeEmbeddings`テーブル作成
  - [ ] `knowledge_vector_index`仮想テーブル作成

**推定時間**: 3-4日  
**リスク**: 中  
**依存**: なし  
**参考**: 
- `docs/04_AI_ML_INNOVATION/VECTOR_DATABASE_MASTERY.md`
- `最強要件定義書.md` 5.4節

#### P0-3: OpenAI Structured Outputs実装
**説明**: 議事録生成とタスク抽出を型安全にする

- [ ] 議事録生成スキーマの定義
- [ ] タスク抽出スキーマの定義
- [ ] フォルダ分類スキーマの定義
- [ ] 既存の議事録生成を移行
- [ ] 既存のタスク抽出を移行

**推定時間**: 2-3日  
**リスク**: 低  
**依存**: なし  
**参考**: 
- `最強要件定義書.md` 5.5節
- `docs/04_AI_ML_INNOVATION/PROMPT_ENGINEERING_BIBLE.md`

---

### Priority 1: コア機能実装（Week 3-6）

#### P1-1: オンボーディング機能
**説明**: 初回ユーザーの事業・部門構造入力と自動フォルダ生成

**タスク**:
- [ ] データベーススキーマ拡張
  - [ ] `onboardingResponses`テーブル作成
  - [ ] `folderCorrections`テーブル作成
- [ ] オンボーディングページ作成 (`app/(dashboard)/onboarding/page.tsx`)
  - [ ] ステップ1: プラン選択（個人/チーム）
  - [ ] ステップ2: 事業数・事業名入力
  - [ ] ステップ3: 部門数・部門名入力
  - [ ] ステップ4: 主な用途選択
  - [ ] ステップ5: フォルダ構造プレビュー
- [ ] Server Actions実装
  - [ ] `server/actions/onboarding.ts`
  - [ ] `generateFolderStructure()`
  - [ ] `completeOnboarding()`
- [ ] 個人用/チーム用切り替え機能
  - [ ] ヘッダーに切り替えボタン追加
  - [ ] モード別データフィルタリング

**推定時間**: 5-7日  
**リスク**: 中  
**依存**: P0-3 (Structured Outputs)  
**参考**: `最強要件定義書.md` 4.2節

#### P1-2: AI自動フォルダ管理
**説明**: LLMによる自動フォルダ分類と階層構造生成

**タスク**:
- [ ] Server Actions実装
  - [ ] `server/actions/ai-folder-classification.ts`
  - [ ] `suggestFolderStructure()` - コンテンツから適切なフォルダを提案
  - [ ] `applyFolderCorrection()` - ユーザー修正を学習
- [ ] UI実装
  - [ ] 録音時のプロジェクト選択モーダル
  - [ ] フォルダツリービュー
  - [ ] AI提案ボタン
  - [ ] 階層構造編集UI
- [ ] 学習機能実装
  - [ ] 修正履歴の保存
  - [ ] 過去の修正をコンテキストに含める

**推定時間**: 7-10日  
**リスク**: 高  
**依存**: P0-2 (Vector Search), P0-3 (Structured Outputs), P1-1 (オンボーディング)  
**参考**: `最強要件定義書.md` 4.1節

#### P1-3: サーバーサイドFFmpeg音声処理
**説明**: 無音検知による音声分割とWhisper API連携

**タスク**:
- [ ] FFmpeg環境構築
  - [ ] Dockerfileの作成/更新（FFmpeg含む）
  - [ ] 本番環境へのFFmpegインストール
- [ ] 音声分割ワーカー実装
  - [ ] `server/workers/audio-splitter.ts`
  - [ ] 無音検知アルゴリズム（`silencedetect`）
  - [ ] 25MB以下のチャンク生成
- [ ] Whisper API統合
  - [ ] `server/actions/transcribe-split-audio.ts`
  - [ ] 分割音声の順次文字起こし
  - [ ] 文字起こし結果の統合（重複除去）
- [ ] 音声波形生成（Peaks.js用）
  - [ ] `server/workers/waveform-generator.ts`
  - [ ] 波形データの生成とS3保存
  - [ ] `audioWaveforms`テーブル作成
- [ ] 進捗表示UI
  - [ ] リアルタイム進捗バー
  - [ ] 処理状況の通知

**推定時間**: 10-14日  
**リスク**: 高  
**依存**: なし  
**参考**: 
- `最強要件定義書.md` 5.2節
- `docs/03_BACKEND_EXCELLENCE/ASYNC_PROGRAMMING_MASTERY.md`

---

### Priority 2: UI/UX実装（Week 7-10）

#### P2-1: WebGL Graph View (Sigma.js)
**説明**: ナレッジグラフの可視化

**タスク**:
- [ ] パッケージインストール
  - [ ] `npm install sigma graphology`
- [ ] データベーススキーマ拡張
  - [ ] `fileLinks`テーブル作成（既存確認）
- [ ] Graph View コンポーネント実装
  - [ ] `components/graph/sigma-graph-view.tsx`
  - [ ] ノード・エッジの描画
  - [ ] インタラクション（ズーム、パン、クリック）
- [ ] パフォーマンス最適化
  - [ ] 仮想化（viewport外は非表示）
  - [ ] WebGLレンダリング設定
  - [ ] 10,000ノード対応
- [ ] ページ実装
  - [ ] `app/(dashboard)/graph/page.tsx`

**推定時間**: 7-10日  
**リスク**: 高  
**依存**: P0-2 (Vector Search)  
**参考**: `最強要件定義書.md` 5.3節

#### P2-2: コンテキスト管理UI
**説明**: AIによる日次質問とコンテキスト整理

**タスク**:
- [ ] データベーススキーマ拡張
  - [ ] `contextManagementSessions`テーブル作成
- [ ] LLM-as-OS実装
  - [ ] `lib/ai/file-system-abstraction.ts`
  - [ ] 仮想ファイルシステムの実装
  - [ ] AI Agent向けツールの定義
- [ ] 毎日自動質問スケジューラー
  - [ ] `app/api/cron/daily-context-questions/route.ts`
  - [ ] Vercel Cron設定
  - [ ] 質問生成ロジック
  - [ ] ユーザーへの通知
- [ ] コンテキスト管理画面実装
  - [ ] `app/(dashboard)/context/page.tsx`
  - [ ] AI質問の表示と回答UI
  - [ ] 階層構造ビュー
  - [ ] ファイル関連性の調整UI

**推定時間**: 10-14日  
**リスク**: 高  
**依存**: P1-2 (AI自動フォルダ管理)  
**参考**: `最強要件定義書.md` 4.4節

---

### Priority 3: 拡張機能（Week 11-16）

#### P3-1: 外部サービス連携（Notion）
**説明**: Notionページのインポートと再構成

**タスク**:
- [ ] データベーススキーマ拡張
  - [ ] `externalIntegrations`テーブル作成
  - [ ] `importedContents`テーブル作成
- [ ] Notion OAuth認証
  - [ ] `lib/integrations/notion.ts`
  - [ ] OAuth設定
- [ ] ページインポート機能
  - [ ] Notion APIでページ取得
  - [ ] ブロックをMarkdownに変換
  - [ ] AI再構成ロジック
- [ ] UI実装
  - [ ] 設定画面に連携セクション追加
  - [ ] インポート進捗表示

**推定時間**: 7-10日  
**リスク**: 中  
**依存**: P1-2 (AI自動フォルダ管理)  
**参考**: `最強要件定義書.md` 4.5.1節

#### P3-2: 外部サービス連携（Slack）
**説明**: Slackメッセージのインポートと口調学習

**タスク**:
- [ ] Slack OAuth認証
  - [ ] Slack App作成
  - [ ] OAuth設定
- [ ] メッセージインポート機能
  - [ ] チャンネル一覧取得
  - [ ] メッセージ取得（スレッド含む）
  - [ ] AI分類と保存
- [ ] 口調情報抽出
  - [ ] `relationshipProfiles`テーブル作成
  - [ ] 口調パターンの学習

**推定時間**: 7-10日  
**リスク**: 中  
**依存**: P3-3 (口調管理機能)  
**参考**: `最強要件定義書.md` 4.5.2節

#### P3-3: 口調管理機能
**説明**: メッセージ履歴から口調を学習し、返信生成に適用

**タスク**:
- [ ] データベーススキーマ拡張
  - [ ] `relationshipProfiles`テーブル作成
- [ ] 口調分析AI実装
  - [ ] `lib/ai/tone-classification.ts`
  - [ ] 関係性の自動分類（superior, boss, peer, subordinate）
  - [ ] 口調パターンの抽出
- [ ] 返信生成実装
  - [ ] `lib/ai/tone-aware-reply.ts`
  - [ ] 口調を考慮した返信生成
- [ ] UI実装
  - [ ] 口調設定画面
  - [ ] 返信生成UI

**推定時間**: 7-10日  
**リスク**: 中  
**依存**: P0-3 (Structured Outputs)  
**参考**: `最強要件定義書.md` 4.7節

#### P3-4: コンテンツ生成機能
**説明**: 議事録からnote記事、X投稿、YouTube台本などを生成

**タスク**:
- [ ] データベーススキーマ拡張
  - [ ] `contentGenerations`テーブル作成
- [ ] 議事録直後提案機能
  - [ ] `server/actions/content-suggestion.ts`
  - [ ] 図解、PDFマニュアル、記事などの提案
  - [ ] モーダル表示
- [ ] 週次提案スケジューラー
  - [ ] `app/api/cron/weekly-content-suggestions/route.ts`
  - [ ] 過去1週間の分析
  - [ ] 重要トピックの抽出
- [ ] コンテンツ生成UI
  - [ ] テンプレート選択
  - [ ] 生成結果の編集
  - [ ] エクスポート機能
- [ ] ユーザー口調学習
  - [ ] 過去のコンテンツから学習
  - [ ] 口調を反映した生成

**推定時間**: 10-14日  
**リスク**: 中  
**依存**: P3-3 (口調管理機能)  
**参考**: `最強要件定義書.md` 4.6節

#### P3-5: 組織共有機能
**説明**: Googleアカウント単位での権限管理と自動アーカイブ

**タスク**:
- [ ] データベーススキーマ拡張
  - [ ] `folderPermissions`テーブル作成
  - [ ] `userRoles`テーブル作成
  - [ ] `files`テーブルに`mode`カラム追加
- [ ] 権限管理UI
  - [ ] フォルダごとの共有ボタン
  - [ ] メールアドレス入力
  - [ ] 権限レベル選択（read, write, admin）
- [ ] 権限チェックミドルウェア
  - [ ] `server/middleware/permission-check.ts`
- [ ] 自動アーカイブ機能
  - [ ] `server/cron/archive-old-files.ts`
  - [ ] 1年以上前のファイルを自動アーカイブ
  - [ ] Vercel Cron設定

**推定時間**: 7-10日  
**リスク**: 中  
**依存**: P1-1 (オンボーディング)  
**参考**: `最強要件定義書.md` 4.3節

---

### Priority 4: モバイル実装（Week 17-24）

#### P4-1: Capacitor環境構築
**説明**: iOSバックグラウンド録音のためのハイブリッドアプリ化

**タスク**:
- [ ] Capacitorインストール
  ```bash
  npm install @capacitor/core @capacitor/cli
  npm install @capacitor/ios @capacitor/android
  npm install @capacitor/audio-recorder
  npm install @capacitor/filesystem
  npm install @capacitor/background-runner
  ```
- [ ] Capacitor初期化
  - [ ] `npx cap init`
  - [ ] `capacitor.config.ts`設定
- [ ] iOSプラットフォーム追加
  - [ ] `npx cap add ios`
  - [ ] `Info.plist`設定（UIBackgroundModes）
- [ ] バックグラウンド録音実装
  - [ ] `lib/capacitor/audio-recorder.ts`
  - [ ] 録音開始/停止
  - [ ] サーバーへのアップロード
- [ ] iOS実機テスト
  - [ ] バックグラウンド録音の動作確認
  - [ ] 9時間連続録音テスト

**推定時間**: 14-21日  
**リスク**: 非常に高  
**依存**: なし  
**参考**: `最強要件定義書.md` 5.1節

#### P4-2: Apple Watch録音（オプション）
**説明**: Apple Watchからの連続録音

**タスク**:
- [ ] WatchConnectivityの実装
- [ ] watchOSアプリの開発
- [ ] iPhoneとの同期

**推定時間**: 21-30日  
**リスク**: 非常に高  
**依存**: P4-1 (Capacitor環境)  
**参考**: `最強要件定義書.md` 4.5節

---

### Priority 5: パフォーマンス最適化（Week 25-28）

#### P5-1: データベース最適化
**タスク**:
- [ ] インデックスの追加
  - [ ] `idx_files_project_parent`
  - [ ] `idx_meeting_notes_created`
  - [ ] `idx_tasks_due_date`
- [ ] FTS5インデックスの作成
- [ ] クエリパフォーマンスの測定と改善

**推定時間**: 3-5日  
**リスク**: 低  
**依存**: なし

#### P5-2: フロントエンド最適化
**タスク**:
- [ ] 画像最適化（next/image）
- [ ] バンドルサイズ削減
- [ ] コード分割
- [ ] レンダリング最適化

**推定時間**: 5-7日  
**リスク**: 低  
**依存**: なし

---

### Priority 6: テスト実装（Week 29-32）

#### P6-1: 単体テスト
**タスク**:
- [ ] Server Actionsのテスト
- [ ] ユーティリティ関数のテスト
- [ ] カバレッジ80%以上

**推定時間**: 7-10日  
**リスク**: 低  
**依存**: なし

#### P6-2: E2Eテスト
**タスク**:
- [ ] Playwrightセットアップ
- [ ] 主要フローのテスト
  - [ ] 録音 → 議事録生成 → タスク作成
  - [ ] オンボーディング
  - [ ] フォルダ管理

**推定時間**: 7-10日  
**リスク**: 低  
**依存**: 全ての機能実装完了

---

## 📋 実装順序提案

### フェーズ1: 基盤安定化（2週間）
1. P0-1: Next.js/React バージョン確認 → **最優先**
2. P0-2: Turso Vector Search → 並行実装可能
3. P0-3: Structured Outputs → 並行実装可能

### フェーズ2: コア機能（4週間）
4. P1-1: オンボーディング → P0-3に依存
5. P1-3: FFmpeg音声処理 → 並行実装可能
6. P1-2: AI自動フォルダ管理 → P1-1完了後

### フェーズ3: UI/UX（4週間）
7. P2-1: WebGL Graph View → P1-2完了後
8. P2-2: コンテキスト管理UI → P1-2完了後

### フェーズ4: 拡張機能（6週間）
9. P3-1: Notion連携
10. P3-3: 口調管理
11. P3-2: Slack連携
12. P3-4: コンテンツ生成
13. P3-5: 組織共有

### フェーズ5: モバイル（8週間）
14. P4-1: Capacitor環境
15. P4-2: Apple Watch（オプション）

### フェーズ6: 最適化とテスト（4週間）
16. P5-1: データベース最適化
17. P5-2: フロントエンド最適化
18. P6-1: 単体テスト
19. P6-2: E2Eテスト

---

## 🚨 リスク管理

### 高リスクタスク
1. **P0-1: Next.js/React バージョン確認** - 既存機能への影響大
2. **P1-2: AI自動フォルダ管理** - LLMの精度に依存
3. **P1-3: FFmpeg音声処理** - サーバー環境に依存
4. **P2-1: WebGL Graph View** - パフォーマンス要件厳しい
5. **P4-1: Capacitor環境** - iOS制約が多い

### リスク軽減策
- 各タスク開始前に技術検証（PoC）を実施
- 問題発生時は即座にバックアップ案に切り替え
- 定期的なコードレビューとテスト

---

## 📝 注意事項

1. **依存関係を守る**: 依存タスクが完了していない場合は実装しない
2. **エラーを即座に修正**: linterエラーは実装完了前に必ず修正
3. **Git commitを細かく**: 各タスクごとにcommit
4. **ドキュメント参照**: `docs/00-09`の技術ドキュメントを必ず参照
5. **公式ドキュメント優先**: エラー発生時は公式ドキュメントを確認

---

## 🎯 目標

- **総実装期間**: 32週間（約8ヶ月）
- **コードカバレッジ**: 80%以上
- **パフォーマンス**: 全ての操作が要件定義書の目標時間内
- **品質**: プロダクションレディな状態

---

**最終更新**: 2024年12月21日

