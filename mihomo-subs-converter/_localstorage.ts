import { EXPIRE_IN_MS } from "./storage.ts";

interface NodesInfoLocalStorage {
  nodes: Array<string>;
  timestamp: number;
}

function isLocalStorageAvaliable(): boolean {
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return true;
  } catch (_error) {
    console.error('localStroage is unabliable.');
    return false;
  }
}

function getUrlID(url:string) : string {
  const bUrl: string = btoa(url.trim());
  return bUrl.length>16? bUrl.substring(bUrl.length-16, bUrl.length) : bUrl;
}

function addKeyToLocalStorageKeyList(key: string) : void {
  const localStorageKeyList: string | null = localStorage.getItem("localStorageKeyList");
  if (localStorageKeyList) {
    const localStorageKeyListArray: Array<string> = JSON.parse(localStorageKeyList);
    if (!localStorageKeyListArray.includes(key)) {
      localStorageKeyListArray.push(key);
      localStorage.setItem("localStorageKeyList", JSON.stringify(localStorageKeyListArray));
    }
  } else {
    localStorage.setItem("localStorageKeyList", JSON.stringify([key]));
  }
}

function removeKeyFromLocalStorageKeyList(key: string) : void {
  const localStorageKeyList: string | null = localStorage.getItem("localStorageKeyList");
  if (localStorageKeyList) {
    const localStorageKeyListArray: Array<string> = JSON.parse(localStorageKeyList);
    if (localStorageKeyListArray.includes(key)) {
      localStorageKeyListArray.splice(localStorageKeyListArray.indexOf(key), 1);
      localStorage.setItem("localStorageKeyList", JSON.stringify(localStorageKeyListArray));
    }
  }
}

function removeExpiredNodesFromLocalStorage() : number {
  let deletedCount: number = 0;
  const localStorageKeyList: string | null = localStorage.getItem("localStorageKeyList");
  if (localStorageKeyList) {
    const localStorageKeyListArray: Array<string> = JSON.parse(localStorageKeyList);
    const newKeyListArray: Array<string> = [];
    for (const key of localStorageKeyListArray) {
      const nodesValue: string | null = localStorage.getItem(key);
      if (nodesValue) {
        const nodesObj : NodesInfoLocalStorage = JSON.parse(nodesValue) as NodesInfoLocalStorage;
        if (nodesObj.timestamp && (Date.now() - nodesObj.timestamp) > EXPIRE_IN_MS) {
          deletedCount++;
          localStorage.removeItem(key);
        } else if (nodesObj.timestamp) newKeyListArray.push(key);
      }
    }
    localStorage.setItem("localStorageKeyList", JSON.stringify(newKeyListArray));
  }
  return deletedCount;
}

function getNodesFromLocalStorage(link: string) : Array<string> | null {
  const key: string = getUrlID(link);
  const nodesValue: string | null = localStorage.getItem(key);
  if (nodesValue) {
    const nodesObj : NodesInfoLocalStorage = JSON.parse(nodesValue) as NodesInfoLocalStorage;
    if (nodesObj.timestamp && (Date.now() - nodesObj.timestamp) < EXPIRE_IN_MS)  {
      console.log(`Get nodes of [${key}](${link}) from localStorage. Timestamp: ${nodesObj.timestamp}`);
      return nodesObj.nodes;
    } else {
      localStorage.removeItem(key);
      removeKeyFromLocalStorageKeyList(key);
      return null;
    }
  }
  else return null;
}

function insertNodesToLocalStorage(link: string, nodes: Array<string>) : void {
  const timestamp: number = Date.now();
  const key: string = getUrlID(link);
  console.log(`Insert nodes of [${key}](${link}) to localStorage. Timestamp: ${timestamp}`);
  localStorage.setItem(key, JSON.stringify({
    nodes,
    timestamp
  } as NodesInfoLocalStorage));
  addKeyToLocalStorageKeyList(key);
}

// This function used by the function removeKeyFromStorage() in './storage.ts'
function removeKey(key: string) : string {
  try {
    localStorage.removeItem(key);
    removeKeyFromLocalStorageKeyList(key);
    return `Remove key [${key}] from localStorage successfully at ${new Date()}.`;  
  } catch (error) {
    return error as string;
  }
}

export { isLocalStorageAvaliable, getNodesFromLocalStorage, insertNodesToLocalStorage, removeExpiredNodesFromLocalStorage, removeKey };
