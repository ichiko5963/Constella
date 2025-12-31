-- P0-2, P1-1, P1-2, P2-1, P2-2, P3-x: 新機能用テーブル作成

-- files テーブルに新カラム追加（先に実行）
-- ALTER TABLE file ADD COLUMN mode TEXT DEFAULT 'personal';
-- ALTER TABLE file ADD COLUMN sharedToTeam INTEGER DEFAULT 0;
-- ALTER TABLE file ADD COLUMN isArchived INTEGER DEFAULT 0;

-- オンボーディング
CREATE TABLE IF NOT EXISTS onboarding_response (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  planType TEXT NOT NULL,
  businessCount INTEGER,
  businessNames TEXT,
  departmentCounts TEXT,
  departmentNames TEXT,
  mainPurpose TEXT,
  folderStructure TEXT,
  isCompleted INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- フォルダ修正履歴
CREATE TABLE IF NOT EXISTS folder_correction (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  projectId INTEGER NOT NULL REFERENCES project(id),
  originalPath TEXT NOT NULL,
  correctedPath TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

-- 音声波形データ
CREATE TABLE IF NOT EXISTS audio_waveform (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recordingId INTEGER NOT NULL,
  waveformData TEXT NOT NULL,
  peaksData TEXT,
  createdAt INTEGER NOT NULL
);

-- ファイルリンク（グラフビュー用）
CREATE TABLE IF NOT EXISTS file_link (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sourceFileId INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  targetFileId INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  linkType TEXT DEFAULT 'related',
  strength REAL DEFAULT 0.5,
  createdAt INTEGER NOT NULL
);

-- コンテキスト管理セッション
CREATE TABLE IF NOT EXISTS context_management_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  targetFileIds TEXT,
  questions TEXT,
  responses TEXT,
  status TEXT DEFAULT 'active',
  createdAt INTEGER NOT NULL,
  completedAt INTEGER
);

-- 外部サービス連携
CREATE TABLE IF NOT EXISTS external_integration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  serviceType TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  serviceAccountId TEXT,
  isActive INTEGER DEFAULT 1,
  lastSyncAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- インポートされたコンテンツ
CREATE TABLE IF NOT EXISTS imported_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  integrationId INTEGER REFERENCES external_integration(id) ON DELETE CASCADE,
  contentType TEXT NOT NULL,
  originalId TEXT,
  title TEXT,
  content TEXT NOT NULL,
  metadata TEXT,
  createdAt INTEGER NOT NULL
);

-- 関係性プロフィール（口調管理）
CREATE TABLE IF NOT EXISTS relationship_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  contactName TEXT,
  contactEmail TEXT,
  contactSlackId TEXT,
  relationshipType TEXT NOT NULL,
  tone TEXT,
  context TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- コンテンツ生成
CREATE TABLE IF NOT EXISTS content_generation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  meetingNoteId INTEGER REFERENCES meeting_note(id),
  contentType TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  status TEXT DEFAULT 'draft',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- フォルダ権限
CREATE TABLE IF NOT EXISTS folder_permission (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fileId INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES user(id),
  permission TEXT NOT NULL,
  grantedBy TEXT NOT NULL REFERENCES user(id),
  createdAt INTEGER NOT NULL
);

-- ユーザーロール
CREATE TABLE IF NOT EXISTS user_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  projectId INTEGER NOT NULL REFERENCES project(id),
  role TEXT DEFAULT 'participant',
  createdAt INTEGER NOT NULL
);

-- AI学習データ
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL REFERENCES user(id),
  dataType TEXT NOT NULL,
  inputData TEXT NOT NULL,
  outputData TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_folder_correction_user ON folder_correction(userId);
CREATE INDEX IF NOT EXISTS idx_file_link_source ON file_link(sourceFileId);
CREATE INDEX IF NOT EXISTS idx_file_link_target ON file_link(targetFileId);
CREATE INDEX IF NOT EXISTS idx_context_session_user ON context_management_session(userId);
CREATE INDEX IF NOT EXISTS idx_external_integration_user ON external_integration(userId);
CREATE INDEX IF NOT EXISTS idx_relationship_profile_user ON relationship_profile(userId);
CREATE INDEX IF NOT EXISTS idx_content_generation_user ON content_generation(userId);
CREATE INDEX IF NOT EXISTS idx_folder_permission_file ON folder_permission(fileId);
CREATE INDEX IF NOT EXISTS idx_user_role_user ON user_role(userId);
CREATE INDEX IF NOT EXISTS idx_user_role_project ON user_role(projectId);

