$ErrorActionPreference = "Stop"

$workspaceDir = "d:\Nandhu\swayam"
$toolsDir = "$workspaceDir\.tools"
if (!(Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}

# 1. Download and extract Gradle 8.7 if not already present
$gradleDir = "$toolsDir\gradle-8.7"
$gradleBat = "$gradleDir\bin\gradle.bat"
if (!(Test-Path $gradleBat)) {
    Write-Host "Downloading Gradle 8.7 via curl..."
    $gradleZip = "$toolsDir\gradle-8.7-bin.zip"
    & curl.exe -L -s -S "https://services.gradle.org/distributions/gradle-8.7-bin.zip" -o $gradleZip
    Write-Host "Extracting Gradle 8.7..."
    Expand-Archive -Path $gradleZip -DestinationPath $toolsDir -Force
    if (Test-Path $gradleZip) { Remove-Item -Path $gradleZip -Force }
}
Write-Host "Gradle exists: $(Test-Path $gradleBat)"

# 2. Download and extract Android Command Line Tools if not already present
$androidSdkDir = "$toolsDir\android-sdk"
$cmdlineToolsDir = "$androidSdkDir\cmdline-tools\latest\bin"
$sdkManagerBat = "$cmdlineToolsDir\sdkmanager.bat"
if (!(Test-Path $sdkManagerBat)) {
    Write-Host "Downloading Android Commandline Tools via curl..."
    $cmdlineZip = "$toolsDir\commandlinetools.zip"
    & curl.exe -L -s -S "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -o $cmdlineZip
    Write-Host "Extracting Android Commandline Tools..."
    $tempExtract = "$toolsDir\cmdline-temp"
    if (Test-Path $tempExtract) { Remove-Item -Path $tempExtract -Recurse -Force }
    Expand-Archive -Path $cmdlineZip -DestinationPath $tempExtract -Force
    
    $latestDir = "$androidSdkDir\cmdline-tools\latest"
    if (!(Test-Path $latestDir)) {
        New-Item -ItemType Directory -Path $latestDir -Force | Out-Null
    }
    Copy-Item -Path "$tempExtract\cmdline-tools\*" -Destination $latestDir -Recurse -Force
    Remove-Item -Path $tempExtract -Recurse -Force
    if (Test-Path $cmdlineZip) { Remove-Item -Path $cmdlineZip -Force }
}
Write-Host "sdkmanager exists: $(Test-Path $sdkManagerBat)"
