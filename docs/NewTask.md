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
- ✅ オンボーディング機能（5-step wizard）
- ✅ AI自動フォルダ管理（LLM分類 + 学習機能）
- ✅ Structured Outputs実装（議事録、タスク、フォルダ分類スキーマ）
- ✅ Turso Vector Search（ベクトル埋め込み + ハイブリッド検索）
- ✅ WebGL Graph View (Sigma.js + 10,000ノード対応)
- ✅ コンテキスト管理UI（AIによる日次質問）
- ✅ 外部サービス連携（Notion OAuth + ページインポート）
- ✅ 外部サービス連携（Slack OAuth + メッセージインポート）
- ✅ コンテンツ生成機能（note/X/YouTube/PDFマニュアル）
- ✅ 口調管理機能（関係性分類 + 口調学習）
- ✅ 組織共有機能（権限管理 + 自動アーカイブ）
- ✅ サーバーサイドFFmpeg処理（音声分割 + 波形生成）

### 未実装（要件定義書より）
- ❌ Capacitorモバイルアプリ（P4-1）
- ❌ Apple Watch録音（P4-2）
- ❌ 単体テスト / E2Eテスト（P6）
- ❌ パフォーマンス最適化（P5）

---

## 🎯 実装優先順位

### Priority 0: 技術基盤の安定化（Week 1-2）

#### P0-1: Next.js/React バージョン確認と調整 ✅ 完了
**現状**: Next.js 16.1.0 + React 19.2.3
**要件**: Next.js 14 + React 18推奨（安定性のため）

- [x] 現在のNext.js 16.1.0 + React 19.2.3での動作確認
- [x] Better Auth 1.4.7との互換性確認
- [x] 問題がある場合はダウングレード検討
- [x] エラーログの確認と修正

**推定時間**: 2-3日
**リスク**: 高（既存機能への影響）
**依存**: なし

#### P0-2: Turso Vector Search環境構築 ✅ 完了
**説明**: DiskANNインデックスを使用したベクトル検索の実装

- [x] Turso接続の動作確認
- [x] DiskANNインデックスの作成スクリプト実装
- [x] ベクトル埋め込み生成の実装（OpenAI Embeddings）
- [x] ハイブリッド検索（Vector + FTS5）の実装
- [x] データベーススキーマ拡張
  - [x] `embeddings`テーブル作成
  - [x] ベクトル検索関数実装

**推定時間**: 3-4日
**リスク**: 中
**依存**: なし
**参考**:
- `docs/04_AI_ML_INNOVATION/VECTOR_DATABASE_MASTERY.md`
- `最強要件定義書.md` 5.4節

#### P0-3: OpenAI Structured Outputs実装 ✅ 完了
**説明**: 議事録生成とタスク抽出を型安全にする

- [x] 議事録生成スキーマの定義
- [x] タスク抽出スキーマの定義
- [x] フォルダ分類スキーマの定義
- [x] 既存の議事録生成を移行
- [x] 既存のタスク抽出を移行

**推定時間**: 2-3日
**リスク**: 低
**依存**: なし
**参考**:
- `最強要件定義書.md` 5.5節
- `docs/04_AI_ML_INNOVATION/PROMPT_ENGINEERING_BIBLE.md`

---

### Priority 1: コア機能実装（Week 3-6）

#### P1-1: オンボーディング機能 ✅ 完了
**説明**: 初回ユーザーの事業・部門構造入力と自動フォルダ生成

**タスク**:
- [x] データベーススキーマ拡張
  - [x] `onboardingResponses`テーブル作成
  - [x] `folderCorrections`テーブル作成
- [x] オンボーディングページ作成 (`app/(dashboard)/onboarding/page.tsx`)
  - [x] ステップ1: プラン選択（個人/チーム）
  - [x] ステップ2: 事業数・事業名入力
  - [x] ステップ3: 部門数・部門名入力
  - [x] ステップ4: 主な用途選択
  - [x] ステップ5: フォルダ構造プレビュー
- [x] Server Actions実装
  - [x] `server/actions/onboarding.ts`
  - [x] `generateFolderStructure()`
  - [x] `completeOnboarding()`
- [x] 個人用/チーム用切り替え機能
  - [x] ヘッダーに切り替えボタン追加
  - [x] モード別データフィルタリング

