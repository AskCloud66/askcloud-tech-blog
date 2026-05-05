# AskCloud Tech Blog

这是当前博客的 **Hugo 源码仓**，用于内容维护，并通过 **GitHub Pages** 自动发布公网博客。

## 当前技术方案

- **静态站点生成器**：Hugo
- **主题基础**：Seven（本地覆盖定制）
- **部署目标**：GitHub Pages
- **评论方向**：Giscus / GitHub Discussions（待后续配置）
- **统计方向**：GoatCounter（当前关闭）

## 目录说明

```text
D:\Blog\
├─ .github\workflows\deploy-pages.yml
├─ assets\
├─ content\
├─ i18n\
├─ layouts\
├─ static\
├─ archetypes\
├─ hugo.toml
├─ go.mod
├─ package.json
└─ README.md
```

## 本地使用

```powershell
hugo server
```

## GitHub Pages 发布

仓库内已包含 `.github/workflows/deploy-pages.yml`，后续满足以下条件后即可自动发布：

1. 仓库推送到 GitHub
2. 仓库启用 **GitHub Pages**
3. Pages Source 选择 **GitHub Actions**
4. 推送到 `main` 分支后自动构建和部署

工作流构建时会：

- 安装 Hugo
- 安装 Node 依赖
- 使用 GitHub Pages 提供的 `base_url`
- 构建并发布 `public/`

## 后续建议

- 文章继续维护在 `content/`
- 封面图与品牌静态资源维护在 `assets/`、`static/images/branding/`
- 正文截图已改为外部图床，不再纳入仓库
- 正式公开前，再补齐：
  - Giscus 仓库与分类配置
  - GoatCounter 统计 code
  - 英文内容翻译
