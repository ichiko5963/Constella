# Kubernetes 本番環境ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [Kubernetesアーキテクチャ](#2-kubernetesアーキテクチャ)
3. [デプロイメント戦略](#3-デプロイメント戦略)
4. [実装例](#4-実装例)
5. [モニタリングとロギング](#5-モニタリングとロギング)

---

## 1. エグゼクティブサマリー

### 1.1 Kubernetes採用理由

- **スケーラビリティ**: 自動スケーリングによるリソース最適化
- **高可用性**: 複数ノードでの冗長構成
- **コンテナオーケストレーション**: マイクロサービスの効率的な管理
- **ロールアウト戦略**: ブルー・グリーン、カナリアリリース

---

## 2. Kubernetesアーキテクチャ

### 2.1 クラスタ構成

```
┌─────────────────────────────────────────┐
│         Load Balancer (Ingress)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│  Master Node   │    │  Worker Nodes    │
│                │    │  (x3)            │
│  - API Server  │    │  - Pods          │
│  - etcd        │    │  - Services     │
│  - Scheduler   │    │  - Deployments  │
└────────────────┘    └──────────────────┘
```

### 2.2 マイクロサービス配置

```yaml
# services/audio-processing/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audio-processing-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: audio-processing
  template:
    metadata:
      labels:
        app: audio-processing
    spec:
      containers:
      - name: audio-processing
        image: actory/audio-processing:latest
        ports:
        - containerPort: 3001
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: url
---
apiVersion: v1
kind: Service
metadata:
  name: audio-processing-service
spec:
  selector:
    app: audio-processing
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
```

---

## 3. デプロイメント戦略

### 3.1 ブルー・グリーンデプロイメント

```yaml
# blue-green-deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: app
    version: blue  # または green
  ports:
  - port: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app
      version: blue
  template:
    metadata:
      labels:
        app: app
        version: blue
    spec:
      containers:
      - name: app
        image: actory/app:v1.0.0
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app
      version: green
  template:
    metadata:
      labels:
        app: app
        version: green
    spec:
      containers:
      - name: app
        image: actory/app:v1.1.0
```

---

## 4. 実装例

### 4.1 Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: audio-processing-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: audio-processing-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 🌐 必須参照リソース

1. [Kubernetes Documentation](https://kubernetes.io/docs/)
2. [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
3. [Kubernetes Production Patterns](https://github.com/kubernetes/community)

---

**推定実装時間**: 2-3週間（Kubernetes本番環境構築）

