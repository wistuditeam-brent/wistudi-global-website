#!/usr/bin/env python3
"""Generate browser-compatible, responsive gallery images and a verified static manifest.

Original photographs remain untouched. HEIC/HEIF inputs are converted only in the
derived gallery assets. Run from the repository root:
  python scripts/build-distributor-gallery.py
Requires: Pillow and pillow-heif.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.parse import quote

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path("distributor-room/gallery")
OUTPUT = ROOT / "optimized"
CATEGORIES = ("wistudi-events", "real-moments", "classroom-moments")
EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".heic", ".heif"}
THUMB_BOUND = (1100, 1100)
DISPLAY_BOUND = (2200, 2200)


def natural_key(path: Path):
    return [int(x) if x.isdigit() else x.casefold()
            for x in re.split(r"(\d+)", path.name)]


def sources(category: str):
    folders = [ROOT / "images" / category]
    if category == "classroom-moments":
        folders += [ROOT / "images" / "Gallery_2", Path("Gallery_2")]
    seen = set()
    for folder in folders:
        if not folder.is_dir():
            continue
        for file in sorted(folder.iterdir(), key=natural_key):
            if not file.is_file() or file.suffix.lower() not in EXTENSIONS:
                continue
            if file.name.casefold() in seen:
                print(f"Skipping duplicate gallery filename: {file}")
                continue
            seen.add(file.name.casefold())
            yield file


def web_path(file: Path) -> str:
    return "/" + "/".join(quote(segment, safe="") for segment in file.parts)


def build():
    manifest = {}
    all_original_bytes = all_thumb_bytes = all_display_bytes = 0
    for category in CATEGORIES:
        entries = []
        expected = set()
        for original in sources(category):
            filename = original.name + ".webp"
            thumb = OUTPUT / "thumbs" / category / filename
            display = OUTPUT / "display" / category / filename
            thumb.parent.mkdir(parents=True, exist_ok=True)
            display.parent.mkdir(parents=True, exist_ok=True)

            with Image.open(original) as opened:
                opened.load()
                frame = ImageOps.exif_transpose(opened)
                if getattr(frame, "is_animated", False):
                    frame.seek(0)
                icc = frame.info.get("icc_profile")
                rgb = frame.convert("RGB")
                large = rgb.copy()
                large.thumbnail(DISPLAY_BOUND, Image.Resampling.LANCZOS)
                kwargs = dict(format="WEBP", quality=84, method=5)
                if icc:
                    kwargs["icc_profile"] = icc
                large.save(display, **kwargs)
                preview = large.copy()
                preview.thumbnail(THUMB_BOUND, Image.Resampling.LANCZOS)
                preview.save(thumb, format="WEBP", quality=76, method=5)

            if not thumb.stat().st_size or not display.stat().st_size:
                raise RuntimeError(f"Missing optimized gallery image for {original}")
            expected.add(filename)
            entries.append({
                "name": original.name,
                "thumb": web_path(thumb),
                "display": web_path(display),
                "original": web_path(original),
            })
            all_original_bytes += original.stat().st_size
            all_thumb_bytes += thumb.stat().st_size
            all_display_bytes += display.stat().st_size

        for size in ("thumbs", "display"):
            folder = OUTPUT / size / category
            if folder.exists():
                for old in folder.glob("*.webp"):
                    if old.name not in expected:
                        old.unlink()
        manifest[category] = entries
        print(f"{category}: {len(entries)} optimized images")

    if not any(manifest.values()):
        raise RuntimeError("Refusing to replace gallery manifest: no source photos found")
    (ROOT / "gallery-manifest.js").write_text(
        "// Generated from original gallery photographs; do not edit by hand.\n"
        + "window.WISTUDI_GALLERY_MANIFEST="
        + json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Original: {all_original_bytes:,} bytes; thumbnails: {all_thumb_bytes:,} bytes; display: {all_display_bytes:,} bytes")
    print("Manifest entries point only to generated, existing WebP assets.")


if __name__ == "__main__":
    build()
