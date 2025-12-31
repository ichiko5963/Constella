/**
 * Structured Outputs を使用したAI生成
 * P0-3: OpenAI Structured Outputs実装
 */

'use server';

import OpenAI from 'openai';
import {
  meetingNoteSchema,
  taskExtractionSchema,
  folderClassificationSchema,
  contentSuggestionsSchema,
  relationshipClassificationSchema,
  contextQuestionsSchema,
  type MeetingNote,
  type TaskExtraction,
  type FolderClassification,
  type ContentSuggestions,
  type RelationshipClassification,
  type ContextQuestions,
} from '@/lib/structured-outputs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 議事録を生成（Structured Outputs使用）
 */
export async function generateMeetingNoteStructured(
  transcription: string,
  projectContext?: string
): Promise<MeetingNote> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたは実務・プロダクト利用を前提とした、プロフェッショナルな議事録生成AIです。
情報を一切省略せず、構造化によって読みやすくすることを心がけてください。
${projectContext ? `\nプロジェクトコンテキスト: ${projectContext}` : ''}`,
      },
      {
        role: 'user',
        content: `以下の文字起こしから議事録を生成してください:\n\n${transcription}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'meeting_note',
        schema: meetingNoteSchema,
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  return result as MeetingNote;
}

/**
 * タスクを抽出（Structured Outputs使用）
 */
export async function extractTasksStructured(
  transcription: string,
  projectContext?: string
): Promise<TaskExtraction> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたはタスク抽出AIです。会議の文字起こしからアクションアイテムを抽出してください。
${projectContext ? `\nプロジェクトコンテキスト: ${projectContext}` : ''}`,
      },
      {
        role: 'user',
        content: `以下の文字起こしからタスクを抽出してください:\n\n${transcription}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'task_extraction',
        schema: taskExtractionSchema,
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"tasks":[]}');
  return result as TaskExtraction;
}

/**
 * フォルダ分類を提案（Structured Outputs使用）
 */
export async function suggestFolderClassification(
  content: string,
  existingFolders: string,
  similarContent: string
): Promise<FolderClassification> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたはActoryのフォルダ構造管理AIです。
既存のフォルダ構造を参照し、新しいコンテンツを適切な階層に配置してください。
階層の深さは最大4段階までです。`,
      },
      {
        role: 'user',
        content: `既存フォルダ構造:\n${existingFolders}\n\n新しいコンテンツ:\n${content}\n\n類似コンテンツ:\n${similarContent}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'folder_classification',
        schema: folderClassificationSchema,
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"suggestedPath":[],"confidence":0}');
  return result as FolderClassification;
}

/**
 * コンテンツ生成提案（Structured Outputs使用）
 */
export async function suggestContentGeneration(noteContent: string): Promise<ContentSuggestions> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたはActoryのコンテンツ生成提案AIです。
議事録の内容を分析し、以下の形式でコンテンツ生成を提案してください:
- 図解: チーム共有用の図解
- PDFマニュアル: 手順書やマニュアル
- Note記事: 経験談や学び
- X投稿: 簡潔なシェア
- YouTube台本: 動画コンテンツ`,
      },
      {
        role: 'user',
        content: `議事録:\n${noteContent}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'content_suggestions',
        schema: contentSuggestionsSchema,
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"suggestions":[]}');
  return result as ContentSuggestions;
}

/**
 * 関係性分類（Structured Outputs使用）
 */
export async function classifyRelationship(messages: string): Promise<RelationshipClassification> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたは口調分析AIです。メッセージの口調から、相手との関係性を4段階で分類してください:
1. superior: 最上級の目上の人（非常に丁寧、敬語）
2. boss: 上司（丁寧だが親しみも）
3. peer: 仲間、友達（カジュアル）
4. subordinate: 部下（やや上から目線）`,
      },
      {
        role: 'user',
        content: `メッセージ履歴:\n${messages}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'relationship_classification',
        schema: relationshipClassificationSchema,
        strict: true,
      },
    },
  });

  const result = JSON.parse(
    completion.choices[0].message.content || '{"relationshipType":"peer","confidence":0}'
  );
  return result as RelationshipClassification;
}

/**
 * コンテキスト質問生成（Structured Outputs使用）
 */
export async function generateContextQuestions(recentData: string): Promise<ContextQuestions> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `あなたはActoryのコンテキスト管理AIです。
今日追加された議事録や録音データを分析し、ユーザーに質問をしてコンテキストを整理してください。
質問は3-5個程度に絞り、具体的で答えやすいものにしてください。`,
      },
      {
        role: 'user',
        content: `今日追加されたデータ:\n${recentData}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'context_questions',
        schema: contextQuestionsSchema,
        strict: true,
      },
    },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{"questions":[]}');
  return result as ContextQuestions;
}

