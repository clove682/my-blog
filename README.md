# my-blog

一个极简的静态博客：markdown 进，静态 HTML 出。没有框架、没有打包器，构建只依赖 [marked](https://github.com/markedjs/marked)。

## 目录结构

```
├── build.mjs          # 构建脚本（含站点配置）
├── src/
│   ├── layout.mjs     # HTML 模板
│   ├── styles.css     # 样式（深色模式自适应）
│   └── posts/         # 文章，一个 .md 一篇
├── docs/              # 构建产物，GitHub Pages 从这里部署
└── package.json
```

## 常用命令

```bash
npm install        # 首次安装依赖
npm run build      # 构建到 docs/
npm run dev        # 本地预览 http://localhost:4321 （改动 src/ 自动重建）
```

## 写新文章

在 `src/posts/` 下新建 `.md`，开头写 front matter：

```markdown
---
title: 文章标题
date: 2026-11-02
description: 一两句话摘要，显示在首页列表里。
tags: [标签1, 标签2]
---

正文从这里开始……
```

文件名（去掉 `.md`）就是 URL slug。然后 `npm run build` 并提交，`src/` 和 `docs/` 一起提交。

## 上线（GitHub Pages）

仓库 Settings → Pages → Source 选 **Deploy from a branch**，Branch 选 `main`，目录选 `/docs`，保存即可。地址：`https://clove682.github.io/my-blog/`。

站点地址写在 `build.mjs` 顶部的 `SITE.url`（RSS 用绝对链接，换域名时改那里）。
