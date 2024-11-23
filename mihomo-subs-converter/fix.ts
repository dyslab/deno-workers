import * as YAML from '@std/yaml';
import { MihomoTemplateProxiesConfig, BaseNode, isCipherValidForSSNode } from './mihomo.ts';
import { encodeHexUnicode } from "./unicode-helper.ts";

export async function getHandler(request: Request): Promise<Response> {
  const url: URL = new URL(request.url);
  const link: string = decodeURIComponent(url.searchParams.get("link") || "");
  if (link) {
    try {
      const response: Response = await fetch(link);
      const text: string = await response.text();
      const yamlObj: MihomoTemplateProxiesConfig = YAML.parse(text) as MihomoTemplateProxiesConfig;
      if (yamlObj['proxies']) {
        console.log(`Fixing link: ${link}`);
        const oldProxiesCount : number = yamlObj['proxies'].length;
        const invalidProxies: Array<BaseNode> = yamlObj['proxies'].filter(proxy => (proxy['type'] === 'ss' && !isCipherValidForSSNode(proxy['cipher'])));
        const invalidProxiesName: Array<string> = invalidProxies.map(invalidProxy => invalidProxy['name']);
        yamlObj['proxies'] = yamlObj['proxies'].filter(proxy => !invalidProxiesName.includes(proxy['name']));
        yamlObj['proxy-groups'].forEach((proxyGroup) => {
          proxyGroup['proxies'] = proxyGroup['proxies'].filter(proxyName => !invalidProxiesName.includes(proxyName));
        });
        console.log(`Source file has ${oldProxiesCount} proxies, Fixed file has ${yamlObj['proxies'].length} proxies. Removed ${oldProxiesCount - yamlObj['proxies'].length} invalid proxies.`);
        if (invalidProxiesName.length > 0) console.log(`Removed proxies: ${invalidProxiesName}`);
        return new Response(encodeHexUnicode(YAML.stringify(yamlObj)), { status: 200 });
      }
      throw new TypeError(`Fetched content is NOT a yaml file. We got text below... 🧐\n\n${text}`);
    } catch (error) {
      return new Response(error as string, { status: 500 });
    }
  }
  return await fetch(new URL(`./fix.html`, import.meta.url));
}
