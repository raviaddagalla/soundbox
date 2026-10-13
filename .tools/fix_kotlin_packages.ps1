$files = Get-ChildItem -Path "d:\Nandhu\swayam\android-companion\app\src" -Filter "*.kt" -Recurse
foreach ($f in $files) {
    $content = Get-Content -Path $f.FullName -Raw
    $newContent = $content -replace "package in\.soundless", "package ``in``.soundless" -replace "import in\.soundless", "import ``in``.soundless"
    if ($content -ne $newContent) {
        Set-Content -Path $f.FullName -Value $newContent -NoNewline
        Write-Host "Updated: $($f.Name)"
    }
}
