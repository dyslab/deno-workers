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

export function unescapeString(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
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
