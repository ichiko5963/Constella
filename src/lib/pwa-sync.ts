/**
 * PWA + IndexedDBを使用したクロスデバイス同期
 * オフライン時はIndexedDBに保存し、オンライン時にTursoに同期
 */

export interface SyncItem {
    id: string;
    type: 'recording' | 'note' | 'task';
    data: any;
    timestamp: number;
    synced: boolean;
}

const DB_NAME = 'actory-sync';
const DB_VERSION = 1;
const STORE_NAME = 'sync-items';

/**
 * IndexedDBを初期化
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

/**
 * アイテムをIndexedDBに保存
 */
export async function saveToIndexedDB(item: SyncItem): Promise<void> {
    const db = await initIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await store.put(item);
}

/**
 * 未同期のアイテムを取得
 */
export async function getUnsyncedItems(): Promise<SyncItem[]> {
    const db = await initIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
        const request = index.getAll(false);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

/**
 * アイテムを同期済みとしてマーク
 */
export async function markAsSynced(itemId: string): Promise<void> {
    const db = await initIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const item = await store.get(itemId);
    if (item) {
        item.synced = true;
        await store.put(item);
    }
}

/**
 * オンライン時に未同期アイテムを同期
 */
export async function syncUnsyncedItems(): Promise<void> {
    if (!navigator.onLine) {
        return;
    }

    const unsyncedItems = await getUnsyncedItems();

    for (const item of unsyncedItems) {
        try {
            // サーバーに送信
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });

            if (response.ok) {
                await markAsSynced(item.id);
            }
        } catch (error) {
            console.error(`Failed to sync item ${item.id}:`, error);
        }
    }
}

/**
 * オンライン/オフラインイベントをリッスン
 */
export function setupSyncListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
        syncUnsyncedItems();
    });

    // 定期的に同期を試行
    setInterval(() => {
        syncUnsyncedItems();
    }, 30000); // 30秒ごと
}
