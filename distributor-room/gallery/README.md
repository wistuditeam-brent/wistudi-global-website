# Distributor Room image gallery

Put original gallery photos in one of the category folders:

- `images/wistudi-events/`
- `images/real-moments/`
- `images/classroom-moments/` (preferred)
- `images/Gallery_2/` or repository-root `Gallery_2/` (legacy Classroom Moments upload location)

Source formats: JPG/JPEG, PNG, HEIC/HEIF, WebP, AVIF and GIF. **Do not put HEIC files directly in the published gallery manifest.** The GitHub Action `distributor-gallery-webp.yml` calls `scripts/build-distributor-gallery.py` to generate browser-compatible assets automatically after image uploads.

Each original is preserved. The builder produces two hash-versioned WebP images in `optimized/thumbs/` and `optimized/display/`, then rewrites `gallery-manifest.js` with verified URLs. English and Vietnamese pages use the same manifest and share the same gallery renderer. The API fallback also serves this local manifest without calling GitHub.

Do not edit the generated manifest or WebP files by hand. Sort source filenames in numeric order to control display order (for example `01-opening-session.jpg`, `02-workshop.jpg`).

Image requests are served from the Wistudi domain. Optimized files have immutable cache headers because their URL changes whenever the original content changes. The small manifest is revalidated so new uploads become visible after deployment.
