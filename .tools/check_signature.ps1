$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$apksigner = "d:\Nandhu\swayam\.tools\android-sdk\build-tools\34.0.0\apksigner.bat"
$apkPath = "d:\Nandhu\swayam\android-companion\app\build\outputs\apk\debug\app-debug.apk"

& $apksigner verify --verbose $apkPath
