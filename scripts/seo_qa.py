#!/usr/bin/env python3
"""Static SEO regression checks for the Wistudi global website.

This intentionally checks the rules that are easiest to regress when new pages are added:
canonical sitemap coverage, multilingual URL shape, Resources/Event discovery, robots,
and essential metadata. Runtime metadata is injected by functions/_middleware.js, so this
also checks the middleware contract rather than requiring duplicated static tags everywhere.
"""

from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://global.wistudi.com"
LANGS = ("en", "vi", "zh-cn", "th", "id", "ms", "ar")
CORE = ("/", "/blocks-activities/", "/organisations/", "/contact/")
RESOURCES = (
    "/resources/",
    "/resources/events/",
    "/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/",
    "/resources/events/building-a-communicative-esl-lesson-with-flow/",
)
NOINDEX = ("/resources/all/", "/resources/guides/")

errors: list[str] = []
warnings: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def warn(message: str) -> None:
    warnings.append(message)


def public_url(lang: str, path: str) -> str:
    if lang == "en":
        return ORIGIN + path
    return ORIGIN + f"/{lang}" + path


def read(path: str) -> str:
    target = ROOT / path
    if not target.exists():
        fail(f"Missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8")


# robots.txt
robots = read("robots.txt")
if "User-agent: *" not in robots or "Allow: /" not in robots:
    fail("robots.txt must allow public crawling")
if f"Sitemap: {ORIGIN}/sitemap.xml" not in robots:
    fail("robots.txt must advertise the canonical sitemap")
if "Disallow: /api/" not in robots:
    warn("robots.txt no longer blocks /api/; confirm this is intentional")

# Sitemap
sitemap_path = ROOT / "sitemap.xml"
try:
    tree = ET.parse(sitemap_path)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text.strip() for node in tree.findall("sm:url/sm:loc", ns) if node.text]
except Exception as exc:  # pragma: no cover - CI diagnostic
    fail(f"sitemap.xml is invalid XML: {exc}")
    urls = []

if len(urls) != len(set(urls)):
    fail("sitemap.xml contains duplicate URLs")

expected = {public_url(lang, path) for lang in LANGS for path in (*CORE, *RESOURCES)}
missing = sorted(expected - set(urls))
extra_noindex = sorted({ORIGIN + p for p in NOINDEX} & set(urls))
if missing:
    fail("Sitemap is missing canonical pages: " + ", ".join(missing))
if extra_noindex:
    fail("Noindex/placeholder pages must not be in sitemap: " + ", ".join(extra_noindex))
if any("?lang=" in url for url in urls):
    fail("Sitemap must use stable language paths, not ?lang= URLs")
if any("/platform/" in url for url in urls):
    fail("/platform/ is consolidated to the homepage and must not appear in sitemap")
if any(not url.startswith(ORIGIN + "/") and url != ORIGIN + "/" for url in urls):
    fail("Sitemap contains a URL outside the canonical global.wistudi.com origin")

# Runtime SEO contract
middleware = read("functions/_middleware.js")
required_middleware_tokens = (
    "CORE_SEO",
    "RESOURCE_SEO_EN",
    "NOINDEX_PATHS",
    "rel=\"alternate\" hreflang",
    "x-default",
    "isAccessibleForFree:true",
    "event-banner.webp",
    "redirectLanguageQuery",
)
for token in required_middleware_tokens:
    if token not in middleware:
        fail(f"SEO middleware contract missing: {token}")

# Client locale URLs must remain path-based and canonical.
i18n = read("assets/js/i18n.js")
if "link.href=seoUrl(code)" not in i18n or "canonical.href=seoUrl(detected)" not in i18n:
    fail("i18n.js must emit self-canonical path-based hreflang URLs")
if "next.searchParams.set('lang'" in i18n or "u.searchParams.set('lang'" in i18n:
    fail("i18n.js has regressed to query-parameter language routing")

# Static content pages should still have useful fallback metadata even before middleware runs.
static_pages = {
    "resources/index.html": "/resources/",
    "resources/events/index.html": "/resources/events/",
    "resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/index.html": "/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/",
    "resources/events/building-a-communicative-esl-lesson-with-flow/index.html": "/resources/events/building-a-communicative-esl-lesson-with-flow/",
}
for filename, canonical_path in static_pages.items():
    html = read(filename)
    if not re.search(r"<title>[^<]{8,}</title>", html, re.I):
        fail(f"{filename}: missing descriptive title")
    if not re.search(r'<meta\s+name="description"\s+content="[^"]{50,}"', html, re.I):
        fail(f"{filename}: missing substantive meta description")
    expected_canonical = f'<link rel="canonical" href="{ORIGIN}{canonical_path}">'
    if expected_canonical not in html:
        fail(f"{filename}: canonical does not match {canonical_path}")
    if re.search(r'<meta\s+name="keywords"', html, re.I):
        warn(f"{filename}: meta keywords are unnecessary and should be removed")

# Event discovery and performance safeguards.
events_hub = read("resources/events/index.html")
if "/assets/images/resources/events/communicative-esl-flow/event-banner.webp" not in events_hub:
    fail("Events hub must use the optimized event-banner.webp asset")
if "WS%20Banner%20(1).png" in events_hub:
    fail("Events hub regressed to the large legacy PNG banner")

# Sitemap dates should be real ISO dates. lastmod is useful only when it tracks significant changes.
if sitemap_path.exists():
    raw = sitemap_path.read_text(encoding="utf-8")
    for value in re.findall(r"<lastmod>(.*?)</lastmod>", raw):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            fail(f"Invalid sitemap lastmod value: {value}")

for message in warnings:
    print(f"WARNING: {message}")

if errors:
    print("\nSEO QA FAILED")
    for message in errors:
        print(f" - {message}")
    sys.exit(1)

print(f"SEO QA passed: {len(urls)} sitemap URLs, {len(expected)} expected indexable URLs checked.")
