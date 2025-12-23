# Googleカレンダー連携の設定方法

## エラー: redirect_uri_mismatch の解決方法

このエラーは、Google Cloud Consoleで設定されているリダイレクトURIと、アプリが使用しているリダイレクトURIが一致していない場合に発生します。

## 解決手順

### 1. 現在のリダイレクトURIを確認

アプリは以下のリダイレクトURIを使用します：
- 開発環境: `http://localhost:3000/api/calendar/google/callback`
- 本番環境: `https://your-domain.com/api/calendar/google/callback`（`NEXT_PUBLIC_APP_URL`で設定）

### 2. Google Cloud Consoleで設定を確認・追加

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「認証情報」に移動
4. OAuth 2.0 クライアント IDを選択（または新規作成）
5. 「承認済みのリダイレクト URI」に以下を追加：
   - 開発環境: `http://localhost:3000/api/calendar/google/callback`
   - 本番環境: `https://your-domain.com/api/calendar/google/callback`

### 3. 環境変数の確認

`.env.local`ファイルに以下が設定されているか確認してください：

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 開発環境の場合
# または
NEXT_PUBLIC_APP_URL=https://your-domain.com  # 本番環境の場合
```

### 4. 注意事項

- リダイレクトURIは完全一致する必要があります（末尾のスラッシュも含む）
- `http://`と`https://`は区別されます
- ポート番号も含めて完全に一致させる必要があります

### 5. 設定後の確認

設定を保存した後、数分待ってから再度連携を試してください。Google Cloud Consoleの変更が反映されるまで時間がかかる場合があります。
