---
title: Welcome
date: 2026-05-14
description: First post. A quick tour of how this blog is structured and how to add new posts.
---

This is the first post on the blog.

## How posts work

Every Markdown file in the `posts/` directory becomes a blog post. Each file
has a small YAML frontmatter block at the top:

```yaml
---
title: My Post Title
date: 2026-05-14
description: One or two sentences shown on the index page.
thumbnail: ../static/images/thumb.png   # optional
---
```

Below the frontmatter is regular Markdown.

## Building

Run `npm install` once, then `npm run build` to regenerate the `site/`
directory. `npm run serve` will build and start a local preview server.

## Styling

The CSS lives in `static/style.css` and mirrors the reference design — orange
underline accents, soft yellow highlights, and the NIXGONM display font.
