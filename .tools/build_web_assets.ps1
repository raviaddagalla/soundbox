$ErrorActionPreference = "Stop"

$nodeDir = "C:\Users\aravi\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.20.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

Write-Host "Running npm run build for Soundless UPI Web App..."
Set-Location "d:\Nandhu\swayam"
& "$nodeDir\npm.cmd" run build

$distDir = "d:\Nandhu\swayam\dist"
$assetsDir = "d:\Nandhu\swayam\android-companion\app\src\main\assets"

if (!(Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

Write-Host "Copying web dist bundle to Android assets ($assetsDir)..."
Copy-Item -Path "$distDir\*" -Destination $assetsDir -Recurse -Force

Write-Host "Verifying copied assets:"
Get-ChildItem -Path $assetsDir | Select-Object Name, Length
