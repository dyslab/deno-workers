import * as YAML from '@std/yaml';
import { decodeUtf8, encodeHexUnicode, addYamlHeaderComment } from "./unicode-helper.ts";

// 有关各类代理协议的配置信息，请参考 https://stash.wiki/proxy-protocols/proxy-types
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

interface ProtocolSSRNode {
  'name': string;
  'server': string;
  'port': number;
  'type': string;
  'udp': boolean;
  'obfs': string;
  'protocol': string;
  'cipher': string;
  'password': string;
  'group': string;
  'obfs-param': string;
  'protocol-param': string;
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
  function isCipherValidForSSNode(cipher: string): boolean {
    const validCipherForSSNode = [
      'aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm', 'chacha20-ietf-poly1305', 'xchacha20-ietf-poly1305',
      'aes-128-cfb', 'aes-192-cfb', 'aes-256-cfb', 'rc4-md5', 'chacha20-ietf', 'xchacha20',
      'aes-128-ctr', 'aes-192-ctr', 'aes-256-ctr',
    ];
    return validCipherForSSNode.includes(cipher);
  }

  try {
    const matchResult: Array<string> | null = decodeURIComponent(info).match(/(.+)@(.+):(\d+)#(.+)/);
    if (matchResult && matchResult.length === 5) {
      const [ cipher, password ]: string[] = atob(matchResult[1]).split(':');
      if (!isCipherValidForSSNode(cipher)) throw new TypeError('Invalid cipher method');
      const server: string = matchResult[2];
      const port: number = parseInt(matchResult[3]);
      const name: string = matchResult[4];
      return <ProtocolSSNode>{ 
        name, server, port, cipher, password, 
        'type': 'ss', 
        'udp': true 
      };
    } else {
      const matchResult2: Array<string> | null = decodeURIComponent(info).match(/(.+)#(.+)/);
      if (matchResult2 && matchResult2.length === 3) {
        const name: string = matchResult2[2];
        const matchResult21: Array<string> | null = atob(matchResult2[1]).match(/(.+):(.+)@(.+):(\d+)/);
        if (matchResult21 && matchResult21.length === 5) {
          const cipher: string = matchResult21[1];
          if (!isCipherValidForSSNode(cipher)) throw new TypeError('Invalid cipher method');
          const password: string = matchResult21[2];
          const server: string = matchResult21[3];
          const port: number = parseInt(matchResult21[4]);
          return <ProtocolSSNode>{ 
            name, server, port, cipher, password, 
            'type': 'ss', 
            'udp': true 
          };
        }
      }
    }
  } catch(error) {
    console.error(error)
  }
  return null;
}

/*
  SSR QRcode scheme: https://github.com/shadowsocksr-backup/shadowsocks-rss/wiki/SSR-QRcode-scheme
  ssr://base64(host:port:protocol:method:obfs:base64pass/?obfsparam=base64param&protoparam=base64param&remarks=base64remarks&group=base64group&udpport=0&uot=0)
  */
function parseSSRNode(info: string): ProtocolSSRNode | null {
  try {
    const decodedInfo: string | null = decodeUtf8(info);
    const matchResult: Array<string> | null = decodedInfo.match(/(.*):([0-9]*):(.+):(.+):(.+):(.+)/);
    if (matchResult && matchResult.length === 7) {
      const server: string = matchResult[1];
      const port: number = parseInt(matchResult[2]);
      const protocol: string = matchResult[3];
      const cipher: string = matchResult[4];
      const obfs: string = matchResult[5];
      const ssrNode: ProtocolSSRNode = <ProtocolSSRNode>{ 
        server, port, protocol, obfs, cipher,
        'type': 'ssr', 
        'udp': true 
      };
      const [encodedPassword, params] = matchResult[6].split('/?');
      if (encodedPassword) ssrNode['password'] = decodeURIComponent(atob(encodedPassword));
      if (params) {
        const urlParams = new URLSearchParams(params);
        if (urlParams.has('group')) ssrNode['group'] = decodeURIComponent(atob(urlParams.get('group') as string));
        if (urlParams.has('remark')) ssrNode['name'] = decodeURIComponent(atob(urlParams.get('remark') as string));
        if (urlParams.has('obfsparam')) ssrNode['obfs-param'] = decodeURIComponent(atob(urlParams.get('obfsparam') as string));
        if (urlParams.has('protoparam')) ssrNode['protocol-param'] = decodeURIComponent(atob(urlParams.get('protoparam') as string));
      }
      return ssrNode;
    }
  } catch(error) {
    console.error(error);
  }
  return null;
}

function parseVmessNode(info: string): ProtocolVmessNode | null {
  try {
    const decodedInfo: string | null = decodeUtf8(info);
    const decodedObj = JSON.parse(decodedInfo);
    if (decodedObj) {
      const name: string = decodedObj['ps']? decodedObj['ps'] as string: '';
      const server: string = decodedObj['add']? decodedObj['add'] as string: '';
      const port: number = decodedObj['port']? parseInt(decodedObj['port'] as string): 0;
      const alterId: number = decodedObj['aid']? parseInt(decodedObj['aid'] as string): 0;
      const sni: string = decodedObj['sni']? decodedObj['sni'] as string: '';
      const servername: string = decodedObj['host']? decodedObj['host'] as string: '';
      const tls: boolean = decodedObj['tls']? Boolean(decodedObj['tls'] as boolean): false;
      const uuid: string = decodedObj['id']? decodedObj['id'] as string: '';
      const cipher: string = (decodedObj['scy'] || decodedObj['security'])? (decodedObj['scy'] as string || decodedObj['security'] as string): 'auto';
      const network: string = decodedObj['net']? decodedObj['net'] as string: '';
      const skipCertVerify: boolean = decodedObj['skip-cert-verify']? Boolean(decodedObj['skip-cert-verify'] as boolean): false;
      const vmessNode : ProtocolVmessNode = <ProtocolVmessNode>{ 
        name, server, port, sni, servername, tls, uuid, cipher, alterId, network,
        'type': 'vmess',
        'skip-cert-verify': skipCertVerify,
      };
      if (decodedObj['v']) vmessNode['version'] = Number(decodedObj['v'] as number);
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
  } catch(error) {
    console.error(error)
  }
  return null;
}

function parseVlessNode(info: string): ProtocolVlessNode | null {
  try {
    const matchResult: Array<string> | null = decodeURIComponent(info).match(/(.+)@(.*):([0-9]*)\?(.+)#(.*)/);
    if (matchResult && matchResult.length === 6) {
      const uuid: string = matchResult[1];
      const server: string = matchResult[2];
      const port: number = parseInt(matchResult[3]);
      const name: string = matchResult[5];
      const vlessNode: ProtocolVlessNode = <ProtocolVlessNode>{ 
        name, server, port, uuid, 
        'type': 'vless' 
      };
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
    }
  } catch(error) {
    console.error(error);
  }
  return null;
}

function parseTrojanNode(info: string): ProtocolTrojanNode | null {
  try {
    const matchResult: Array<string> | null = decodeURIComponent(info).match(/(.+)@(.*):([0-9]*)\??(.+)?#(.*)/);
    if (matchResult && matchResult.length === 6) {
      const password: string = matchResult[1];
      const server: string = matchResult[2];
      const port: number = parseInt(matchResult[3]);
      const name: string = matchResult[5];
      const trojanNode: ProtocolTrojanNode = <ProtocolTrojanNode>{ 
        name, server, port, password,
        'udp': true,
        'type': 'trojan',
      };
      if (matchResult[4]) {
        const urlParams = new URLSearchParams(matchResult[4]);
        if (urlParams.has('sni')) trojanNode['sni'] = urlParams.get('sni') as string;
        if (urlParams.has('type')) trojanNode['network'] = urlParams.get('type') as string;
        if (urlParams.has('security')) trojanNode['tls'] = ['tls', 'true'].includes((urlParams.get('security') as string).toLocaleLowerCase())? true: false;
        if (urlParams.has('alpn')) trojanNode['alpn'] = [urlParams.get('alpn') as string];
        if (urlParams.has('skip-cert-verify')) trojanNode['skip-cert-verify'] = (urlParams.get('skip-cert-verify') as string === 'true')? true: false;  
      }
      return trojanNode;
    }
  } catch(error) {
    console.error(error);
  }
  return null;
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
        case 'ssr': {
          const ssrNode: ProtocolSSRNode | null = parseSSRNode(v2rayNode.info);
          if (ssrNode) targetNodes.push(ssrNode);
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
  if (targetNodes.length === 0) return 'Error: No available nodes found. Check the link and the decoding method again 🙁';
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
