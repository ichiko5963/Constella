# Googleカレンダー連携の設定方法

## エラー: redirect_uri_mismatch の解決方法

このエラーは、Google Cloud Consoleで設定されているリダイレクトURIと、アプリが使用しているリダイレクトURIが一致していない場合に発生します。

## 解決手順

### 1. リダイレクトURIの自動決定

アプリは以下のロジックでリダイレクトURIを自動決定します：
- **本番環境**: `NEXT_PUBLIC_APP_URL`環境変数が設定されている場合はそれを使用
- **開発環境**: 環境変数が設定されていない場合は、リクエストのオリジン（`http://localhost:3000`など）を自動使用

これにより、開発環境では環境変数を設定せずに動作します。

### 2. Google Cloud Consoleで設定を確認・追加

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. OAuth 2.0 クライアント IDを選択（または新規作成）
5. 「承認済みのリダイレクト URI」に以下を追加：
   - **開発環境**: `http://localhost:3000/api/calendar/google/callback`
   - **本番環境**: `https://your-domain.com/api/calendar/google/callback`（実際のドメインに置き換え）

### 3. 環境変数の設定（本番環境のみ必須）

`.env.local`ファイル（開発環境）または本番環境の環境変数に以下を設定：

```env
# 必須
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# 本番環境のみ必須（開発環境では自動検出）
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**開発環境では`NEXT_PUBLIC_APP_URL`を設定する必要はありません。** アプリが自動的に`http://localhost:3000`を使用します。

### 4. 開発環境での使用

開発環境では、Google Cloud Consoleに`http://localhost:3000/api/calendar/google/callback`を追加するだけで動作します。環境変数の設定は不要です。

### 5. 注意事項

- リダイレクトURIは完全一致する必要があります（末尾のスラッシュも含む）
- `http://`と`https://`は区別されます
- ポート番号も含めて完全に一致させる必要があります
- 設定を保存した後、数分待ってから再度連携を試してください

### 6. トラブルシューティング

もしエラーが続く場合は、ブラウザの開発者ツールのコンソールで実際に使用されているリダイレクトURIを確認してください。Google Cloud ConsoleにそのURIが正確に登録されているか確認してください。
