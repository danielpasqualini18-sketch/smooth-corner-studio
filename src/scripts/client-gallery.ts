import { decode64, decryptGallery, deriveGalleryKey, encode64 } from '../lib/client-gallery-crypto.mjs';

interface ClientPhoto { src:string; thumbnail:string; width:number; height:number; alt:string; srcset:string; }
interface ClientCollection { title:string; photos:ClientPhoto[]; }
const match = location.pathname.match(/^\/clients\/([a-z0-9-]+)\/$/);
const base = match ? `/clients/${match[1]}/` : null;
const form = document.querySelector<HTMLFormElement>('[data-client-unlock]')!;
const locked = document.querySelector<HTMLElement>('[data-client-locked]')!;
const collections = document.querySelector<HTMLElement>('[data-client-collections]')!;
const title = document.querySelector<HTMLElement>('[data-client-title]')!;
const feedback = document.querySelector<HTMLElement>('#gallery-feedback')!;
const password = document.querySelector<HTMLInputElement>('#gallery-password')!;
const clientName = document.querySelector<HTMLElement>('[data-client-name]')!;
const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
let expiryTimer:ReturnType<typeof setTimeout> | undefined;
const slug = match?.[1] ?? '';
const storageKey = `sc-gallery:${slug}`;
let descriptor: {title:string;clientName?:string;cover?:{src:string;srcset:string;width:number;height:number};encrypted:{salt:string;iterations:number;iv:string;data:string}};
function forgetSession() { try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ } }
function message(text:string, error=false) { feedback.textContent=text; feedback.toggleAttribute('data-error',error); }
function clearGallery() {
 // Reloading also tears down PhotoSwipe, loaded images and event listeners on this document.
 forgetSession();location.replace(location.pathname);
}
function renderGallery(data:{title:string;clientName?:string;groups:ClientCollection[]}) {
 clientName.textContent=data.clientName ?? '';
 clientName.hidden=!data.clientName;
 title.textContent = data.title;
 document.title = `${data.title} | Smooth Corner Studio`;
 collections.replaceChildren();
 const template = document.querySelector<HTMLTemplateElement>('#client-gallery-template')!;
 data.groups.forEach((group,index)=>{
  const section = document.createElement('section');
  section.className='client-collection';
  if(data.groups.length>1) { const heading=document.createElement('h2');heading.textContent=group.title;heading.id=`collection-title-${index}`;section.setAttribute('aria-labelledby',heading.id);section.append(heading); }
  if(!group.photos.length) {
   const placeholder=document.createElement('div');placeholder.className='collection-empty';
   const note=document.createElement('p');note.textContent='Photographs coming soon.';placeholder.append(note);
   section.append(placeholder);collections.append(section);return;
  }
  const content = template.content.cloneNode(true) as DocumentFragment;
  const root=content.querySelector<HTMLElement>('[data-gallery-root]')!;
  root.removeAttribute('data-gallery-initialised');
  const grid=content.querySelector<HTMLElement>('[data-photo-gallery]')!;
  grid.id=`client-grid-${index}`;
  root.querySelector('.gallery-nav')?.remove();
  root.querySelector('.gallery-status')?.remove();
  group.photos.forEach(photo=>{
   const figure=document.createElement('figure');figure.className='curated-photo';
   const link=document.createElement('a');link.href=photo.src;link.dataset.pswpWidth=String(photo.width);link.dataset.pswpHeight=String(photo.height);link.dataset.pswpSrcset=photo.srcset;link.setAttribute('aria-label',`View photograph: ${photo.alt}`);
   const image=document.createElement('img');image.src=photo.thumbnail;image.srcset=photo.srcset;image.sizes='(max-width:600px) calc(100vw - 40px), (max-width:1000px) calc((100vw - 58px) / 2), (max-width:1220px) calc((100vw - 76px) / 3), 382px';image.width=photo.width;image.height=photo.height;image.alt=photo.alt;image.loading='lazy';image.decoding='async';
   for(const attribute of grid.getAttributeNames().filter(name=>name.startsWith('data-astro-cid-'))) {for(const node of [figure,link,image])node.setAttribute(attribute,'');}
   link.append(image);figure.append(link);grid.append(figure);
  });
  section.append(content);collections.append(section);
 });
 document.querySelector<HTMLElement>('#main-content')!.dataset.clientState='unlocked';
 locked.hidden=true;collections.hidden=false;
 document.dispatchEvent(new Event('smooth-corner:gallery-ready'));
}
async function loadGallery() {
 if(!base) {submit.disabled=true;message('Open the gallery link supplied by the studio.');return;}
 try {
  const response=await fetch(`/client-galleries/${slug}.json`,{cache:'no-store'});
  if(!response.ok)throw new Error('This gallery is unavailable. Please contact the studio.');
  descriptor=await response.json();
  showWelcome();message('');
 } catch {message('This gallery is unavailable. Please try again shortly.',true);submit.disabled=true;return;}
 try {
  const saved=JSON.parse(sessionStorage.getItem(storageKey)??'null');
  if(saved?.version===descriptor.encrypted.iv && saved.expires>Date.now() && saved.expires<=Date.now()+8*60*60*1000) {
   renderGallery(await decryptGallery(descriptor.encrypted,decode64(saved.key),slug));
   expiryTimer=setTimeout(clearGallery,saved.expires-Date.now());
  } else forgetSession();
 } catch {forgetSession();}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!base || !descriptor)return;
 submit.disabled=true;submit.textContent='Opening…';message('');
 try {
  const raw=await deriveGalleryKey(password.value,descriptor.encrypted.salt,descriptor.encrypted.iterations);
  const data=await decryptGallery(descriptor.encrypted,raw,slug);
  password.value='';renderGallery(data);
  const expires=Date.now()+8*60*60*1000;
  try {sessionStorage.setItem(storageKey,JSON.stringify({key:encode64(raw),version:descriptor.encrypted.iv,expires}));} catch { /* Gallery still opens if session storage is blocked. */ }
  clearTimeout(expiryTimer);expiryTimer=setTimeout(clearGallery,8*60*60*1000);
 } catch {message('That password doesn’t match. Please try again.',true);password.focus();}
 finally {submit.disabled=false;submit.textContent='Open gallery';}
});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
void loadGallery();

function showWelcome() {
 const data=descriptor;
 title.textContent=data.title;document.title=`${data.title} | Smooth Corner Studio`;
 clientName.textContent=data.clientName??'';clientName.hidden=!data.clientName;
 if(data.cover && data.cover.src.startsWith(`/client-assets/${slug}/`)) {
  const background=document.querySelector<HTMLElement>('[data-client-background]')!;
  const image=background.querySelector<HTMLImageElement>('[data-client-cover]')!;
  image.width=data.cover.width;image.height=data.cover.height;image.sizes='100vw';
  image.srcset=data.cover.srcset;image.src=data.cover.src;
  background.hidden=false;
 }
}
