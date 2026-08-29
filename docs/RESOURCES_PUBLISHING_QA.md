# Wistudi Resources Publishing QA Protocol

This protocol applies to every Community Note, Guide, Resource and Event page. A resource is not considered publish-ready because its files exist in GitHub. It must pass asset integrity, image-quality, browser-render and human visual-review gates.

## 1. Fail-closed publication states

New content starts as `draft` in `assets/data/resources-manifest.json` and must not be surfaced as a published resource until QA passes. `published` is the final state, not the working state.

Required sequence:

`draft` → branch preview → automated static QA → real-browser desktop/mobile QA → screenshot review → approved → `published`

If any required check fails, the resource remains in draft and must not be merged to production.

## 2. Master image standard

The original supplied image is the master source.

- Never create a web image from a screenshot, chat preview, thumbnail or already-compressed derivative.
- Never repeatedly re-export an already compressed WebP/JPEG.
- Derivatives must be generated from the original master.
- Preserve the master separately when a derivative is created.
- Do not enlarge a photograph beyond its native pixel dimensions.
- Do not accept a file simply because its extension says `.webp`, `.jpg` or `.png`. The binary must decode and its detected format must match its extension.

### Editorial photo minimums

Hero / featured photography:
- hard minimum: 1200 × 675 px;
- preferred: 1600 px+ wide;
- minimum encoded size for WebP/JPEG photographs: 60 KB;
- minimum information density: 85 KB per megapixel.

Inline/editorial photography:
- hard minimum: 900 × 500 px;
- minimum encoded size for WebP/JPEG photographs: 35 KB;
- minimum information density: 85 KB per megapixel.

These are release gates, not optimisation targets. A larger, sharper source should not be reduced to these minimums unnecessarily.

## 3. Asset integrity validation

`scripts/resources_qa.py` must fail the build when any of the following occurs:

- invalid manifest JSON;
- missing published article route;
- missing referenced image;
- image cannot be decoded;
- image format does not match its file extension;
- hero or editorial image is below pixel minimums;
- photograph is suspiciously small or over-compressed;
- Resources internal link resolves to a missing route;
- referenced Resources script is missing;
- Coming Soon content is accidentally made live/clickable.

A GitHub blob existing at the expected path is not proof that the image is usable.

## 4. Real-browser render QA

`scripts/resources_browser_qa.mjs` opens the built site in Chromium and tests both:

- desktop: 1440 × 900;
- mobile: 390 × 844.

For every core and Resources page it must verify:

- successful HTTP response;
- meaningful visible page content;
- page height/content actually renders;
- no blocking browser JavaScript errors;
- no failed image network responses;
- every visible image completes and decodes;
- `naturalWidth` and `naturalHeight` are non-zero;
- the runtime image fallback was not triggered;
- large editorial images have at least 1.25× source-width headroom relative to their rendered CSS width;
- images are not stretched vertically unless intentional `object-fit: cover` is being used;
- repeated scrolling does not leave substantial sections hidden;
- page interaction remains responsive;
- key Resources navigation works.

The test must scroll the entire page before image measurements so lazy-loaded assets are actually exercised.

## 5. Runtime fallback is not a pass

Resources pages use the Resources-specific runtime for image fallbacks. If an image fails at runtime, the page may show a neutral Wistudi fallback instead of a broken-image icon.

That fallback exists for temporary network/CDN failures only. **If QA observes the fallback even once during a reproducible build, the build fails.** A visually tidy fallback must never convert a broken asset into a passing release.

## 6. Visual evidence is mandatory

Every browser QA run captures full-page screenshots for desktop and mobile. The screenshots are retained as workflow artifacts for 30 days.

A person must review the screenshots before production publication. The review is not optional because automated tests cannot reliably judge composition, photographic quality or focal-point choice.

Visual approval must explicitly check:

- every intended image is visibly rendered, not merely present in the DOM;
- image sharpness at its actual displayed size;
- no visible compression blocks, smearing or excessive softness;
- crop and focal point;
- no stretched or distorted photographs;
- caption and alt-text match the image;
- desktop and mobile composition;
- article spacing and hierarchy;
- no fallback state, broken-image icon or exposed alt text;
- images still look credible when viewed at 100% browser zoom on a large desktop display.

## 7. Workflow enforcement

The Resources QA workflow must run automatically when Resources-related files change on:

- `feature/community-notes-resources`;
- `integration/resources-merge-no-deploy`;
- `main`;
- pull requests targeting the integration branch or `main`.

The integration branch is the required pre-production checkpoint. A Resources change should not be merged to `main` while the static or browser QA workflow is failing.

## 8. Core-site isolation

Resources code must not destabilize Platform, Blocks & Activities, Organisations, Contact or the homepage.

The browser workflow tests the core pages as part of every Resources run. Resources-specific behavior should remain isolated in Resources-specific JS/CSS. The general `site-shell.js` delegates Resources pages to `resources-page-shell.js` so image fallback and archive behavior cannot be silently skipped.

## 9. Current release rule

The existing Vietnam EdTech Expo resource is not production-ready until its corrupted hero asset is replaced from the original high-quality source and all editorial images pass the strengthened quality thresholds.

No Resources change should be deployed to production merely because the page layout appears complete.
