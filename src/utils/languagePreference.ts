export const LANGUAGE_PREFERENCE_KEY = 'smooth-corner-language';
export function shouldOfferItalian(locale: string, preference: string | null, country: string | null): boolean {
 return locale === 'en' && preference !== 'en' && preference !== 'it' && country === 'IT';
}
export function preserveLocation(destination: string, location: { search: string; hash: string }): string {
 const query = new URLSearchParams(location.search);
 query.delete('language-preview');
 const search = query.toString();
 return `${destination}${search ? `?${search}` : ''}${location.hash}`;
}
