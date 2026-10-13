$ErrorActionPreference = "Stop"

$adb = "C:\Users\aravi\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe"
$apkPath = "d:\Nandhu\swayam\android-companion\app\build\outputs\apk\debug\app-debug.apk"
$deviceId = "AENVTKIFUSCY5TT4"

Write-Host "1. Checking APK file..."
$apkItem = Get-Item $apkPath
Write-Host "APK Path: $($apkItem.FullName)"
Write-Host "APK Size: $($apkItem.Length) bytes ($([math]::Round($apkItem.Length / 1MB, 2)) MB)"
Write-Host "Created : $($apkItem.LastWriteTime)"

Write-Host "`n2. Pushing APK to device..."
& $adb -s $deviceId push $apkPath /data/local/tmp/app-debug.apk

Write-Host "`n3. Installing updated APK..."
& $adb -s $deviceId shell "pm install -r -d /data/local/tmp/app-debug.apk"

Write-Host "`n4. Launching updated application..."
& $adb -s $deviceId shell "am force-stop in.soundless.companion"
& $adb -s $deviceId shell "am start -n in.soundless.companion/.MainActivity"

Write-Host "`n5. Confirming active top activity..."
& $adb -s $deviceId shell "dumpsys activity activities | grep -E 'ResumedActivity|topResumedActivity'"
