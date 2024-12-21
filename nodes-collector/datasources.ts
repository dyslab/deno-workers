const NODES_PAGE_LIST: Array<string> = [ 
  'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/LogInfo.txt',
  'https://v2cross.com/1884.html',
]

/**
 * 
 * Common functions
 * 
 */

function getNodesPageList(): string[] {
  return NODES_PAGE_LIST;
}

function setNextId(id: number): number {
  return (id + 1) % NODES_PAGE_LIST.length;
}

function getNodesPageLink(id: string | number): string | null {
  const numberId = parseInt(id as string);
  if (numberId >= 0 || numberId < NODES_PAGE_LIST.length)
    return NODES_PAGE_LIST[numberId];
  else 
    return null;
}

async function getLinksFromDataSource(id: number, count: number = 50): Promise<Array<string>> {
  switch (id) {
    case 0: return await getFastestNodesLinks(id, count);
    case 1: return await extractNodesFromV2Cross(id, count);
  }
  return [];
}

async function fetchSourceFile(url: URL | string): Promise<string> {
  const resp = await fetch(url);
  return await resp.text();
}

/**
 * 
 * The data types and functions below are designed to parse the following page(s)
 * 
 *  NODES_PAGE_LIST[0], 'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/LogInfo.txt'
 * 
 */ 
interface LogInfo {
  name: string;
  type: string;
  id: number;
  remarks: string;
  protocol: string;
  ping: number;
  avg_speed: number;
  max_speed: number;
  Link: string;
}

async function getFastestNodesLinks(id: number, count: number = 50): Promise<Array<string>> {
  const logInfos: Array<LogInfo> = await loadAvaliableNodesFromSource(id);
  // Sort by ping and avg_speed
  logInfos.sort((a: LogInfo, b: LogInfo) => {
    try {
      if (a.avg_speed > b.avg_speed) return -1;
      if (a.avg_speed < b.avg_speed) return 1;
      if (a.ping < b.ping) return -1;
      if (a.ping > b.ping) return 1;
      return 0;
    } catch {
      return 0;
    }
  });
  // console.log(logInfos.slice(0, count)); For debugging
  const links: Array<string> = logInfos.slice(0, count).map((logInfo: LogInfo) => logInfo.Link);
  return links;
}

async function loadAvaliableNodesFromSource(id: number): Promise<Array<LogInfo>> {
  const logInfos: Array<LogInfo> = [];
  if (id === 0) {
    // const responseText: string = await fetchSourceFile(new URL('./testdata/LogInfo.txt', import.meta.url)); // For testing
    const responseText: string = await fetchSourceFile(NODES_PAGE_LIST[id]);
    const logInfoStrings: Array<string> = responseText.split('\n');
    for (const logInfoString of logInfoStrings) {
      const logInfo: LogInfo | null = parseLogInfo(logInfoString);
      if(logInfo) logInfos.push(logInfo);
    }
  }
  return logInfos;
}

function parseLogInfo(logInfo: string): LogInfo | null {

  function parseNumber(value: string): number {
    const d: Array<string> | null = /[\+|\-]?\d+(.\d+)?/.exec(value);
    return d? parseFloat(d[0]) : 0;
  }

  function removeKey(str: string, key: string): string {
    const regEx: RegExp = new RegExp(`\s*${key}:\s*`, 'g');
    return str.replace(regEx, '').trim();
  }
  
  const [name, type, id, remarks, protocol, ping, avg_speed, max_speed, Link] = logInfo.split('|');
  const number_ping: number = parseNumber(ping);
  const number_Avg_speed: number = parseNumber(avg_speed);
  if (number_ping>0 && number_Avg_speed>0) {
    return {
      name: removeKey(name, 'name'),
      type: removeKey(type, 'type'),
      id: parseNumber(id),
      remarks: removeKey(remarks, 'remarks'),
      protocol: removeKey(protocol, 'protocol'),
      ping: number_ping,
      avg_speed: number_Avg_speed,
      max_speed: parseNumber(max_speed),
      Link: removeKey(Link, 'Link'),
    }
  } else {
    return null;
  }
}

/**
 * 
 * The data types and functions below are designed to parse the following page(s)
 * 
 *  NODES_PAGE_LIST[1], 'https://v2cross.com/1884.html'
 * 
 */ 
async function extractNodesFromV2Cross(id: number, count: number = 50): Promise<Array<string>> {
  const links: Array<string> = [];
  if (id === 1) {
    // const responseText: string = await fetchSourceFile(new URL('./testdata/v2cross.com_1884.html', import.meta.url)); // For testing
    const responseText: string = await fetchSourceFile(NODES_PAGE_LIST[id]);
    const htmlLines: Array<string> = responseText.split('\n');
    for (const htmlLine of htmlLines) {
      const link: string | null = extractLinkFromV2CrossLine(htmlLine);
      if (link) links.push(link);
    }
  }
  return links.slice(0, count);
}

function extractLinkFromV2CrossLine(line: string): string | null {
  function removeHtmlTag(str: string): string {
    const regEx: RegExp = /<\/?[^>]+(>|$)/g;
    return str.replace(regEx, '');
  }

  function validateLink(link: string): string | null {
    const regEx: RegExp = /\[.+\]/;
    const d: Array<string> | null = regEx.exec(link);
    return d? null : link;
  }

  const regEx: RegExp = /((vmess)|(vless)|(trojan)|(ssr)|(ss))(:\/\/)(.+)/;
  const d: Array<string> | null = regEx.exec(line);
  return d? validateLink(d[1] + d[7] + removeHtmlTag(d[8])) : null;
}

export { getNodesPageList, setNextId, getNodesPageLink, getLinksFromDataSource }
