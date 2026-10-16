// The listing is encrypted; image URLs themselves intentionally remain public.
export const encode64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
export const decode64 = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
export async function deriveGalleryKey(password, salt, iterations = 210000) {
 const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
 return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:decode64(salt),iterations},material,256);
}
export async function decryptGallery(encrypted, keyBytes, slug) {
 const key = await crypto.subtle.importKey('raw',keyBytes,'AES-GCM',false,['decrypt']);
 const bytes = await crypto.subtle.decrypt({name:'AES-GCM',iv:decode64(encrypted.iv),additionalData:new TextEncoder().encode(slug)},key,decode64(encrypted.data));
 return JSON.parse(new TextDecoder().decode(bytes));
}
