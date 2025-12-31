/**
 * LLM-as-OS ファイルシステム抽象化
 * P2-2: コンテキスト管理UI（LLM-as-OS）
 */

import { db } from '@/db';
import { meetingNotes, files, recordings } from '@/db/schema';
import { eq, and, sql, like } from 'drizzle-orm';

export class VirtualFileSystem {
  constructor(private userId: string) {}

  /**
   * ファイルを読み込む
   */
  async readFile(path: string): Promise<string> {
    const parts = path.split('/').filter(Boolean);
    
    // /mnt/memories/YYYY/filename
    if (parts[0] === 'mnt' && parts[1] === 'memories') {
      const year = parts[2];
      const fileName = parts[3];
      
      // 議事録を取得
      const note = await db.query.meetingNotes.findFirst({
        where: and(
          eq(meetingNotes.userId, this.userId),
          sql`strftime('%Y', datetime(${meetingNotes.createdAt}, 'unixepoch')) = ${year}`,
          like(meetingNotes.title, `%${fileName}%`)
        ),
      });

      if (!note) {
        throw new Error(`File not found: ${path}`);
      }

      return note.formattedMinutes || note.summary || note.title;
    }

    // /mnt/recordings/YYYY/MM/filename
    if (parts[0] === 'mnt' && parts[1] === 'recordings') {
      const year = parts[2];
      const month = parts[3];
      const fileName = parts[4];

      const recording = await db.query.recordings.findFirst({
        where: and(
          eq(recordings.userId, this.userId),
          sql`strftime('%Y', datetime(${recordings.createdAt}, 'unixepoch')) = ${year}`,
          sql`strftime('%m', datetime(${recordings.createdAt}, 'unixepoch')) = ${month}`
        ),
      });

      if (!recording) {
        throw new Error(`File not found: ${path}`);
      }

      return recording.transcription || '';
    }

    throw new Error(`Invalid path: ${path}`);
  }

  /**
   * ディレクトリ内のファイル一覧を取得
   */
  async listDirectory(path: string): Promise<string[]> {
    const parts = path.split('/').filter(Boolean);

    // /mnt/memories
    if (parts[0] === 'mnt' && parts[1] === 'memories' && parts.length === 2) {
      // 年のリストを返す
      const years = await db
        .select({
          year: sql<string>`strftime('%Y', datetime(${meetingNotes.createdAt}, 'unixepoch'))`,
        })
        .from(meetingNotes)
        .where(eq(meetingNotes.userId, this.userId))
        .groupBy(sql`strftime('%Y', datetime(${meetingNotes.createdAt}, 'unixepoch'))`);

      return years.map(y => y.year);
    }

    // /mnt/memories/YYYY
    if (parts[0] === 'mnt' && parts[1] === 'memories' && parts.length === 3) {
      const year = parts[2];
      const notes = await db
        .select()
        .from(meetingNotes)
        .where(and(
          eq(meetingNotes.userId, this.userId),
          sql`strftime('%Y', datetime(${meetingNotes.createdAt}, 'unixepoch')) = ${year}`
        ));

      return notes.map(n => `${n.title}.md`);
    }

    return [];
  }

  /**
   * ファイルを検索
   */
  async grep(pattern: string, directory: string = '/mnt/memories'): Promise<Array<{ path: string; content: string }>> {
    const results: Array<{ path: string; content: string }> = [];

    const notes = await db
      .select()
      .from(meetingNotes)
      .where(and(
        eq(meetingNotes.userId, this.userId),
        sql`${meetingNotes.formattedMinutes} LIKE ${'%' + pattern + '%'}`
      ))
      .limit(10);

    for (const note of notes) {
      const year = new Date((note.createdAt as any) * 1000).getFullYear();
      results.push({
        path: `/mnt/memories/${year}/${note.title}.md`,
        content: note.formattedMinutes || note.summary || '',
      });
    }

    return results;
  }

  /**
   * ファイルの統計情報を取得
   */
  async stat(path: string): Promise<{ size: number; created: Date; modified: Date }> {
    const parts = path.split('/').filter(Boolean);

    if (parts[0] === 'mnt' && parts[1] === 'memories') {
      const year = parts[2];
      const fileName = parts[3];

      const note = await db.query.meetingNotes.findFirst({
        where: and(
          eq(meetingNotes.userId, this.userId),
          sql`strftime('%Y', datetime(${meetingNotes.createdAt}, 'unixepoch')) = ${year}`,
          like(meetingNotes.title, `%${fileName}%`)
        ),
      });

      if (!note) {
        throw new Error(`File not found: ${path}`);
      }

      const content = note.formattedMinutes || note.summary || '';
      return {
        size: content.length,
        created: new Date((note.createdAt as any) * 1000),
        modified: new Date((note.updatedAt as any) * 1000),
      };
    }

    throw new Error(`Invalid path: ${path}`);
  }
}

/**
 * AIエージェント向けのツール定義
 */
export function createVFSTools(userId: string) {
  const vfs = new VirtualFileSystem(userId);

  return [
    {
      type: 'function' as const,
      function: {
        name: 'read_file',
        description: '仮想ファイルシステムからファイルを読み込む',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'ファイルパス（例: /mnt/memories/2024/meeting_A.md）',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'list_directory',
        description: 'ディレクトリ内のファイル一覧を取得',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'ディレクトリパス（例: /mnt/memories/2024）',
            },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'grep_files',
        description: 'ファイル内を検索する',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: '検索パターン' },
            directory: { type: 'string', description: '検索ディレクトリ' },
          },
          required: ['pattern'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'stat_file',
        description: 'ファイルの統計情報を取得',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'ファイルパス' },
          },
          required: ['path'],
        },
      },
    },
  ];
}

/**
 * ツール呼び出しを実行
 */
export async function executeVFSTool(
  userId: string,
  toolName: string,
  args: any
): Promise<any> {
  const vfs = new VirtualFileSystem(userId);

  switch (toolName) {
    case 'read_file':
      return await vfs.readFile(args.path);
    case 'list_directory':
      return await vfs.listDirectory(args.path);
    case 'grep_files':
      return await vfs.grep(args.pattern, args.directory);
    case 'stat_file':
      return await vfs.stat(args.path);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

