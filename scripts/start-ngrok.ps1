param(
    [int]$Port = 5000,
    [string]$Subdomain = ""
)

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Error "ngrok is not on PATH. Install it from https://ngrok.com/download and run 'ngrok config add-authtoken <token>' first."
    exit 1
}

$ngrokArgs = @("http", $Port)
if ($Subdomain -ne "") {
    $ngrokArgs += @("--subdomain", $Subdomain)
}

# Launch ngrok in a dedicated window so it stays running
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "ngrok " + ($ngrokArgs -join " ")
)
