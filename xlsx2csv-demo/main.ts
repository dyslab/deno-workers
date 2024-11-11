// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

const getHandler = async () => {
  const response:Response = await fetch(new URL("./file-upload-template.html", import.meta.url));
  // const response:Response = await fetch(new URL("./demo.json", import.meta.url));
  // const response:Response = await fetch("https://data.weather.gov.hk/weatherAPI/opendata/lunardate.php?date=[2024-11-12]");
  return response;
}

const postHandler = () => {
  const x = XLSX.utils.aoa_to_sheet([
    [ "type", "start", ],
    [ "prez",     "1789-04-21", ],
    [ "viceprez", "1789-04-21", ],
    [ "viceprez", "1793-03-04", ],
  ]);
  const resp_x = XLSX.utils.sheet_to_csv(x);
  return new Response(resp_x, { 
    headers: { 
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": "attachment; filename=test.csv" 
    } 
  });
}

Deno.serve({ port: 8601, hostname: 'localhost' }, async (req: Request) => {
  switch (req.method) {
    case "GET":
      return await getHandler();
    case "POST":
      return postHandler();
    default:
      return new Response(`Warning: Request method '${req.method}' not allowed!`, { status: 405 });
  }
});
