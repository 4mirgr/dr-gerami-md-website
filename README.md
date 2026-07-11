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

## Website Manager workflow

For a simple edit-and-publish workflow on the project Mac:

1. Double-click `Start Admin.command`.
2. Keep the Terminal window open.
3. Edit colors, videos, or resources in the dashboard that opens automatically.
4. Click **ذخیره و انتشار سایت**.

The local manager writes the content and theme files, creates a Git commit, and pushes `main` to GitHub. It binds only to `127.0.0.1` and protects publishing with a random session token.

The public `admin.html` page remains preview-only because a public GitHub Pages site cannot safely hold repository credentials.

Advanced tools can still generate:

- new companion post HTML files for `posts/`
- video-card snippets for `videos.html`
- resource-card snippets for `resources.html`
- Shorts Pack drafts
- `theme-overrides.css` appearance and UI changes
- `data/site-content.json` content-library updates for videos and resources

The manager uses the existing authenticated `gh` session on the Mac and never places a GitHub token in browser JavaScript.

## Deployment

Upload or commit the contents of this folder to the repository root, then use GitHub Pages:

`Settings → Pages → Deploy from a branch → main → /root`
