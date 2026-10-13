$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$sdkRoot = "d:\Nandhu\swayam\.tools\android-sdk"
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$sdkManager = "$sdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "Accepting licenses..."
$answers = @("y", "y", "y", "y", "y", "y", "y", "y", "y")
$answers | & $sdkManager --licenses --sdk_root=$sdkRoot

Write-Host "Installing platforms;android-34 and build-tools;34.0.0..."
& $sdkManager --install "platforms;android-34" "build-tools;34.0.0" --sdk_root=$sdkRoot

Write-Host "Checking installed packages..."
Test-Path "$sdkRoot\platforms\android-34\android.jar"
Test-Path "$sdkRoot\build-tools\34.0.0\aapt2.exe"
