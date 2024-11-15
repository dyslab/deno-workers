export interface KvNodes {
  id: number;
  nodes: Array<string>;
  updated_time: Date;
}

export function setNodes(id: number, nodes: Array<string>): KvNodes {
  return {
    id: id,
    nodes: nodes,
    updated_time: new Date(),
  };
}

export async function loadNodesFromKv(kv: Deno.Kv, id: string): Promise<KvNodes | null> {
  const resp = await kv.get<KvNodes>(["nodes", String(id)]);
  if (resp.value) {
    return resp.value;
  }
  return null;
}

export async function loadNodesLastUpdatedTimeFromKv(kv: Deno.Kv): Promise<Date | null> {
  const resp = await kv.get<Date>(["nodes", "last_updated_time"]);
  return resp.value? resp.value : null;
}

export async function loadNodesCurrentIdFromKv(kv: Deno.Kv): Promise<number | null> {
  const resp = await kv.get<number>(["nodes", "current_id"]);
  return (resp.value !== null)? resp.value : null;
}

export async function saveNodesToKv(kv: Deno.Kv, nodes: KvNodes) {
  const resp = await kv.atomic()
   .set(["nodes", String(nodes.id)], nodes)
   .set(["nodes", "current_id"], nodes.id)
   .set(["nodes", "last_updated_time"], nodes.updated_time)
   .commit();
  if (!resp.ok) {
    throw new Error(`Failed to update nodes for [${nodes.id}]`);
  }
}
