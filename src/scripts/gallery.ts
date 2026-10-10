 import 'photoswipe/style.css';

import PhotoSwipeLightbox from 'photoswipe/lightbox';

 import { mixOrientations } from '../utils/galleryOrder';
function initialiseGalleries() {
 document.querySelectorAll<HTMLElement>('[data-gallery-root]').forEach(root => {
  if (root.dataset.galleryInitialised) return;
  const gallery = root.querySelector<HTMLElement>('[data-photo-gallery]');
  if (!gallery) return;
  root.dataset.galleryInitialised = 'true';
  const cards = [...gallery.querySelectorAll<HTMLElement>('.curated-photo')];
  const filters = root.querySelectorAll<HTMLButtonElement>('[data-gallery-filter]');
  const layout = () => {
   gallery.classList.add('is-masonry');
   const gap = parseFloat(getComputedStyle(gallery).rowGap);
   cards.filter(card => !card.hidden).forEach(card => {
    const image = card.querySelector('img');
    if (!image) return;
    const ratio = Number(image.getAttribute('height')) / Number(image.getAttribute('width'));
    const height = (card.getBoundingClientRect().width - 2) * ratio + 2;
    card.style.gridRowEnd = `span ${Math.ceil((height + gap) / (1 + gap))}`;
   });
  };
  filters.forEach(button => button.addEventListener('click', () => {
   const collection = button.dataset.galleryFilter;
   cards.forEach(card => { card.hidden = collection !== 'all' && card.dataset.collection !== collection; });
   const visible = cards.filter(card => !card.hidden);
   const mixed = mixOrientations(visible, card => {
    const image = card.querySelector('img')!;
    return Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
   });
   gallery.append(...mixed);
   filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
   const status = root.querySelector('.gallery-status');
   if (status) status.textContent = `${cards.filter(card => !card.hidden).length} ${root.dataset.photoWord ?? "photographs"}${collection === 'all' ? '' : ` · ${button.textContent}`}`;
   layout();
  }));
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(gallery);
  else window.addEventListener('resize', layout);
 const lightbox = new PhotoSwipeLightbox({
  gallery,
  children: '.curated-photo:not([hidden]) a',
  pswpModule: () => import('photoswipe'),
  preload: [1, 1],
  closeTitle: document.documentElement.lang === "it" ? "Chiudi" : "Close",
  zoomTitle: document.documentElement.lang === "it" ? "Ingrandisci" : "Zoom",
  arrowPrevTitle: document.documentElement.lang === "it" ? "Precedente" : "Previous",
  arrowNextTitle: document.documentElement.lang === "it" ? "Successiva" : "Next",
  errorMsg: document.documentElement.lang === "it" ? "Impossibile caricare la fotografia." : "The image cannot be loaded.",
  paddingFn: viewport => ({ top: viewport.x < 850 ? 72 : 96, bottom: viewport.x < 850 ? 72 : 96, left: viewport.x < 850 ? 22 : 72, right: viewport.x < 850 ? 22 : 72 }),
 });
 lightbox.init();
 });
}
if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', initialiseGalleries, { once: true });
} else {
 initialiseGalleries();
}
document.addEventListener('astro:page-load', initialiseGalleries);
