# Actory Implementation Plan

This document outlines the technical implementation steps for Actory, based on the requirements defined in `requirements.md`.

## Tech Stack Overview
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Turso (LibSQL)
- **ORM**: Drizzle ORM
- **Auth**: BetterAuth
- **Payments**: Stripe
- **AI**: OpenAI (Whisper, GPT-4), Gemini
- **Storage**: S3 Compatible Storage (e.g., R2, AWS S3)

## Phase 1: Project Initialization & Infrastructure Setup
- [ ] **Initialize Next.js Project**
    - Setup Next.js with TypeScript and Tailwind CSS 4.
    - Configure `eslint` and `prettier`.
    - Setup absolute imports (alias `@/*`).
- [ ] **Database Setup (Turso + Drizzle)**
    - Create Turso database.
    - Install `drizzle-orm` and `drizzle-kit`.
    - Configure Drizzle connection to Turso.
    - Create `db/schema.ts` and ensure initial connection works.
- [ ] **Authentication Setup (BetterAuth)**
    - Install BetterAuth.
    - Configure Google Provider (and others if needed).
    - Define User schema extensions in BetterAuth if necessary (or sync with Drizzle).
    - Create Auth API routes (`/api/auth/[...all]`).
    - specific: Setup `users`, `sessions`, `accounts` tables via BetterAuth migrations.
- [ ] **Stripe Integration Setup**
    - Install `stripe` SDK.
    - Configure Stripe Webhooks endpoint.
    - Create basic checkout session creation utility.

## Phase 2: Database Schema Implementation
- [ ] **Define Schema in Drizzle**
    - `projects`: Projects table.
    - `files`: File/Folder structure.
    - `recordings`: Metadata for audio files.
    - `meeting_notes`: Transcriptions and summaries.
    - `tasks`: Action items.
    - `reminders`: Notification triggers.
    - `chat_conversations` & `chat_messages`: AI chat history.
- [ ] **Run Migrations**
    - Generate and push migrations to Turso.

## Phase 3: Core Features - Backend & Logic
- [ ] **Recording Upload API**
    - Implement S3 presigned URL generation or server-side upload handler (Next.js Server Actions).
    - Database entry creation for `recordings`.
- [ ] **Audio Processing Pipeline**
    - Implement file segmentation (FFmpeg) for large files (>25MB).
    - Integration with OpenAI Whisper API for transcription.
    - Webhook or background job to handle async transcription completion.
- [ ] **AI Summarization Logic**
    - GPT-4 / Gemini integration to process transcripts.
    - Structured output generation (Meeting Minutes, Tasks, Decisions).
- [ ] **Task & Project Management Actions**
    - Server Actions for Creating, Updating, Deleting Projects/Tasks.
    - Project auto-sorting logic (AI classifier).

## Phase 4: Frontend Implementation (App Router)
- [ ] **Layouts & Global UI**
    - Root Layout with Providers (Auth, Theme).
    - Dashboard Layout (Sidebar, Navigation).
    - Design System implementation (Colors, Typography, UI Components).
- [ ] **Recording Interface**
    - Visual Audio visualizer (Canvas/Web Audio API).
    - One-tap record button with animations.
    - Timer and Status indicators.
- [ ] **Dashboard & Project View**
    - Project cards grid.
    - Project detail view (File tree/List).
- [ ] **Meeting Note View**
    - Markdown renderer for notes.
    - Audio player synced with transcript (optional but nice).
    - Task extraction review UI.
- [ ] **Calendar & Task View**
    - Monthly calendar component.
    - Task list with filtering (Due date, Priority).
- [ ] **AI Chat Interface**
    - RAG implementation (retrieving relevant notes).
    - Chat UI with streaming responses.

## Phase 5: Refinement & Polish
- [ ] **Real-time Updates**
    - RevalidateTag / RevalidatePath strategies.
    - Optimistic UI updates for tasks.
- [ ] **Stripe Subscription Logic**
    - Gating features based on subscription status.
    - Customer portal integration.
- [ ] **Performance Optimization**
    - React Server Components (RSC) usage optimization.
    - Image optimization.
- [ ] **Testing & Verification**
    - E2E flows for Recording -> Note -> Task.

## Phase 6: Deployment
- [ ] Deploy to Vercel (or similar).
- [ ] Configure Environment Variables.
- [ ] Verify Production functionality.

## Verification Plan for Recording Upload & Processing

### Automated Verification
- None (requires S3/OpenAI mocks which are not set up).

### Manual Verification (Browser Tool)
1.  **Login**: Access `/login` and sign in (or sign up).
2.  **Create Project**: Create a new project "Test Project".
3.  **Upload**: Use "Upload Recording" button to upload a small sample audio file (need to locate one or create one).
4.  **Verify**:
    - Check if toast appears "Upload successful".
    - Check if "Processing" status is shown.
    - Wait for completion (this might fail if OpenAI keys are missing).
