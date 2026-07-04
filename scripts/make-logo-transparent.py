"""
Remove o fundo das logos do FiscalCheck AI usando máscara por
saturação — funciona onde flood-fill falha por causa de texturas de
ruído no fundo geradas por IA.

Regra simples e robusta:
- Pixel COLORIDO (max-min de RGB alto): faz parte do desenho.
- Pixel BRANCO PURO (min >= WHITE_MIN): faz parte de brancos
  internos do desenho (check, flecha, brilho na tinta cyan) — mantém.
- Pixel CINZA (max-min baixo, mas não branco puro): fundo → apaga.

Depois aplicamos unpremultiply nas bordas para eliminar franjas
anti-aliased residuais ao redor do desenho e do texto.

Trade-off aceito: a sombra suave abaixo do escudo (que também é
cinza-branca) é removida. É preferível uma logo limpa a uma com
aura ruidosa sobrando ao redor.

Uso:
  uv tool run --with pillow python scripts/make-logo-transparent.py

Idempotente via stamp gravado no metadata do PNG — imagens já
processadas são puladas (rerodar sem restaurar os originais
continuaria corroendo levemente as bordas anti-aliased).

Para reprocessar do zero, remova o metadata ou restaure o arquivo
original antes de rodar novamente.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, PngImagePlugin

ROOT = Path(__file__).resolve().parent.parent
BRAND_DIR = ROOT / "apps" / "web" / "public" / "brand"

LOGOS = [
    BRAND_DIR / "logo-horizontal.png",
    BRAND_DIR / "logo-mark.png",
    # Favicon do Next.js (aba do navegador, PWA, share) — Next detecta
    # automaticamente `app/icon.png`. Precisa ter fundo transparente
    # para renderizar bem em temas dark/light dos navegadores.
    ROOT / "apps" / "web" / "app" / "icon.png",
]

# Marca gravada no PNG para tornar o script idempotente. Cada
# execução do UNPREMULT_PASS corrói levemente a borda anti-aliased,
# então precisamos evitar reprocessar imagens já processadas.
STAMP_KEY = "FiscalCheckTransparentV1"
STAMP_VALUE = "true"

SAT_MIN = 25  # pixel com sat>=25 é considerado "colorido" (do desenho)
WHITE_MIN = 252  # min(R,G,B)>=252 = branco puro do desenho (check/flecha/brilho)
UNPREMULT_PASSES = 2  # afinamento de franjas de anti-aliasing residual


def _saturation_mask(img: Image.Image) -> None:
    """Zera alpha de pixels do fundo (cinzas não brancos)."""
    w, h = img.size
    pixels = img.load()
    if pixels is None:
        raise RuntimeError("não consegui carregar pixels")
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]  # type: ignore[misc]
            if a == 0:
                continue
            mx = max(r, g, b)
            mn = min(r, g, b)
            sat = mx - mn
            if sat >= SAT_MIN:
                continue  # colorido → desenho
            if mn >= WHITE_MIN:
                continue  # branco puro → desenho
            pixels[x, y] = (r, g, b, 0)  # type: ignore[misc]


def _unpremultiply_pass(img: Image.Image) -> int:
    """Unpremultiply-from-white nas bordas de transparência.
    Só afina banda cinza (150..245) — preserva branco puro e cor sólida."""
    w, h = img.size
    pixels = img.load()
    if pixels is None:
        raise RuntimeError("não consegui carregar pixels")

    alpha0 = [pixels[x, y][3] for y in range(h) for x in range(w)]  # type: ignore[index]

    def alpha_at(x: int, y: int) -> int:
        return alpha0[y * w + x]

    changed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]  # type: ignore[misc]
            if a == 0:
                continue

            has_edge = False
            for dy in (-1, 0, 1):
                ny = y + dy
                if ny < 0 or ny >= h:
                    continue
                for dx in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nx = x + dx
                    if nx < 0 or nx >= w:
                        continue
                    if alpha_at(nx, ny) < 30:
                        has_edge = True
                        break
                if has_edge:
                    break

            if not has_edge:
                continue

            luma = max(r, g, b)
            if luma < 150 or luma > 245:
                continue

            alpha_orig = 1.0 - luma / 255.0
            inv = 1.0 - alpha_orig
            nr = max(0, min(255, int((r - 255 * inv) / alpha_orig)))
            ng = max(0, min(255, int((g - 255 * inv) / alpha_orig)))
            nb = max(0, min(255, int((b - 255 * inv) / alpha_orig)))
            new_a = int(round(alpha_orig * a))

            if (nr, ng, nb, new_a) != (r, g, b, a):
                pixels[x, y] = (nr, ng, nb, new_a)  # type: ignore[misc]
                changed += 1

    return changed


def _already_processed(path: Path) -> bool:
    """True se a imagem já carrega o stamp da última execução."""
    try:
        with Image.open(path) as im:
            info = im.info or {}
            return info.get(STAMP_KEY) == STAMP_VALUE
    except (OSError, ValueError):
        return False


def make_transparent(path: Path) -> None:
    if _already_processed(path):
        print(f"skip (já processado): {path.relative_to(ROOT)}")
        return

    img = Image.open(path).convert("RGBA")
    w, h = img.size

    _saturation_mask(img)
    for pass_i in range(UNPREMULT_PASSES):
        changed = _unpremultiply_pass(img)
        if changed == 0:
            break
        print(f"  pass {pass_i + 1}: {changed} px reconstruídos")

    meta = PngImagePlugin.PngInfo()
    meta.add_text(STAMP_KEY, STAMP_VALUE)
    img.save(path, optimize=True, pnginfo=meta)
    print(f"ok: {path.relative_to(ROOT)} ({w}x{h})")


def main() -> None:
    for logo in LOGOS:
        if not logo.exists():
            print(f"skip: {logo} não existe")
            continue
        make_transparent(logo)


if __name__ == "__main__":
    main()
