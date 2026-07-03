# Crop dos assets do logotipo gerados pela IA (que saem em 1536x1024)
# para as proporções corretas.
# Rode com: pwsh -NoProfile -File scripts\crop-brand-assets.ps1

param(
  [string]$SourceDir = "$PSScriptRoot\..\assets\brand",
  [string]$PublicDir = "$PSScriptRoot\..\apps\web\public\brand",
  [string]$AppDir    = "$PSScriptRoot\..\apps\web\app"
)

Add-Type -AssemblyName System.Drawing

function Crop-Image {
  param(
    [string]$InputPath,
    [string]$OutputPath,
    [int]$X,
    [int]$Y,
    [int]$W,
    [int]$H
  )
  $src = [System.Drawing.Image]::FromFile((Resolve-Path $InputPath))
  try {
    $bmp = New-Object System.Drawing.Bitmap $W, $H
    $bmp.SetResolution($src.HorizontalResolution, $src.VerticalResolution)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $gfx.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $gfx.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $destRect   = New-Object System.Drawing.Rectangle 0, 0, $W, $H
      $sourceRect = New-Object System.Drawing.Rectangle $X, $Y, $W, $H
      $gfx.DrawImage($src, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
    } finally { $gfx.Dispose() }

    $dir = Split-Path -Parent $OutputPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "  -> $OutputPath  ($W x $H)"
  } finally {
    $src.Dispose()
  }
}

Write-Host "== Crop do mark (1536x1024 -> 1024x1024 centralizado) =="
$markSrc = Join-Path $SourceDir "logo-mark-source.png"
Crop-Image -InputPath $markSrc -OutputPath (Join-Path $PublicDir "logo-mark.png") -X 256 -Y 0 -W 1024 -H 1024
Crop-Image -InputPath $markSrc -OutputPath (Join-Path $AppDir    "icon.png")      -X 256 -Y 0 -W 1024 -H 1024

Write-Host ""
Write-Host "== Crop do logotipo horizontal (1536x1024 -> 1536x640 reduzindo padding vertical) =="
$horSrc = Join-Path $SourceDir "logo-horizontal-source.png"
# Centraliza verticalmente: (1024 - 640) / 2 = 192
Crop-Image -InputPath $horSrc -OutputPath (Join-Path $PublicDir "logo-horizontal.png") -X 0 -Y 192 -W 1536 -H 640

Write-Host ""
Write-Host "Concluido. Novos tamanhos:"
Get-ChildItem (Join-Path $PublicDir "logo-mark.png"), (Join-Path $PublicDir "logo-horizontal.png"), (Join-Path $AppDir "icon.png") | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  "  {0,-55} {1}x{2}" -f $_.FullName, $img.Width, $img.Height
  $img.Dispose()
}
