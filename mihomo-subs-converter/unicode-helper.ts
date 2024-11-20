/*
  Url-Safe 64 decoding with chinese unicode support
*/
export function decodeUtf8(str: string): string {
  return decodeURIComponent(
    new TextDecoder('utf-8').decode(
      new Uint8Array(
        atob(str.replace(/_/g, '/').replace(/-/g, '+')).split('').map(
          (c) => c.charCodeAt(0)
        )
      )
    )
  );
}

export function encodeHexUnicode(str: string): string {
  const hexUnicodeArray: Array<string> | null = str.match(/\\[UuXX]([0-9A-F]{8})/gm);
  if (hexUnicodeArray) {
    const tempSet = new Set(hexUnicodeArray);
    const hexUnicodes: Array<string> = [...tempSet];
    for (const hexUnicode of hexUnicodes) {
      const unicode: string = String.fromCodePoint(parseInt(hexUnicode.substring(2), 16));
      str = str.replaceAll(hexUnicode, unicode);
    }
  }
  return str;
}

export function addYamlHeaderComment(str: string): string {
  return `# 模版来源：v2rayse.com
# 模版名称：DySLaB
# 生成时间：${new Date()}
# 不要随意改变关键字，否则会导致出错
# acl4SSR规则
# 去广告：支持
# 自动测速：支持
# 微软分流：支持
# 苹果分流：支持
# 增强中国IP段：不支持
# 增强国外GFW：不支持
# 节点类型：ss / ssr / vmess / vless / trojan

${str}`;
}
