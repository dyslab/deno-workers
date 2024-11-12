# xlsx2csv-demo: A Deno Worker Demo For XLSX File To CSV File Conversion

## Development & Deployment

```bash
deno task dev       # Development

deno task deploy    # Deployment
```

## Importing Package 'xlsx' in Deno Project

```ts
// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.3/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';
// load the codepage support library for extended support with older formats
import * as cptable from 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/cpexcel.full.mjs';
XLSX.set_cptable(cptable);
```

> NOTE: Please refer to <https://docs.sheetjs.com/docs/getting-started/installation/deno/> for more details about importing npm:xlsx package (Officially from SheetJS) in deno project.
