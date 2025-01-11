import * as YAML from '@std/yaml';
import { MihomoTemplateProxiesConfig, BaseNode, isCipherValidForSSNode } from './mihomo.ts';
import { encodeHexUnicode } from "./unicode-helper.ts";

export async function getHandler(request: Request): Promise<Response> {
  const url: URL = new URL(request.url);
  const link: string = decodeURIComponent(url.searchParams.get("link") || "");
  if (link) {
    try {
      const response: Response = await fetch(link);
      const originalText: string = await response.text();
      let processingText: string = originalText;
      console.log(`Fixing link: ${link}`);
      // 1. Remove invalid html element <pre> & </pre>.
      processingText = processingText.replace(/\<\/?pre.*\>/gm, '');
      console.log(`1. The process of removing invalid html elements '<pre>' & '</pre>' accomplished.`);
      // 2. Remove SS nodes with the incorrect configuration of 'cipher: ss'.
      const yamlObj: MihomoTemplateProxiesConfig = YAML.parse(processingText) as MihomoTemplateProxiesConfig;
      if (yamlObj['proxies']) {
        const oldProxiesCount : number = yamlObj['proxies'].length;
        const invalidProxies: Array<BaseNode> = yamlObj['proxies'].filter(proxy => (proxy['type'] === 'ss' && !isCipherValidForSSNode(proxy['cipher'])));
        const invalidProxiesName: Array<string> = invalidProxies.map(invalidProxy => invalidProxy['name']);
        yamlObj['proxies'] = yamlObj['proxies'].filter(proxy => !invalidProxiesName.includes(proxy['name']));
        yamlObj['proxy-groups'].forEach((proxyGroup) => {
          proxyGroup['proxies'] = proxyGroup['proxies'].filter(proxyName => !invalidProxiesName.includes(proxyName));
        });
        console.log(`2. The process of removing SS nodes with the incorrect configuration of 'cipher: ss' accomplished. Counted proxies: ${oldProxiesCount} => ${yamlObj['proxies'].length}, total ${oldProxiesCount - yamlObj['proxies'].length} proxies removed.`);
        if (invalidProxiesName.length > 0) console.log(`   Removed proxies: ${invalidProxiesName}`);
        console.log('OK');
        return new Response(encodeHexUnicode(YAML.stringify(yamlObj)), { status: 200 });
      }
      else throw new TypeError(`🧐 YamlError: Unable to seek the YAML object 'proxies', original text content listed below:\n\n${originalText}`);
    } catch (error) {
      return new Response(`🧐 ${error as string}`, { status: 500 });
    }
  }
  return await fetch(new URL(`./fix.html`, import.meta.url));
}
