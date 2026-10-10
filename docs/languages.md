# English and Italian

English remains at the existing URLs; Italian is under `/it/`. Both use shared layouts in `src/views` so responsive CSS, image assets, galleries and video players stay consistent. Adapted Italian text is in `src/data/italian.json`; descriptive gallery alt text is in `src/data/galleryItalian.json`.

EN / IT controls preserve the equivalent page, current section and campaign query parameters. A stored language answer suppresses repeat invitations. Opening an English URL still shows English; choosing Italian follows Italian links throughout the site.

Cloudflare Pages compiles `functions/api/visitor-country.js` from the repository root. Only `/api/visitor-country` invokes it, via `public/_routes.json`. The response is either `{country:"IT"}` or `{country:null}`, is not cached and never exposes or stores an IP address. Visitors in Italy on an English page with no stored choice receive an invitation; geolocation failures leave the manual controls available.

Local preview: `/?language-preview=italy` opens the invitation in development only. This does not simulate the Cloudflare lookup. After deploying a Pages preview, verify `/api/visitor-country` returns the expected JSON and no-store header, and verify the invitation from an Italian connection with no stored language choice. Country lookup has been tested with mocked Cloudflare metadata, but not against a deployed version yet.

`npm run check:site` verifies the production build, asset references, metadata and bilingual routes, plus country privacy, invitation preferences and section-preserving language navigation. `npm run lint` checks source code.
