# Actory Development Progress

## 1. Environment & Infrastructure
- [x] Initialize Next.js 15+ Project with TypeScript & Tailwind CSS 4
- [x] Setup Turso Database & Drizzle ORM
- [x] Setup BetterAuth (Authentication)
- [x] Setup Stripe (Payments)
- [x] Configure S3 Compatible Storage

## 2. Database Schema
- [x] Define `User` schema (BetterAuth)
- [x] Define `Project` schema
- [x] Define `File` / `Folder` schema
- [x] Define `Recording` schema
- [x] Define `MeetingNote` schema
- [x] Define `Task` schema
- [x] Define `Reminder` schema
- [x] Define `Chat` schema (Conversations & Messages)

## 3. Backend Logic (Server Actions / API)
- [x] **Auth**: Login / Signup / Logout (Email + Google)
- [x] **Recording**: Upload Audio to Storage
- [x] **Recording**: Save Metadata to DB
- [x] **Audio Processing**: Split large files (>25MB)
- [x] **Transcription**: OpenAI Whisper API integration
- [x] **AI Processing**: Generate Summaries, Decisions, Tasks from Transcript
- [x] **Project**: Create / Update / Delete / List
- [x] **Task**: Create / Update / Delete / List / Approve
- [x] **Chat**: RAG (Search Notes) + Chat Response Generation

## 4. Frontend Implementation
- [x] **Auth UI**: Login / Signup Pages
- [x] **Dashboard UI**: Sidebar & Layout
- [x] **Project UI**: List & Create Modal
- [x] **Project Detail**: Recording List & Upload Button
- [x] **Recording Detail**: Audio Player & Transcript View
- [x] **Task UI**: Task Board / List & Task Detail
- [x] **Chat UI**: Chat Interface
- [ ] **Calendar**: Monthly View with Task indicators
- [ ] **Task List**: Daily/Weekly Task Management
- [ ] **Chat**: AI Assistant Interface

## 5. Integration & Polish
- [ ] Connect Recording UI to Upload API
- [ ] Connect Transcription Result to Note View
- [ ] Connect Extracted Tasks to Calendar/Task List
- [ ] Implement Stripe Checkout Flow
- [ ] Test End-to-End Workflow

## 6. Deployment
- [ ] Deploy to Production Environment (e.g. Vercel)
- [ ] Verify functionality in Production

## 7. Notta Feature Adoption (Cursor lines 954-1095)

### 7.1 音声認識・文字起こし
- [ ] リアルタイム文字起こし — Build WebRTC/WebSocket gateway that streams MediaStream chunks to OpenAI/Deepgram realtime endpoints and renders interim captions.
- [ ] 話者識別 — Integrate pyannote/AssemblyAI diarization and persist speaker segments for transcript colouring.
- [x] ブックマーク/ハイライト — Wire existing `bookmarks` / `highlights` tables to Recorder/Transcript UI with timeline markers.
- [x] 音声とテキストの同期（カラオケ効果） — 単語ごとのタイムスタンプ取得、仮想化トランスクリプトビューアー、requestAnimationFrameによる同期エンジン実装完了
- [ ] Notta Memo相当の録音アップ — Add mobile/PWA upload endpoint and hardware-friendly presigned URL flow.

### 7.2 AI要約・分析
- [ ] AI要約テンプレート — Template library + multi-format exports.
- [ ] カスタムAIプロンプト — Enterprise-only prompt overrides tied to projects.
- [ ] AIノート→マインドマップ — Parse headings into graph and export PNG/SVG.
- [ ] 週間レポート — Scheduled aggregation + dashboard cards/PDF.
- [x] AIチャット — RAG chat MVP live; extend with Jira/email action blueprints.

### 7.3 会議参加・スケジューリング
- [ ] カレンダー同期 — OAuth + webhooks for Google/Outlook, hydrate `calendarEvents`.
- [ ] 手動参加（会議URL貼付） — Modal to queue Bot worker joins on demand.
- [ ] 自動参加 — Scheduler that books Bot jobs via Zoom/Meet/Teams SDKs.
- [ ] ミーティングスケジューラー — Cal.com style booking page integrated with Google Calendar.

### 7.4 編集・共有・検索
- [ ] 編集と注釈 (@メンション) — Tiptap-based editor with comments stored in `comments`.
- [ ] 検索・スニペット — Smart search UI with snippet tagging + audio jump.
- [ ] フォルダー管理と共有 — Tree UI for `parentFileId` plus share links/Slack hooks.
- [x] エクスポート (TXT/PDF/SRT/DOCX) — Existing export actions; expand to mind map & weekly reports next.

### 7.5 インテグレーション / セキュリティ
- [ ] Slack/Notion/CRM連携 — OAuth + outbound automations post-meeting.
- [ ] クロスデバイス同期 — PWA + mobile clients syncing via Turso/Supabase.
- [ ] データセキュリティ（ISO/SOC2） — Audit logs, encryption at rest/in transit, policy docs.
