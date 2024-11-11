# My Deno Workers Demo Compilation

[![Deno deploy](./assets/deno-deploy.svg)](https://deno.com/)

Each subfolder of this project connects to a deno worker demo.

## Subfolders / Worker projects

1. **[XLSX File To CSV File Demo](./xlsx2cxv-demo/)**: This is a demo to upload a xlsx file and then convert to a csv file for downloading. It purpose to be a basic deno snippet for xlsx file middleware / processor.

## Deno Installation

```bash
curl -fsSL https://deno.land/install.sh | sh # For Mac / Linux

# Or,

irm https://deno.land/install.ps1 | iex # For Windows (PowerShell)

deno --version # Output deno version

deno --help # For help
```

> NOTE: Please refer to <https://docs.deno.com/runtime/getting_started/installation/> for more details about the installation of deno project.
