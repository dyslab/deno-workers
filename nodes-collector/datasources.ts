const NODES_PAGE_LIST: Array<string> = [ 
  'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/LogInfo.txt',
]

/**
 * 
 * Common functions
 * 
 */
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
    case 1: break; // return (await fetchSourceFile(NODES_PAGE_LIST[id])).split('\n');
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
    if (a.avg_speed < b.avg_speed) return -1;
    if (a.avg_speed > b.avg_speed) return 1;
    if (a.max_speed < b.max_speed) return -1;
    if (a.max_speed > b.max_speed) return 1;
    if (a.ping < b.ping) return -1;
    if (a.ping > b.ping) return 1;
    return 0;
  });
  // console.log(logInfos.slice(0, count)); For debugging
  const links: Array<string> = logInfos.slice(0, count).map((logInfo: LogInfo) => logInfo.Link);
  return links;
}

async function loadAvaliableNodesFromSource(id: number): Promise<Array<LogInfo>> {
  const logInfos: Array<LogInfo> = [];
  if (id >= 0 || id < NODES_PAGE_LIST.length) {
    const responseText: string = await fetchSourceFile(NODES_PAGE_LIST[id]);
    switch (id) {
      case 0: {
        // const responseText: string = await fetchSourceFile(new URL('./testdata/LogInfo.txt', import.meta.url)); // For testing
        const logInfoStrings: Array<string> = responseText.split('\n');
        for (const logInfoString of logInfoStrings) {
          const logInfo: LogInfo | null = parseLogInfo(logInfoString);
          if(logInfo) logInfos.push(logInfo);
        }
        return logInfos;
      }
      default:
        return logInfos;
    }
  } else {
    return logInfos;
  }
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

export { setNextId, getNodesPageLink, getLinksFromDataSource }
