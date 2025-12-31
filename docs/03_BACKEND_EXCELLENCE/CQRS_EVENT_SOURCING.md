# CQRS & Event Sourcing 完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: CQRS + Event Sourcing パターン

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [CQRSアーキテクチャ詳解](#2-cqrsアーキテクチャ詳解)
3. [Event Sourcing実装](#3-event-sourcing実装)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [パフォーマンスチューニング](#5-パフォーマンスチューニング)

---

## 1. エグゼクティブサマリー

### 1.1 CQRSとは

CQRS (Command Query Responsibility Segregation) は、読み取り（Query）と書き込み（Command）の責務を分離するパターンです。

### 1.2 Event Sourcingとは

Event Sourcingは、状態の変更をイベントのストリームとして保存し、イベントを再生することで現在の状態を再構築するパターンです。

### 1.3 Actoryでの適用

- **Command側**: プロジェクト作成、議事録更新、タスク作成
- **Query側**: プロジェクト一覧、議事録表示、タスク一覧
- **Event Store**: すべての状態変更をイベントとして保存

---

## 2. CQRSアーキテクチャ詳解

### 2.1 アーキテクチャ図

```
┌─────────────────────────────────────────┐
│         Command Side                    │
│  ┌───────────────────────────────────┐  │
│  │  Command Handler                  │  │
│  │  - バリデーション                  │  │
│  │  - ビジネスロジック                │  │
│  │  - イベント発行                    │  │
│  └───────────────────────────────────┘  │
│              │                          │
│              ▼                          │
│  ┌───────────────────────────────────┐  │
│  │  Event Store                     │  │
│  │  - イベント保存                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Query Side                     │
│  ┌───────────────────────────────────┐  │
│  │  Read Model                      │  │
│  │  - 最適化されたクエリ             │  │
│  │  - プロジェクション                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.2 Command実装

```typescript
// server/commands/create-project-command.ts
export interface CreateProjectCommand {
  userId: number;
  name: string;
  description?: string;
}

export class CreateProjectCommandHandler {
  constructor(
    private eventStore: EventStore,
    private eventBus: EventBus
  ) {}

  async handle(command: CreateProjectCommand) {
    // バリデーション
    if (!command.name || command.name.length < 1) {
      throw new Error('Project name is required');
    }

    // 集約を作成
    const projectId = crypto.randomUUID();
    const project = new ProjectAggregate(projectId, command.userId);

    // コマンドを実行
    project.create(command.name, command.description);

    // イベントを保存
    for (const event of project.getUncommittedEvents()) {
      await this.eventStore.append(event);
      await this.eventBus.publish(event);
      project.markEventAsCommitted(event);
    }

    return projectId;
  }
}
```

### 2.3 Query実装

```typescript
// server/queries/get-project-query.ts
export class GetProjectQueryHandler {
  constructor(private db: Database) {}

  async handle(projectId: string): Promise<ProjectReadModel> {
    // 読み取り専用の最適化されたクエリ
    return await this.db.query.projectReadModels.findFirst({
      where: eq(projectReadModels.id, projectId),
      with: {
        files: true,
        tasks: true,
        meetingNotes: true,
      },
    });
  }
}

// server/queries/list-projects-query.ts
export class ListProjectsQueryHandler {
  constructor(private db: Database) {}

  async handle(userId: number): Promise<ProjectReadModel[]> {
    return await this.db.query.projectReadModels.findMany({
      where: eq(projectReadModels.userId, userId),
      orderBy: desc(projectReadModels.createdAt),
    });
  }
}
```

---

## 3. Event Sourcing実装

### 3.1 集約実装

```typescript
// server/domain/project-aggregate.ts
export class ProjectAggregate {
  private id: string;
  private userId: number;
  private name: string;
  private description?: string;
  private status: 'active' | 'archived' = 'active';
  private uncommittedEvents: DomainEvent[] = [];
  private version = 0;

  constructor(id: string, userId: number) {
    this.id = id;
    this.userId = userId;
  }

  create(name: string, description?: string) {
    if (this.name) {
      throw new Error('Project already created');
    }

    this.name = name;
    this.description = description;

    this.addEvent({
      id: crypto.randomUUID(),
      type: 'project.created',
      timestamp: new Date(),
      userId: this.userId,
      data: {
        projectId: this.id,
        name,
        description,
      },
    });
  }

  update(data: Partial<{ name: string; description: string }>) {
    if (data.name) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;

    this.addEvent({
      id: crypto.randomUUID(),
      type: 'project.updated',
      timestamp: new Date(),
      userId: this.userId,
      data: {
        projectId: this.id,
        ...data,
      },
    });
  }

  archive() {
    if (this.status === 'archived') {
      throw new Error('Project already archived');
    }

    this.status = 'archived';

    this.addEvent({
      id: crypto.randomUUID(),
      type: 'project.archived',
      timestamp: new Date(),
      userId: this.userId,
      data: {
        projectId: this.id,
      },
    });
  }

  // イベントから状態を復元
  static fromEvents(events: DomainEvent[]): ProjectAggregate {
    const aggregate = new ProjectAggregate('', 0);

    for (const event of events) {
      aggregate.applyEvent(event);
    }

    return aggregate;
  }

  private applyEvent(event: DomainEvent) {
    switch (event.type) {
      case 'project.created':
        this.id = event.data.projectId;
        this.userId = event.userId;
        this.name = event.data.name;
        this.description = event.data.description;
        break;
      case 'project.updated':
        if (event.data.name) this.name = event.data.name;
        if (event.data.description !== undefined) {
          this.description = event.data.description;
        }
        break;
      case 'project.archived':
        this.status = 'archived';
        break;
    }

    this.version++;
  }

  private addEvent(event: DomainEvent) {
    this.uncommittedEvents.push(event);
    this.applyEvent(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  markEventAsCommitted(event: DomainEvent) {
    this.uncommittedEvents = this.uncommittedEvents.filter(
      (e) => e.id !== event.id
    );
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }
}
```

### 3.2 プロジェクション実装

```typescript
// server/projections/project-projection.ts
export class ProjectProjection {
  constructor(private db: Database) {}

  async handle(event: DomainEvent) {
    switch (event.type) {
      case 'project.created':
        await this.handleProjectCreated(event);
        break;
      case 'project.updated':
        await this.handleProjectUpdated(event);
        break;
      case 'project.archived':
        await this.handleProjectArchived(event);
        break;
    }
  }

  private async handleProjectCreated(event: ProjectCreatedEvent) {
    await this.db.insert(projectReadModels).values({
      id: event.data.projectId,
      userId: event.userId,
      name: event.data.name,
      description: event.data.description,
      status: 'active',
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    });
  }

  private async handleProjectUpdated(event: ProjectUpdatedEvent) {
    await this.db
      .update(projectReadModels)
      .set({
        name: event.data.name || undefined,
        description: event.data.description !== undefined
          ? event.data.description
          : undefined,
        updatedAt: event.timestamp,
      })
      .where(eq(projectReadModels.id, event.data.projectId));
  }

  private async handleProjectArchived(event: ProjectArchivedEvent) {
    await this.db
      .update(projectReadModels)
      .set({
        status: 'archived',
        updatedAt: event.timestamp,
      })
      .where(eq(projectReadModels.id, event.data.projectId));
  }
}
```

---

## 4. 詳細なコード実装例

### 4.1 Command Handler統合

```typescript
// server/commands/command-handler.ts
export class CommandHandler {
  constructor(
    private createProjectHandler: CreateProjectCommandHandler,
    private updateProjectHandler: UpdateProjectCommandHandler,
    private archiveProjectHandler: ArchiveProjectCommandHandler
  ) {}

  async handle(command: Command): Promise<void> {
    switch (command.type) {
      case 'create_project':
        return this.createProjectHandler.handle(command);
      case 'update_project':
        return this.updateProjectHandler.handle(command);
      case 'archive_project':
        return this.archiveProjectHandler.handle(command);
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }
}
```

### 4.2 イベントリプレイ

```typescript
// server/events/event-replay.ts
export class EventReplayService {
  constructor(
    private eventStore: EventStore,
    private projections: Projection[]
  ) {}

  async replayEvents(aggregateId: string) {
    const events = await this.eventStore.getEvents(aggregateId);

    for (const event of events) {
      for (const projection of this.projections) {
        await projection.handle(event);
      }
    }
  }

  async replayAllEvents() {
    const allEvents = await this.eventStore.getAllEvents();

    for (const event of allEvents) {
      for (const projection of this.projections) {
        await projection.handle(event);
      }
    }
  }
}
```

---

## 5. パフォーマンスチューニング

### 5.1 スナップショット

```typescript
// server/snapshots/snapshot-service.ts
export class SnapshotService {
  async createSnapshot(aggregateId: string, aggregate: Aggregate) {
    await db.insert(snapshots).values({
      aggregateId,
      data: JSON.stringify(aggregate.toJSON()),
      version: aggregate.getVersion(),
      timestamp: new Date(),
    });
  }

  async getSnapshot(aggregateId: string): Promise<Snapshot | null> {
    const snapshot = await db.query.snapshots.findFirst({
      where: eq(snapshots.aggregateId, aggregateId),
      orderBy: desc(snapshots.version),
    });

    return snapshot;
  }

  async rebuildAggregate(aggregateId: string): Promise<Aggregate> {
    // スナップショットから開始
    const snapshot = await this.getSnapshot(aggregateId);
    let aggregate: Aggregate;
    let fromVersion = 0;

    if (snapshot) {
      aggregate = Aggregate.fromJSON(JSON.parse(snapshot.data));
      fromVersion = snapshot.version;
    } else {
      aggregate = new Aggregate(aggregateId);
    }

    // スナップショット以降のイベントを適用
    const events = await this.eventStore.getEventsAfter(
      aggregateId,
      fromVersion
    );

    for (const event of events) {
      aggregate.applyEvent(event);
    }

    return aggregate;
  }
}
```

---

## 🌐 必須参照リソース

1. [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html) - Martin Fowler
2. [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) - Martin Fowler
3. [Domain-Driven Design](https://www.domainlanguage.com/ddd/) - Eric Evans
4. [Event Store Documentation](https://eventstore.com/docs/) - EventStore

---

**推定実装時間**: 4-5週間（CQRS + Event Sourcing完全実装）

