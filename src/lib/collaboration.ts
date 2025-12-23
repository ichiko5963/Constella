/**
 * リアルタイム共同編集機能
 * Yjs + WebSocketを使用した共同編集の基盤
 * 
 * 注意: 完全な実装にはWebSocketサーバー（Hocuspocus、PartyKit等）が必要
 * このファイルは将来の実装のための基盤を提供
 */

import * as Y from 'yjs';

export interface CollaborationConfig {
    noteId: number;
    userId: string;
    userName: string;
    userColor: string;
}

/**
 * Yjsドキュメントを作成
 */
export function createYDoc(): Y.Doc {
    return new Y.Doc();
}

/**
 * YjsドキュメントをJSONにエクスポート（永続化用）
 */
export function exportYDocToJSON(doc: Y.Doc): Uint8Array {
    return Y.encodeStateAsUpdate(doc);
}

/**
 * JSONからYjsドキュメントをインポート（復元用）
 */
export function importYDocFromJSON(doc: Y.Doc, update: Uint8Array): void {
    Y.applyUpdate(doc, update);
}

/**
 * Yjsドキュメントの状態を取得（デバッグ用）
 */
export function getYDocState(doc: Y.Doc): any {
    return {
        guid: doc.guid,
        clientID: doc.clientID,
    };
}

/**
 * 共同編集用のWebSocketプロバイダー（将来の実装用）
 * 現在はプレースホルダー
 */
export class CollaborationProvider {
    private doc: Y.Doc;
    private ws: WebSocket | null = null;
    private noteId: number;
    private userId: string;

    constructor(doc: Y.Doc, noteId: number, userId: string, wsUrl?: string) {
        this.doc = doc;
        this.noteId = noteId;
        this.userId = userId;

        // WebSocket接続（将来の実装）
        // if (wsUrl) {
        //     this.connect(wsUrl);
        // }
    }

    connect(wsUrl: string) {
        // TODO: WebSocketサーバーとの接続を実装
        // this.ws = new WebSocket(wsUrl);
        // this.ws.onmessage = (event) => {
        //     const update = new Uint8Array(event.data);
        //     Y.applyUpdate(this.doc, update);
        // };
        // 
        // this.doc.on('update', (update: Uint8Array) => {
        //     if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        //         this.ws.send(update);
        //     }
        // });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    getDoc(): Y.Doc {
        return this.doc;
    }
}
