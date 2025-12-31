/**
 * データベーススキーマ拡張
 * 新機能用のテーブル定義
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { users, projects, files, meetingNotes } from './schema';

// --- P1-1: オンボーディング機能 ---

export const onboardingResponses = sqliteTable('onboarding_response', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  planType: text('planType').notNull(), // 'one' | 'company'
  businessCount: integer('businessCount'),
  businessNames: text('businessNames'), // JSON array
  departmentCounts: text('departmentCounts'), // JSON object {businessIndex: count}
  departmentNames: text('departmentNames'), // JSON object {businessIndex: [names]}
  mainPurpose: text('mainPurpose'), // JSON array
  folderStructure: text('folderStructure'), // JSON object
  isCompleted: integer('isCompleted', { mode: 'boolean' }).default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$onUpdate(() => new Date()),
});

// --- P1-2: AI自動フォルダ管理 ---

export const folderCorrections = sqliteTable('folder_correction', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  projectId: integer('projectId').notNull().references(() => projects.id),
  originalPath: text('originalPath').notNull(), // JSON array
  correctedPath: text('correctedPath').notNull(), // JSON array
  content: text('content').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// --- P1-3: サーバーサイドFFmpeg音声処理 ---

export const audioWaveforms = sqliteTable('audio_waveform', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recordingId: integer('recordingId').notNull(),
  waveformData: text('waveformData').notNull(), // JSON array
  peaksData: text('peaksData'), // Peaks.js用のDATファイル（Base64）
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// --- P2-1: WebGL Graph View ---

export const fileLinks = sqliteTable('file_link', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceFileId: integer('sourceFileId').notNull().references(() => files.id, { onDelete: 'cascade' }),
  targetFileId: integer('targetFileId').notNull().references(() => files.id, { onDelete: 'cascade' }),
  linkType: text('linkType').default('related'), // related, reference, derived
  strength: real('strength').default(0.5), // 関連度 0-1
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// --- P2-2: コンテキスト管理AI ---

export const contextManagementSessions = sqliteTable('context_management_session', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  targetFileIds: text('targetFileIds'), // JSON array
  questions: text('questions'), // JSON array
  responses: text('responses'), // JSON object {questionIndex: response}
  status: text('status').default('active'), // active, completed, skipped
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
});

// --- P3-1, P3-2: 外部サービス連携 ---

export const externalIntegrations = sqliteTable('external_integration', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  serviceType: text('serviceType').notNull(), // notion, slack
  accessToken: text('accessToken'), // 暗号化して保存
  refreshToken: text('refreshToken'),
  serviceAccountId: text('serviceAccountId'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true),
  lastSyncAt: integer('lastSyncAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$onUpdate(() => new Date()),
});

export const importedContents = sqliteTable('imported_content', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  integrationId: integer('integrationId').references(() => externalIntegrations.id, { onDelete: 'cascade' }),
  contentType: text('contentType').notNull(), // notion_page, slack_message
  originalId: text('originalId'), // 外部サービスのID
  title: text('title'),
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// --- P3-3: 口調管理機能 ---

export const relationshipProfiles = sqliteTable('relationship_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  contactName: text('contactName'),
  contactEmail: text('contactEmail'),
  contactSlackId: text('contactSlackId'),
  relationshipType: text('relationshipType').notNull(), // superior, boss, peer, subordinate
  tone: text('tone'), // JSON object {patterns: [], examples: []}
  context: text('context'), // JSON object
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$onUpdate(() => new Date()),
});

// --- P3-4: コンテンツ生成機能 ---

export const contentGenerations = sqliteTable('content_generation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  meetingNoteId: integer('meetingNoteId').references(() => meetingNotes.id),
  contentType: text('contentType').notNull(), // diagram, pdf_manual, note_article, x_post, youtube_script
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON
  status: text('status').default('draft'), // draft, published
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().$onUpdate(() => new Date()),
});

// --- P3-5: 組織共有機能 ---

export const folderPermissions = sqliteTable('folder_permission', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: integer('fileId').notNull().references(() => files.id, { onDelete: 'cascade' }),
  userId: text('userId').notNull().references(() => users.id),
  permission: text('permission').notNull(), // read, write, admin
  grantedBy: text('grantedBy').notNull().references(() => users.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

export const userRoles = sqliteTable('user_role', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  projectId: integer('projectId').notNull().references(() => projects.id),
  role: text('role').default('participant'), // owner, admin, member, participant
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// --- AI学習データ ---

export const aiLearningData = sqliteTable('ai_learning_data', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id),
  dataType: text('dataType').notNull(), // folder_correction, tone_learning, content_preference
  inputData: text('inputData').notNull(), // JSON
  outputData: text('outputData').notNull(), // JSON
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().$default(() => new Date()),
});

// --- Relations ---

export const onboardingResponsesRelations = relations(onboardingResponses, ({ one }) => ({
  user: one(users, {
    fields: [onboardingResponses.userId],
    references: [users.id],
  }),
}));

export const folderCorrectionsRelations = relations(folderCorrections, ({ one }) => ({
  user: one(users, {
    fields: [folderCorrections.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [folderCorrections.projectId],
    references: [projects.id],
  }),
}));

export const fileLinksRelations = relations(fileLinks, ({ one }) => ({
  sourceFile: one(files, {
    fields: [fileLinks.sourceFileId],
    references: [files.id],
  }),
  targetFile: one(files, {
    fields: [fileLinks.targetFileId],
    references: [files.id],
  }),
}));

export const contextManagementSessionsRelations = relations(contextManagementSessions, ({ one }) => ({
  user: one(users, {
    fields: [contextManagementSessions.userId],
    references: [users.id],
  }),
}));

export const externalIntegrationsRelations = relations(externalIntegrations, ({ one, many }) => ({
  user: one(users, {
    fields: [externalIntegrations.userId],
    references: [users.id],
  }),
  importedContents: many(importedContents),
}));

export const importedContentsRelations = relations(importedContents, ({ one }) => ({
  user: one(users, {
    fields: [importedContents.userId],
    references: [users.id],
  }),
  integration: one(externalIntegrations, {
    fields: [importedContents.integrationId],
    references: [externalIntegrations.id],
  }),
}));

export const relationshipProfilesRelations = relations(relationshipProfiles, ({ one }) => ({
  user: one(users, {
    fields: [relationshipProfiles.userId],
    references: [users.id],
  }),
}));

export const contentGenerationsRelations = relations(contentGenerations, ({ one }) => ({
  user: one(users, {
    fields: [contentGenerations.userId],
    references: [users.id],
  }),
  meetingNote: one(meetingNotes, {
    fields: [contentGenerations.meetingNoteId],
    references: [meetingNotes.id],
  }),
}));

export const folderPermissionsRelations = relations(folderPermissions, ({ one }) => ({
  file: one(files, {
    fields: [folderPermissions.fileId],
    references: [files.id],
  }),
  user: one(users, {
    fields: [folderPermissions.userId],
    references: [users.id],
  }),
  grantedByUser: one(users, {
    fields: [folderPermissions.grantedBy],
    references: [users.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [userRoles.projectId],
    references: [projects.id],
  }),
}));

