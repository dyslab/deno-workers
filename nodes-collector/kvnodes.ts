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

export async function loadNodesLastUpdatedInfoFromKv(kv: Deno.Kv): Promise<[number | null, Date | null]> {
  const respId = await kv.get<number>(["nodes", "current_id"]);
  const currentId : number | null = respId !== null? respId.value : null;
  const respDatetime = await kv.get<Date>(["nodes", "last_updated_time"]);
  const lastUpdatedTime : Date | null = respDatetime? respDatetime.value : null;
  return [currentId, lastUpdatedTime];
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
