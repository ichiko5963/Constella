/**
 * OpenAI Structured Outputs スキーマ定義
 * P0-3: OpenAI Structured Outputs実装
 */

import { z } from 'zod';

// --- 議事録生成スキーマ ---

export const meetingNoteSchema = {
  type: 'object' as const,
  properties: {
    title: {
      type: 'string',
      description: '会議のタイトル',
    },
    summary: {
      type: 'string',
      description: '3-5文程度の要約',
    },
    agendaItems: {
      type: 'array',
      items: { type: 'string' },
      description: '議題一覧',
    },
    discussionDetails: {
      type: 'string',
      description: 'Markdown形式の詳細な議論内容',
    },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string' },
          details: { type: 'string' },
        },
        required: ['item'],
        additionalProperties: false,
      },
    },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          assignee: { type: 'string' },
          dueDate: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
        },
        required: ['title'],
        additionalProperties: false,
      },
    },
    nextMeeting: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        time: { type: 'string' },
        agenda: { type: 'string' },
      },
      additionalProperties: false,
    },
    additionalNotes: {
      type: 'string',
      description: '追加メモ・補足情報',
    },
  },
  required: ['title', 'summary', 'agendaItems', 'discussionDetails'],
  additionalProperties: false,
};

// Zod型定義
export const meetingNoteZodSchema = z.object({
  title: z.string(),
  summary: z.string(),
  agendaItems: z.array(z.string()),
  discussionDetails: z.string(),
  decisions: z.array(
    z.object({
      item: z.string(),
      details: z.string().optional(),
    })
  ),
  actionItems: z.array(
    z.object({
      title: z.string(),
      assignee: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
    })
  ),
  nextMeeting: z
    .object({
      date: z.string().optional(),
      time: z.string().optional(),
      agenda: z.string().optional(),
    })
    .optional(),
  additionalNotes: z.string().optional(),
});

export type MeetingNote = z.infer<typeof meetingNoteZodSchema>;

// --- タスク抽出スキーマ ---

export const taskExtractionSchema = {
  type: 'object' as const,
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
          dueDate: { type: 'string' },
          assignee: { type: 'string' },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
          },
        },
        required: ['title', 'priority', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['tasks'],
  additionalProperties: false,
};

export const taskExtractionZodSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low']),
      dueDate: z.string().optional(),
      assignee: z.string().optional(),
      confidence: z.number().min(0).max(100),
    })
  ),
});

export type TaskExtraction = z.infer<typeof taskExtractionZodSchema>;

// --- フォルダ分類スキーマ ---

export const folderClassificationSchema = {
  type: 'object' as const,
  properties: {
    suggestedPath: {
      type: 'array',
      items: { type: 'string' },
      description: '推奨されるフォルダパス（例: ["Aircle", "オンラインイベント企画", "2025-12-27 Vimmerさんイベント"]）',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'AIの信頼度スコア',
    },
    reasoning: {
      type: 'string',
      description: 'なぜこの階層構造を提案したかの理由',
    },
    alternativePaths: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'string' },
      },
      description: '代替案のフォルダパス',
    },
  },
  required: ['suggestedPath', 'confidence'],
  additionalProperties: false,
};

export const folderClassificationZodSchema = z.object({
  suggestedPath: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().optional(),
  alternativePaths: z.array(z.array(z.string())).optional(),
});

export type FolderClassification = z.infer<typeof folderClassificationZodSchema>;

// --- コンテンツ提案スキーマ ---

export const contentSuggestionsSchema = {
  type: 'object' as const,
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contentType: {
            type: 'string',
            enum: ['diagram', 'pdf_manual', 'note_article', 'x_post', 'youtube_script'],
          },
          title: { type: 'string' },
          reason: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
        },
        required: ['contentType', 'title', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['suggestions'],
  additionalProperties: false,
};

export const contentSuggestionsZodSchema = z.object({
  suggestions: z.array(
    z.object({
      contentType: z.enum(['diagram', 'pdf_manual', 'note_article', 'x_post', 'youtube_script']),
      title: z.string(),
      reason: z.string(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
    })
  ),
});

export type ContentSuggestions = z.infer<typeof contentSuggestionsZodSchema>;

// --- 関係性分類スキーマ ---

export const relationshipClassificationSchema = {
  type: 'object' as const,
  properties: {
    relationshipType: {
      type: 'string',
      enum: ['superior', 'boss', 'peer', 'subordinate'],
    },
    confidence: { type: 'number' },
    examples: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['relationshipType', 'confidence'],
  additionalProperties: false,
};

export const relationshipClassificationZodSchema = z.object({
  relationshipType: z.enum(['superior', 'boss', 'peer', 'subordinate']),
  confidence: z.number(),
  examples: z.array(z.string()).optional(),
});

export type RelationshipClassification = z.infer<typeof relationshipClassificationZodSchema>;

// --- コンテキスト質問スキーマ ---

export const contextQuestionsSchema = {
  type: 'object' as const,
  properties: {
    questions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

export const contextQuestionsZodSchema = z.object({
  questions: z.array(z.string()),
});

export type ContextQuestions = z.infer<typeof contextQuestionsZodSchema>;

