# Client galleries

Client galleries use the existing static Cloudflare Pages / Git deployment. No R2, KV, extra Cloudflare bindings, or paid storage service is required.

Each client gets `/clients/their-slug/` and a separate password. A public welcome screen shows their approved title, name and cover. The gallery listing is encrypted with AES-256-GCM using a key derived from the password with PBKDF2-SHA256 (210,000 iterations and a random salt). The plaintext password is never shipped to the browser or stored in Git. Each listing is tied to its gallery slug. Unlocking renders the existing responsive PhotoSwipe gallery. Tab-scoped sessions remember the derived key for up to eight hours; there is no lock button.

**Images are intentionally public.** Anyone with a direct image URL can open or share it without a password. This is a lightweight gallery password gate, not private photo storage or server-side access control. The owner approved this model for Brayden's photographs. Client assets are published in this public source repository and Pages. Client routes, image assets and descriptors have noindex headers; gallery pages are omitted from the sitemap. These directives discourage indexing but do not make assets private. The encrypted listing does not prevent offline password guessing; choose a unique password per gallery.

## Preparing and publishing

1. Keep original exports and source-path configuration outside public assets. The private input config and intermediate manifest live under Git-ignored `work/`.
2. Set `CLIENT_GALLERY_PASSWORD` in your terminal environment. Run `node scripts/prepare-client-gallery.mjs --config=/absolute/path/private-config.json` to create derived WebP photos in `work/client-galleries/<slug>/`: maximum 2400px edge, 480/800/1200px responsive variants, stripped metadata. An optional cover gets 800/1440/1920px variants with a maximum 2560px height.
3. Review the private manifest's photo order. Run `node scripts/publish-client-gallery.mjs <slug>` with the same password to copy only optimized public WebP assets into `public/client-assets/<slug>/` and produce the encrypted descriptor at `public/client-galleries/<slug>.json`. It never copies the private manifest or original filenames. This is the explicit publication step; only use it for approved photographs.
4. Run `npm run check:site` and `npm run lint`, review locally, then commit/push through `site-build` and `main` when authorized. Static gallery routes are generated from the public descriptors. Future ordinary builds preserve the gallery automatically; no external downloads or local-only dependencies are needed.
5. Verify the live password screen, correct and incorrect passwords, collection counts, responsive layout and PhotoSwipe. Direct image links should be accessible without a password by design.

To change a password, rerun the publication script with the new password and redeploy the changed descriptor. Its random encryption IV changes, invalidating saved tab keys on reload. Already-open or downloaded content cannot be recalled. Removing a gallery requires removing its descriptor and public asset directory, then deploying; public Git history and previously shared copies may remain.

## Brayden admission gallery

Title: A Case for Celebration. Client: Brayden Juen-Hung HSU. Slug: `brayden-admission`.

On Film contains 12 Hasselblad photographs in the approved curated sequence, with the final two swapped. In the Moment contains 50 digital photographs in DateTimeOriginal capture order. The courthouse cover is behind the taller header only. A continuous rounded gradient sits behind both collections, matching the Photography page. The shared studio footer appears below.

Keep local backups of the original exports, private preparation config and private manifests. Passwords belong in a password manager, not this document or Git.
