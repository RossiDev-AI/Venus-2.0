
import { VaultItem, StudioSession, LuminaPreset } from './types';
import { db, generateThumbnail } from './db';

export const saveSession = async (session: StudioSession): Promise<void> => {
    await db.sessions.put(session);
};

export const getAllSessions = async (): Promise<StudioSession[]> => {
    return await db.sessions.toArray();
};

export const saveNode = async (item: VaultItem): Promise<void> => {
  // Geração de thumbnail automática antes do save
  if (item.imageUrl && !item.thumbUrl) {
    item.thumbUrl = await generateThumbnail(item.imageUrl);
  }
  await db.nodes.put(item);
};

export const getAllNodes = async (): Promise<VaultItem[]> => {
  return await db.nodes.reverse().sortBy('timestamp');
};

export const deleteNode = async (id: string): Promise<void> => {
  await db.nodes.delete(id);
};

export const toggleFavoriteNode = async (id: string): Promise<void> => {
  const item = await db.nodes.get(id);
  if (item) {
    item.isFavorite = !item.isFavorite;
    await db.nodes.put(item);
  }
};

export const bulkSaveNodes = async (items: VaultItem[]): Promise<void> => {
  await db.nodes.bulkPut(items);
};

// --- Added Fixes: Missing Preset Management ---

export const getAllUserPresets = async (): Promise<LuminaPreset[]> => {
  return await db.presets.toArray();
};

export const savePreset = async (preset: LuminaPreset): Promise<void> => {
  await db.presets.put(preset);
};
