import { decodeUtf8 } from "./unicode-helper.ts";
import { isValidNode, detectStorage, getNodesFromStorage, insertNodesToStorage, removeExpiredNodesFromStorage } from "./storage.ts";
import { convertNodesToMihomo } from "./mihomo.ts";
import * as FIX from "./fix.ts";

// 检测存储类型, 优先使用 localStorage, 其次使用 Deno.Kv, 都不可用则返回 null
const kvStorage = await detectStorage();

function checkFavIcon(url: string): string {
  const faviconFiles: Array<string> = [
    "styles.css",
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

async function v2rayToMihomo(link: string, b64DecodeFlag: boolean, templateId: number): Promise<string> {
  try {
    const stroageNodes : Array<string> | null =  await getNodesFromStorage(link, kvStorage);
    if (stroageNodes) {
      return await convertNodesToMihomo(stroageNodes, templateId);
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
      if (vaildV2rayNodes.length > 0) {
        await insertNodesToStorage(link, vaildV2rayNodes, kvStorage)
        return await convertNodesToMihomo(vaildV2rayNodes, templateId);
      } else return 'Error: Node resolution failed. Change the decoding option and try again. 🙁'
    } else return 'Error: Response not ok 🙁';
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'InvalidCharacterError') {
        return 'InvalidCharacterError: Check base64 decoding option 🙁';
      } else {
        return 'DOMException: Check url and base64 decoding option 🙁';
      }
    } else return error as string;
  }
}

async function getRouter(request: Request): Promise<Response> {
  // 处理 favicon.ico 请求
  const favIcon: string = checkFavIcon(request.url);
  if (favIcon) return await fetch(new URL(`./assets/${favIcon}`, import.meta.url));
  else {
    const url: URL = new URL(request.url);
    if (url.pathname === '/') {
      // 处理根路径请求
      const link: string = decodeURIComponent(url.searchParams.get("link")?? "");
      const b64DecodeFlag: boolean = isTrueOrYes(url.searchParams.get("base64"));
      const templateId: number = parseInt(url.searchParams.get("template")?? '0');
      if (link) {
        const returnText: string = await v2rayToMihomo(link, b64DecodeFlag, templateId);
        return new Response(returnText, { status: 200 });
      }
    } else {
      // 处理其他路径请求
      switch (url.pathname) {
        case '/fix':
          return await FIX.getHandler(request);
        default:
          return new Response(`Request path ${url.pathname} not support.`, { status: 404 });
      }
    }
  }
  return await fetch(new URL(`./default.html`, import.meta.url));
}

Deno.serve({ port: 8603, hostname: 'localhost' }, async (request) => 
  (request.method === 'GET')? 
  await getRouter(request) : 
  new Response(`Request method ${request.method} not support.`, { status: 200 })
);

Deno.cron('Auto remove expired nodes from storage daily', '33 03 * * *', async () => {
  await removeExpiredNodesFromStorage(kvStorage);
});
