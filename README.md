# guystone-blog

Personal blog. Each post is a Markdown file in `posts/`.

## Quick start

```bash
npm install
npm run build      # regenerates site/
npm run serve      # builds and serves at http://localhost:4000
npm run watch      # rebuilds on changes
```

## Adding a post

Create a new file in `posts/`:

```markdown
---
title: My New Post
date: 2026-05-20
description: One or two sentences shown on the home page.
thumbnail: ../static/images/my-thumb.png   # optional
thumbnailStyle: "width: auto; height: 200px;"   # optional override
---

Post body in regular Markdown.
```

Then run `npm run build`. The post is rendered to `site/posts/<slug>.html` and
appears on the index, sorted by date descending. If you omit `slug` in the
frontmatter, the filename (minus `.md`) is used.

## Project layout

```
posts/             markdown post files (one file = one post)
pages/             markdown for static pages (about, etc.)
static/            CSS and any images/assets, copied verbatim
templates/         minimal HTML templates with {{var}} placeholders
build.js           the static site generator
site.config.json   site name, subtitle, profile blurb
site/              generated output (gitignored)
```

## Site config

Edit `site.config.json` to change the header name, subtitle, profile image, and
intro blurb shown above the post list.

## Deploying

The output is plain static HTML — drop `site/` on any host. If you upgrade this
repo to GitHub Pages (requires Pro for private repos), the workflow in
`.github/workflows/deploy.yml` will build and publish on every push to `main`.
