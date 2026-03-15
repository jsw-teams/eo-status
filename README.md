# Frontend Pages

静态前端，兼容 Cloudflare Pages 与腾讯云 EO Pages。

修改 `config.js` 中的 `apiBase` 与 `apiToken` 后直接部署。

页面特性：
- 自动按浏览器语言切换简体中文、繁体中文、英文
- 只请求一次后端 API
- 首次慢加载时显示分阶段等待提示
- 优先展示上一次缓存结果，再等待最新结果返回
- 适配移动端、平板和桌面端

图表规则：绿色表示已检测可用比例，红色表示已检测不可用比例，灰色表示近 7 天内尚未形成检测数据的占位比例。

历史故障柱在站点当前可用时使用橙色显示，只有当前实时不可用时才使用红色。

## 缓存策略

### 根目录直接部署

适合不做构建时直接部署：

- `/`、`/index.html`：浏览器缓存 5 分钟，CDN 缓存 30 分钟，并启用 `stale-while-revalidate`
- `/config.js`：浏览器缓存 5 分钟，CDN 缓存 30 分钟
- `/app.js`、`/styles.css`：浏览器缓存 1 天，CDN 缓存 7 天

这样可以明显减少回源，同时不让入口页和配置文件长时间滞后。

### 生产推荐：部署 `deploy/`

执行：

```bash
npm run build
```

构建后会生成：

- `deploy/index.html`
- `deploy/assets/app.<hash>.js`
- `deploy/assets/styles.<hash>.css`
- `deploy/assets/config.<hash>.js`
- `deploy/build-info.json`
- `deploy/edgeone.json`

推荐直接部署 `deploy/` 目录：

- `deploy/index.html`：浏览器缓存 5 分钟，CDN 缓存 30 分钟
- `deploy/assets/*`：浏览器和 CDN 都缓存 1 年，并使用 `immutable`

这样静态资源带指纹文件名后，可以把缓存开得更激进，进一步减少 ESA/CDN 回源。

## 实时状态接口

前端请求状态 API 时仍保留：

```js
cache: 'no-store'
```

这是刻意保留的。状态数据属于实时信息，前端 API 请求不建议做浏览器缓存，否则页面可能显示旧状态。
