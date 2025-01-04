import * as LS from "./_localstorage.ts";
import * as KV from "./_kv.ts";

type StorageType = 'localStroage' | Deno.Kv | null;

/**
 * The value 'EXPIRE_IN_MS' sets when the keys will be expired (or deleted automatically).
 * The value is in milliseconds. Please be aware of that it SHOULD be a positive integer.
 * In case the value <= 0, addKeyToKvKeyList() in '_kv.ts' will store the key value and 
 * the key list. (The operations for KV are same as LocalStorage)
 */
const EXPIRE_IN_MS: number = 86400000; // default to 1 day (86400000 ms)

function isValidNode(node: string): boolean {
  return /(\w{2,10}):\/\/(.+)/.test(node);
}

async function detectStorage(): Promise<StorageType> {
  if (LS.isLocalStorageAvaliable()) {
    console.log('LocalStorage is available.');
    return 'localStroage';
  } else {
    console.log('LocalStorage is not available.');
    try {
      const kv: Deno.Kv = await Deno.openKv();
      console.log('Deno.Kv is available.');
      return kv;
    } catch (_error) {
      console.log('Deno.Kv is not available.')
      return null;
    }
  }
}

async function getNodesFromStorage(link: string, kv: StorageType): Promise<Array<string> | null> {
  if (kv === 'localStroage') {
    return LS.getNodesFromLocalStorage(link);
  } else if (kv instanceof Deno.Kv) {
    return await KV.getNodesFromKv(link, kv);
  } else {
    return null;
  }
}

async function insertNodesToStorage(link: string, nodes: Array<string>, kv: StorageType): Promise<void> {
  if (kv === 'localStroage') {
    LS.insertNodesToLocalStorage(link, nodes);
  } else if (kv instanceof Deno.Kv) {
    await KV.insertNodesToKv(link, nodes, kv);
  }
}

async function removeExpiredNodesFromStorage(kv: StorageType): Promise<void> {
  try {
    let deletedCount: number = 0;
    if (kv === 'localStroage') {
      deletedCount = LS.removeExpiredNodesFromLocalStorage();
    } else if (kv instanceof Deno.Kv) {
      deletedCount = await KV.removeExpiredNodesFromKv(kv);
    }
    console.log(`Remove ${deletedCount} expired nodes from storage successfully at ${new Date()}.`);
  } catch (error) {
    console.error(`Failed to remove expired nodes from storage at ${new Date()}`, error);
  }
}

async function removeKeyFromStorage(key: string, kv: StorageType): Promise<string> {
  if (kv === 'localStroage') {
    return LS.removeKey(key);
  } else if (kv instanceof Deno.Kv) {
    return await KV.removeKey(key, kv);
  } else {
    return 'Storage type unknown.';
  }
}

export type { StorageType };
export {
  isValidNode, detectStorage, getNodesFromStorage, insertNodesToStorage,
  removeExpiredNodesFromStorage, removeKeyFromStorage, EXPIRE_IN_MS
};
