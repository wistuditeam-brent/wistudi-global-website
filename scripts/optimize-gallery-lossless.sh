#!/usr/bin/env bash
# Repack existing JPEG coefficients and PNG data without changing decoded image pixels.
set -euo pipefail
root="distributor-room/gallery/images"
command -v jpegtran >/dev/null || { echo "jpegtran is required" >&2; exit 1; }
command -v optipng >/dev/null || { echo "optipng is required" >&2; exit 1; }
saved=0
processed=0
while IFS= read -r -d '' file; do
  ((processed+=1))
  before=$(stat -c %s "$file")
  case "${file,,}" in
    *.jpg|*.jpeg)
      tmp=$(mktemp)
      trap 'rm -f "$tmp"' EXIT
      # -copy all preserves metadata; -optimize/-progressive only reorganize JPEG coding.
      jpegtran -copy all -optimize -progressive "$file" > "$tmp"
      after=$(stat -c %s "$tmp")
      if ((after < before)); then
        chmod --reference="$file" "$tmp"
        mv -f "$tmp" "$file"
        ((saved+=before-after))
        printf 'JPEG optimized: %s (%d -> %d bytes)\n' "$file" "$before" "$after"
      else rm -f "$tmp"; fi
      trap - EXIT
      ;;
    *.png)
      # OptiPNG recompresses pixels losslessly, keeping metadata (no --strip).
      optipng -o3 -preserve -quiet "$file"
      after=$(stat -c %s "$file")
      ((saved+=before-after))
      if ((after < before)); then printf 'PNG optimized: %s (%d -> %d bytes)\n' "$file" "$before" "$after"; fi
      ;;
  esac
done < <(find "$root" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)
printf 'Processed %d images, saved %d bytes using lossless methods.\n' "$processed" "$saved"
