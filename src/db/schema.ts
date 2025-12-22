import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Auth Tables (BetterAuth) ---

export const users = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
    image: text("image"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => users.id),
});

export const accounts = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => users.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
    refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }),
    updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// --- Application Tables ---

export const projects = sqliteTable("project", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    context: text("context"), // Accumulated context
    color: text("color").default('#007AFF'),
    isArchived: integer("isArchived", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const files = sqliteTable("file", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    projectId: integer("projectId").notNull().references(() => projects.id),
    name: text("name").notNull(),
    description: text("description"),
    fileType: text("fileType").default('meeting_notes'), // enum not natively supported in sqlite the same way, using text
    parentFileId: integer("parentFileId"), // for nesting if implemented via adjacency list
    aiGenerated: integer("aiGenerated", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const recordings = sqliteTable("recording", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    projectId: integer("projectId").references(() => projects.id),
    fileId: integer("fileId").references(() => files.id),
    audioUrl: text("audioUrl").notNull(),
    audioKey: text("audioKey").notNull(), // S3 Key
    duration: integer("duration"), // in seconds
    transcription: text("transcription"),
    structuredNotes: text("structuredNotes"), // JSON string
    status: text("status").default('uploading'), // uploading, transcribing, processing, completed, failed
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const transcriptSegments = sqliteTable("transcript_segment", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recordingId: integer("recordingId").notNull().references(() => recordings.id, { onDelete: 'cascade' }),
    noteId: integer("noteId").references(() => meetingNotes.id, { onDelete: 'set null' }),
    word: text("word").notNull(),
    start: integer("start").notNull(), // 開始時間（ミリ秒）
    end: integer("end").notNull(), // 終了時間（ミリ秒）
    speaker: text("speaker"), // 話者ラベル（将来実装）
    wordIndex: integer("wordIndex").notNull(), // 単語の順序
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export const meetingNotes = sqliteTable("meeting_note", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    fileId: integer("fileId").notNull().references(() => files.id),
    projectId: integer("projectId").notNull().references(() => projects.id),
    recordingId: integer("recordingId").references(() => recordings.id),
    title: text("title").notNull(),
    summary: text("summary"),
    keyPoints: text("keyPoints"), // JSON
    decisions: text("decisions"), // JSON
    actionItems: text("actionItems"), // JSON
    participants: text("participants"), // JSON
    rawTranscription: text("rawTranscription"),
    formattedMinutes: text("formattedMinutes"), // Markdown
    agendaItems: text("agendaItems"), // JSON
    discussionDetails: text("discussionDetails"),
    nextMeeting: text("nextMeeting"),
    additionalNotes: text("additionalNotes"),
    meetingDate: integer("meetingDate", { mode: "timestamp" }),
    duration: integer("duration"),
    shareToken: text("shareToken"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const highlights = sqliteTable("highlight", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: integer("noteId").notNull().references(() => meetingNotes.id, { onDelete: 'cascade' }),
    userId: text("userId").notNull().references(() => users.id),
    start: integer("start").notNull(),
    end: integer("end").notNull(),
    color: text("color").default('yellow'),
    note: text("note"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export const bookmarks = sqliteTable("bookmark", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recordingId: integer("recordingId").notNull().references(() => recordings.id, { onDelete: 'cascade' }),
    userId: text("userId").notNull().references(() => users.id),
    timestamp: integer("timestamp").notNull(),
    note: text("note"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export const tasks = sqliteTable("task", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    projectId: integer("projectId").references(() => projects.id),
    fileId: integer("fileId").references(() => files.id),
    meetingNoteId: integer("meetingNoteId").references(() => meetingNotes.id),
    recordingId: integer("recordingId").references(() => recordings.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default('pending'), // pending, approved, rejected, completed
    priority: text("priority").default('medium'), // low, medium, high
    dueDate: integer("dueDate", { mode: "timestamp" }),
    completedAt: integer("completedAt", { mode: "timestamp" }),
    aiGenerated: integer("aiGenerated", { mode: "boolean" }).default(false),
    aiConfidence: integer("aiConfidence"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const reminders = sqliteTable("reminder", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    taskId: integer("taskId").notNull().references(() => tasks.id),
    userId: text("userId").notNull().references(() => users.id),
    reminderType: text("reminderType").notNull(), // 3_days, 1_day, 12_hours
    scheduledAt: integer("scheduledAt", { mode: "timestamp" }).notNull(),
    isSent: integer("isSent", { mode: "boolean" }).default(false),
    sentAt: integer("sentAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export const taskCandidates = sqliteTable("task_candidate", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    recordingId: integer("recordingId").notNull().references(() => recordings.id),
    suggestedProjectId: integer("suggestedProjectId").references(() => projects.id),
    suggestedFileId: integer("suggestedFileId").references(() => files.id),
    title: text("title").notNull(),
    description: text("description"),
    suggestedDueDate: integer("suggestedDueDate", { mode: "timestamp" }),
    suggestedPriority: text("suggestedPriority").default('medium'),
    aiConfidence: integer("aiConfidence"),
    isApproved: integer("isApproved", { mode: "boolean" }), // null=pending
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export const chatConversations = sqliteTable("chat_conversation", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    title: text("title"),
    lastMessageAt: integer("lastMessageAt", { mode: "timestamp" }).notNull(),
    messageCount: integer("messageCount").default(0),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const chatMessages = sqliteTable("chat_message", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    conversationId: integer("conversationId").notNull().references(() => chatConversations.id),
    userId: text("userId").notNull().references(() => users.id),
    role: text("role").notNull(), // user, assistant
    content: text("content").notNull(), // text content
    sources: text("sources"), // JSON
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

export const subscriptions = sqliteTable("subscription", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id).unique(),
    stripeCustomerId: text("stripeCustomerId").unique(),
    stripeSubscriptionId: text("stripeSubscriptionId").unique(),
    stripePriceId: text("stripePriceId"),
    status: text("status").notNull(), // active, past_due, canceled, incomplete
    currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

// --- RAG / Vector Search ---

import { customType } from 'drizzle-orm/sqlite-core';

const float32Blob = customType<{ data: number[]; driverData: Buffer }>({
    dataType() {
        return "F32_BLOB(1536)"; // OpenAI embedding dimension
    },
    toDriver(value: number[]): Buffer {
        return Buffer.from(new Float32Array(value).buffer);
    },
    fromDriver(value: Buffer): number[] {
        return Array.from(new Float32Array(value.buffer));
    },
});

export const embeddings = sqliteTable("embedding", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    resourceId: integer("resourceId").notNull(), // ID of the note/chunk
    resourceType: text("resourceType").notNull(), // 'meeting_note'
    content: text("content").notNull(), // The actual text chunk
    embedding: float32Blob("embedding"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
});

// --- Relations ---

import { relations } from 'drizzle-orm';

export const projectsRelations = relations(projects, ({ one, many }) => ({
    user: one(users, {
        fields: [projects.userId],
        references: [users.id],
    }),
    recordings: many(recordings),
    files: many(files),
    meetingNotes: many(meetingNotes),
    tasks: many(tasks),
}));

export const recordingsRelations = relations(recordings, ({ one, many }) => ({
    project: one(projects, {
        fields: [recordings.projectId],
        references: [projects.id],
    }),
    file: one(files, {
        fields: [recordings.fileId],
        references: [files.id],
    }),
    meetingNotes: many(meetingNotes),
    taskCandidates: many(taskCandidates),
    transcriptSegments: many(transcriptSegments),
}));

export const transcriptSegmentsRelations = relations(transcriptSegments, ({ one }) => ({
    recording: one(recordings, {
        fields: [transcriptSegments.recordingId],
        references: [recordings.id],
    }),
    note: one(meetingNotes, {
        fields: [transcriptSegments.noteId],
        references: [meetingNotes.id],
    }),
}));

export const meetingNotesRelations = relations(meetingNotes, ({ one }) => ({
    project: one(projects, {
        fields: [meetingNotes.projectId],
        references: [projects.id],
    }),
    recording: one(recordings, {
        fields: [meetingNotes.recordingId],
        references: [recordings.id],
    }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
}));

// --- User Settings ---

export const userSettings = sqliteTable("user_setting", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id).unique(),
    backgroundTheme: text("backgroundTheme").default('default'), // default, white, gradient-cool, gradient-warm
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(users, {
        fields: [userSettings.userId],
        references: [users.id],
    }),
}));

// --- Calendar Integrations ---

export const calendarIntegrations = sqliteTable("calendar_integration", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    provider: text("provider").notNull(), // 'google', 'microsoft'
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    expiresAt: integer("expiresAt", { mode: "timestamp" }),
    enabled: integer("enabled", { mode: "boolean" }).default(true),
    lastSyncAt: integer("lastSyncAt", { mode: "timestamp" }),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const calendarEvents = sqliteTable("calendar_event", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    integrationId: integer("integrationId").references(() => calendarIntegrations.id, { onDelete: 'cascade' }), // null = 手動追加
    externalId: text("externalId"), // Google Calendar event ID (null = 手動追加)
    title: text("title").notNull(),
    description: text("description"),
    startTime: integer("startTime", { mode: "timestamp" }).notNull(),
    endTime: integer("endTime", { mode: "timestamp" }).notNull(),
    meetingLink: text("meetingLink"), // Zoom, Google Meet, Teams link
    location: text("location"),
    attendees: text("attendees"), // JSON array
    projectId: integer("projectId").references(() => projects.id), // 関連プロジェクト
    autoJoinEnabled: integer("autoJoinEnabled", { mode: "boolean" }).default(false), // 自動参加有効
    autoRecordEnabled: integer("autoRecordEnabled", { mode: "boolean" }).default(false), // 自動録音有効
    recordingId: integer("recordingId").references(() => recordings.id, { onDelete: 'set null' }), // 関連録音
    joinStatus: text("joinStatus").default('pending'), // pending, joining, joined, failed, completed
    joinedAt: integer("joinedAt", { mode: "timestamp" }), // 参加時刻
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const calendarIntegrationsRelations = relations(calendarIntegrations, ({ one, many }) => ({
    user: one(users, {
        fields: [calendarIntegrations.userId],
        references: [users.id],
    }),
    events: many(calendarEvents),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
    user: one(users, {
        fields: [calendarEvents.userId],
        references: [users.id],
    }),
    integration: one(calendarIntegrations, {
        fields: [calendarEvents.integrationId],
        references: [calendarIntegrations.id],
    }),
}));

// --- Custom AI Prompts ---

export const customPrompts = sqliteTable("custom_prompt", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    name: text("name").notNull(),
    prompt: text("prompt").notNull(),
    variables: text("variables"), // JSON object with variable definitions
    isDefault: integer("isDefault", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const customPromptsRelations = relations(customPrompts, ({ one }) => ({
    user: one(users, {
        fields: [customPrompts.userId],
        references: [users.id],
    }),
}));

// --- Snippets ---

export const snippets = sqliteTable("snippet", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    noteId: integer("noteId").references(() => meetingNotes.id, { onDelete: 'set null' }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    tags: text("tags"), // JSON array
    startTime: integer("startTime"), // For audio snippets
    endTime: integer("endTime"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const snippetsRelations = relations(snippets, ({ one }) => ({
    user: one(users, {
        fields: [snippets.userId],
        references: [users.id],
    }),
    note: one(meetingNotes, {
        fields: [snippets.noteId],
        references: [meetingNotes.id],
    }),
}));

// --- Comments ---

export const comments = sqliteTable("comment", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: integer("noteId").notNull().references(() => meetingNotes.id, { onDelete: 'cascade' }),
    userId: text("userId").notNull().references(() => users.id),
    content: text("content").notNull(),
    mentions: text("mentions"), // JSON array of user IDs
    highlightStart: integer("highlightStart"),
    highlightEnd: integer("highlightEnd"),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const commentsRelations = relations(comments, ({ one }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    note: one(meetingNotes, {
        fields: [comments.noteId],
        references: [meetingNotes.id],
    }),
}));

// --- Weekly Reports ---

export const weeklyReports = sqliteTable("weekly_report", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").notNull().references(() => users.id),
    weekStartDate: integer("weekStartDate", { mode: "timestamp" }).notNull(), // 週の開始日（月曜日）
    weekEndDate: integer("weekEndDate", { mode: "timestamp" }).notNull(), // 週の終了日（日曜日）
    totalMeetings: integer("totalMeetings").default(0),
    totalDuration: integer("totalDuration").default(0), // 合計時間（秒）
    totalTasks: integer("totalTasks").default(0),
    completedTasks: integer("completedTasks").default(0),
    summary: text("summary"), // AI生成の週間サマリー
    keyMetrics: text("keyMetrics"), // JSON object with metrics
    topProjects: text("topProjects"), // JSON array of project IDs
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const weeklyReportsRelations = relations(weeklyReports, ({ one }) => ({
    user: one(users, {
        fields: [weeklyReports.userId],
        references: [users.id],
    }),
}));

// --- Summary Templates ---

export const summaryTemplates = sqliteTable("summary_template", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId").references(() => users.id), // null = システムデフォルト
    name: text("name").notNull(),
    description: text("description"),
    prompt: text("prompt").notNull(), // LLMプロンプトテンプレート
    outputFormat: text("outputFormat").default('markdown'), // markdown, json, plain
    variables: text("variables"), // JSON array of variable names
    isDefault: integer("isDefault", { mode: "boolean" }).default(false),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$onUpdate(() => new Date()),
});

export const summaryTemplatesRelations = relations(summaryTemplates, ({ one }) => ({
    user: one(users, {
        fields: [summaryTemplates.userId],
        references: [users.id],
    }),
}));
