import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const PAGES_DIR = path.join(ROOT, 'pages');
const STATIC_DIR = path.join(ROOT, 'static');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const SITE_DIR = path.join(ROOT, 'site');

const CONFIG = readConfig();

function readConfig() {
  const configPath = path.join(ROOT, 'site.config.json');
  if (!fs.existsSync(configPath)) {
    return {
      siteName: 'Guy Stone',
      siteSubtitle: 'blog',
      profileImage: null,
      profileText: '',
    };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function tmpl(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf8');
}

function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] === undefined || vars[key] === null ? '' : String(vars[key])
  );
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const parsed = matter(raw);
      const slug = parsed.data.slug || slugify(f);
      return {
        slug,
        sourceFile: f,
        title: parsed.data.title || slug,
        date: parsed.data.date || null,
        description: parsed.data.description || '',
        thumbnail: parsed.data.thumbnail || null,
        thumbnailStyle: parsed.data.thumbnailStyle || 'width: auto; height: 200px;',
        content: parsed.content,
      };
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
}

function readPages() {
  if (!fs.existsSync(PAGES_DIR)) return [];
  return fs
    .readdirSync(PAGES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(PAGES_DIR, f), 'utf8');
      const parsed = matter(raw);
      const slug = parsed.data.slug || slugify(f);
      return {
        slug,
        sourceFile: f,
        title: parsed.data.title || slug,
        content: parsed.content,
      };
    });
}

function renderSiteHeader() {
  return render(tmpl('index-header.html'), {
    siteName: escapeHtml(CONFIG.siteName),
    siteSubtitle: CONFIG.siteSubtitle
      ? `\n        <h2>${escapeHtml(CONFIG.siteSubtitle)}</h2>`
      : '',
  });
}

function buildIndex(posts) {
  const cardTmpl = tmpl('post-card.html');
  const cards = posts
    .map(p => {
      const thumbHtml = p.thumbnail
        ? `            <img class="post-image" src="${p.thumbnail}" alt="${escapeHtml(p.title)}" style="${p.thumbnailStyle}">`
        : '';
      return render(cardTmpl, {
        href: `posts/${p.slug}.html`,
        title: escapeHtml(p.title),
        description: escapeHtml(p.description),
        thumbnail: thumbHtml,
      });
    })
    .join('\n');

  const profileImg = CONFIG.profileImage
    ? `        <img src="${CONFIG.profileImage}" alt="${escapeHtml(CONFIG.siteName)}" class="profile-image">\n        <br>`
    : '';
  const profileText = CONFIG.profileText
    ? `        <div class="profile-text">${CONFIG.profileText}</div>`
    : '';

  const postList = cards
    ? `        <section class="post-list">\n${cards}\n        </section>`
    : '';
  const main = [profileImg, profileText, postList].filter(Boolean).join('\n');

  return render(tmpl('base.html'), {
    title: escapeHtml(CONFIG.siteName),
    cssPath: 'static/style.css',
    headerContent: renderSiteHeader(),
    homeHref: 'index.html',
    aboutHref: 'about.html',
    mainContent: main,
  });
}

function buildPost(post) {
  const html = marked.parse(post.content);
  const headerContent = render(tmpl('post-header.html'), {
    title: escapeHtml(post.title),
    date: escapeHtml(formatDate(post.date)),
  });
  return render(tmpl('base.html'), {
    title: escapeHtml(post.title),
    cssPath: '../static/style.css',
    headerContent,
    homeHref: '../index.html',
    aboutHref: '../about.html',
    mainContent: `        <article class="post-body">\n${html}\n        </article>`,
  });
}

function buildPage(page) {
  const html = marked.parse(page.content);
  return render(tmpl('base.html'), {
    title: `${CONFIG.siteName} — ${page.title}`,
    cssPath: 'static/style.css',
    headerContent: renderSiteHeader(),
    homeHref: 'index.html',
    aboutHref: 'about.html',
    mainContent: `        <article class="post-body">\n${html}\n        </article>`,
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function build() {
  rmrf(SITE_DIR);
  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.mkdirSync(path.join(SITE_DIR, 'posts'), { recursive: true });

  copyDir(STATIC_DIR, path.join(SITE_DIR, 'static'));

  const posts = readPosts();
  const pages = readPages();

  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), buildIndex(posts));

  for (const post of posts) {
    fs.writeFileSync(
      path.join(SITE_DIR, 'posts', `${post.slug}.html`),
      buildPost(post)
    );
  }

  for (const page of pages) {
    fs.writeFileSync(
      path.join(SITE_DIR, `${page.slug}.html`),
      buildPage(page)
    );
  }

  console.log(
    `built site/ — ${posts.length} post(s), ${pages.length} page(s)`
  );
}

build();

if (process.argv.includes('--watch')) {
  console.log('watching for changes...');
  const watched = [POSTS_DIR, PAGES_DIR, STATIC_DIR, TEMPLATES_DIR];
  for (const dir of watched) {
    if (!fs.existsSync(dir)) continue;
    fs.watch(dir, { recursive: true }, () => {
      try {
        build();
      } catch (e) {
        console.error('build failed:', e.message);
      }
    });
  }
}
