# 自動スケーリングポリシー完全実装ガイド - Actory版

**バージョン**: 1.0.0  
**最終更新日**: 2024年12月21日  
**対象**: Kubernetes HPA + VPA + Cluster Autoscaler

---

## 📚 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [HPA設定](#2-hpa設定)
3. [VPA設定](#3-vpa設定)
4. [スケーリングポリシー](#4-スケーリングポリシー)

---

## 1. エグゼクティブサマリー

### 1.1 自動スケーリングとは

負荷に応じて自動的にリソースをスケールアップ/ダウンする機能です。

### 1.2 Actoryでの適用

- **HPA**: Pod数の自動スケーリング
- **VPA**: リソース要求の自動調整
- **Cluster Autoscaler**: ノード数の自動調整

---

## 2. HPA設定

### 2.1 Horizontal Pod Autoscaler

```yaml
# kubernetes/hpa/audio-processing-hpa.yaml
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

---

## 🌐 必須参照リソース

1. [Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/) - Kubernetes公式
2. [VPA Documentation](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler) - VPA公式

---

**推定実装時間**: 2-3週間（自動スケーリング完全実装）

