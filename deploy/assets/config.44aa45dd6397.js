window.STATUS_APP_CONFIG = {
  apiBase: 'https://api-status.jsw.ac.cn',
  realtimePath: '/api/realtime',
  historyPath: '/api/history?window=7',
  fetchTimeoutMs: 15000,
  challengePath: '/api/realtime',
  historyStorageKey: 'jsw-status-history-v6',
  historyStorageMaxAgeMs: 86400000,
  title: 'JSW Status',
  titleZhHans: '\u6280\u672f\u7f51 \u7ad9\u70b9\u72b6\u6001',
  titleZhHant: '\u6280\u8853\u7db2 \u7ad9\u9ede\u72c0\u614b',
  titleEn: 'JSW Status',
  siteNames: {
    'www.jsw.ac.cn': {
      'zh-Hans': '\u4e3b\u7ad9',
      'zh-Hant': '\u4e3b\u7ad9',
      en: 'Main Site'
    },
    'mirror.jsw.ac.cn': {
      'zh-Hans': '\u955c\u50cf\u7ad9',
      'zh-Hant': '\u93e1\u50cf\u7ad9',
      en: 'Mirror Site'
    },
    'upload-pic.jsw.ac.cn': {
      'zh-Hans': '\u56fe\u5e8a',
      'zh-Hant': '\u5716\u5e8a',
      en: 'Image Upload'
    }
  }
};
