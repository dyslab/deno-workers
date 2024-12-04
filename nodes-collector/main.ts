import { getDefaultResponseMessage, getIncorrectIdMessage } from "./messages.ts";
import { setNextId, getNodesPageLink, getLinksFromDataSource } from "./datasources.ts";
import { KvNodes, loadNodesFromKv, loadNodesCurrentIdFromKv, loadNodesLastUpdatedTimeFromKv, setNodes, saveNodesToKv } from "./kvnodes.ts";

const kv = await Deno.openKv();

Deno.serve({ port: 8602, hostname: 'localhost' }, async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const kvNodes: KvNodes | null = await loadNodesFromKv(kv, id);
    if (kvNodes) {
      return new Response(kvNodes.nodes.join('\n'), { 
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename=${id}.txt`,
          "Cache-Control": "max-age=3600",
        }
      });
    }
    else {
      /*
      // For new datasource testing
      const nodesLinks : Array<string> = await getLinksFromDataSource(1, 88);
      return new Response(nodesLinks.join('\n') + String(nodesLinks.length), { status: 200 });
      */
      return new Response(getIncorrectIdMessage(id), { status: 200 });
    }
  } else if (request.url.endsWith("/favicon.ico")) {
    return await fetch(new URL('./assets/favicon.ico', import.meta.url));
  } else {
    // console.log(`Request ${request.url} at ${new Date().toISOString()}`); // For debugging
    const currentId: number | null = await loadNodesCurrentIdFromKv(kv);
    const strCurrentId: string = currentId !== null? String(currentId) : 'undefined';
    const lastUpdatedTime: Date | null = await loadNodesLastUpdatedTimeFromKv(kv);
    const strLastUpdatedTime: string = lastUpdatedTime? lastUpdatedTime.toLocaleString() : 'undefined';
    return new Response(getDefaultResponseMessage(strCurrentId, strLastUpdatedTime), { status: 200 })
  }
});

// Cron job runs at the 8th minute every 11 hours (UTC)
Deno.cron("Daily Fetch And Save", "12 */12 * * *", async () => {
  const currentId: number | null = await loadNodesCurrentIdFromKv(kv);
  const numberCurrentId: number = (currentId !== null)? setNextId(currentId) : 0;
  const nodesLinks : Array<string> = await getLinksFromDataSource(numberCurrentId, 88);
  await saveNodesToKv(kv, setNodes(numberCurrentId, nodesLinks));
  console.log(`Cron job finished at: ${new Date().toISOString()}. Saved ${nodesLinks.length} nodes. Set current Id to ${numberCurrentId}, Datasource: ${getNodesPageLink(numberCurrentId)}`);
});
