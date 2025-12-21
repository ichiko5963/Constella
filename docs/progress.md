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
- [x] **Auth**: Login / Signup / Logout
- [x] **Recording**: Upload Audio to Storage
- [x] **Recording**: Save Metadata to DB
- [x] **Audio Processing**: Split large files (>25MB)
- [x] **Transcription**: OpenAI Whisper API integration
- [x] **AI Processing**: Generate Summaries, Decisions, Tasks from Transcript
- [x] **Project**: Create / Update / Delete / List
- [ ] **Task**: Create / Update / Delete / List / Approve
- [ ] **Chat**: RAG (Search Notes) + Chat Response Generation

## 4. Frontend Implementation
- [x] **Auth UI**: Login / Signup Pages
- [x] **Dashboard UI**: Sidebar & Layout
- [x] **Project UI**: List & Create Modal
- [x] **Project Detail**: Recording List & Upload Button
- [x] **Recording Detail**: Audio Player & Transcript View
- [ ] **Task UI**: Task Board / List & Task Detail
- [ ] **Chat UI**: Chat Interface
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