**推定時間**: 5-7日
**リスク**: 中
**依存**: P0-3 (Structured Outputs)
**参考**: `最強要件定義書.md` 4.2節

#### P1-2: AI自動フォルダ管理 ✅ 完了
**説明**: LLMによる自動フォルダ分類と階層構造生成

**タスク**:
- [x] Server Actions実装
  - [x] `server/actions/ai-folder-classification.ts`
  - [x] `suggestFolderStructure()` - コンテンツから適切なフォルダを提案
  - [x] `applyFolderCorrection()` - ユーザー修正を学習
- [x] UI実装
  - [x] 録音時のプロジェクト選択モーダル
  - [x] フォルダツリービュー
  - [x] AI提案ボタン
  - [x] 階層構造編集UI
- [x] 学習機能実装
  - [x] 修正履歴の保存
  - [x] 過去の修正をコンテキストに含める

**推定時間**: 7-10日
**リスク**: 高
**依存**: P0-2 (Vector Search), P0-3 (Structured Outputs), P1-1 (オンボーディング)
**参考**: `最強要件定義書.md` 4.1節

#### P1-3: サーバーサイドFFmpeg音声処理 ✅ 完了
**説明**: 無音検知による音声分割とWhisper API連携

**タスク**:
- [x] FFmpeg環境構築
  - [x] Dockerfileの作成/更新（FFmpeg含む）
  - [x] 本番環境へのFFmpegインストール
- [x] 音声分割ワーカー実装
  - [x] `server/workers/audio-splitter.ts`
  - [x] 無音検知アルゴリズム（`silencedetect`）
  - [x] 25MB以下のチャンク生成
- [x] Whisper API統合
  - [x] `server/actions/transcribe-split-audio.ts`
  - [x] 分割音声の順次文字起こし
  - [x] 文字起こし結果の統合（重複除去）
- [x] 音声波形生成（Peaks.js用）
  - [x] `server/workers/waveform-generator.ts`
  - [x] 波形データの生成とS3保存
  - [x] `audioWaveforms`テーブル作成
- [x] 進捗表示UI
  - [x] リアルタイム進捗バー
  - [x] 処理状況の通知

**推定時間**: 10-14日
**リスク**: 高
**依存**: なし
**参考**:
- `最強要件定義書.md` 5.2節
- `docs/03_BACKEND_EXCELLENCE/ASYNC_PROGRAMMING_MASTERY.md`

---

### Priority 2: UI/UX実装（Week 7-10）

#### P2-1: WebGL Graph View (Sigma.js) ✅ 完了
**説明**: ナレッジグラフの可視化

**タスク**:
- [x] パッケージインストール
  - [x] `npm install sigma graphology`
- [x] データベーススキーマ拡張
  - [x] `fileLinks`テーブル作成
- [x] Graph View コンポーネント実装
  - [x] `components/graph/sigma-graph-view.tsx`
  - [x] ノード・エッジの描画
  - [x] インタラクション（ズーム、パン、クリック）
- [x] パフォーマンス最適化
  - [x] 仮想化（viewport外は非表示）
  - [x] WebGLレンダリング設定
  - [x] 10,000ノード対応
- [x] ページ実装
  - [x] `app/(dashboard)/graph/page.tsx`

**推定時間**: 7-10日
**リスク**: 高
**依存**: P0-2 (Vector Search)
**参考**: `最強要件定義書.md` 5.3節

#### P2-2: コンテキスト管理UI ✅ 完了
**説明**: AIによる日次質問とコンテキスト整理

**タスク**:
- [x] データベーススキーマ拡張
  - [x] `contextManagementSessions`テーブル作成
- [x] LLM-as-OS実装
  - [x] `lib/ai/file-system-abstraction.ts`
  - [x] 仮想ファイルシステムの実装
  - [x] AI Agent向けツールの定義
- [x] 毎日自動質問スケジューラー
  - [x] `app/api/cron/daily-context-questions/route.ts`
  - [x] Vercel Cron設定
  - [x] 質問生成ロジック
  - [x] ユーザーへの通知
- [x] コンテキスト管理画面実装
  - [x] `app/(dashboard)/context/page.tsx`
  - [x] AI質問の表示と回答UI
  - [x] 階層構造ビュー
  - [x] ファイル関連性の調整UI

**推定時間**: 10-14日
**リスク**: 高
**依存**: P1-2 (AI自動フォルダ管理)
**参考**: `最強要件定義書.md` 4.4節

