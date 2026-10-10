import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet } from '../functions/api/visitor-country.js';
// Node's TypeScript stripping keeps policy tests on the same code used in the browser.
import { shouldOfferItalian, preserveLocation } from '../src/utils/languagePreference.ts';
for (const country of ['IT', 'AU', undefined]) {
 const response = onRequestGet({request:{cf:{country}}});
 assert.deepEqual(await response.json(), {country:country === 'IT' ? 'IT' : null});
 assert.match(response.headers.get('cache-control'), /no-store/);
}
assert.equal(shouldOfferItalian('en', null, 'IT'), true);
for (const preference of ['en','it']) assert.equal(shouldOfferItalian('en', preference, 'IT'), false);
assert.equal(shouldOfferItalian('it', null, 'IT'), false);
assert.equal(shouldOfferItalian('en', null, 'AU'), false);
assert.equal(shouldOfferItalian('en', null, null), false);
assert.equal(preserveLocation('/it/', {search:'?utm_source=instagram&language-preview=italy',hash:'#work'}), '/it/?utm_source=instagram#work');
const base = 'https://www.smoothcornerstudio.com.au';
for (const page of ['', 'photography','events','films','links']) {
 const suffix = page ? page+'/' : '';
 const en = readFileSync(`dist/${page ? page+'/' : ''}index.html`, 'utf8');
 const it = readFileSync(`dist/it/${page ? page+'/' : ''}index.html`, 'utf8');
 assert.match(it, /<html lang="it"/);
 assert.match(en, /<html lang="en"/);
 for (const document of [en,it]) {
  assert.ok(document.includes(`hreflang="en" href="${base}/${suffix}"`) || document.includes(`href="${base}/${suffix}" hreflang="en"`), page+' English alternate');
  assert.ok(document.includes(`${base}/it/${page}`), page+' Italian alternate');
 }
 assert.equal((it.match(/data-pswp-width=/g)||[]).length, (en.match(/data-pswp-width=/g)||[]).length);
}
const sitemap=readFileSync('dist/sitemap-0.xml','utf8');
assert.ok(sitemap.includes(`${base}/it/photography`));
assert.ok(sitemap.includes(`${base}/photography`));
console.log('PASS: country privacy, prompt preferences, language navigation, bilingual metadata and gallery parity.');
