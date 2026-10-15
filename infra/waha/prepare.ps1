$ErrorActionPreference = 'Stop'
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$privateDirectory = Join-Path $repositoryRoot '.local/waha'
$privateEnvironment = Join-Path $privateDirectory '.env'
New-Item -ItemType Directory -Force -Path $privateDirectory | Out-Null
if (-not (Test-Path -LiteralPath $privateEnvironment)) {
    $randomBytes = New-Object byte[] 32
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($randomBytes) } finally { $generator.Dispose() }
    $privateApiKey = ([BitConverter]::ToString($randomBytes)).Replace('-', '').ToLowerInvariant()
    [IO.File]::WriteAllText($privateEnvironment, "WAHA_API_KEY=$privateApiKey`n", (New-Object Text.UTF8Encoding($false)))
    # Restrict the generated file to this Windows user and SYSTEM.
    $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    & icacls $privateEnvironment /inheritance:r /grant:r "${currentIdentity}:(F)" 'SYSTEM:(F)' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not restrict the private key file permissions.' }
}
Write-Output 'Private WAHA configuration prepared. No session started or account paired.'
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Output 'Docker is missing. Install Docker Desktop with its WSL 2 prerequisites, then run start.ps1.'
}
