$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","$env:PORT=3001; npm run start:dev" -WorkingDirectory (Join-Path $root "backend-nestjs")
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","npm run dev -- --port 3002" -WorkingDirectory (Join-Path $root "frontend\admin-mfe")
Start-Process -FilePath "powershell" -ArgumentList "-NoExit","-Command","npm run dev -- --port 3003" -WorkingDirectory (Join-Path $root "frontend\demo-next")
