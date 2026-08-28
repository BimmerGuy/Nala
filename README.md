# NALA Landing Page V3 — Cinematic / Performance First

A self-contained, single-page landing page using the real NALA logo and current NALA app screenshots.

## Run
Open `index.html` directly, or host the folder on Cloudflare Pages / Netlify.

## What changed from V2
- Removed Tailwind CDN runtime to eliminate render delay and external dependency.
- No external fonts or JS libraries.
- Optimized screenshots to WebP.
- Galaxy canvas caps device pixel ratio and particle count, runs at roughly 30 FPS, and pauses in background tabs.
- Intersection animations run once and then unobserve.
- Pointer parallax/tilt only runs on fine-pointer desktop devices.
- Mobile is a real layout, not a scaled-down desktop layout.
- Real NALA screenshots are used; UI inside the images is not redesigned.
- App Store / Google Play controls clearly say Coming soon.

## Files
- `index.html`
- `styles.css`
- `app.js`
- `assets/`
