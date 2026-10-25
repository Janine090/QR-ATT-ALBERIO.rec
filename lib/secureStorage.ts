import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number) {
  return `${key}__chunk_${index}`;
}

function countKey(key: string) {
  return `${key}__chunk_count`;
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await SecureStore.getItemAsync(countKey(key));
    if (countRaw === null) {
      return SecureStore.getItemAsync(key);
    }
    const count = Number(countRaw);
    if (!Number.isFinite(count) || count < 1) return null;
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const parts =
      value.match(new RegExp(`[\\s\\S]{1,${CHUNK_SIZE}}`, 'g')) ?? [value];
    const previousRaw = await SecureStore.getItemAsync(countKey(key));
    const previousCount = previousRaw ? Number(previousRaw) : 0;

    for (let i = 0; i < parts.length; i++) {
      await SecureStore.setItemAsync(chunkKey(key, i), parts[i]);
    }
    await SecureStore.setItemAsync(countKey(key), String(parts.length));

    if (Number.isFinite(previousCount) && previousCount > parts.length) {
      for (let i = parts.length; i < previousCount; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i));
      }
    }
    await SecureStore.deleteItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    const countRaw = await SecureStore.getItemAsync(countKey(key));
    await SecureStore.deleteItemAsync(key);
    if (countRaw !== null) {
      const count = Number(countRaw);
      if (Number.isFinite(count) && count > 0) {
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, i));
        }
      }
    }
    await SecureStore.deleteItemAsync(countKey(key));
  },
};
