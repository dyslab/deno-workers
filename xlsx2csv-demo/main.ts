// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
// load the codepage support library for extended support with older formats
import * as cptable from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);

const getTodayFormatString = () => {
  const today:Date = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

const getFileFromFormData = async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get("file");
  if (file instanceof File) {
    return file;
  } else {
    return null;
  }
}

const readFileDataAsArrayBuffer = (file: File) => {
  return new Promise((resolve, reject) => {
    const reader: FileReader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const processWorkSheet = (wsData:XLSX.WorkSheet) => {
  // Worksheet data processing...
  XLSX.utils.sheet_add_aoa(wsData, [
    [],
    ['NOTE: This file was generated by xlsx2csv-demo.'],
  ], { origin: -1 });
  return wsData;
}

const getHandler = async (type: string | null) => {
  if (type) {
    switch (type.toLocaleLowerCase()) {
      case "json":
        return await fetch(new URL("./demo.json", import.meta.url), {
          headers: {
            "Accept": "application/json"
          }
        });
      case "remote": {
        return await fetch(`https://data.weather.gov.hk/weatherAPI/opendata/lunardate.php?date=[${getTodayFormatString()}]`, {
          headers: {
            "Accept": "application/json"
          },
        });
      }
    }
  }
  return await fetch(new URL("./file-upload-template.html", import.meta.url));
}

const postHandler = async (file:File | null) => {
  let responseFilename: string = `demo_data_${getTodayFormatString()}.csv`;
  let wsData:XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [ "Type", "Message", "Code", ],
    [ "This is a demo!", "OK!", 0 ],
    [ "这是一组演示数据", "成功读取", 65001 ],
  ]);
  if (file) {
    responseFilename = `processed_data_${getTodayFormatString()}.csv`;
    try {
      const fileData = await readFileDataAsArrayBuffer(file);
      const wbData = XLSX.read(fileData, {
        type: "binary",
        codepage: 65001,
        cellDates: true,
        UTC: false,
      });
      wsData = wbData.Sheets[wbData.SheetNames[0]];
      // console.log(wsData); // For debugging
    } catch (err) {
      console.log(err)
    }
  }
  const resp_x = XLSX.utils.sheet_to_csv(processWorkSheet(wsData));
  return new Response(resp_x, { 
    headers: { 
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${responseFilename}` 
    } 
  });  
}

Deno.serve({ port: 8601, hostname: 'localhost' }, async (req: Request) => {
  const params:URLSearchParams = new URL(req.url).searchParams;
  switch (req.method) {
    case "GET":
      return await getHandler(params.get("type"));
    case "POST":
      return await postHandler(await getFileFromFormData(req));
    default:
      return new Response(`Warning: Request method '${req.method}' not allowed!`, { status: 405 });
  }
});