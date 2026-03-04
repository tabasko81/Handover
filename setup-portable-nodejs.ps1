# Setup Portable Node.js for Shift Handover Log
# Downloads Node.js LTS and extracts to dist/nodejs (no global install required)

$ErrorActionPreference = "Stop"
$NodeVersion = "v20.20.0"
$NodeZip = "node-$NodeVersion-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/$NodeVersion/$NodeZip"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DistNodejs = Join-Path $ScriptDir "dist\nodejs"
$TempDir = Join-Path $env:TEMP "handover-nodejs-setup"

Write-Host "Setting up portable Node.js $NodeVersion..." -ForegroundColor Cyan
Write-Host ""

# Create temp directory
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -ItemType Directory -Path $TempDir | Out-Null

try {
    # Download Node.js
    Write-Host "Downloading $NodeZip..."
    Invoke-WebRequest -Uri $NodeUrl -OutFile (Join-Path $TempDir $NodeZip) -UseBasicParsing

    # Backup existing dist/nodejs if present
    if (Test-Path $DistNodejs) {
        $BackupDir = Join-Path $ScriptDir "dist\nodejs.bak"
        if (Test-Path $BackupDir) { Remove-Item $BackupDir -Recurse -Force }
        Rename-Item -Path $DistNodejs -NewName "nodejs.bak"
        Write-Host "Backed up existing dist\nodejs to dist\nodejs.bak"
    }

    # Ensure dist exists
    $DistDir = Join-Path $ScriptDir "dist"
    if (-not (Test-Path $DistDir)) { New-Item -ItemType Directory -Path $DistDir | Out-Null }

    # Extract
    Write-Host "Extracting..."
    Expand-Archive -Path (Join-Path $TempDir $NodeZip) -DestinationPath $TempDir -Force

    # Node zip extracts to node-vX.X.X-win-x64, we need the contents in dist/nodejs
    $ExtractedDir = Join-Path $TempDir "node-$NodeVersion-win-x64"
    if (-not (Test-Path $ExtractedDir)) {
        throw "Expected extracted folder node-$NodeVersion-win-x64 not found"
    }

    New-Item -ItemType Directory -Path $DistNodejs -Force | Out-Null
    Copy-Item -Path "$ExtractedDir\*" -Destination $DistNodejs -Recurse -Force
    Write-Host "Node.js installed to dist\nodejs" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  .\install.bat"
    Write-Host "  .\setup-db.bat"
    Write-Host "  .\start.bat"
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    if (Test-Path (Join-Path $ScriptDir "dist\nodejs.bak")) {
        Rename-Item -Path (Join-Path $ScriptDir "dist\nodejs.bak") -NewName "nodejs"
        Write-Host "Restored dist\nodejs from backup"
    }
    exit 1
}
finally {
    if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue }
}
