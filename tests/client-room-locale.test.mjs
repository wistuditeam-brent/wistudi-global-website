import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext, Script } from 'node:vm';
import { preferredClientRoomLocale, clientRoomLanguageRedirect } from '../functions/_client-room-locale.mjs';

const ORIGIN = 'https://global.wistudi.com';
const request = (path, { country, cookie = '', browser = 'en-US,en;q=0.9', method = 'GET' } = {}) => ({
 url: ORIGIN + path,
 method,
 cf: country ? { country } : undefined,
 headers: new Headers({ cookie, 'accept-language': browser })
});
const target = (path, opts) => clientRoomLanguageRedirect(request(path, opts));

test('new Vietnamese visitor gets Vietnamese even with English browser', () => {
 const res = target('/client-room/', { country: 'VN' });
 assert.equal(res.status, 302);
 assert.equal(res.headers.get('location'), ORIGIN + '/client-room/vi/');
 assert.match(res.headers.get('cache-control'), /no-store/);
});
test('non-Vietnamese visitor gets English even with Vietnamese browser', () => {
 assert.equal(preferredClientRoomLocale(request('/client-room/', { country: 'US', browser: 'vi-VN' })), 'en');
 assert.equal(target('/client-room/', { country: 'US', browser: 'vi-VN' }), null);
});
test('browser language used only when country is missing or unknown', () => {
 assert.equal(target('/client-room/', { browser: 'vi-VN,vi;q=0.8,en;q=0.6' }).headers.get('location'), ORIGIN + '/client-room/vi/');
 assert.equal(target('/client-room/', { country: 'XX', browser: 'vi-VN' }).status, 302);
 assert.equal(target('/client-room/', { country: 'T1', browser: 'en-US' }), null);
});
test('explicit saved English overrides Vietnamese IP', () => {
 assert.equal(target('/client-room/', { country: 'VN', cookie: 'foo=1; wistudi_client_room_locale=en; other=2' }), null);
});
test('explicit saved Vietnamese overrides non-Vietnamese IP', () => {
 assert.equal(target('/client-room/', { country: 'GB', cookie: 'wistudi_client_room_locale=vi' }).status, 302);
});
test('invalid saved language ignored', () => {
 assert.equal(target('/client-room/', { country: 'VN', cookie: 'wistudi_client_room_locale=fr' }).status, 302);
});
test('direct Vietnamese URLs are never redirected', () => {
 for(const path of ['/client-room/vi/', '/client-room/vi/contact/', '/client-room/vi/partner/?slug=abc']) {
  assert.equal(target(path, { country: 'GB', cookie: 'wistudi_client_room_locale=en' }), null);
 }
});
test('contact and partner subpages are localised and query strings preserved', () => {
 assert.equal(target('/client-room/contact/', { country: 'VN' }).headers.get('location'), ORIGIN + '/client-room/vi/contact/');
 assert.equal(target('/client-room/partner/?slug=abc%20def', { country: 'VN' }).headers.get('location'), ORIGIN + '/client-room/vi/partner/?slug=abc%20def');
});
test('unrelated pages, assets and room-manager are not redirected', () => {
 for(const path of ['/', '/room-manager/', '/client-room/cms.js', '/client-room/partner.js', '/client-room/vi/contact.js', '/client-room/starter-assets/foo.mp4']) {
  assert.equal(target(path, { country: 'VN' }), null, path);
 }
 assert.equal(target('/client-room/', { country: 'VN', method: 'POST' }), null);
});
test('each localized page loads the same preference handler', () => {
 for(const path of [
  'client-room/index.html', 'client-room/vi/index.html',
  'client-room/contact/index.html', 'client-room/vi/contact/index.html',
  'client-room/partner/index.html', 'client-room/vi/partner/index.html'
 ]) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  assert.match(source, /<script defer src="\/client-room\/locale-preference\.js"><\/script>/, path);
 }
});
test('language selector records selected language with a Client Room-only cookie', () => {
 const source = readFileSync(new URL('../client-room/locale-preference.js', import.meta.url), 'utf8');
 assert.doesNotThrow(() => new Script(source));
 const events = {};
 const en = { id:'langEn', href:'#', addEventListener(name,fn){ events.en = fn; } };
 const vi = { id:'langVi', href:'#', addEventListener(name,fn){ events.vi = fn; } };
 const document = { cookie: '', querySelectorAll(){ return [en,vi]; } };
 runInNewContext(source, { document, URL, location: { origin: ORIGIN } });
 events.en();
 assert.match(document.cookie, /^wistudi_client_room_locale=en;/);
 assert.match(document.cookie, /Path=\/client-room/);
 events.vi();
 assert.match(document.cookie, /^wistudi_client_room_locale=vi;/);
});
