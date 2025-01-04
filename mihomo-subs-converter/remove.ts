import { StorageType, removeKeyFromStorage } from "./storage.ts";

export async function getHandler(request: Request, kvStorage: StorageType): Promise<Response> {
  const url: URL = new URL(request.url);
  const key: string = decodeURIComponent(url.searchParams.get("key") || "");
  if (key) {
    const result: string = await removeKeyFromStorage(key, kvStorage);
    console.log(result);
    return new Response(result, { status: 200 });
  } else {
    return new Response('Request key not found.', { status: 404 });
  }
}
