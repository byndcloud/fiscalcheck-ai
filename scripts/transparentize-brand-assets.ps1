# Remove o fundo #F4F6FB dos PNGs do logotipo, gerando versões com alpha
# realmente transparente. Preserva o branco puro do check (255,255,255)
# via guarda "pixel só é candidato a fundo se <= bg em TODOS os canais".
#
# Uso (Windows PowerShell 5.1 — Add-Type funciona nesse host):
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\transparentize-brand-assets.ps1
#
# Se estiver no PowerShell 7+ (pwsh), rode via dot-source na sessão:
#   . scripts\transparentize-brand-assets.ps1

param(
  [string]$SourceDir = "$PSScriptRoot\..\assets\brand",
  [string]$PublicDir = "$PSScriptRoot\..\apps\web\public\brand",
  [string]$AppDir    = "$PSScriptRoot\..\apps\web\app"
)

Add-Type -AssemblyName System.Drawing

# Compilador inline C#: pixel loop puro em PowerShell é lento demais.
$csharp = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class BrandBg {
    public static void RemoveOffWhite(string sourcePath, string destPath,
                                       int bgR, int bgG, int bgB,
                                       double innerDist, double outerDist) {
        using (var srcImg = Image.FromFile(sourcePath)) {
            int w = srcImg.Width;
            int h = srcImg.Height;
            using (var bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                using (var gfx = Graphics.FromImage(bmp)) {
                    gfx.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
                    gfx.DrawImage(srcImg, 0, 0, w, h);
                }
                var rect = new Rectangle(0, 0, w, h);
                var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                int size = data.Stride * data.Height;
                byte[] bytes = new byte[size];
                Marshal.Copy(data.Scan0, bytes, 0, size);

                double range = outerDist - innerDist;
                if (range <= 0) range = 1;

                // Guarda-chuva: só considera candidato a fundo o pixel que
                // é menor-igual ao bg em TODOS os canais (bg-like ou sombra).
                // Assim protegemos o branco puro do check (#FFFFFF), que fica
                // apenas a distância ~15 do #F4F6FB e seria falsamente atingido
                // por uma tolerância maior.
                for (int i = 0; i < size; i += 4) {
                    byte b = bytes[i];
                    byte g = bytes[i + 1];
                    byte r = bytes[i + 2];
                    byte a = bytes[i + 3];

                    bool bgLike = (r <= bgR + 2) && (g <= bgG + 2) && (b <= bgB + 2);
                    if (!bgLike) {
                        continue;
                    }

                    int dr = r - bgR;
                    int dg = g - bgG;
                    int db = b - bgB;
                    double dist = Math.Sqrt(dr * dr + dg * dg + db * db);

                    if (dist <= innerDist) {
                        bytes[i]     = 0;
                        bytes[i + 1] = 0;
                        bytes[i + 2] = 0;
                        bytes[i + 3] = 0;
                    } else if (dist < outerDist) {
                        double t = (dist - innerDist) / range;
                        byte newA = (byte)(a * t);
                        if (newA < a) {
                            bytes[i + 3] = newA;
                        }
                    }
                }

                Marshal.Copy(bytes, 0, data.Scan0, size);
                bmp.UnlockBits(data);
                bmp.Save(destPath, ImageFormat.Png);
            }
        }
    }
}
"@

if (-not ("BrandBg" -as [type])) {
  Add-Type -TypeDefinition $csharp -ReferencedAssemblies System.Drawing -ErrorAction Stop
}

# Fundo alvo: #F4F6FB (o mesmo que a IA usou como canvas).
# innerDist=8: pixels quase idênticos ao fundo -> transparentes.
# outerDist=45: transição suave preserva anti-alias das bordas e a sombra.
$bgR = 244; $bgG = 246; $bgB = 251
$inner = 8.0; $outer = 45.0

function Process-Asset {
  param([string]$In, [string]$Out)
  $inFull  = (Resolve-Path $In).Path
  $outDir  = Split-Path -Parent $Out
  if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
  [BrandBg]::RemoveOffWhite($inFull, $Out, $bgR, $bgG, $bgB, $inner, $outer)
  $img = [System.Drawing.Image]::FromFile($Out)
  "  -> {0}  ({1} x {2})" -f $Out, $img.Width, $img.Height
  $img.Dispose()
}

Write-Host "== Gerando logo-mark.png com fundo transparente =="
# Fonte: o próprio arquivo já cortado 1024x1024 (que foi processado antes)
# Como o script anterior gerou logo-mark.png com fundo opaco, usamos o
# source original (1536x1024) e cortamos + transparente numa passada só.
$markCropTmp = Join-Path $env:TEMP "fiscalcheck-mark-cropped.png"
$markSrc     = Join-Path $SourceDir "logo-mark-source.png"
# Crop 1024x1024 centralizado horizontalmente
$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $markSrc))
$crop = New-Object System.Drawing.Bitmap 1024, 1024
$gfx = [System.Drawing.Graphics]::FromImage($crop)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$destRect   = New-Object System.Drawing.Rectangle 0, 0, 1024, 1024
$sourceRect = New-Object System.Drawing.Rectangle 256, 0, 1024, 1024
$gfx.DrawImage($srcImg, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
$gfx.Dispose()
$crop.Save($markCropTmp, [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$srcImg.Dispose()

Process-Asset -In $markCropTmp -Out (Join-Path $PublicDir "logo-mark.png")
Process-Asset -In $markCropTmp -Out (Join-Path $AppDir    "icon.png")
Remove-Item $markCropTmp -Force

Write-Host ""
Write-Host "== Gerando logo-horizontal.png com fundo transparente =="
$horCropTmp = Join-Path $env:TEMP "fiscalcheck-hor-cropped.png"
$horSrc     = Join-Path $SourceDir "logo-horizontal-source.png"
$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $horSrc))
$crop = New-Object System.Drawing.Bitmap 1536, 640
$gfx = [System.Drawing.Graphics]::FromImage($crop)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$destRect   = New-Object System.Drawing.Rectangle 0, 0, 1536, 640
$sourceRect = New-Object System.Drawing.Rectangle 0, 192, 1536, 640
$gfx.DrawImage($srcImg, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
$gfx.Dispose()
$crop.Save($horCropTmp, [System.Drawing.Imaging.ImageFormat]::Png)
$crop.Dispose()
$srcImg.Dispose()

Process-Asset -In $horCropTmp -Out (Join-Path $PublicDir "logo-horizontal.png")
Remove-Item $horCropTmp -Force

Write-Host ""
Write-Host "Concluido."
