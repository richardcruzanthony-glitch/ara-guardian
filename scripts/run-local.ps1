param(
    [int]$Port = 5001,
    [string]$Subdomain = ""
)

$env:PORT = $Port

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd C:\ara-3; npm start"
)

Start-Sleep -Seconds 4

$scriptPath = Join-Path $PSScriptRoot "start-ngrok.ps1"
if (-not (Test-Path $scriptPath)) {
    Write-Error "start-ngrok.ps1 not found at $scriptPath"
    exit 1
}

& $scriptPath -Port $Port -Subdomain $Subdomain
