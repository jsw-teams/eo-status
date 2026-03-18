# Frontend Pages

静态前端，兼容 Cloudflare Pages 与腾讯云 EO Pages。

修改 `config.js` 中的 `apiBase` 后直接部署。默认首屏各请求一次：`/api/realtime` 与 `/api/history?window=7`，不会自动轮询。

页面特性：
- 自动按浏览器语言切换简体中文、繁体中文、英文
- 只请求一次后端 API
- 首次慢加载时显示分阶段等待提示
- 历史数据会写入 `localStorage`，下次打开先显示本地历史数据，再更新成最新结果
- 实时状态不做本地持久缓存，避免把旧实时状态误当成当前状态
- 适配移动端、平板和桌面端

图表规则：绿色表示已检测可用比例，橙/红表示已检测不可用比例，灰色表示近 7 天内尚未形成检测数据的占位比例。

## 关于 Cloudflare 托管质询 / WAF

如果 API 域名被 Cloudflare 托管质询、WAF 或其他跨域拦截命中，浏览器中的 `fetch` 往往会直接报 `Failed to fetch`，前端代码本身无法绕过这个挑战。

这版前端做了两件事：
- 当存在本地历史缓存时，先显示缓存，避免整个页面空白
- 当跨域 API 请求失败时，提示更接近实际原因

根本处理仍然建议二选一：
- 给 `api-status.jsw.ac.cn/api/*` 加跳过 Managed Challenge / WAF Challenge 的规则
- 或把 API 通过同源路径反代到状态页域名下，再把 `apiBase` 改成同源路径

## 缓存策略

生产推荐直接部署 `deploy/`：

- `deploy/index.html`：浏览器缓存 5 分钟，CDN 缓存 30 分钟
- `deploy/assets/*`：浏览器和 CDN 都缓存 1 年，并使用 `immutable`
- `deploy/build-info.json`：浏览器缓存 5 分钟，CDN 缓存 30 分钟
- 缓存控制完全由 `edgeone.json` 负责

## 本地缓存配置

`config.js` 提供：

- `historyStorageKey`
- `historyStorageMaxAgeMs`

默认本地历史缓存有效期为 24 小时。
