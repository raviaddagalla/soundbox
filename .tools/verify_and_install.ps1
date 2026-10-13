$ErrorActionPreference = "Stop"

$apkPath = "d:\Nandhu\swayam\android-companion\app\build\outputs\apk\debug\app-debug.apk"
$adb = "C:\Users\aravi\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"
$aapt2 = "d:\Nandhu\swayam\.tools\android-sdk\build-tools\34.0.0\aapt2.exe"
$apksigner = "d:\Nandhu\swayam\.tools\android-sdk\build-tools\34.0.0\apksigner.bat"

Write-Host "=== 1. VERIFY APK FILE ==="
if (Test-Path $apkPath) {
    $apkItem = Get-Item $apkPath
    Write-Host "APK Path: $($apkItem.FullName)"
    Write-Host "APK Size: $($apkItem.Length) bytes ($([math]::Round($apkItem.Length / 1MB, 2)) MB)"
    Write-Host "Created : $($apkItem.LastWriteTime)"
} else {
    Write-Error "APK file not found at $apkPath"
}

Write-Host "`n=== 2. VERIFY APK SIGNATURE ==="
& $apksigner verify --verbose $apkPath

Write-Host "`n=== 3. VERIFY ADB DEVICE ==="
& $adb devices -l

$deviceId = "AENVTKIFUSCY5TT4"

Write-Host "`n=== 4. INSTALL APK ON DEVICE ($deviceId) ==="
& $adb -s $deviceId install -r $apkPath

Write-Host "`n=== 5. CONFIRM INSTALLED PACKAGE ==="
& $adb -s $deviceId shell "pm list packages | grep soundless"

Write-Host "`n=== 6. LAUNCH COMPANION APP ==="
& $adb -s $deviceId shell "am start -n in.soundless.companion/.MainActivity"

Write-Host "`n=== INSTALL AND LAUNCH SUCCESSFUL ==="
