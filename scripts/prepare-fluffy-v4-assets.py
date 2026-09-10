#!/usr/bin/env python3
"""Extract Fluffy System V4 inline art into real high-resolution WebP assets.

The V4 experiments were prototyped with generated art embedded as CSS data URIs.
That is convenient for a one-file prototype, but it makes the HTML very large and
lets the browser upscale a 960px render into a much larger hero surface.

This script is intentionally deterministic: it decodes the existing source art,
creates a 1920px-wide WebP derivative with high-quality Lanczos resampling and a
small sharpening pass, then rewrites the page's ``--art`` variable to the real
asset path. Running it again is a no-op once the external asset exists.
"""

from __future__ import annotations

import base64
import io
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageOps
except ImportError as exc:  # pragma: no cover - exercised by CI setup
    raise SystemExit(
        "Pillow is required. Install it with: python -m pip install Pillow"
    ) from exc


REPO_ROOT = Path(__file__).resolve().parents[1]
V4_DIR = REPO_ROOT / "frontend" / "public" / "experiments" / "fluffy-system-v4"
ASSET_DIR = V4_DIR / "assets"
TARGET_WIDTH = 1920
WEBP_QUALITY = 92

PAGES = (
    "fluffy-study-partner",
    "fluffy-editorial",
    "fluffy-3d",
    "pam-preflight",
    "pam-proof",
    "ra-control-room",
    "ra-lab",
    "mixed-media",
)

ART_RE = re.compile(
    r"--art\s*:\s*url\(\s*[\"']?"
    r"data:image/(?P<format>webp|jpeg|jpg|png);base64,"
    r"(?P<data>[A-Za-z0-9+/=]+)"
    r"[\"']?\s*\)",
    re.IGNORECASE,
)


def prepare_page(slug: str) -> tuple[bool, str]:
    page_path = V4_DIR / f"{slug}.html"
    asset_path = ASSET_DIR / f"{slug}.webp"
    html = page_path.read_text(encoding="utf-8")
    match = ART_RE.search(html)

    if not match:
        expected = f'--art:url("./assets/{slug}.webp")'
        if expected in html and asset_path.exists():
            return False, f"{slug}: already externalized"
        raise RuntimeError(
            f"{page_path.relative_to(REPO_ROOT)} has neither inline art nor a valid external asset"
        )

    raw = base64.b64decode(match.group("data"), validate=True)
    with Image.open(io.BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        source_size = image.size

        if image.width < TARGET_WIDTH:
            target_height = round(image.height * TARGET_WIDTH / image.width)
            image = image.resize(
                (TARGET_WIDTH, target_height),
                resample=Image.Resampling.LANCZOS,
            )
            # A restrained pass compensates for browser/prototype resampling softness
            # without inventing hard halos around type-like edges in generated art.
            image = image.filter(
                ImageFilter.UnsharpMask(radius=1.15, percent=75, threshold=3)
            )

        asset_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(
            asset_path,
            format="WEBP",
            quality=WEBP_QUALITY,
            method=6,
            exact=True,
        )
        output_size = image.size

    replacement = f'--art:url("./assets/{slug}.webp")'
    rewritten = ART_RE.sub(replacement, html, count=1)
    page_path.write_text(rewritten, encoding="utf-8")

    return (
        True,
        f"{slug}: {source_size[0]}x{source_size[1]} -> "
        f"{output_size[0]}x{output_size[1]} ({asset_path.stat().st_size // 1024} KiB)",
    )


def main() -> int:
    if not V4_DIR.is_dir():
        raise SystemExit(f"V4 directory not found: {V4_DIR}")

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    changed = 0
    for slug in PAGES:
        did_change, message = prepare_page(slug)
        changed += int(did_change)
        print(message)

    print(f"Prepared {changed} Fluffy V4 page(s).")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fluffy V4 asset preparation failed: {exc}", file=sys.stderr)
        raise
