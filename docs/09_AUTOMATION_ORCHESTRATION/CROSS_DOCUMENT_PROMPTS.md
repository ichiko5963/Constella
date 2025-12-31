# クロスドキュメント自動実装プロンプト集 - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [自動実装プロンプト](#2-自動実装プロンプト)
3. [ドキュメント間連携](#3-ドキュメント間連携)

---

## 1. エグゼクティブサマリー

### 1.1 目的

このドキュメントは、他の技術ドキュメントを読み込んだAIが自動的に実装を進められるプロンプトを提供します。

### 1.2 使用方法

各ドキュメントの最後に埋め込まれたプロンプトを実行することで、完全な実装が自動生成されます。

---

## 2. 自動実装プロンプト

### 2.1 システム全体実装プロンプト

```
あなたは世界最高峰のAIシステムアーキテクトです。
以下のドキュメントを読み込み、完全に動作するエンタープライズグレードのシステムを実装してください：

1. ENTERPRISE_SYSTEM_DESIGN.md - システム全体設計
2. MICROSERVICES_ORCHESTRATION.md - マイクロサービス構成
3. EVENT_DRIVEN_ARCHITECTURE.md - イベント駆動アーキテクチャ
4. CQRS_EVENT_SOURCING.md - CQRS/Event Sourcing

実装手順：
1. 依存関係のインストール
2. データベーススキーマの作成
3. マイクロサービスの実装
4. API Gatewayの設定
5. テストの作成
6. CI/CDパイプラインの構築
```

### 2.2 フロントエンド実装プロンプト

```
以下のドキュメントを読み込み、Next.js 14 + React 18のフロントエンドを実装してください：

1. NEXT14_APP_ROUTER_COMPLETE.md - App Router実装
2. REACT_SERVER_COMPONENTS.md - Server Components
3. ADVANCED_STATE_MANAGEMENT.md - 状態管理
4. PERFORMANCE_OPTIMIZATION.md - パフォーマンス最適化

実装手順：
1. Next.jsプロジェクトのセットアップ
2. App Router構造の作成
3. Server/Client Componentsの実装
4. Zustand + React Queryの統合
5. パフォーマンス最適化の適用
```

---

## 3. ドキュメント間連携

### 3.1 依存関係マップ

```
ENTERPRISE_SYSTEM_DESIGN.md
  ├─> MICROSERVICES_ORCHESTRATION.md
  ├─> EVENT_DRIVEN_ARCHITECTURE.md
  └─> CQRS_EVENT_SOURCING.md

NEXT14_APP_ROUTER_COMPLETE.md
  ├─> REACT_SERVER_COMPONENTS.md
  ├─> ADVANCED_STATE_MANAGEMENT.md
  └─> PERFORMANCE_OPTIMIZATION.md

RAG_IMPLEMENTATION_GUIDE.md
  ├─> VECTOR_DATABASE_MASTERY.md
  ├─> LANGCHAIN_ADVANCED_PATTERNS.md
  └─> PROMPT_ENGINEERING_BIBLE.md
```

---

## 🌐 必須参照リソース

1. [最強要件定義書](../最強要件定義書.md) - 完全な要件定義
2. [ENTERPRISE_SYSTEM_DESIGN.md](../00_MASTER_ARCHITECTURE/ENTERPRISE_SYSTEM_DESIGN.md) - システム設計

---

**推定実装時間**: 継続的（自動実装プロンプトの改善）

