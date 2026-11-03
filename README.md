# AI for HE

Practical guidance on AI in higher education, by Paul Hendrie.

A static site: plain HTML pages with one small script (`assets/dc-lite.js`) that powers dark mode, search, filters and accordions. Each page is pre-rendered, so content is visible without JavaScript.

- `index.html` is the home page; every other page sits alongside it.
- `assets/` holds the script, the photo and the self-hosted Geist font (SIL Open Font Licence, see `assets/fonts/LICENSE.txt`).
- No build step. Deploy the repository root as-is (e.g. Vercel, Netlify, GitHub Pages). `vercel.json` turns on clean URLs.
