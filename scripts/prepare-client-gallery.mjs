import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { deriveGalleryKey, encode64 } from '../src/lib/client-gallery-crypto.mjs';
const hashPassword = async (password, salt, iterations) => encode64(await deriveGalleryKey(password, salt, iterations));
import { prepareClientCover } from './lib/prepare-client-cover.mjs';
const demo=process.argv.includes('--demo');
const input=process.argv.find(arg=>arg.startsWith('--config='))?.slice(9);
if(!demo&&!input) throw new Error('Use --demo or --config=/absolute/path/to/private-config.json');
let config;
if(demo) {
 const gallery=JSON.parse(await fs.readFile('src/data/galleries.json','utf8'));
 config={slug:'demo',title:'A collection of moments.',groups:[
  {title:'Portraits',photos:gallery.photography[0].photos.slice(0,6).map(photo=>({path:path.resolve('public'+photo.src),alt:photo.alt}))},
  {title:'Coast & country',photos:gallery.photography[1].photos.slice(0,6).map(photo=>({path:path.resolve('public'+photo.src),alt:photo.alt}))},
 ]};
} else config=JSON.parse(await fs.readFile(input,'utf8'));
if(!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(config.slug)) throw new Error('Use a simple lowercase gallery slug.');
const password=demo?'smooth-preview':process.env.CLIENT_GALLERY_PASSWORD;
if(!password||password.length<12) throw new Error('Set CLIENT_GALLERY_PASSWORD to a unique password of at least 12 characters.');
if(!config.title||!config.groups?.length||config.groups.some(group=>!group.photos?.length)) throw new Error('Provide a title and at least one nonempty group.');
for(const group of config.groups) if(group.expectedCount !== undefined && group.photos.length !== group.expectedCount) throw new Error(`${group.title}: expected ${group.expectedCount} photographs, received ${group.photos.length}.`);
const directory=path.resolve('work/client-galleries',config.slug);
await fs.mkdir(directory,{recursive:true});
const salt=randomBytes(16).toString('base64url');
const manifest={title:config.title,clientName:config.clientName??'',previewOnly:config.previewOnly===true,password:{salt,iterations:100000,hash:await hashPassword(password,salt)},groups:[]};
if(config.cover?.path) manifest.cover=await prepareClientCover(config.cover.path,directory);
let count=0,total=0;
for(const group of config.groups) {
 const photos=[];
 for(const photo of group.photos) {
  const stem=`photo-${String(++count).padStart(3,'0')}`;
  const full=await sharp(photo.path).rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:5}).toBuffer({resolveWithObject:true});
  await fs.writeFile(path.join(directory,`${stem}.webp`),full.data);total+=full.data.length;
  const variants=[];
  for(const width of [480,800,1200].filter(width=>width<full.info.width)) {
   const file=`${stem}-${width}w.webp`;
   const buffer=await sharp(full.data).resize({width}).webp({quality:80,effort:5}).toBuffer();
   await fs.writeFile(path.join(directory,file),buffer);total+=buffer.length;variants.push({file,width});
  }
  variants.push({file:`${stem}.webp`,width:full.info.width});
  photos.push({file:`${stem}.webp`,thumbnail:variants.find(variant=>variant.width===800)?.file??`${stem}.webp`,width:full.info.width,height:full.info.height,alt:photo.alt??'Client photograph',variants});
 }
 manifest.groups.push({title:group.title??'',photos});
}
// No original filenames, EXIF, GPS or plain-text passwords go into the upload bundle.
await fs.writeFile(path.join(directory,'gallery.json'),JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
console.log(`Prepared ${count} photographs (${(total/1024/1024).toFixed(1)} MB including responsive variants) in ${directory}`);
if(demo) console.log('Local demonstration only: /clients/demo/ — password: smooth-preview');
