# JSW Status Frontend Pages

## 说明

这是纯静态前端，可直接部署到：

- Cloudflare Pages
- 腾讯云 EdgeOne Pages
- 任意静态托管

页面只展示：

- 网站标题
- 检测卡片
- 每个站点的实时可用性
- 每个站点近 7 天可用率
- 每个站点近 7 天图表

语言会根据浏览器自动切换：

- 简体中文
- 繁體中文
- English

不提供手动切换。

## 配置

编辑 `config.js`：

```js
window.STATUS_APP_CONFIG = {
  apiBase: 'https://api-status.jsw.ac.cn',
  apiToken: 'REPLACE_WITH_YOUR_TOKEN',
  refreshMs: 60000,
  historyStorageKey: 'jsw-status-history-v2',
  title: 'JSW Status',
  titleZhHans: 'JSW 站点状态',
  titleZhHant: 'JSW 站點狀態',
  titleEn: 'JSW Status'
};
```

## 7 天历史说明

当前后端接口只提供实时结果，不提供 7 天历史字段。

因此前端会在浏览器本地使用 `localStorage` 累计最近 7 天采样结果，再计算：

- 7 天可用率百分数
- 7 天图表

这表示：

- 同一个浏览器可持续累积历史
- 清理浏览器存储后会重新开始统计
- 不同设备之间不会共享历史

## 部署

直接上传整个目录即可。

若使用 Git 构建：

- Build command 留空
- Output directory 设为项目根目录
