import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manager = read('room-manager/index.html');
const cms = read('client-room/cms.js');
const media = read('functions/api/room-management/media.js');
const contentApi = read('functions/api/room-management/content.js');
const published = read('functions/api/room-management/published.js');

function launchFixture() {
 const launch = { children: [], prepend(child) { child.parent = this; this.children.unshift(child); } };
 const document = { createElement(tag) {
  return {
   tag, attributes: {},
   setAttribute(name, value) { this.attributes[name] = value; },
   addEventListener() {},
   remove() { const list = this.parent?.children; if (list) list.splice(list.indexOf(this), 1); }
  };
 } };
 const start = cms.indexOf('function addVideoPoster(launch,item,source){');
 const end = cms.indexOf('\nfunction makeVideoCard(item){', start);
 assert.ok(start >= 0 && end > start, 'video poster implementation exists');
 const addVideoPoster = runInNewContext(cms.slice(start, end) + '\naddVideoPoster', { document, URL, location: { origin: 'https://global.wistudi.com' } });
 return { launch, addVideoPoster };
}

test('custom thumbnail is used instead of a generated preview', () => {
 const { launch, addVideoPoster } = launchFixture();
 addVideoPoster(launch, { thumbnail_url: '/api/room-management/media?room=client&key=xyz' }, { kind: 'video', url: '/movie.mp4' });
 assert.equal(launch.children.length, 1);
 assert.equal(launch.children[0].tag, 'img');
 assert.equal(launch.children[0].src, '/api/room-management/media?room=client&key=xyz');
});

test('uploaded video has a first-frame preview when thumbnail is absent', () => {
 const { launch, addVideoPoster } = launchFixture();
 addVideoPoster(launch, { thumbnail_url: '' }, { kind: 'video', url: 'https://global.wistudi.com/api/room-management/media?room=client&key=abc' });
 assert.equal(launch.children[0].tag, 'video');
 assert.match(launch.children[0].src, /#t=0\.1$/);
 assert.equal(launch.children[0].preload, 'metadata');
 assert.equal(launch.children[0].muted, true);
});

test('failed custom thumbnail falls back to a video frame', () => {
 const { launch, addVideoPoster } = launchFixture();
 addVideoPoster(launch, { thumbnail_url: '/missing.webp' }, { kind: 'video', url: '/movie.mp4' });
 launch.children[0].onerror();
 assert.equal(launch.children.length, 1);
 assert.equal(launch.children[0].tag, 'video');
});

test('YouTube has an actual provider thumbnail without custom upload', () => {
 const { launch, addVideoPoster } = launchFixture();
 addVideoPoster(launch, { asset_url: 'https://youtu.be/abcdefghijk' }, { kind: 'iframe', url: 'https://www.youtube-nocookie.com/embed/abcdefghijk' });
 assert.equal(launch.children[0].tag, 'img');
 assert.equal(launch.children[0].src, 'https://i.ytimg.com/vi/abcdefghijk/hqdefault.jpg');
});

test('Vimeo has a player still without custom upload', () => {
 const { launch, addVideoPoster } = launchFixture();
 addVideoPoster(launch, { asset_url: 'https://vimeo.com/123456' }, { kind: 'iframe', url: 'https://player.vimeo.com/video/123456' });
 assert.equal(launch.children[0].tag, 'iframe');
 assert.match(launch.children[0].src, /autoplay=0/);
 assert.equal(launch.children[0].tabIndex, -1);
});

test('manager hidden previews stay hidden and a video fallback is available', () => {
 assert.match(manager, /\[hidden\]\{display:none!important\}/);
 assert.match(manager, /id="videoThumbnailFallback"/);
 assert.match(manager, /function renderContentVideoFallback\(force=false\)/);
 assert.match(manager, /renderContentVideoFallback\(true\)/);
});

test('both client room languages position preview behind play action', () => {
 for (const path of ['client-room/index.html', 'client-room/vi/index.html']) {
  const html = read(path);
  assert.match(html, /\.video-launch img,\.video-launch video,\.video-launch iframe\{/);
  assert.match(html, /pointer-events:none/);
 }
});

test('thumbnail upload, storage, and public rendering remain connected', () => {
 assert.match(manager, /prepareThumbnail\(\$\('videoThumbnailFile'\)\.files\[0\]\)/);
 assert.match(manager, /uploadSmallFile\(prepared,'gallery'\)/);
 assert.match(manager, /thumbnail_url:\$\('category'\)\.value==='video'/);
 assert.match(contentApi, /setVideoThumbnail\(env,'content',id,body\.thumbnail_url\|\|''\)/);
 assert.match(contentApi, /linkedRows\.results\|\|\[\]\)await setVideoThumbnail/);
 assert.match(published, /COALESCE\(vt\.thumbnail_url,''\) AS thumbnail_url/);
 assert.match(media, /room_video_thumbnails vt/);
 assert.match(media, /rawLength===null\?null:Number\(rawLength\)/);
});
