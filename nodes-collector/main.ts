import { getDefaultResponseHtml, /*getDefaultResponseText, */getIncorrectIdMessage, getGeoIPInformation } from "./messages.ts";
import { getNodesPageList, setNextId, getNodesPageLink, getLinksFromDataSource } from "./datasources.ts";
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
  } else {
    // console.log(`Request ${request.url} at ${new Date().toISOString()}`); // For debugging
    for await (const dirEntry of Deno.readDir('./assets')) {
      // return the file if its filename exists in the assets directory
      if (request.url.endsWith(dirEntry.name)) return await fetch(new URL(`./assets/${dirEntry.name}`, import.meta.url));
    }
    // const clientIP: string | null = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for");
    const currentId: number | null = await loadNodesCurrentIdFromKv(kv);
    const lastUpdatedTime: Date | null = await loadNodesLastUpdatedTimeFromKv(kv);
    const geoIP: Map<string, string | number> = await getGeoIPInformation();
    const htmlContent: string = await getDefaultResponseHtml('./main.html', {
      links: getNodesPageList(),
      strCurrentId: String(currentId),
      strLastUpdatedTime: lastUpdatedTime? lastUpdatedTime.toLocaleString() : 'null',
      geoIP
    });
    return new Response(htmlContent, { 
      status: 200,
      headers: {
        'Accept-Encoding': 'gzip',
        'Content-Type': 'text/html; charset=utf-8',
        // 'Cache-Control': 'max-age=3600',
      }
    });
    /*
    const textContent: string = getDefaultResponseText(
      String(currentId), 
      lastUpdatedTime? lastUpdatedTime.toLocaleString() : 'null'
    );
    return new Response(textContent, { 
      status: 200,
      headers: {
        'Accept-Encoding': 'gzip',
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'max-age=3600',
      }
    });
    */
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
