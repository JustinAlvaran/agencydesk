$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'prepare.ps1')
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop is required and must be running.' }
& docker info --format '{{.OSType}}'
if ($LASTEXITCODE -ne 0) { throw 'Docker is installed but its engine is not ready.' }
$privateEnvironment = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../.local/waha/.env'))
$composeFile = Join-Path $PSScriptRoot 'compose.yaml'
& docker compose --env-file $privateEnvironment -f $composeFile config --quiet
if ($LASTEXITCODE -ne 0) { throw 'WAHA configuration validation failed.' }
& docker compose --env-file $privateEnvironment -f $composeFile up -d
if ($LASTEXITCODE -ne 0) { throw 'WAHA container startup failed.' }
Write-Output 'WAHA is bound to localhost:3001. No WhatsApp session has been created or paired.'
