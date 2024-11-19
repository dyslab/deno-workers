import * as YAML from '@std/yaml';
import { decodeUtf8, encodeHexUnicode, addYamlHeaderComment } from "./unicode-helper.ts";

interface V2rayNodeStructure {
  'protocol': string;
  'info': string;
}

interface BaseNode {
  'name': string;
  'type': string;
}

interface ProtocolSSNode {
  'name': string;
  'server': string;
  'port': number;
  'type': string;
  'udp': boolean;
  'cipher': string;
  'password': string;
}

interface ProtocolVmessNode {
  'name': string;
  'server': string;
  'servername': string;
  'port': number;
  'type': string;
  'sni': string;
  'tls': boolean;
  'uuid': string;
  'version': number;
  'cipher': string;
  'alterId': number;
  'network': string;
  'skip-cert-verify': boolean;
  'ws-opts': object;
  'http-opts': object;
}

interface ProtocolVlessNode {
  'name': string;
  'server': string;
  'port': number;
  'type': string;
  'sni': string;
  'tls': boolean;
  'uuid': string;
  'cipher': string;
  'network': string;
  'skip-cert-verify': boolean;
  'ws-opts': object;
  'http-opts': object;
}

interface ProtocolTrojanNode {
  'name': string;
  'server': string;
  'port': number;
  'type': string;
  'sni': string;
  'password': string;
  'network': string;
  'udp': boolean;
  'tls': boolean;
  'skip-cert-verify': boolean;
  'alpn': Array<string>;
}

interface MihomoTemplateProxyGroupsConfig {
  'name': string;
  'type': string;
  'proxies': Array<string>;
}

interface MihomoTemplateProxiesConfig {
  'proxies': Array<ProtocolSSNode | ProtocolVmessNode | BaseNode>;
  'proxy-groups': Array<MihomoTemplateProxyGroupsConfig>;
}

function parseV2rayNode(node: string): V2rayNodeStructure | null {
  const matchResult: Array<string> | null = node.match(/(\w{2,10}):\/\/(.+)/);
  if (matchResult && matchResult.length === 3) {
    const protocol: string = matchResult[1];
    const info: string = matchResult[2];
    return <V2rayNodeStructure>{ protocol, info };
  } else return null;
}

