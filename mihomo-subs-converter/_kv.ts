interface NodesInfoKvStorage {
  nodes: Array<string>;
  timestamp: number;
}

function getUrlID(url:string) : string {
  const bUrl: string = btoa(url.trim());
  return bUrl.length>16? bUrl.substring(bUrl.length-16, bUrl.length) : bUrl;
}

async function addKeyToKvKeyList(key: string, kv: Deno.Kv) : Promise<void> {
  const kvKeyList = await kv.get(["KeyList"]);
  if (kvKeyList.value) {
    const kvKeyListArray: Array<string> = kvKeyList.value as Array<string>;
    if (!kvKeyListArray.includes(key)) {
      kvKeyListArray.push(key);
      await kv.set(["KeyList"], kvKeyListArray);
    }
  } else {
    await kv.set(["KeyList"], [key]);
  }
}

async function removeKeyFromKvKeyList(key: string, kv: Deno.Kv) : Promise<void> {
  const kvKeyList = await kv.get(["KeyList"]);
  if (kvKeyList.value) {
    const kvKeyListArray: Array<string> = kvKeyList.value as Array<string>;
    if (kvKeyListArray.includes(key)) {
      kvKeyListArray.splice(kvKeyListArray.indexOf(key), 1);
      await kv.set(["KeyList"], kvKeyListArray);
    }
  }
}

async function removeExpiredNodesFromKv(kv: Deno.Kv) : Promise<number> {
  let deletedCount: number = 0;
  const kvKeyList = await kv.get(["KeyList"]);
  if (kvKeyList.value) {
    const kvKeyListArray: Array<string> = kvKeyList.value as Array<string>;
    const newKeyListArray: Array<string> = [];
    for (const key of kvKeyListArray) {
      const nodesKey = await kv.get([key]);
      if (nodesKey.value) {
        const nodesKeyValue : NodesInfoKvStorage = nodesKey.value as NodesInfoKvStorage;
        if (nodesKeyValue.timestamp && (Date.now() - nodesKeyValue.timestamp) > 86400000) { // 86400000 ms = 1 day
          deletedCount++;
          await kv.delete([key]);
        } else if (nodesKeyValue.timestamp) newKeyListArray.push(key);
      }
    }
    await kv.set(["KeyList"], newKeyListArray);
  }
  return deletedCount;
}

async function getNodesFromKv(link: string, kv: Deno.Kv) : Promise<Array<string> | null> {
  try {
    const key: string = getUrlID(link);
    const nodesKey = await kv.get([key]);
    if (nodesKey.value) {
      const nodesKeyValue : NodesInfoKvStorage = nodesKey.value as NodesInfoKvStorage;
      if (nodesKeyValue.timestamp && (Date.now() - nodesKeyValue.timestamp) < 86400000)  { // 86400000 ms = 1 day
        console.log(`Get nodes of '${link}' from Deno.Kv. Timestamp: ${nodesKeyValue.timestamp}`);
        return nodesKeyValue.nodes;
      } else {
        await kv.delete([key]);
        removeKeyFromKvKeyList(key, kv);
        return null;
      }
    }
    else return null;  
  } catch (error) {
    console.error(`Failed to get nodes of '${link}' from Deno.Kv.`, error);
    return null;
  }
}

async function insertNodesToKv(link: string, nodes: Array<string>, kv: Deno.Kv) : Promise<void> {
  try {
    // The value of Deno.Kv has a limited size of 64K. Issue #21089: https://github.com/denoland/deno/issues/21089
    const timestamp: number = Date.now();
    const key: string = getUrlID(link);
    await kv.set([key], {
      nodes,
      timestamp
    } as NodesInfoKvStorage);
    await addKeyToKvKeyList(key, kv);
    console.log(`Insert nodes of '${link}' to Deno.Kv. Timestamp: ${timestamp}`);  
  } catch (error) {
    console.error(`Failed to insert nodes of '${link}' to Deno.Kv.`, error);
  }
}

export { getNodesFromKv, insertNodesToKv, removeExpiredNodesFromKv };
