type StorageValue = string | null;

const memoryStore = new Map<string, string>();

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

async function getItem(key: string): Promise<StorageValue> {
  const storage = getStorage();
  if (storage) {
    return storage.getItem(key);
  }

  return memoryStore.get(key) ?? null;
}

async function setItem(key: string, value: string): Promise<void> {
  const storage = getStorage();
  if (storage) {
    storage.setItem(key, value);
    return;
  }

  memoryStore.set(key, value);
}

async function removeItem(key: string): Promise<void> {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(key);
    return;
  }

  memoryStore.delete(key);
}

async function clear(): Promise<void> {
  const storage = getStorage();
  if (storage) {
    storage.clear();
    return;
  }

  memoryStore.clear();
}

async function getAllKeys(): Promise<string[]> {
  const storage = getStorage();
  if (storage) {
    return Object.keys(storage);
  }

  return Array.from(memoryStore.keys());
}

const AsyncStorage = {
  getItem,
  setItem,
  removeItem,
  clear,
  getAllKeys,
};

export { clear, getAllKeys, getItem, removeItem, setItem };
export default AsyncStorage;
