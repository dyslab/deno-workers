import { decodeUtf8 } from "./unicode-helper.ts";
import { isValidNode, getNodesFromLocalStorage, insertNodesToLocalStorage } from "./localstorage.ts";
import { convertNodesToMihomo } from "./mihomo.ts";

function checkFavIcon(url: string): string {
  const faviconFiles: Array<string> = [
    "favicon.ico",
    "favicon.png",
    "favicon.jpg",
    "favicon.gif",
    "favicon.svg",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "site.webmanifest",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "apple-touch-icon.png",
  ];
  for (const faviconFile of faviconFiles)
    if (url.endsWith(faviconFile)) return faviconFile;
  return '';
} 

function isTrueOrYes(value: string | null): boolean {
  return (value && ['true', 'yes'].includes(value.toLowerCase()))? true : false;
}

async function v2rayToMihomo(link: string, b64DecodeFlag: boolean): Promise<string> {
  try {
    const localStorageNodes : Array<string> | null =  getNodesFromLocalStorage(link);
    if (localStorageNodes) {
      return await convertNodesToMihomo(localStorageNodes);
    }
    const resp: Response = await fetch(link);
    let v2rayText: string = await resp.text();
    const vaildV2rayNodes: Array<string> = [];
    if (resp.ok) {
      if (b64DecodeFlag) v2rayText = decodeUtf8(v2rayText);
      const v2rayNodes: Array<string> = v2rayText.split('\n');
      for (const v2rayNode of v2rayNodes) {
        if (isValidNode(v2rayNode)) {
          vaildV2rayNodes.push(v2rayNode);
        }
      }
      if (vaildV2rayNodes.length > 0) insertNodesToLocalStorage(link, vaildV2rayNodes);
    }
    return resp.ok? vaildV2rayNodes.join('') : '';
  } catch (error) {
    console.error(error);
    return '';
  }
}

Deno.serve({ port: 8603, hostname: 'localhost' }, async (request) => {
  switch (request.method) {
    case "GET": {
      const favIcon: string = checkFavIcon(request.url);
      if (favIcon) return await fetch(new URL(`./assets/${favIcon}`, import.meta.url));
      else {
        const url: URL = new URL(request.url);
        const link: string = decodeURIComponent(url.searchParams.get("link") || "");
        const b64DecodeFlag: boolean = isTrueOrYes(url.searchParams.get("base64"));
        if(link) {
          const return_value: string = await v2rayToMihomo(link, b64DecodeFlag);
          return new Response(return_value, { status: 200 });  
        } else {
          return await fetch(new URL(`./default.html`, import.meta.url));
        }
      }
    }
    default:
      return new Response(`Request method ${request.method} not support.`, { status: 200 });
  }
});