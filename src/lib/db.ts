import { openDB, type DBSchema } from 'idb';
import { type CropResult } from './imageProcessor';

interface SplitterDB extends DBSchema {
    history: {
        key: string;
        value: {
            id: string;
            timestamp: number;
            originalName: string;
            crops: {
                id: string;
                blob: Blob; // IDB can store Blobs
                label: string;
            }[];
        };
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'ai-image-splitter-db';
const DB_VERSION = 1;

export async function initDB() {
    return openDB<SplitterDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            const store = db.createObjectStore('history', { keyPath: 'id' });
            store.createIndex('by-date', 'timestamp');
        },
    });
}

export async function saveHistory(originalName: string, crops: CropResult[]) {
    const db = await initDB();
    const id = crypto.randomUUID();
    await db.add('history', {
        id,
        timestamp: Date.now(),
        originalName,
        crops: crops.map(c => ({
            id: c.id,
            blob: c.blob,
            label: c.label
        }))
    });
    return id;
}

export async function getHistory() {
    const db = await initDB();
    return db.getAllFromIndex('history', 'by-date');
}
