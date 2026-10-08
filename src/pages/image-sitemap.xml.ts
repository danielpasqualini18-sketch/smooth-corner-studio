import type { APIRoute } from 'astro';

import galleries from '../data/galleries.json';
import { SITE_URL } from '../data/site';
export const prerender = true;
const escape = (value: string) => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]!));
export const GET: APIRoute = () => {
 const pages: Record<string, string[]> = {
  '/': ['/images/title-background.jpg', '/images/photography-cover.webp', '/images/events-cover.webp', '/images/films-cover.webp'],
  '/photography/': galleries.photography.flatMap(group => group.photos.map(photo => photo.src)),
  '/events/': galleries.events.flatMap(group => group.photos.map(photo => photo.src)),
  '/films/': ['loinnir', 'pathway-to-purpose', 'soulty-sisters-project', 'carers-land-sea'].map(slug => `/images/films/${slug}.webp`),
 };
 const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + Object.entries(pages).map(([path, images]) => `<url><loc>${escape(new URL(path, SITE_URL).href)}</loc>${images.map(src => `<image:image><image:loc>${escape(new URL(src, SITE_URL).href)}</image:loc></image:image>`).join('')}</url>`).join('') + '</urlset>\n';
 return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
