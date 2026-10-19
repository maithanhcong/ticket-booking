# ===================================================================
# AuraTickets - Public Tunnel Sharing Utility (Zero-Setup)
# ===================================================================
param (
    [string]$Method = "pinggy", # "pinggy" or "localtunnel"
    [int]$Port = 3000
)

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   AuraTickets Public Tunnel Sharing (Port $Port)      " -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check if local port 3000 is listening
$portListening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $portListening) {
    Write-Host "[WARNING] Port $Port does not appear to be active!" -ForegroundColor Yellow
    Write-Host "Please make sure your Next.js Frontend is running: (cd frontend && npm run dev)" -ForegroundColor Gray
    Write-Host "Press Ctrl+C to exit if you need to start it first, or wait to continue..." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Reverse Proxy Status: Active" -ForegroundColor Green
Write-Host "All frontend API calls to /api/v1 are automatically rewritten to Backend (Port 4000)." -ForegroundColor Gray
Write-Host "You only need to share 1 single link for both Frontend & AI Backend!" -ForegroundColor Green
Write-Host ""

if ($Method -eq "localtunnel") {
    Write-Host "[Starting LocalTunnel via npx]..." -ForegroundColor Cyan
    Write-Host "If prompted for a tunnel password on the webpage, your public IP is your password." -ForegroundColor Yellow
    Write-Host "You can find your IP at: https://loca.lt/mytunnelpassword" -ForegroundColor Gray
    Write-Host ""
    npx localtunnel --port $Port
} else {
    Write-Host "[Starting Pinggy SSH Tunnel (Zero Setup)]..." -ForegroundColor Cyan
    Write-Host "Generating instant HTTPS link via SSH..." -ForegroundColor Gray
    Write-Host "Copy the https://xxxx.a.pinggy.io link displayed below and send to your testers!" -ForegroundColor Green
    Write-Host ""
    ssh -p 443 -R0:localhost:$Port a.pinggy.io
}
