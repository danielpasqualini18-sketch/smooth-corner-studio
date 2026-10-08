# Smooth Corner Studio

Astro portfolio with static Cloudflare Pages hosting, PhotoSwipe galleries and a Formspree contact form.

## Local development

Use Node.js 22.12 or later; `.node-version` selects Node 22 for Cloudflare Pages. Install with `npm ci`, then run `npm run dev`. The local preview normally uses port 4321.

- `npm run check:site` builds the site and checks links, image dimensions, responsive variants, metadata, structured data, sitemaps and Cloudflare asset limits.
- `npm run lint` checks the source.
- `npm run preview` serves the production build.

Stop the development server before building, then restart it afterwards to avoid stale generated styles.

## Content and images

The photography and events collections are in `src/data/galleries.json`. Originals in `Images for website/` are ignored by Git. Only selected, optimised images and their responsive variants belong in `public/images/`.

Page metadata and the canonical domain are defined in `src/data/site.ts` and `src/components/SeoHead.astro`. If the canonical domain changes, also update `astro.config.mjs` and `public/robots.txt`.

## Deployment

Cloudflare Pages build command: `npm run build`. Output directory: `dist`. The repository includes a single npm lockfile.

`site-build` is the full website development branch. `main` contains the live temporary website. Verify the actual Cloudflare production branch and preview settings before publishing. Do not commit, push, merge, change production settings or launch without Daniel's explicit approval.

After an approved `site-build` push, review the Cloudflare branch preview. Launch separately after approval by merging the reviewed website into `main`, if Cloudflare is still configured to deploy production from `main`.
