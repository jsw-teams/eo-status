window.STATUS_APP_CONFIG = {
  apiBase: 'https://api-status.jsw.ac.cn',
  realtimePath: '/api/realtime',
  historyPath: '/api/history?window=7',
<<<<<<<< HEAD:deploy/assets/config.101e64d18960.js
  refreshMs: 0,
  historyRefreshMs: 0,
  fetchTimeoutMs: 15000,
  realtimeStorageKey: 'jsw-status-realtime-v4',
  historyStorageKey: 'jsw-status-history-v4',
========
  legacyCombinedPath: '/healthy-api',
  refreshMs: 60000,
  historyRefreshMs: 600000,
  fetchTimeoutMs: 15000,
  realtimeStorageKey: 'jsw-status-realtime-v3',
  historyStorageKey: 'jsw-status-history-v3',
>>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35:deploy/assets/config.3197b8249c36.js
  title: 'JSW Status',
  titleZhHans: '技术网 站点状态',
  titleZhHant: '技術網 站點狀態',
  titleEn: 'JSW Status',
  siteNames: {
    'www.jsw.ac.cn': {
      'zh-Hans': '主站',
      'zh-Hant': '主站',
      en: 'Main Site'
    },
    'mirror.jsw.ac.cn': {
      'zh-Hans': '镜像站',
      'zh-Hant': '鏡像站',
      en: 'Mirror Site'
    },
    'upload-pic.jsw.ac.cn': {
      'zh-Hans': '图床',
      'zh-Hant': '圖床',
      en: 'Image Upload'
    }
  }
};
