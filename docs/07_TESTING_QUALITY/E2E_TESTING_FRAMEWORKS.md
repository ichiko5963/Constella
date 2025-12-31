# E2Eテストフレームワーク完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Playwright + Jest + Testing Library

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [E2Eテストアーキテクチャ](#2-e2eテストアーキテクチャ)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)
5. [CI/CD統合](#5-cicd統合)

---

## 1. エグゼクティブサマリー

### 1.1 E2Eテスト戦略

Actoryでは、Playwrightを使用してE2Eテストを実装します。主要なユーザーフローを自動テストします。

### 1.2 テスト対象

- **認証フロー**: ログイン、ログアウト
- **プロジェクト管理**: 作成、編集、削除
- **録音機能**: 録音開始、停止、アップロード
- **AIチャット**: メッセージ送信、応答確認

---

## 2. E2Eテストアーキテクチャ

### 2.1 Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2.2 テストヘルパー

```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}
```

---

## 3. 実装パターン

### 3.1 プロジェクト作成テスト

```typescript
// e2e/projects/create.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'password');
  });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    
    await page.fill('input[name="name"]', 'Test Project');
    await page.fill('textarea[name="description"]', 'Test Description');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Test Project')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=プロジェクト名は必須です')).toBeVisible();
  });
});
```

### 3.2 録音機能テスト

```typescript
// e2e/recording/record.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Recording', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'password');
  });

  test('should start and stop recording', async ({ page }) => {
    await page.goto('/record');
    
    // 録音開始
    await page.click('[data-testid="start-recording-button"]');
    await expect(page.locator('[data-testid="recording-status"]')).toHaveText('録音中');
    
    // 少し待つ
    await page.waitForTimeout(2000);
    
    // 録音停止
    await page.click('[data-testid="stop-recording-button"]');
    await expect(page.locator('[data-testid="recording-status"]')).toHaveText('停止');
  });
});
```

---

## 4. 詳細なコード実装例

### 4.1 AIチャットテスト

```typescript
// e2e/chat/ai-chat.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'password');
  });

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/chat');
    
    const message = 'こんにちは';
    await page.fill('[data-testid="chat-input"]', message);
    await page.click('[data-testid="send-button"]');
    
    // メッセージが表示されることを確認
    await expect(page.locator(`text=${message}`)).toBeVisible();
    
    // AI応答を待つ
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
  });
});
```

---

## 5. CI/CD統合

### 5.1 GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🌐 必須参照リソース

1. [Playwright Documentation](https://playwright.dev/) - Playwright公式
2. [Testing Library](https://testing-library.com/) - Testing Library
3. [Jest Documentation](https://jestjs.io/) - Jest公式

---

**推定実装時間**: 2-3週間（E2Eテスト完全実装）

