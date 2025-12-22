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
