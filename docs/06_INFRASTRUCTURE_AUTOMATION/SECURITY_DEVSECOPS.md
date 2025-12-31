# DevSecOps セキュリティ完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: OWASP + Snyk + Trivy + SAST/DAST

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [セキュリティスキャン](#2-セキュリティスキャン)
3. [脆弱性管理](#3-脆弱性管理)
4. [CI/CD統合](#4-cicd統合)

---

## 1. エグゼクティブサマリー

### 1.1 DevSecOpsとは

開発、セキュリティ、運用を統合したアプローチです。セキュリティを開発プロセスに組み込みます。

### 1.2 Actoryでの適用

- **依存関係スキャン**: npm audit、Snyk
- **コンテナスキャン**: Trivy
- **コードスキャン**: ESLint Security、SonarQube
- **シークレット管理**: GitHub Secrets、Vault

---

## 2. セキュリティスキャン

### 2.1 依存関係スキャン

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm audit --audit-level=moderate
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'actory/api:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
```

### 2.2 コードスキャン

```typescript
// .eslintrc.security.js
module.exports = {
  extends: [
    'plugin:security/recommended',
  ],
  plugins: ['security'],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'warn',
  },
};
```

---

## 🌐 必須参照リソース

1. [OWASP Top 10](https://owasp.org/www-project-top-ten/) - OWASP公式
2. [Snyk Documentation](https://docs.snyk.io/) - Snyk公式
3. [Trivy Documentation](https://aquasecurity.github.io/trivy/) - Trivy公式

---

**推定実装時間**: 2-3週間（DevSecOps完全実装）

