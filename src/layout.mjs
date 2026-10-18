/** HTML 模板。所有函数返回字符串片段，由 build.mjs 组装。 */

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtDate = (d = '') => String(d).slice(0, 10).replace(/-/g, '.');

function tagsHtml(tags = []) {
  if (!tags.length) return '';
  return `<span class="tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>`;
}

/** 页面外壳 */
export function shell({ SITE, prefix = '', title, description, content, isPost = false, canonical, published, noindex = false }) {
  const ogType = isPost ? 'article' : 'website';
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(SITE.author)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="${esc(SITE.title)}">
<meta property="og:image" content="${SITE.url}/${SITE.avatar}">
<meta name="twitter:card" content="summary">
<meta name="twitter:image" content="${SITE.url}/${SITE.avatar}">
${canonical ? `<link rel="canonical" href="${canonical}">
<meta property="og:url" content="${canonical}">` : ''}
${published ? `<meta property="article:published_time" content="${published}">` : ''}
<link rel="icon" href="${prefix}favicon.png" type="image/png">
<link rel="stylesheet" href="${prefix}style.css">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.title)}" href="${prefix}feed.xml">
<script>
  (function () {
    try {
      var t = localStorage.getItem('theme');
      if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    } catch (e) {}
  })();
</script>
</head>
<body>
<a class="skip-link" href="#main">跳到正文</a>

<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${prefix}index.html"><img class="brand-avatar" src="${prefix}${SITE.avatar}" alt="" width="30" height="30"><span>${esc(SITE.name)}</span></a>
    <nav class="nav">
      <a href="${prefix}index.html">文章</a>
      <a href="${prefix}feed.xml">RSS</a>
      <a href="${SITE.repo}" target="_blank" rel="noopener">GitHub</a>
      <button class="theme-toggle" type="button" aria-label="切换深色模式">☾</button>
    </nav>
  </div>
</header>

<main id="main" class="wrap">
${content}
</main>

<footer class="site-footer">
  <div class="wrap">
    <p>© ${new Date().getFullYear()} ${esc(SITE.author)} · 由 <a href="${SITE.repo}" target="_blank" rel="noopener">my-blog</a> 驱动</p>
  </div>
</footer>

<script>
  (function () {
    var btn = document.querySelector('.theme-toggle');
    var root = document.documentElement;
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function current() {
      return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light');
    }
    function paint() {
      btn.textContent = current() === 'dark' ? '☀' : '☾';
    }
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      paint();
    });
    paint();
  })();
</script>
</body>
</html>
`;
}

/** 首页 */
export function renderIndex(posts, SITE) {
  const list = posts.length
    ? `<ul class="post-list">
${posts
  .map(
    (p) => `  <li class="post-list-item">
    <a href="posts/${p.slug}.html">
      <time class="post-date" datetime="${p.date}">${fmtDate(p.date)}</time>
      <span class="post-body">
        <span class="post-title">${esc(p.title)}</span>
        ${p.description ? `<span class="post-desc">${esc(p.description)}</span>` : ''}
        ${tagsHtml(p.tags)}
      </span>
    </a>
  </li>`
  )
  .join('\n')}
</ul>`
    : '<p class="empty">还没有文章。往 <code>src/posts/</code> 里丢一个 <code>.md</code> 就行了。</p>';

  return `<section class="hero">
  <img class="hero-avatar" src="${SITE.avatar}" alt="${esc(SITE.name)} 的头像" width="76" height="76">
  <p class="eyebrow">BLOG</p>
  <h1>${esc(SITE.name)}</h1>
  <p class="lede">${esc(SITE.tagline)}</p>
</section>
${list}`;
}

/** 文章页 */
export function renderPost(post, newer, older, SITE) {
  const nav = [];
  if (newer) nav.push(`<a class="post-nav-prev" href="${newer.slug}.html"><span>较新</span>${esc(newer.title)}</a>`);
  if (older) nav.push(`<a class="post-nav-next" href="${older.slug}.html"><span>较旧</span>${esc(older.title)}</a>`);

  return `<article class="post">
  <header class="post-header">
    <a class="back" href="../index.html">← 全部文章</a>
    <h1>${esc(post.title)}</h1>
    <p class="post-meta">
      <time datetime="${post.date}">${fmtDate(post.date)}</time>
      <span class="dot">·</span>
      <span>约 ${post.minutes} 分钟</span>
      ${tagsHtml(post.tags)}
    </p>
  </header>

  <div class="prose">
${post.html}
  </div>

  ${nav.length ? `<nav class="post-nav">${nav.join('')}</nav>` : ''}
</article>`;
}

/** 404 */
export function render404(SITE) {
  return `<section class="hero notfound">
  <p class="eyebrow">404</p>
  <h1>这页不存在</h1>
  <p class="lede">链接可能过期了，或者我压根没写过。</p>
  <p><a class="back" href="index.html">← 回首页</a></p>
</section>`;
}

/** RSS 2.0 */
export function renderFeed(posts, SITE) {
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE.url}/posts/${p.slug}.html</link>
      <guid isPermaLink="true">${SITE.url}/posts/${p.slug}.html</guid>
      <pubDate>${new Date(`${p.date}T09:00:00+08:00`).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.title)}</title>
    <link>${SITE.url}</link>
    <description>${esc(SITE.tagline)}</description>
    <language>${SITE.lang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}
