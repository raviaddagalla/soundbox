param(
    [string]$Task = "assembleDebug"
)

$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME = "d:\Nandhu\swayam\.tools\android-sdk"
$env:ANDROID_SDK_ROOT = "d:\Nandhu\swayam\.tools\android-sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;C:\Users\aravi\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools;$env:PATH"

# Ensure local.properties exists in android-companion
$localProps = "d:\Nandhu\swayam\android-companion\local.properties"
$sdkPathEscaped = "d\:\\Nandhu\\swayam\\.tools\\android-sdk"
"sdk.dir=$sdkPathEscaped" | Set-Content -Path $localProps -Force

# Generate wrapper if missing
if (!(Test-Path "d:\Nandhu\swayam\android-companion\gradlew.bat")) {
    Write-Host "Generating Gradle wrapper..."
    & "d:\Nandhu\swayam\.tools\gradle-8.7\bin\gradle.bat" wrapper --gradle-version 8.7
}

Write-Host "Running Gradle task: $Task"
& "d:\Nandhu\swayam\android-companion\gradlew.bat" $Task
