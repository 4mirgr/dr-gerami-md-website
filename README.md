# Dr Gerami MD Website — Clinical Cabinet

A static Persian-first medical education website for **Dr Gerami MD | Internal Medicine**.

This site is designed as a premium clinical dashboard/cabinet and remains compatible with GitHub Pages branch deployment.

## Main pages

- `index.html` — Clinical Cabinet homepage
- `videos.html` — video library and learning paths
- `resources.html` — references and resource library
- `about.html` — professional bio and brand trust page
- `admin.html` — static Admin Lite dashboard for content generation and appearance controls
- `posts/aki-approach.html` — first video companion post
- `data/site-content.json` — central content library for videos and resources
- `theme-overrides.css` — optional generated theme variables from Admin Lite

## Admin Lite workflow

Open `admin.html` locally or on GitHub Pages to generate:

- new companion post HTML files for `posts/`
- video-card snippets for `videos.html`
- resource-card snippets for `resources.html`
- Shorts Pack drafts
- `theme-overrides.css` appearance and UI changes
- `data/site-content.json` content-library updates for videos and resources

The admin panel is intentionally backend-free. It does not store GitHub tokens or secrets in public browser JavaScript. Copy or download the generated output, place it in the repository, commit, and wait for GitHub Pages to publish.

Because the content library is loaded with browser `fetch`, use a local static server for full testing instead of opening files directly from Finder.

## Deployment

Upload or commit the contents of this folder to the repository root, then use GitHub Pages:

`Settings → Pages → Deploy from a branch → main → /root`
