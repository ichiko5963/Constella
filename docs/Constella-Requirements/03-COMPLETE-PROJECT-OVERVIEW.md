# Constella - Complete Project Overview

## Product Vision

**Constella** is an AI-powered context management platform that helps users capture, organize, and connect their thoughts, meetings, and knowledge like stars forming constellations. The name combines "Constellation" (星座) representing connected ideas, and "Stella" (星) representing individual context units.

### Core Philosophy
- **Stella = Star = Context**: Each piece of context (meeting notes, voice recordings, documents) is a "star"
- **Constellation = Connected Stellas**: Stars connect to form meaningful constellations of knowledge
- **AI Curator**: An AI assistant that helps organize and connect your Stellas

### Tagline
> "Connect context, like stars."

---

## Current Features (Implemented)

### 1. Authentication & User Management
- Google OAuth sign-in via NextAuth.js
- User session management
- Personal/Team mode switching

### 2. Dashboard (Home)
- Daily greeting: "今日はどんな物語を聞かせてくれますか？"
- Quick recorder card with starry sky visualization
- Constellation status (recording count, Stella count)
- Recent recordings list
- Recent Stella (projects) list
- Calendar and Constellation quick links

### 3. Stella (Context/Project Management)
- Create, edit, delete Stellas
- Stella = Container for related context
- Each Stella has:
  - Name and description
  - Associated recordings
  - Tags/metadata
  - Creation/update timestamps

### 4. Recording System
- **Voice Recording**: Browser-based audio capture
- **Starry Sky Visualizer**: Audio-reactive visualization during recording
- **Audio Import**: Upload MP3, WAV, M4A, WebM, OGG files (max 50MB)
- **Transcription**: Automatic speech-to-text via OpenAI Whisper
- **Minutes Generation**: AI-generated meeting summaries
- **Recording Details**: View transcription, generated minutes, audio playback

### 5. AI Chat
- Conversational AI assistant
- Context-aware responses based on user's Stellas
- Real-time streaming responses

### 6. Constellation Graph
- Visual graph showing connections between Stellas
- Network visualization of context relationships
- Interactive node exploration

### 7. Content Generation
- AI-powered content creation
- Based on user's context and Stellas

### 8. Calendar Integration
- Google Calendar connection
- View upcoming events
- Schedule-based context organization

### 9. Tasks
- Task management linked to Stellas
- Recording-to-task workflow

### 10. Settings
- Account settings
- Billing management (Stripe integration)
- Notification preferences

---

## UI/UX Design System

