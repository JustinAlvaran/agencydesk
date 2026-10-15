$ErrorActionPreference = 'Stop'
$privateDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../.local/waha'))
$keyLine = [IO.File]::ReadAllLines((Join-Path $privateDirectory '.env')) | Where-Object { $_.StartsWith('WAHA_API_KEY=') } | Select-Object -First 1
if (-not $keyLine) { throw 'Run prepare.ps1 first.' }
$privateHeaders = @{ 'X-Api-Key' = $keyLine.Substring('WAHA_API_KEY='.Length) }
$base = 'http://127.0.0.1:3001'
# Verify API authentication before creating a session. Never log response bodies.
$unauthorizedStatus = $null
try { $null = Invoke-WebRequest -Uri "$base/api/sessions" -UseBasicParsing -TimeoutSec 15 }
catch { if ($_.Exception.Response) { $unauthorizedStatus = [int]$_.Exception.Response.StatusCode } }
if ($unauthorizedStatus -ne 401 -and $unauthorizedStatus -ne 403) { throw 'WAHA is unavailable or its API is not protected; pairing stopped.' }
$sessions = @(Invoke-RestMethod -Uri "$base/api/sessions?all=true" -Headers $privateHeaders -TimeoutSec 20)
$session = $sessions | Where-Object { $_.name -eq 'default' } | Select-Object -First 1
if (-not $session) {
    $body = @{ name = 'default'; start = $true; config = @{ webhooks = @(); ignore = @{ groups = $true; channels = $true; status = $true; broadcast = $true }; client = @{ deviceName = 'AgencyDesk'; browserName = 'Chrome' } } } | ConvertTo-Json -Depth 6
    $session = Invoke-RestMethod -Method Post -Uri "$base/api/sessions" -Headers $privateHeaders -ContentType 'application/json' -Body $body -TimeoutSec 30
} elseif ($session.status -eq 'STOPPED') {
    $session = Invoke-RestMethod -Method Post -Uri "$base/api/sessions/default/start" -Headers $privateHeaders -TimeoutSec 30
}
if ($session.status -eq 'WORKING') {
    $account = Invoke-RestMethod -Uri "$base/api/sessions/default/me" -Headers $privateHeaders -TimeoutSec 15
    # Only confirm the user-authorized sender; do not expose another account.
    if ($account.id -notmatch '^639913780170(?::\d+)?@') { throw 'A different account is linked. No changes were made to it.' }
    Write-Output 'The intended WhatsApp account is linked. No messages were sent.'
    exit 0
}
Write-Output ('Session status: ' + $session.status)
if ($session.status -ne 'SCAN_QR_CODE') {
    Write-Output 'Session is starting. Run this script again to retrieve its QR; do not recreate or restart it.'
    exit 0
}
$qrPath = Join-Path $privateDirectory 'pairing-qr.png'
$qrHeaders = @{ 'X-Api-Key' = $privateHeaders['X-Api-Key']; Accept = 'image/png' }
$null = Invoke-WebRequest -Uri "$base/api/default/auth/qr" -Headers $qrHeaders -OutFile $qrPath -UseBasicParsing -TimeoutSec 20
Write-Output ('Pairing QR saved privately: ' + $qrPath)
Write-Output 'Scan only if you approve this local WAHA service accessing your WhatsApp chats and sending as your account. No automation is enabled.'