---

### Priority 3: 拡張機能（Week 11-16）

#### P3-1: 外部サービス連携（Notion） ✅ 完了
**説明**: Notionページのインポートと再構成

**タスク**:
- [x] データベーススキーマ拡張
  - [x] `externalIntegrations`テーブル作成
  - [x] `importedContents`テーブル作成
- [x] Notion OAuth認証
  - [x] `lib/integrations/notion.ts`
  - [x] OAuth設定
- [x] ページインポート機能
  - [x] Notion APIでページ取得
  - [x] ブロックをMarkdownに変換
  - [x] AI再構成ロジック
- [x] UI実装
  - [x] 設定画面に連携セクション追加
  - [x] インポート進捗表示

**推定時間**: 7-10日
**リスク**: 中
**依存**: P1-2 (AI自動フォルダ管理)
**参考**: `最強要件定義書.md` 4.5.1節

#### P3-2: 外部サービス連携（Slack） ✅ 完了
**説明**: Slackメッセージのインポートと口調学習

**タスク**:
- [x] Slack OAuth認証
  - [x] Slack App作成
  - [x] OAuth設定
- [x] メッセージインポート機能
  - [x] チャンネル一覧取得
  - [x] メッセージ取得（スレッド含む）
  - [x] AI分類と保存
- [x] 口調情報抽出
  - [x] `relationshipProfiles`テーブル作成
  - [x] 口調パターンの学習

**推定時間**: 7-10日
**リスク**: 中
**依存**: P3-3 (口調管理機能)
**参考**: `最強要件定義書.md` 4.5.2節

#### P3-3: 口調管理機能 ✅ 完了
**説明**: メッセージ履歴から口調を学習し、返信生成に適用

**タスク**:
- [x] データベーススキーマ拡張
  - [x] `relationshipProfiles`テーブル作成
- [x] 口調分析AI実装
  - [x] `lib/ai/tone-classification.ts`
  - [x] 関係性の自動分類（superior, boss, peer, subordinate）
  - [x] 口調パターンの抽出
- [x] 返信生成実装
  - [x] `lib/ai/tone-aware-reply.ts`
  - [x] 口調を考慮した返信生成
- [x] UI実装
  - [x] 口調設定画面
  - [x] 返信生成UI

**推定時間**: 7-10日
**リスク**: 中
**依存**: P0-3 (Structured Outputs)
**参考**: `最強要件定義書.md` 4.7節

#### P3-4: コンテンツ生成機能 ✅ 完了
**説明**: 議事録からnote記事、X投稿、YouTube台本などを生成

**タスク**:
- [x] データベーススキーマ拡張
  - [x] `contentGenerations`テーブル作成
- [x] 議事録直後提案機能
  - [x] `server/actions/content-suggestion.ts`
  - [x] 図解、PDFマニュアル、記事などの提案
  - [x] モーダル表示
- [x] 週次提案スケジューラー
  - [x] `app/api/cron/weekly-content-suggestions/route.ts`
  - [x] 過去1週間の分析
  - [x] 重要トピックの抽出
- [x] コンテンツ生成UI
  - [x] テンプレート選択
  - [x] 生成結果の編集
  - [x] エクスポート機能
- [x] ユーザー口調学習
  - [x] 過去のコンテンツから学習
  - [x] 口調を反映した生成

**推定時間**: 10-14日
**リスク**: 中
**依存**: P3-3 (口調管理機能)
**参考**: `最強要件定義書.md` 4.6節

#### P3-5: 組織共有機能 ✅ 完了
**説明**: Googleアカウント単位での権限管理と自動アーカイブ

**タスク**:
- [x] データベーススキーマ拡張
  - [x] `folderPermissions`テーブル作成
  - [x] `userRoles`テーブル作成
  - [x] `files`テーブルに`isArchived`/`sharedToTeam`カラム追加
- [x] 権限管理UI
  - [x] フォルダごとの共有ボタン
  - [x] メールアドレス入力
  - [x] 権限レベル選択（read, write, admin）
- [x] 権限チェックミドルウェア
  - [x] `server/middleware/permission-check.ts`
- [x] 自動アーカイブ機能
  - [x] `server/cron/archive-old-files.ts`
  - [x] 1年以上前のファイルを自動アーカイブ
  - [x] Vercel Cron設定

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

**最終更新**: 2026年1月8日

