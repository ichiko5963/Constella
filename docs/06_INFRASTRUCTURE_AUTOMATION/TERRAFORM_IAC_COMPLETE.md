# Terraform Infrastructure as Code 完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Terraform + AWS + Vercel

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Terraformアーキテクチャ](#2-terraformアーキテクチャ)
3. [実装パターン](#3-実装パターン)
4. [詳細なコード実装例](#4-詳細なコード実装例)

---

## 1. エグゼクティブサマリー

### 1.1 Infrastructure as Code

Terraformを使用して、インフラストラクチャをコードとして管理します。AWS、Vercel、Tursoなどのリソースを定義します。

### 1.2 Actoryでの適用

- **AWS S3**: 音声ファイルストレージ
- **AWS RDS**: データベース（必要に応じて）
- **Vercel**: フロントエンド・APIデプロイ
- **Turso**: プライマリデータベース

---

## 2. Terraformアーキテクチャ

### 2.1 ディレクトリ構造

```
infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── s3/
│   │   ├── rds/
│   │   └── networking/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── production/
```

### 2.2 メイン設定

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "actory-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# S3バケット
resource "aws_s3_bucket" "audio_storage" {
  bucket = "actory-audio-${var.environment}"
  
  tags = {
    Environment = var.environment
    Project     = "Actory"
  }
}

resource "aws_s3_bucket_versioning" "audio_storage" {
  bucket = aws_s3_bucket.audio_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audio_storage" {
  bucket = aws_s3_bucket.audio_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

---

## 3. 実装パターン

### 3.1 モジュール化

```hcl
# infrastructure/terraform/modules/s3/main.tf
variable "bucket_name" {
  type = string
}

variable "environment" {
  type = string
}

resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  
  tags = {
    Environment = var.environment
  }
}

output "bucket_id" {
  value = aws_s3_bucket.this.id
}

output "bucket_arn" {
  value = aws_s3_bucket.this.arn
}
```

### 3.2 環境別設定

```hcl
# infrastructure/terraform/environments/production/main.tf
module "s3" {
  source = "../../modules/s3"
  
  bucket_name = "actory-audio-production"
  environment = "production"
}
```

---

## 🌐 必須参照リソース

1. [Terraform Documentation](https://www.terraform.io/docs) - Terraform公式
2. [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs) - AWSプロバイダー
3. [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/) - ベストプラクティス

---

**推定実装時間**: 2-3週間（Terraform IAC完全実装）

