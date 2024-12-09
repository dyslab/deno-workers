import { getDefaultResponseMessage, getIncorrectIdMessage } from "./messages.ts";
import { setNextId, getNodesPageLink, getLinksFromDataSource } from "./datasources.ts";
import { loadNodesFromKv, loadNodesCurrentIdFromKv, loadNodesLastUpdatedTimeFromKv, setKvNodes, saveNodesToKv } from "./kvnodes.ts";

const kv = await Deno.openKv();

Deno.serve({ port: 8602, hostname: 'localhost' }, async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const nodes: Array<string> | null = await loadNodesFromKv(kv, id);
    if (nodes) {
      return new Response(nodes.join('\n'), {
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
      const testID: number = 0;
      const nodesLinks: Array<string> = await getLinksFromDataSource(testID, 88);
      await saveNodesToKv(kv, setKvNodes(testID, nodesLinks));
      return new Response(nodesLinks.join('\n') + '\n\n' + String(nodesLinks.length), { status: 200 });
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

// Cron job runs at the 13th minute every 12 hours (UTC)
Deno.cron("Daily Fetch And Save", "13 */12 * * *", async () => {
  const currentId: number | null = await loadNodesCurrentIdFromKv(kv);
  const numberCurrentId: number = (currentId !== null)? setNextId(currentId) : 0;
  const nodesLinks : Array<string> = await getLinksFromDataSource(numberCurrentId, 88);
  await saveNodesToKv(kv, setKvNodes(numberCurrentId, nodesLinks));
  console.log(`Cron job finished at: ${new Date().toISOString()}. Saved ${nodesLinks.length} nodes. Set current Id to ${numberCurrentId}, Datasource: ${getNodesPageLink(numberCurrentId)}`);
});
