# FOLLICLE. standalone website

Static responsive website with SFW homepage, category filters, gallery page and an age-confirmation dialog.

## Deploy quickly with Cloudflare Pages
1. Create a Cloudflare account.
2. Open Workers & Pages and create a Pages project.
3. Upload the site folder using the supported direct-upload workflow, or push it to Git and connect the repository.
4. Use no build command; set the output directory to the folder containing `index.html`.
5. Test the provided `*.pages.dev` URL.
6. To attach a domain, register one with a domain registrar, then use Pages > Custom domains and follow the exact DNS instructions shown in your account. For an apex domain, Cloudflare documents adding the domain as a zone and pointing nameservers to Cloudflare.

Docs: https://developers.cloudflare.com/pages/configuration/custom-domains/

Alternative static hosting: Netlify can host the folder and provide a `*.netlify.app` URL before a custom domain is attached: https://www.netlify.com/knowledge-base/how-to-deploy-a-site-to-netlify/

## Domain
No domain has been bought or connected by this package. Names to check (not availability claims): `folliclearchive.com`, `follicle.studio`, `folliclevisuals.com`. Check domain availability and trademark conflicts before purchasing.

## Large image storage
Recommended: Cloudflare Pages for the site + Cloudflare R2 for image objects + a media subdomain such as `images.YOURDOMAIN.com` connected to the bucket. Store optimized WebP/AVIF thumbnails separately from originals and serve thumbnails in grids. Keep original files backed up independently.

R2 docs: https://developers.cloudflare.com/r2/ and https://developers.cloudflare.com/r2/buckets/public-buckets/
Pricing: https://developers.cloudflare.com/r2/pricing/

R2 is private by default. Enable public delivery intentionally and connect a custom domain for production CDN features. Do not use the development `r2.dev` endpoint for production. Never put storage API keys in browser JavaScript. For admin uploads, use a server-side Worker with authentication and short-lived upload URLs.

## Age confirmation
The modal is a simple localStorage self-attestation and is not legally robust age verification; it can be bypassed. It does not verify identity. Keep the public front page SFW as designed. If legally age-restricted content will be hosted, research the rules applicable to your audience and jurisdiction and implement a compliant age-assurance flow if required.

## Replace gallery placeholders
The current gallery cards are graphic placeholders. Add `<img>` elements pointing at optimized image URLs, with meaningful alt text, dimensions, and `loading="lazy"`. Upload only content you have rights and permission to publish; maintain consent/licensing records where relevant.
