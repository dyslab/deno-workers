/**
 * Get the geoip information
 * @param ip <string | null> the ip address to query, default to null
 * @returns Map<string, string | number> the geoip information
 */
export const getGeoIPInformation = async (ip: string | null = null): Promise<Map<string, string | number>> => {
  const ipQuery: string = ip? `/${ip}` : '';
  try {
    const response = await fetch(`https://api.ip.sb/geoip${ipQuery}`);
    return new Map(Object.entries(await response.json()));  
  } catch(_err) {
    return new Map();
  }
}

/**
 * Get html content as the default response
 * @param htmlFilePath <string> the filepath of html file
 * @returns <string> the content of html file
 */
export const getDefaultResponseHtml = async (
  htmlFilePath: string, params: { 
    links: string[],
    strCurrentId: string,
    strLastUpdatedTime: string,
    geoIP: Map<string, string | number> 
  }
): Promise<string> => {
  const subsLink: string = params.links.map((link, id) => `<a class="custom-link" href="/?id=${id}" title="source: ${link}">🆔 ${id}</a>`).join(' | ');
  const html:string = await Deno.readTextFile(htmlFilePath);
  return html.replaceAll(/\${subsLink}/g, subsLink)
  .replaceAll(/\${currentId}/g, params.strCurrentId)
  .replaceAll(/\${lastUpdatedTime}/g, params.strLastUpdatedTime)
  .replaceAll(/\${ip}/g, params.geoIP.get('ip') as string || '')
  .replaceAll(/\${organization}/g, params.geoIP.get('organization') as string || '')
  .replaceAll(/\${asn}/g, params.geoIP.get('asn') as string || '')
  .replaceAll(/\${isp}/g, params.geoIP.get('isp') as string || '')
  .replaceAll(/\${country}/g, params.geoIP.get('country') as string || '')
  .replaceAll(/\${continent_code}/g, params.geoIP.get('continent_code') as string || '')
  .replaceAll(/\${timezone}/g, params.geoIP.get('timezone') as string || '');
};

/**
 * Get text message as the default response
 * @param currentId <string> the current id read from KV
 * @param lastUpdatedTime <string> the last updated time read from KV
 * @returns <string> the default response message
 */
export const getDefaultResponseText = (currentId: string, lastUpdatedTime: string): string => `
This demo page is powered by Deno, and deployed on the Deno Deploy Server with its free tier. All datasource pages which fetched by the demo were developed and maintained by other talented and warmhearted developers. I hereby would like to give them thumbs up and also contribute my respectful thanks to all of them. 

HINT: Remember to give this link a parameter 'id' to fetch a v2ray nodes file. ✈️

KV database (id:${currentId}) last updated at ${lastUpdatedTime}, ${Intl.DateTimeFormat().resolvedOptions().timeZone}

Version: v2024.12.09
`;

/**
 * Get text message as the incorrect id response
 * @param value <string | null> the value that seems incorrect
 * @returns <string> the incorrect id message
 */
export const getIncorrectIdMessage = (value: string | null): string => `
The value '${value}' seems incorrect. 😉
`;
