import italian from '../data/italian.json';
export type Locale = 'en' | 'it';
export const translate = (locale: Locale, text: string): string => locale === 'it' ? (italian as Record<string, string>)[text.replace(/\s+/g, ' ').trim()] ?? text : text;
export function localizedPath(path: string, locale: Locale): string {
 if (locale === 'it' && path === '/404.html') return '/it/404/';
 if (!path.startsWith('/') || path.startsWith('//')) return path;
 return locale === 'it' ? `/it${path === '/' ? '/' : path}` : path;
}
export const categoryTitles: Record<string, string> = {
 'portraits-editorial': 'Ritratti ed editoriale',
 'coast-country': 'Costa e paesaggi',
 'travel-details': 'Viaggi e dettagli',
 'documentary-stories': 'Persone e storie',
 'weddings-people': 'Matrimoni e persone',
 'community-live': 'Comunità ed eventi dal vivo',
};
