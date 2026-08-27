#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'assets/data/resources-manifest.json'
RESOURCE_ROOT = ROOT / 'resources'
MIN_HERO_WIDTH = 900
WARN_HERO_WIDTH = 1400
MIN_INLINE_WIDTH = 700
MIN_PHOTO_KB_PER_MP = 55

errors=[]
warnings=[]
def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)

try:
    from PIL import Image
except Exception:
    Image = None
    err('Pillow is required for Resources image QA: pip install pillow')

class Scan(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.images=[]; self.scripts=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='a' and a.get('href'): self.links.append(a['href'])
        if tag=='img' and a.get('src'): self.images.append((a['src'], a.get('class','')))
        if tag=='script' and a.get('src'): self.scripts.append(a['src'])

def route_to_file(href:str):
    path=urlparse(href).path
    if not path.startswith('/'): return None
    if path.startswith('/assets/'): return ROOT / path.lstrip('/')
    if path == '/': return ROOT/'index.html'
    if path.endswith('/'): return ROOT/path.lstrip('/')/'index.html'
    p=ROOT/path.lstrip('/')
    if p.suffix: return p
    return p/'index.html'

def image_metrics(path:Path):
    if not Image: return None
    try:
        with Image.open(path) as im: im.verify()
        with Image.open(path) as im: w,h=im.size; fmt=im.format
        return w,h,fmt,path.stat().st_size
    except Exception as e:
        err(f'Image cannot be decoded: {path.relative_to(ROOT)} ({e})'); return None

def check_photo_quality(path:Path, role:str):
    m=image_metrics(path)
    if not m: return
    w,h,fmt,size=m
    if role=='hero':
        if w < MIN_HERO_WIDTH: err(f'Hero image too small: {path.relative_to(ROOT)} is {w}px wide; hard minimum {MIN_HERO_WIDTH}px')
        elif w < WARN_HERO_WIDTH: warn(f'Hero image below preferred width: {path.relative_to(ROOT)} is {w}px; preferred {WARN_HERO_WIDTH}px+')
    elif w < MIN_INLINE_WIDTH:
        warn(f'Inline/editorial image is only {w}px wide: {path.relative_to(ROOT)}')
    mp=max((w*h)/1_000_000,0.01)
    kbpm=(size/1024)/mp
    if fmt in {'WEBP','JPEG'} and kbpm < MIN_PHOTO_KB_PER_MP:
        err(f'Photo looks over-compressed: {path.relative_to(ROOT)} = {kbpm:.1f} KB/MP; minimum {MIN_PHOTO_KB_PER_MP} KB/MP')

if not MANIFEST.exists():
    err('Missing assets/data/resources-manifest.json'); data={}
else:
    try: data=json.loads(MANIFEST.read_text(encoding='utf-8'))
    except Exception as e: err(f'Manifest JSON invalid: {e}'); data={}

articles=data.get('articles',[]) if isinstance(data,dict) else []
for article in articles:
    if article.get('status')!='published': continue
    title=article.get('locales',{}).get('en',{}).get('title','(untitled)')
    url=article.get('locales',{}).get('en',{}).get('url')
    hero=article.get('heroImage')
    if not url: err(f'Published article missing EN URL: {title}')
    else:
        f=route_to_file(url)
        if not f or not f.exists(): err(f'Published article route missing: {url} ({title})')
    if not hero: err(f'Published article missing heroImage: {title}')
    else:
        f=route_to_file(hero)
        if not f or not f.exists(): err(f'Hero image file missing: {hero} ({title})')
        else: check_photo_quality(f,'hero')

html_files=sorted(RESOURCE_ROOT.rglob('*.html'))
if not html_files: err('No Resources HTML pages found')
for html in html_files:
    text=html.read_text(encoding='utf-8')
    scan=Scan(); scan.feed(text)
    rel=html.relative_to(ROOT)
    if '/assets/js/site-shell.js' in scan.scripts:
        warn(f'{rel} uses global site-shell.js; Resources should prefer resources-page-shell.js directly')
    for src in scan.scripts:
        if src.startswith('/'):
            f=route_to_file(src)
            if not f or not f.exists(): err(f'Broken script reference in {rel}: {src}')
    for href in scan.links:
        if href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:') or href.startswith('http'): continue
        if href.startswith('/'):
            f=route_to_file(href)
            if not f or not f.exists(): err(f'Broken internal link in {rel}: {href}')
    for src,cls in scan.images:
        if src.startswith('http'): continue
        f=route_to_file(src)
        if not f or not f.exists(): err(f'Broken image reference in {rel}: {src}')
        elif '/resources/' in src:
            role='hero' if ('hero' in cls or ('expo-hero' in src and ('resources/index.html' in str(rel) or 'community-notes' in str(rel)))) else 'inline'
            check_photo_quality(f,role)

for html in html_files:
    text=html.read_text(encoding='utf-8')
    if re.search(r'<a\b[^>]*class="[^"]*res-coming[^"]*"', text, re.I):
        err(f'Coming-soon card is clickable in {html.relative_to(ROOT)}')

print('Resources QA')
for w in warnings: print(f'WARN: {w}')
for e in errors: print(f'ERROR: {e}')
print(f'Checked {len(html_files)} HTML pages and {len(articles)} manifest article records.')
if errors:
    print(f'FAILED with {len(errors)} error(s) and {len(warnings)} warning(s).')
    sys.exit(1)
print(f'PASSED with {len(warnings)} warning(s).')
