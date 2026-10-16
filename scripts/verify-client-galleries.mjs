import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { decode64, decryptGallery, deriveGalleryKey, encode64 } from '../src/lib/client-gallery-crypto.mjs';
const password='an independent test password';
const salt=encode64(crypto.getRandomValues(new Uint8Array(16)));
const iv=crypto.getRandomValues(new Uint8Array(12));
const raw=await deriveGalleryKey(password,salt);
const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']);
const expected={title:'Sample gallery',groups:[{title:'On Film',photos:[]}]};
const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('alpha')},key,new TextEncoder().encode(JSON.stringify(expected)));
const encrypted={iv:encode64(iv),data:encode64(ciphertext)};
assert.deepEqual(await decryptGallery(encrypted,raw,'alpha'),expected);
await assert.rejects(decryptGallery(encrypted,await deriveGalleryKey('wrong password',salt),'alpha'));
await assert.rejects(decryptGallery(encrypted,raw,'beta'));
const corrupted=decode64(encrypted.data);corrupted[0]^=1;
await assert.rejects(decryptGallery({...encrypted,data:encode64(corrupted)},raw,'alpha'));
for(const file of await fs.readdir('public/client-galleries')) {
 if(!file.endsWith('.json'))continue;
 const descriptor=JSON.parse(await fs.readFile(path.join('public/client-galleries',file),'utf8'));
 const slug=file.slice(0,-5);
 assert(!descriptor.password && !descriptor.groups,'No plaintext credentials or listing');
 assert.equal(descriptor.encrypted.iterations,210000);
 assert(decode64(descriptor.encrypted.salt).length===16 && decode64(descriptor.encrypted.iv).length===12);
 assert((await fs.stat(`dist/clients/${slug}/index.html`)).isFile());
 for(const asset of await fs.readdir(`public/client-assets/${slug}`)) {
  assert.match(asset,/^(photo-\d{3}(?:-\d+w)?|cover(?:-\d+w)?)\.webp$/);
  assert((await fs.stat(`dist/client-assets/${slug}/${asset}`)).isFile());
 }
 const html=await fs.readFile(`dist/clients/${slug}/index.html`,'utf8');
 assert.match(html,/noindex/);
 assert(!html.includes('/photo-001'),'No photos rendered before unlocking');
}
console.log('PASS: encrypted listings, wrong passwords, cross-client isolation, tamper detection, public optimised image assets and noindex gallery shells.');
