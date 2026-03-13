# JSW Status Frontend Pages

## 说明

这是纯静态前端，不依赖 Pages Functions。

可直接部署到：

- Cloudflare Pages
- 腾讯云 EdgeOne Pages
- 任意静态托管

## 配置

编辑 `config.js`：

```js
window.STATUS_APP_CONFIG = {
  apiBase: "https://api-status.jsw.ac.cn",
  apiToken: "REPLACE_WITH_YOUR_TOKEN",
  refreshMs: 60000,
  title: "JSW 站点健康监测",
  subtitle: "接入 https://api-status.jsw.ac.cn/healthy-api/<token>"
};
```

## 部署

直接上传整个目录即可。

若使用 Git 构建：

- Build command 留空
- Output directory 设为项目根目录

## 页面功能

- 展示全局模式与 warm 信息
- 展示每个站点的健康状态
- 展示实际动作 `action`
- 展示自动托管预判 `would_auto`
- 展示原始 JSON