### Color Palette
- **Primary**: Black (#0A0A0A)
- **Background**: White (#FFFFFF)
- **Text Primary**: Gray-900 (#171717)
- **Text Secondary**: Gray-500 (#737373)
- **Borders**: Gray-200 (#E5E5E5)
- **Accents**: Gray-100 (#F5F5F5)

### Typography
- **Font Family**: System fonts (Inter, sans-serif)
- **Headings**: Bold, tracking-tight
- **Body**: Regular weight, gray-500 for secondary text

### Components
- **Cards**: White background, subtle shadow, rounded-xl corners
- **Buttons**: Gray-900 primary, outline variants
- **Navigation**: Left sidebar with icon + label
- **Mode Switcher**: Top-right toggle (Personal/Team)

### Recording UI
- Dark background (#0A0A0A) with starry sky visualization
- White text and controls
- Centered timer display
- Round control buttons

---

## Planned Features (Roadmap)

### Phase 1: Enhanced Stella Import

#### 1.1 Markdown Import
- Single file import (.md)
- Bulk import from folder
- Parse frontmatter for metadata
- AI processing to Stella format

#### 1.2 Notion Integration
- OAuth connection to Notion
- Import pages and databases
- Sync changes periodically
- Map Notion structure to Stella hierarchy

#### 1.3 Google Docs Integration
- OAuth connection to Google
- Import documents
- Parse document structure
- AI summarization to Stella format

#### 1.4 Apple Notes / Phone Notes Import
- iCloud connection (if available)
- Manual export/import workflow
- OCR for handwritten notes

### Phase 2: Memory Management System

#### 2.1 Memory Chunking
- Break large contexts into manageable chunks
- AI-optimized chunk sizes
- Semantic segmentation

#### 2.2 Hierarchical Organization
- Stella parent-child relationships
- Folder-like structure
- AI-suggested hierarchy

#### 2.3 Stella Linking (Constellation Building)
- Manual link creation
- AI-suggested links based on content similarity
- Link strength/relevance scoring
- Visual constellation graph

#### 2.4 Smart Search
- Semantic search across all Stellas
- Vector embeddings for similarity
- Cross-Stella context retrieval

### Phase 3: AI Curator (Context Management AI)

#### 3.1 AI Avatar Chat
- Conversational interface for context management
- Customizable avatar appearance (cute, realistic, etc.)
- Voice chat capability (like ChatGPT mobile app)
- Life consultation / weekly review conversations

#### 3.2 Proactive Context Gathering
- AI asks clarifying questions during conversation
- "Who was this meeting with?"
- "What project is this related to?"
- Natural dialogue-based metadata collection

#### 3.3 Daily Context Organization
- Automated daily organization job
- AI reviews new content
- Suggests categorization
- Creates/updates Stella hierarchy
- Default: ON (opt-out available)
- Notification summary of changes

#### 3.4 Context Quality Scoring
- Completeness score for each Stella
- Suggestions for missing information
- Duplicate detection
- Merge recommendations

### Phase 4: Advanced Features

#### 4.1 Team Collaboration
- Shared Stellas
- Permission management
- Real-time collaboration
- Team constellation view

#### 4.2 Export & Sharing
- Export to Markdown/PDF
- Public sharing links
- Embed snippets
- API access

#### 4.3 Integrations
- Slack integration
- Zoom meeting auto-import
- Email parsing
- Browser extension for web clipping

#### 4.4 Analytics
- Usage statistics
- Knowledge growth tracking
- Connection insights
- Memory health dashboard

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State**: React hooks + Context

### Backend
- **API Routes**: Next.js API routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **File Storage**: AWS S3
- **Authentication**: NextAuth.js

### AI Services
- **Transcription**: OpenAI Whisper
- **Chat/Generation**: OpenAI GPT-4
- **Embeddings**: OpenAI Ada (for semantic search)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Neon Postgres
- **Storage**: AWS S3
- **Payments**: Stripe

---

## Database Schema (Core Tables)

### users
- id, name, email, image
- plan, stripeCustomerId
- createdAt, updatedAt

### projects (Stellas)
- id, name, description
- userId, parentId (for hierarchy)
- tags, metadata
- createdAt, updatedAt

### recordings
- id, audioUrl, transcription
- summary, status
- projectId, userId
- createdAt

### stella_links (Constellation Connections)
- id, fromStellaId, toStellaId
- strength, aiGenerated
- createdAt

### memory_chunks
- id, stellaId, content
- embedding, chunkIndex
- createdAt

### curator_sessions
- id, userId, messages
- extractedMetadata
- createdAt

---

## Navigation Structure

### Sidebar Navigation
1. **Home** - Dashboard overview
2. **Stella** - Context/project management
3. **Record** - Voice recording
4. **Calendar** - Schedule view
5. **Tasks** - Task management
6. **AI Chat** - Conversational AI
7. **Generate** - Content generation
8. **Constellation** - Graph visualization
9. **Curator** - AI context organization
10. **Tone** - Writing tone settings
11. **Settings** - Account settings

### Mode Switching
- Personal Mode: Individual context
- Team Mode: Shared team context

---

## User Flows

### Recording Flow
1. User clicks "Record" in sidebar
2. Starry sky visualization appears
3. User records voice
4. Recording stops → audio conversion
5. Upload to S3
6. Automatic transcription (Whisper)
7. AI generates meeting summary
8. User can edit/assign to Stella

### Stella Import Flow
1. User goes to Stella page
2. Clicks "Import" button
3. Chooses source (Markdown/Notion/Google)
4. Authenticates if needed
5. Selects content to import
6. AI processes and formats
7. User reviews and confirms
8. Stella created with imported content

### AI Curator Flow
1. User opens Curator
2. Avatar greets user
3. Natural conversation begins
4. AI asks about recent activities
5. User shares context through chat
6. AI extracts metadata
7. AI suggests organization
8. User approves changes
9. Stellas updated automatically

---

## Success Metrics

### User Engagement
- Daily active users
- Recordings per user
- Stellas created
- Curator conversations

### Content Quality
- Transcription accuracy
- Summary usefulness ratings
- Context completeness scores

### System Performance
- Page load times < 2s
- Recording upload success rate > 99%
- Transcription processing < 5min

---

## Development Priorities

### Immediate (Current Sprint)
1. UI/UX refinements (completed)
2. Sidebar navigation fixes (completed)
3. Recording functionality verification
4. Database connectivity checks

### Short-term (Next 2 Sprints)
1. Markdown import for Stella
2. Basic memory chunking
3. Stella linking (manual)
4. Daily organization notifications

### Medium-term (Next Quarter)
1. Notion integration
2. Google Docs integration
3. AI Curator chat interface
4. Advanced constellation graph

### Long-term (6+ Months)
1. Team collaboration features
2. Third-party integrations
3. Mobile app
4. API for developers

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── recordings/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── chat/
│   │   ├── content/
│   │   ├── graph/
│   │   ├── context/
│   │   ├── tone/
│   │   └── settings/
│   └── api/
├── components/
│   ├── navigation/
│   ├── recording/
│   ├── dashboard/
│   ├── opening/
│   └── ui/
├── lib/
├── server/
│   └── actions/
└── db/
    └── schema.ts
```

---

## Appendix: Terminology

| Term | Japanese | Description |
|------|----------|-------------|
| Constella | コンステラ | The product name (Constellation) |
| Stella | ステラ | Individual context unit (Star) |
| Constellation | 星座 | Connected Stellas forming a knowledge graph |
| Curator | キュレーター | AI assistant for context organization |
| Recording | 録音 | Voice recording feature |
| Transcription | 文字起こし | Speech-to-text conversion |

---

*Last Updated: 2026-01-08*
*Version: 1.0*
