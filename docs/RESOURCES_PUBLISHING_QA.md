# Wistudi Resources Publishing QA Protocol

This protocol applies to every Community Note, Guide, Resource and Event page. A resource is not considered publish-ready because its files exist in GitHub; it must pass asset, static and browser-render QA.

## 1. Fail-closed publication states

New content starts as `draft` in `assets/data/resources-manifest.json` and must not be surfaced as a published resource until QA passes. `published` is the final state, not the working state.

Recommended sequence:

`draft` → preview → automated QA pass → visual review → `published`

If any required check fails, keep the resource in draft and do not merge/deploy it.

## 2. Master image policy

- Keep the original supplied image as the master source.
- Never generate a web image from a screenshot, thumbnail, chat preview or already-compressed derivative.
- Derivatives must always be generated from the master.
- Do not visibly degrade an image just to reduce file size.
- Do not enlarge a photograph beyond its native pixel dimensions in the rendered page.

Editorial photo targets:

- Hero: preferred 1400px+ wide; hard automated minimum 900px.
- Inline/editorial: 700px+ wide.
- WebP/JPEG photographs are checked for suspiciously low bytes per megapixel to catch severe over-compression.
- The browser test also checks that large displayed images are not being upscaled beyond their source dimensions.

## 3. Static asset and route validation

`scripts/resources_qa.py` checks every Resources build for:

- valid manifest JSON;
- every published article route exists;
- every referenced image exists;
- every image can actually be decoded by an image library;
- image dimensions meet the media policy;
- severe photo over-compression is rejected;
- every Resources internal link resolves to a real file/route;
- every referenced Resources script exists;
- Coming Soon cards are not coded as clickable live cards.

A broken binary image therefore fails QA even when GitHub reports that a file with that filename exists.

## 4. Real-browser render QA

`scripts/resources_browser_qa.mjs` opens the site in Chromium, rather than trusting file inspection alone.

It checks the existing core website pages and all Resources pages for:

- successful HTTP response;
- meaningful visible page content;
- page height/content actually rendering;
- browser JavaScript errors;
- failed network requests;
- broken images using `naturalWidth`/`naturalHeight`;
- image upscaling;
- event-loop responsiveness after scrolling the full page;
- featured Community Note navigation;
- Browse All Notes navigation.

It also scrolls each page from top to bottom to trigger lazy-loaded content and catch the type of failure where the header appears but lower page sections never render.

## 5. Visual evidence

Every automated browser run captures full-page screenshots into a QA artifact. These are retained for review so a release has visual evidence of what Chromium actually rendered.

After the Resources design is formally approved, approved screenshots should become visual-regression baselines so future layout changes can be compared against a known-good render.

## 6. Core-site isolation

Resources code must not destabilize Platform, Blocks & Activities, Organisations, Contact or the existing homepage runtime.

The workflow tests those pages as part of every Resources browser run. It also guards the existing hero-video and role-guide runtime files from accidental Resources modifications.

Resources page behavior should remain isolated in Resources-specific JS/CSS wherever possible.

## 7. Runtime fallback

Automated QA is the primary protection. A runtime image fallback should also be retained so a temporary CDN/network failure shows a branded neutral media state instead of a broken-image icon. A fallback is not permission to publish a broken asset: any reproducible image failure still blocks publication.

## 8. Human approval gate

Automation verifies integrity and rendering; it cannot decide whether a photograph is editorially good, well-cropped or visually appropriate. Before production publication, review the QA screenshots for:

- crop and focal point;
- perceived sharpness;
- caption/alt-text fit;
- article spacing and hierarchy;
- desktop and mobile composition.

No Resources change should be merged to production while its required QA checks are failing.
