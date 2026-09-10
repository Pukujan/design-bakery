#!/usr/bin/env python3
"""Externalize and prepare Fluffy System V4 artwork.

The V4 experiments began as single-file prototypes with generated page renders
embedded as CSS data URIs. Some later inline WebP replacements are malformed in
Git history, and every page asks the browser to scale a 960px prototype render
well beyond its native dimensions.

This script turns the artwork into real files. It prefers the current inline
source, falls back to each page's original creation commit if the current data
URI is not decodable, creates a 1920px-wide high-quality WebP derivative, and
rewrites ``--art`` to the external asset path.
"""

from __future__ import annotations

import base64
import io
import subprocess
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

# First commits that introduced each V4 page. These preserve the original
# generated render before the later one-line image-quality replacement commits.
SOURCE_COMMITS = {
    "fluffy-study-partner": "337e955d5f5380b5e0bd37c71e1956b8cda99168",
    "fluffy-editorial": "52914cd1b3dfe72bfb8365d0e205537bdfdb61ce",
    "fluffy-3d": "3c98fba87aa431dc5c71217bbc706cf569fe5c7a",
    "pam-preflight": "696e3d009352a04f5e7a25e40aef298807db0de3",
    "pam-proof": "5b23ca68b72f9e202a16a6aecb7a1279bdf457bb",
    "ra-control-room": "616f4cf2c92e920cb2ffd5e44276de782c3329e9",
    "ra-lab": "74ff3e59797326a714cc90c9a9011b9bc73dce99",
    "mixed-media": "3e95605cdb8f67a243b140dcfa67770955705b89",
}

PAGES = tuple(SOURCE_COMMITS)
BASE64_CHARS = frozenset(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
)


def find_inline_art(html: str) -> tuple[int, int, str] | None:
    """Return the CSS art span and encoded payload without regexing a huge line."""
    art_start = html.find("--art")
    if art_start < 0:
        return None

    data_start = html.find("data:image/", art_start)
    if data_start < 0:
        return None

    base64_marker = ";base64,"
    payload_start = html.find(base64_marker, data_start)
    if payload_start < 0:
        return None
    payload_start += len(base64_marker)

    css_end = html.find(")", payload_start)
    if css_end < 0:
        raise RuntimeError("Inline --art data URI is not terminated correctly")

    payload = html[payload_start:css_end].strip().rstrip("\"'").strip()
    return art_start, css_end + 1, payload


def decode_payload(payload: str) -> bytes:
    # Historical HTML snapshots sometimes wrapped/escaped the enormous line.
    # The CSS boundary has already been isolated, so filtering is safe here.
    clean = "".join(ch for ch in payload if ch in BASE64_CHARS)
    clean += "=" * ((-len(clean)) % 4)
    if not clean:
        raise RuntimeError("Inline --art payload is empty")
    return base64.b64decode(clean, validate=False)


def image_from_payload(payload: str) -> Image.Image:
    raw = decode_payload(payload)
    with Image.open(io.BytesIO(raw)) as source:
        source.load()
        return ImageOps.exif_transpose(source).convert("RGB")


def historical_html(slug: str, page_path: Path) -> str:
    rel = page_path.relative_to(REPO_ROOT).as_posix()
    commit = SOURCE_COMMITS[slug]
    proc = subprocess.run(
        ["git", "show", f"{commit}:{rel}"],
        cwd=REPO_ROOT,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.stdout.decode("utf-8")


def load_source_image(slug: str, page_path: Path, payload: str) -> tuple[Image.Image, str]:
    try:
        return image_from_payload(payload), "current"
    except Exception as current_error:
        old_html = historical_html(slug, page_path)
        old_art = find_inline_art(old_html)
        if not old_art:
            raise RuntimeError(
                f"Current art is invalid and original commit has no inline art: {current_error}"
            ) from current_error
        try:
            return image_from_payload(old_art[2]), f"history:{SOURCE_COMMITS[slug][:8]}"
        except Exception as old_error:
            raise RuntimeError(
                f"Neither current nor original historical art decodes; "
                f"current={current_error!r}, history={old_error!r}"
            ) from old_error


def prepare_page(slug: str) -> tuple[bool, str]:
    page_path = V4_DIR / f"{slug}.html"
    asset_path = ASSET_DIR / f"{slug}.webp"
    html = page_path.read_text(encoding="utf-8")
    found = find_inline_art(html)

    if not found:
        expected = f'--art:url("./assets/{slug}.webp")'
        if expected in html and asset_path.exists():
            return False, f"{slug}: already externalized"
        raise RuntimeError(
            f"{page_path.relative_to(REPO_ROOT)} has neither inline art nor a valid external asset"
        )

    art_start, art_end, payload = found
    image, source_label = load_source_image(slug, page_path, payload)
    source_size = image.size

    if image.width < TARGET_WIDTH:
        target_height = round(image.height * TARGET_WIDTH / image.width)
        image = image.resize(
            (TARGET_WIDTH, target_height),
            resample=Image.Resampling.LANCZOS,
        )
        # Mild sharpening counters interpolation softness without producing
        # conspicuous halos around the generated render's fine details.
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
    rewritten = html[:art_start] + replacement + html[art_end:]
    page_path.write_text(rewritten, encoding="utf-8")

    return (
        True,
        f"{slug}: {source_label} {source_size[0]}x{source_size[1]} -> "
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