// V2ray nodes 
async function getMihomoTemplateObject(): Promise<MihomoTemplateProxiesConfig | null> {
  try {
    const templateText: string = await Deno.readTextFile("./template/v2rayse_20241116150227.yaml");
    return YAML.parse(templateText) as MihomoTemplateProxiesConfig;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function parseSSNode(info: string): ProtocolSSNode | null {
  try {
    const matchResult: Array<string> | null = decodeURIComponent(info).match(/(.+)@(.+):(\d+)#(.+)/);
    if (matchResult && matchResult.length === 5) {
      const [ cipher, password ]: string[] = atob(matchResult[1]).split(':');
      const server: string = matchResult[2];
      const port: number = parseInt(matchResult[3]);
      const name: string = matchResult[4];
      return <ProtocolSSNode>{ name, server, port, type: 'ss', udp: true, cipher, password };
    } else {
      const matchResult2: Array<string> | null = decodeURIComponent(info).match(/(.+)#(.+)/);
      if (matchResult2 && matchResult2.length === 3) {
        const name: string = matchResult2[2];
        const matchResult21: Array<string> | null = atob(matchResult2[1]).match(/(.+):(.+)@(.+):(\d+)/);
        if (matchResult21 && matchResult21.length === 5) {
          const cipher: string = matchResult21[1];
          const password: string = matchResult21[2];
          const server: string = matchResult21[3];
          const port: number = parseInt(matchResult21[4]);
          return <ProtocolSSNode>{ name, server, port, type: 'ss', udp: true, cipher, password };
        } else return null;
      } else return null;
    }
  } catch(error) {
    console.error(error)
    return null;
  }
}

function parseVmessNode(info: string): ProtocolVmessNode | null {
  try {
    const decodedInfo: string | null = decodeUtf8(info);
    const decodedObj = JSON.parse(decodedInfo);
    if (decodedObj) {
      const name: string = decodedObj['ps']? decodedObj['ps'] as string: '';
      const server: string = decodedObj['add']? decodedObj['add'] as string: '';
      const port: number = decodedObj['port']? decodedObj['port'] as number: 0;
      const version: number = decodedObj['v']? decodedObj['v'] as number: 0;
      const alterId: number = decodedObj['aid']? decodedObj['aid'] as number: 0;
      const sni: string = decodedObj['sni']? decodedObj['sni'] as string: '';
      const tls: boolean = decodedObj['tls']? decodedObj['tls'] as boolean: false;
      const servername: string = decodedObj['host']? decodedObj['host'] as string: '';
      const uuid: string = decodedObj['id']? decodedObj['id'] as string: '';
      const cipher: string = decodedObj['security']? decodedObj['security'] as string: 'auto';
      const network: string = decodedObj['net']? decodedObj['net'] as string: '';
      const skipCertVerify: boolean = decodedObj['skip-cert-verify']? decodedObj['skip-cert-verify'] as boolean: false;
      const vmessNode : ProtocolVmessNode = <ProtocolVmessNode>{ 
        name, server, port, version, sni, tls, servername, uuid, cipher, alterId, network,
        'type': 'vmess',
        'skip-cert-verify': skipCertVerify,
      };
      const opts: object = { 
        'path': decodedObj['path']? decodedObj['path'] as string: '',
        'headers': {
          'host': decodedObj['host']? decodedObj['host'] as string: ''
        }
      };
      switch (network) {
        case 'ws': {
          vmessNode[`ws-opts`] = opts;
          break;
        }
        case 'http': {
          vmessNode[`http-opts`] = opts;
          break;
        }
        default: 
          break;
      }
      return vmessNode;
    }
    else return null;  
  } catch(error) {
    console.error(error)
    return null;
  }
}

function parseVlessNode(info: string): ProtocolVlessNode | null {
  try {
    const matchResult: Array<string> | null = decodeURIComponent(info).match(/(.+)@(.*):([0-9]*)\?(.+)#(.*)/);
    if (matchResult && matchResult.length === 6) {
      const uuid: string = matchResult[1];
      const server: string = matchResult[2];
      const port: number = parseInt(matchResult[3]);
      const name: string = matchResult[5];
      const vlessNode: ProtocolVlessNode = <ProtocolVlessNode>{ name, server, port, type: 'vless', uuid };
      const params: string = matchResult[4];
      if (params) {
        const urlParams = new URLSearchParams(params);
        if (urlParams.has('type')) vlessNode['network'] = urlParams.get('type') as string;
        if (urlParams.has('sni')) vlessNode['sni'] = urlParams.get('sni') as string;
        if (urlParams.has('security')) vlessNode['cipher'] = urlParams.get('security') as string;
        const opts: object = { 
          'path': urlParams.has('path')? urlParams.get('path') as string : '',
          'headers': {
            'host': urlParams.has('host')? urlParams.get('host') as string : ''
          }
        };
        switch (vlessNode['network']) {
          case 'ws': {
            vlessNode[`ws-opts`] = opts;
            break;
          }
          case 'http': {
            vlessNode[`http-opts`] = opts;
            break;
          }
          default: 
            break;
        }  
      }
      return vlessNode;
    } else return null;
  } catch(error) {
    console.error(error)
    return null;
  }
}

function parseTrojanNode(info: string): ProtocolTrojanNode | null {
  try {
    const matchResult: Array<string> | null = decodeURIComponent(info).match(/(.+)@(.*):([0-9]*)\?(.+)#(.*)/);
    if (matchResult && matchResult.length === 6) {
      const password: string = matchResult[1];
      const server: string = matchResult[2];
      const port: number = parseInt(matchResult[3]);
      const name: string = matchResult[5];
      const trojanNode: ProtocolTrojanNode = <ProtocolTrojanNode>{ name, server, port, type: 'trojan', password };
      const params: string = matchResult[4];
      if (params) {
        const urlParams = new URLSearchParams(params);
        if (urlParams.has('sni')) trojanNode['sni'] = urlParams.get('sni') as string;
        if (urlParams.has('type')) trojanNode['network'] = urlParams.get('type') as string;
        if (urlParams.has('security')) trojanNode['tls'] = (urlParams.get('security') as string === 'tls')? true: false;
        if (urlParams.has('alpn')) trojanNode['alpn'] = [urlParams.get('alpn') as string];
        if (urlParams.has('skip-cert-verify')) trojanNode['skip-cert-verify'] = (urlParams.get('skip-cert-verify') as string === 'true')? true: false;  
      }
      return trojanNode;
    } else return null;
  } catch(error) {
    console.error(error)
    return null;
  }
}

async function convertNodesToMihomo(nodes: Array<string>): Promise<string> {
  const targetNodes: Array<ProtocolSSNode | BaseNode> = [];
  for (const node of nodes) {
    const v2rayNode: V2rayNodeStructure | null = parseV2rayNode(node);
    if (v2rayNode) {
      switch (v2rayNode.protocol.toLocaleLowerCase()) {
        case 'ss': {
          const ssNode: ProtocolSSNode | null = parseSSNode(v2rayNode.info);
          if (ssNode) targetNodes.push(ssNode);
          break;
        }
        case 'vmess': {
          const vmessNode : ProtocolVmessNode | null = parseVmessNode(v2rayNode.info);
          if (vmessNode) targetNodes.push(vmessNode);
          break;
        }
        case 'vless': {
          const vlessNode : ProtocolVlessNode | null = parseVlessNode(v2rayNode.info);
          if (vlessNode) targetNodes.push(vlessNode);
          break;
        }
        case 'trojan': {
          const trojanNode : ProtocolTrojanNode | null = parseTrojanNode(v2rayNode.info);
          if (trojanNode) targetNodes.push(trojanNode);
          break;
        }
      }
    }
  }
  // 如果没有找到可用节点，直接返回错误字符串
  if (targetNodes.length === 0) return 'Error: No available nodes found 🙁';
  // 节点名称防重，每个节点名称后面添加防重标记 @DySLaB_1, 2, 3...
  for (let i = 0; i < targetNodes.length; i++) {
    const node: BaseNode = targetNodes[i];
    if (node instanceof Object) node['name'] += `@DySLaB_${i + 1}`;
  }
  // 获取模板，导入节点，输出 Mihomo 节点文件 (YAML格式)
  const templateObj: MihomoTemplateProxiesConfig | null = await getMihomoTemplateObject();
  if (templateObj) {
    templateObj['proxies'] = targetNodes;
    const targetNodesName: Array<string> = targetNodes.map((node) => node['name']);
    for (const proxyGroup of templateObj['proxy-groups']) {
      if (proxyGroup['proxies'] === null) {
        proxyGroup['proxies'] = targetNodesName;
      } else if (!proxyGroup['proxies'].includes('REJECT')) {
        proxyGroup['proxies'].push(...targetNodesName);
      }
    }
    return addYamlHeaderComment(encodeHexUnicode(YAML.stringify(templateObj)));
  } else return '';
}

export { convertNodesToMihomo };
