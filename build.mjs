#!/usr/bin/env node
/**
 * 静态博客构建脚本
 * src/posts/*.md  ->  docs/*.html
 * 只依赖 marked，没有框架、没有打包器。
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { shell, renderIndex, renderPost, renderFeed, render404 } from './src/layout.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs');

// ---------------------------------------------------------------------------
// 站点配置：改这里就够了
// ---------------------------------------------------------------------------
const SITE = {
  title: 'Penn Ma 的博客',
  name: 'Penn Ma',
  tagline: '关于 AI、工程，以及别的一些东西。',
  author: 'Penn Ma',
  email: '1016164355@qq.com',
  avatar: 'avatar.png',
  // GitHub Pages 项目站点的地址；换成自己的域名时改这里（RSS 用绝对链接）
  url: 'https://clove682.github.io/my-blog',
  repo: 'https://github.com/clove682/my-blog',
  lang: 'zh-CN',
};

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------
function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/);
  if (!m) return { data: {}, body: raw };

  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    data[key] = val;
  }
  return { data, body: raw.slice(m[0].length) };
}

/** 中文按 400 字/分钟、英文按 220 词/分钟估算 */
function readingTime(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9']+/g) || []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 220));
}

function loadPosts() {
  const dir = path.join(SRC, 'posts');
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, body } = parseFrontMatter(raw);
      const slug = data.slug || file.replace(/\.md$/, '');
      return {
        slug,
        title: data.title || slug,
        date: data.date || '1970-01-01',
        description: data.description || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        minutes: readingTime(body),
        html: wrapTables(marked.parse(cjkSafeBold(body), { gfm: true, breaks: false })),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** 宽表格在手机上要能横向滚动 */
function wrapTables(html) {
  return html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
}

/**
 * CommonMark 规则处理不了 `**加粗。**后面紧跟汉字`（闭合 ** 前是标点、后是汉字，
 * 会被判成左翼分隔符而不是加粗闭合）——中文写作里这个模式太常见了。
 * 先把代码块/行内代码摘出来，再在纯文本里把 **…** 直接转成 <strong>。
 */
function cjkSafeBold(md) {
  return md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')))
    .join('');
}

function write(relPath, content) {
  const target = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

/** 递归复制 src/public/ 下的静态资源（头像、图片等）到输出目录 */
function copyPublic() {
  const from = path.join(SRC, 'public');
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcFile = path.join(from, entry.name);
    const dstFile = path.join(OUT, entry.name);
    entry.isDirectory() ? copyDir(srcFile, dstFile) : fs.copyFileSync(srcFile, dstFile);
  }
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    entry.isDirectory() ? copyDir(path.join(from, entry.name), path.join(to, entry.name)) : fs.copyFileSync(path.join(from, entry.name), path.join(to, entry.name));
  }
}

// ---------------------------------------------------------------------------
// 构建
// ---------------------------------------------------------------------------
function build() {
  const started = Date.now();
  const posts = loadPosts();

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  fs.copyFileSync(path.join(SRC, 'styles.css'), path.join(OUT, 'style.css'));
  copyPublic();
  write('.nojekyll', '');

  write('index.html', shell({ SITE, prefix: '', title: SITE.title, description: SITE.tagline, content: renderIndex(posts, SITE) }));
  write('404.html', shell({ SITE, prefix: '', title: `页面不存在 · ${SITE.title}`, description: '', content: render404(SITE), noindex: true }));

  posts.forEach((post, i) => {
    write(
      `posts/${post.slug}.html`,
      shell({
        SITE,
        prefix: '../',
        title: `${post.title} · ${SITE.title}`,
        description: post.description,
        content: renderPost(post, posts[i - 1], posts[i + 1], SITE),
        isPost: true,
        canonical: `${SITE.url}/posts/${post.slug}.html`,
        published: post.date,
      })
    );
  });

  write('feed.xml', renderFeed(posts, SITE));

  const kb = (dirSize(OUT) / 1024).toFixed(0);
  console.log(`✓ 构建完成  ${posts.length} 篇文章  ${kb} KB  ${Date.now() - started}ms  → docs/`);
  return posts;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}

// ---------------------------------------------------------------------------
// 本地预览：node build.mjs --serve --watch
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

function serve(port = 4321) {
  http
    .createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      let file = path.join(OUT, rel);
      if (!file.startsWith(OUT)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(OUT, '404.html');
        res.writeHead(404, { 'Content-Type': MIME['.html'] });
        res.end(fs.readFileSync(file));
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
    })
    .listen(port, () => console.log(`→ 预览地址 http://localhost:${port}`));
}

build();

if (args.includes('--watch')) {
  let timer = null;
  fs.watch(SRC, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error('构建失败:', err.message);
      }
    }, 120);
  });
  console.log('→ 监听 src/ 变化中…');
}

if (args.includes('--serve')) serve(Number(process.env.PORT) || 4321);
