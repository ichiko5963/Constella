-- P5-1: データベース最適化
-- インデックス追加とクエリパフォーマンス改善

-- 既存テーブルのインデックス追加

-- users テーブル
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);

-- recordings テーブル
CREATE INDEX IF NOT EXISTS idx_recording_user_created ON recording(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_recording_project ON recording(projectId);
CREATE INDEX IF NOT EXISTS idx_recording_status ON recording(status);

-- meeting_notes テーブル
CREATE INDEX IF NOT EXISTS idx_meeting_note_user_created ON meeting_note(userId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_note_project ON meeting_note(projectId);
CREATE INDEX IF NOT EXISTS idx_meeting_note_recording ON meeting_note(recordingId);
CREATE INDEX IF NOT EXISTS idx_meeting_note_share_token ON meeting_note(shareToken);

-- tasks テーブル
CREATE INDEX IF NOT EXISTS idx_task_user_status ON task(userId, status);
CREATE INDEX IF NOT EXISTS idx_task_project ON task(projectId);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON task(dueDate);
CREATE INDEX IF NOT EXISTS idx_task_completed ON task(completedAt);

-- files テーブル
CREATE INDEX IF NOT EXISTS idx_file_user_project ON file(userId, projectId);
CREATE INDEX IF NOT EXISTS idx_file_parent ON file(parentFileId);
CREATE INDEX IF NOT EXISTS idx_file_type ON file(fileType);
CREATE INDEX IF NOT EXISTS idx_file_archived ON file(isArchived);

-- projects テーブル
CREATE INDEX IF NOT EXISTS idx_project_user_archived ON project(userId, isArchived);

-- embeddings テーブル
CREATE INDEX IF NOT EXISTS idx_embedding_resource ON embedding(resourceType, resourceId);

-- chat_messages テーブル
CREATE INDEX IF NOT EXISTS idx_chat_message_conversation ON chat_message(conversationId, createdAt DESC);

-- calendar_events テーブル
CREATE INDEX IF NOT EXISTS idx_calendar_event_user_time ON calendar_event(userId, startTime);
CREATE INDEX IF NOT EXISTS idx_calendar_event_project ON calendar_event(projectId);

-- bookmarks テーブル
CREATE INDEX IF NOT EXISTS idx_bookmark_recording ON bookmark(recordingId);
CREATE INDEX IF NOT EXISTS idx_bookmark_user ON bookmark(userId);

-- highlights テーブル
CREATE INDEX IF NOT EXISTS idx_highlight_note ON highlight(noteId);
CREATE INDEX IF NOT EXISTS idx_highlight_user ON highlight(userId);

-- 複合インデックス（頻繁に使用されるクエリ用）
CREATE INDEX IF NOT EXISTS idx_recording_user_project_created ON recording(userId, projectId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_note_user_project_created ON meeting_note(userId, projectId, createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_task_user_project_status ON task(userId, projectId, status);

-- FTS5 全文検索インデックス（議事録用）
CREATE VIRTUAL TABLE IF NOT EXISTS meeting_notes_fts USING fts5(
  title,
  summary,
  formattedMinutes,
  content=meeting_note,
  content_rowid=id
);

-- FTS5トリガー（自動更新）
CREATE TRIGGER IF NOT EXISTS meeting_notes_fts_insert AFTER INSERT ON meeting_note BEGIN
  INSERT INTO meeting_notes_fts(rowid, title, summary, formattedMinutes)
  VALUES (new.id, new.title, new.summary, new.formattedMinutes);
END;

CREATE TRIGGER IF NOT EXISTS meeting_notes_fts_delete AFTER DELETE ON meeting_note BEGIN
  DELETE FROM meeting_notes_fts WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS meeting_notes_fts_update AFTER UPDATE ON meeting_note BEGIN
  DELETE FROM meeting_notes_fts WHERE rowid = old.id;
  INSERT INTO meeting_notes_fts(rowid, title, summary, formattedMinutes)
  VALUES (new.id, new.title, new.summary, new.formattedMinutes);
END;

-- ANALYZE統計情報を更新
ANALYZE;

