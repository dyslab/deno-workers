import { getDefaultResponseMessage, getIncorrectIdMessage } from "./messages.ts";
import { setNextId, getNodesPageLink, getFastestNodesLinks } from "./datasources.ts";
import { KvNodes, loadNodesFromKv, loadNodesCurrentIdFromKv, loadNodesLastUpdatedTimeFromKv, setNodes, saveNodesToKv } from "./kvnodes.ts";

const kv = await Deno.openKv();

Deno.serve({ port: 8602, hostname: 'localhost' }, async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const kvNodes: KvNodes | null = await loadNodesFromKv(kv, id);
    if (kvNodes) {
      return new Response(kvNodes.nodes.join('\n'), { 
        status : 200,
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename=${id}.txt`,
          "Cache-Control": "max-age=3600",
        }
      });
    }
    else {
      return new Response(getIncorrectIdMessage(id), { status : 200 });
    }
  } else if (request.url.endsWith("/favicon.ico")) {
    return await fetch(new URL('./assets/favicon.ico', import.meta.url));
  } else {
    console.log(`Request ${request.url} at ${new Date().toISOString()}`);
    return new Response(getDefaultResponseMessage(await loadNodesLastUpdatedTimeFromKv(kv)), { status : 200 })
  }
});

// Cron job runs every day at 11:11 AM (UTC)
Deno.cron("Daily Fetch And Save", "11 11 * * *", async () => {
  let currentId : number | null = await loadNodesCurrentIdFromKv(kv);
  currentId = (currentId !== null)? setNextId(currentId) : 0;
  const nodesLinks : Array<string> = await getFastestNodesLinks(currentId);
  await saveNodesToKv(kv, setNodes(currentId, nodesLinks));
  console.log(`Cron job finished at: ${new Date().toISOString()}. Saved ${nodesLinks.length} nodes. Set current Id to ${currentId}, Datasource: ${getNodesPageLink(currentId)}`);
});
