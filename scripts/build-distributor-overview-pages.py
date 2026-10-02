#!/usr/bin/env python3
"""Split the original Distributor Room overview PDFs without reducing image quality.

Each page is a self-contained PDF. The original embedded JPEG/image streams are
not downsampled, rasterised or lossy re-encoded. Compare every delivered page's
rendered pixels with the corresponding original page before allowing commit.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import fitz

MAX_ASSET_BYTES = 24 * 1024 * 1024
SOURCE_EN = Path("/tmp/wistudi-overview-original-en.pdf")
SOURCE_VI = Path("distributor-room/vi/assets/presentation/Presentation VN.pdf")
DEST_EN = Path("distributor-room/assets/presentation/overview-en-pages")
DEST_VI = Path("distributor-room/vi/assets/presentation/overview-vi-pages")
MANIFEST = Path("distributor-room/overview-page-manifest.json")


def git_blob_hash(data: bytes) -> str:
    header = f"blob {len(data)}\\0".encode().replace(b"\\0", b"\\x00")
    return hashlib.sha1(header + data).hexdigest()


def verify_source(path: Path, expected_sha: str) -> None:
    raw = path.read_bytes()
    got = git_blob_hash(raw)
    if got != expected_sha:
        raise SystemExit(f"Source integrity mismatch for {path}: {got} != {expected_sha}")
    print(f"Original verified: {path} ({len(raw):,} bytes, Git blob {got})")


def pixel_digest(page: fitz.Page) -> str:
    # Render exactly the same original and published PDF at fixed scaling and
    # color space. This detects missing fonts, distorted graphics or any
    # change in the visible slide, not merely a successful PDF save.
    pix = page.get_pixmap(matrix=fitz.Matrix(0.85, 0.85), colorspace=fitz.csRGB, alpha=False, annots=True)
    return hashlib.sha256(pix.samples).hexdigest()


def split(source: Path, dest: Path, label: str, expected_pages: int) -> dict:
    src = fitz.open(source)
    if src.page_count != expected_pages:
        raise SystemExit(f"{label}: expected {expected_pages} pages, received {src.page_count}")
    dest.mkdir(parents=True, exist_ok=True)
    files = []
    sizes = []
    for index in range(src.page_count):
        out = dest / f"slide-{index + 1:02d}.pdf"
        with fitz.open() as part:
            part.insert_pdf(src, from_page=index, to_page=index, links=True, annots=True)
            part.save(out, garbage=4, deflate=True, deflate_images=True, deflate_fonts=True, use_objstms=1)
        if out.stat().st_size >= MAX_ASSET_BYTES:
            raise SystemExit(f"{out}: exceeds Pages' recommended 24MB single-file limit")
        with fitz.open(out) as published:
            if published.page_count != 1:
                raise SystemExit(f"{out}: page count mismatch")
            before = src[index]
            after = published[0]
            if abs(before.rect.width - after.rect.width) > 0.01 or abs(before.rect.height - after.rect.height) > 0.01:
                raise SystemExit(f"{out}: page geometry changed")
            if pixel_digest(before) != pixel_digest(after):
                raise SystemExit(f"{out}: rendered pixels differ from original; aborting lossless release")
        files.append("/" + out.as_posix())
        sizes.append(out.stat().st_size)
        print(f"{label} {index + 1:02d}/{src.page_count}: {sizes[-1] / 1048576:.2f} MiB, visual pixels verified")
    print(f"{label}: original {source.stat().st_size / 1048576:.2f} MiB, pages total {sum(sizes) / 1048576:.2f} MiB; first page {sizes[0] / 1048576:.2f} MiB")
    return {"count": src.page_count, "files": files, "bytes": sizes}


def main() -> None:
    verify_source(SOURCE_EN, "f35307f8f22ffcad728e17429a4a2718b5a39f77")
    verify_source(SOURCE_VI, "df7e1dfee77c7c99c8b9535fa82eeb9bfe650c5a")
    data = {
        "version": 1,
        "mode": "lossless-original-pdf-pages",
        "en": split(SOURCE_EN, DEST_EN, "EN", 16),
        "vi": split(SOURCE_VI, DEST_VI, "VI", 13),
    }
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Saved manifest: {MANIFEST}")


if __name__ == "__main__":
    main()
