# My Deno Workers Demo Compilation

[![Deno deploy](./assets/deno-deploy.svg)](https://deno.com/)

Each subfolder of this project connects to a deno worker demo.

## Subfolders / Worker projects

1. **[XLSX File To CSV File Demo](./xlsx2csv-demo/)**: This is a demo to upload a xlsx / csv file and then convert to a csv file for downloading. It purpose to be a basic deno snippet for xlsx / csv file middleware / processor.

2. **[Nodes Collector](./nodes-collector/)**: This is a toolkit for collecting v2ray nodes from specific datasources.

3. **[Mihomo Subscription File / Link Converter](./mihomo-subs-converter/)**: This is a toolkit for generating mihomo subscription file / link from v2ray subscription link.

## Deno / Deno Deploy Installation

```bash
# Deno
curl -fsSL https://deno.land/install.sh | sh # For Mac / Linux
# Or `irm https://deno.land/install.ps1 | iex` # For Windows (PowerShell)

deno --version # Output deno version

deno --help # For help

# Deno Deploy
deno install -A jsr:@deno/deployctl --global # Install deno deploy

deployctl --version # Output deno deploy version

deployctl --help  # For help
```

> NOTE: Please refer to <https://docs.deno.com/runtime/> and <https://docs.deno.com/deploy/manual/> for more details about the deno and deno deploy.
