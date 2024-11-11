// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

Deno.serve(() => {
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
});
