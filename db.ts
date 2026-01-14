
import Dexie, { type EntityTable } from 'dexie';
// Added Fix: Removed non-existent IAHistory from types import
import { VaultItem, StudioSession, LuminaPreset } from './types';

// Asset storage for large blobs
interface AssetBlob {
  id: string;
  blob: Blob;
  type: 'image' | 'mask' | 'thumb';
  timestamp: number;
}

// Fixed VenusDB initialization to resolve TypeScript property access errors
const db = new Dexie('VenusIndustrialDB') as Dexie & {
  assets: EntityTable<AssetBlob, 'id'>;
  nodes: EntityTable<VaultItem, 'id'>;
  sessions: EntityTable<StudioSession, 'id'>;
  // Added Fix: Using 'any' for history table since IAHistory is not defined in types
  history: EntityTable<any, 'id'>;
  presets: EntityTable<LuminaPreset, 'id'>;
};

// Define database schema
db.version(1).stores({
  assets: 'id, type, timestamp',
  nodes: 'id, shortId, timestamp, vaultDomain, isFavorite',
  sessions: 'id, timestamp',
  history: 'id, timestamp',
  presets: 'id'
});

export { db };

// Utilitário para geração de thumbnails via Canvas
export async function generateThumbnail(base64: string, size: number = 256): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = (img.height / img.width) * size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    img.onerror = () => resolve('');
  });
}
