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

const processWorkSheet = (wsData:XLSX.WorkSheet, url: string) => {
  // Worksheet data processing...
  XLSX.utils.sheet_add_aoa(wsData, [
    [],
    [`NOTE: This file was generated by [xlsx2csv-demo](${url}).`],
  ], { origin: -1 });
  return wsData;
}

const getTypeHandler = async (type: string | null) => {
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
  } else {
    return await fetch(new URL("./file-upload-template.html", import.meta.url));    
  }
}

const postHandler = async (request:Request, file:File | null) => {
  let responseFilename: string = `demo_data_${getTodayFormatString()}.csv`;
  const limitedFilesizeMB: number = 1; // The limited size of uploaded file in MB
  let wsData:XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
    [ "Type", "Message", "Code", ],
    [ "This is a demo!", "Loading OK!", 0 ],
    [ "这是一组演示数据", "成功读取", 65001 ],
    [ "Российская презентация", "1945-07-28", 6.666 ],
    [ "การนําเสนอเป็นภาษาไทย", "Created on 2024-11-12", 88.88 ],
    [ "File Size Limitation", `The limit on server side is ${limitedFilesizeMB}MB.`, limitedFilesizeMB * 1024 * 1024 ],
  ]);
  if (file) {
    try {
      // Check file size
      if (file.size > limitedFilesizeMB * 1024 * 1024) {
        throw new Error(`File size (${Math.round(file.size / (1024 * 1024) * 100) / 100}MB) is too large! The limit is ${limitedFilesizeMB}MB.`);
      }
      const fileData = await readFileDataAsArrayBuffer(file);
      const wbData = XLSX.read(fileData, {
        type: "binary",
        codepage: 65001,
        cellDates: true,
        UTC: false,
      });
      wsData = wbData.Sheets[wbData.SheetNames[0]];
      responseFilename = `processed_data_${getTodayFormatString()}.csv`;
      // console.log(wsData); // For debugging
    } catch (err) {
      console.error(err);
    }
  }
  const resp_x = XLSX.utils.sheet_to_csv(processWorkSheet(wsData, request.url));
  return new Response(resp_x, { 
    headers: { 
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${responseFilename}` 
    } 
  });  
}

const checkFavIcon = (url: string): string | null => {
  const faviconFiles: Array<string> = [
    "favicon.ico",
    "favicon.png",
    "favicon.jpg",
    "favicon.gif",
    "favicon.svg",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "site.webmanifest",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "apple-touch-icon.png",
  ];
  for (const faviconFile of faviconFiles)
    if (url.endsWith(faviconFile)) return faviconFile;
  return null;
} 

Deno.serve({ port: 8601, hostname: 'localhost' }, async (req) => {
  const params:URLSearchParams = new URL(req.url).searchParams;
  switch (req.method) {
    case "GET": {
      const faviconFile = checkFavIcon(req.url);
      if (faviconFile) return await fetch(new URL(`./assets/${faviconFile}`, import.meta.url));
      else return await getTypeHandler(params.get("type"));
    }
    case "POST":
      return await postHandler(req, await getFileFromFormData(req));
    default:
      return new Response(`Warning: Request method '${req.method}' not allowed!`, { status: 405 });
  }
});
