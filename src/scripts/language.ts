import { LANGUAGE_PREFERENCE_KEY, preserveLocation, shouldOfferItalian } from '../utils/languagePreference';
function initialiseLanguage() {
 const preference = () => { try { return localStorage.getItem(LANGUAGE_PREFERENCE_KEY); } catch { return null; } };
 const remember = (locale: string) => { try { localStorage.setItem(LANGUAGE_PREFERENCE_KEY, locale); } catch { /* Language links also work when storage is unavailable. */ } };
 document.querySelectorAll<HTMLAnchorElement>('[data-language-choice]').forEach(link => {
  link.href = preserveLocation(link.getAttribute('href')!, location);
  link.addEventListener('click', () => {
   link.href = preserveLocation(new URL(link.href).pathname, location);
   remember(link.dataset.languageChoice!);
  });
 });
 const dialog = document.querySelector<HTMLDialogElement>('[data-language-prompt]');
 if (!dialog) return;
 const dismiss = () => { remember('en'); dialog.close(); };
 dialog.querySelector('[data-language-dismiss]')?.addEventListener('click', dismiss);
 dialog.addEventListener('cancel', () => remember('en'));
 const preview = dialog.dataset.devPreview === 'true' && new URLSearchParams(location.search).get('language-preview') === 'italy';
 if (!preview && preference()) return;
 const offer = (country: string | null) => {
  if (shouldOfferItalian(document.documentElement.lang, preview ? null : preference(), country) && !dialog.open) dialog.showModal();
 };
 if (preview) { offer('IT'); return; }
 fetch('/api/visitor-country', { cache:'no-store', credentials:'same-origin', signal:AbortSignal.timeout(4000) })
  .then(response => response.ok ? response.json() : null)
  .then(result => offer(result?.country ?? null))
  .catch(() => { /* Geolocation is optional; English and the manual switch remain available. */ });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialiseLanguage, { once:true });
else initialiseLanguage();
