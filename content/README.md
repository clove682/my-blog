# content/ — 稿件存档

这里放的是**不参与构建**的原始稿件，纯备份用途。

博客构建只读取 `src/posts/*.md`，本目录下的任何文件都不会出现在 `docs/`，因此**不会发布到网站上**，也不会被搜索引擎从站点收录。

## 什么时候用这个目录

- 文章有多个版本（原始稿 / 公众号版 / 精简版），需要一个地方留存
- 只想存档、暂不想发布的稿子
- 需要保留原始排版，不想为了上站而改动的内容

## 目录约定

```
content/
└── articles/
    ├── YYYY-MM-article-N-slug.md            # 原始稿
    └── YYYY-MM-article-N-slug-wechat.md     # 公众号排版版
```

## 想把某篇正式发布到博客

把它复制到 `src/posts/`，在开头补上 front matter（`title` / `date` / `description` / `tags`），然后 `npm run build` 并提交。

```markdown
---
title: 文章标题
date: 2026-10-18
description: 一两句话摘要
tags: [标签1, 标签2]
---
```

## 注意

本仓库是公开仓库，此目录下的文件在 GitHub 网页上**可以直接看到**（只是不会出现在博客站点里）。如果需要真正保密，得改用私有仓库，或不要把文件提交进 git。
