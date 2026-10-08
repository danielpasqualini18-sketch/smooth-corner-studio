import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root = path.resolve('dist');
const origin = 'https://www.smoothcornerstudio.com.au';
const files = [];
async function walk(directory) {
 for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
  const file = path.join(directory, entry.name);
  if (entry.isDirectory()) await walk(file); else files.push(file);
 }
}
await walk(root);
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
const attribute = (tag, name) => decode(tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? '');
const issues = [];
const references = new Set();
const metadata = new Map();
const titles = new Set(), descriptions = new Set();
let pageCount = 0, imageCount = 0;
async function imageInfo(file) {
 if (!metadata.has(file)) metadata.set(file, await sharp(file).metadata());
 return metadata.get(file);
}
async function checkReference(reference, source, anchors = false) {
 if (!reference || /^(data:|mailto:|tel:|javascript:)/i.test(reference)) return;
 const url = new URL(reference, origin + source);
 if (url.origin !== origin) return;
 let location = path.join(root, decodeURIComponent(url.pathname));
 const stat = await fs.stat(location).catch(() => null);
 if (stat?.isDirectory()) location = path.join(location, 'index.html');
 else if (!stat && !path.extname(location)) location = path.join(location, 'index.html');
 if (!(await fs.stat(location).catch(() => null))?.isFile()) { issues.push(`Missing ${reference} on ${source}`); return; }
 references.add(location);
 if (anchors && url.hash) {
  const html = await fs.readFile(location, 'utf8');
  const id = decodeURIComponent(url.hash.slice(1));
  if (!html.includes(`id="${id}"`)) issues.push(`Missing anchor ${reference} on ${source}`);
 }
}
for (const file of files.filter(file => file.endsWith('.html'))) {
 const html = await fs.readFile(file, 'utf8');
 const relative = path.relative(root, file).replaceAll(path.sep, '/');
 const urlPath = relative === 'index.html' ? '/' : '/' + relative.replace(/index\.html$/, '');
 if (html.includes('http-equiv="refresh"')) continue;
 pageCount++;
 assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${urlPath}: one H1`);
 const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
 assert.equal(ids.length, new Set(ids).size, `${urlPath}: unique IDs`);
 const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '');
 const meta = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => match[0]);
 const description = attribute(meta.find(tag => attribute(tag, 'name') === 'description') ?? '', 'content');
 assert(title && description, `${urlPath}: title and description`);
 assert(!titles.has(title) && !descriptions.has(description), `${urlPath}: unique search metadata`);
 titles.add(title); descriptions.add(description);
 const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0]).find(tag => attribute(tag, 'rel') === 'canonical');
 assert(attribute(canonical ?? '', 'href').startsWith(origin), `${urlPath}: production canonical`);
 if (!urlPath.includes('404')) {
  const json = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]));
  assert(json.some(value => value['@graph']?.some(node => ['WebPage', 'CollectionPage'].includes(node['@type']))), `${urlPath}: page schema`);
 }
 for (const match of html.matchAll(/<(?:img|script|link|a)\b[^>]*>/g)) {
  const tag = match[0];
  for (const name of ['src', 'href']) await checkReference(attribute(tag, name), urlPath, tag.startsWith('<a'));
  if (tag.startsWith('<img')) {
   imageCount++;
   assert(/\salt=/.test(tag), `${urlPath}: image alt text`);
   const width = Number(attribute(tag, 'width')), height = Number(attribute(tag, 'height'));
   assert(width > 0 && height > 0, `${urlPath}: reserved image dimensions`);
   const src = attribute(tag, 'src');
   if (src.startsWith('/')) {
    const info = await imageInfo(path.join(root, src));
    assert(Math.abs(width / height - info.width / info.height) < .015, `${src}: aspect ratio`);
   }
   for (const candidate of attribute(tag, 'srcset').split(',').map(s => s.trim()).filter(Boolean)) {
    const [src, descriptor] = candidate.split(/\s+/);
    await checkReference(src, urlPath);
    const info = await imageInfo(path.join(root, src));
    assert.equal(info.width, parseInt(descriptor), `${src}: srcset width`);
   }
  }
 }
}
for (const file of files.filter(file => file.endsWith('.css'))) {
 for (const match of (await fs.readFile(file, 'utf8')).matchAll(/url\(["']?([^\)"']+)["']?\)/g)) await checkReference(match[1], '/');
}
for (const file of files.filter(file => file.endsWith('.xml'))) {
 const xml = await fs.readFile(file, 'utf8');
 for (const match of xml.matchAll(/<(?:loc|image:loc)>(.*?)<\/(?:loc|image:loc)>/g)) await checkReference(decode(match[1]), '/');
 if (file.endsWith('sitemap-0.xml')) assert(!/films-stories|\/404|image-sitemap/.test(xml), 'Only indexable pages in sitemap');
}
for (const file of files) assert((await fs.stat(file)).size < 25 * 1024 * 1024, `${file}: Cloudflare Pages file size`);
assert.equal(issues.length, 0, issues.join('\n'));
console.log(`PASS: ${pageCount} pages, ${imageCount} image elements, ${references.size} local references, ${metadata.size} image variants; links, anchors, metadata, schema, sitemap and Cloudflare asset limits.`);
