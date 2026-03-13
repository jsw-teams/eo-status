(() => {
  const config = window.STATUS_APP_CONFIG || {};
  const apiBase = String(config.apiBase || '').replace(/\/$/, '');
  const apiToken = String(config.apiToken || '').trim();
  const refreshMs = Number(config.refreshMs) > 0 ? Number(config.refreshMs) : 60000;
  const pageTitleEl = document.getElementById('pageTitle');
  const siteGrid = document.getElementById('siteGrid');

  const locale = (() => {
    const lang = String(navigator.language || '').toLowerCase();
    if (lang.startsWith('zh-hk') || lang.startsWith('zh-tw') || lang.startsWith('zh-mo') || lang.includes('hant')) return 'zh-Hant';
    if (lang.startsWith('zh')) return 'zh-Hans';
    return 'en';
  })();

  const textMap = {
    'zh-Hans': {
      title: String(config.titleZhHans || config.title || 'JSW 站点状态'),
      available: '可用',
      unavailable: '不可用',
      realtime: '实时可用性',
      history7d: '7天可用率',
      noData: '暂无数据',
      loadError: '读取失败',
      needConfig: '请先在 config.js 中填写 apiToken'
    },
    'zh-Hant': {
      title: String(config.titleZhHant || config.title || 'JSW 站點狀態'),
      available: '可用',
      unavailable: '不可用',
      realtime: '即時可用性',
      history7d: '7天可用率',
      noData: '暫無資料',
      loadError: '讀取失敗',
      needConfig: '請先在 config.js 中填寫 apiToken'
    },
    en: {
      title: String(config.titleEn || config.title || 'JSW Status'),
      available: 'Available',
      unavailable: 'Unavailable',
      realtime: 'Live availability',
      history7d: '7-day uptime',
      noData: 'No data',
      loadError: 'Load failed',
      needConfig: 'Set apiToken in config.js first'
    }
  };

  const t = textMap[locale];
  document.documentElement.lang = locale === 'en' ? 'en' : locale;
  document.title = t.title;
  pageTitleEl.textContent = t.title;

  const getApiUrl = () => {
    if (!apiBase || !apiToken || apiToken === 'REPLACE_WITH_YOUR_TOKEN') return '';
    return `${apiBase}/healthy-api/${encodeURIComponent(apiToken)}`;
  };

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const barClass = (percent) => {
    if (percent == null) return 'bar-wrap';
    if (percent < 80) return 'bar-wrap bar-bad';
    if (percent < 99.9) return 'bar-wrap bar-low';
    return 'bar-wrap';
  };

  const renderCards = (payload) => {
    const results = Array.isArray(payload?.results) ? payload.results : [];
    if (!results.length) {
      siteGrid.innerHTML = `<div class="empty">${escapeHtml(t.noData)}</div>`;
      return;
    }
    siteGrid.innerHTML = results.map((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      const history = site?.history_7d || {};
      const historyDays = Array.isArray(history.days) ? history.days : [];
      const statusText = site.ok ? t.available : t.unavailable;
      const statusClass = site.ok ? 'badge badge-ok' : 'badge badge-bad';
      const percentText = history.availability_percent == null ? '--' : `${Number(history.availability_percent).toFixed(2)}%`;
      const chart = historyDays.map((entry) => {
        const percent = typeof entry?.availability_percent === 'number' ? entry.availability_percent : 0;
        const height = Math.max(6, Math.min(100, Math.round(percent)));
        const label = String(entry?.date || '').slice(5);
        return `<div class="${barClass(entry?.availability_percent)}"><div class="bar"><div class="bar-fill" style="height:${height}px"></div></div><div class="day">${escapeHtml(label)}</div></div>`;
      }).join('');
      return `
        <article class="site-card">
          <h2 class="site-name">${escapeHtml(host)}</h2>
          <div class="status-row">
            <span class="label">${escapeHtml(t.realtime)}</span>
            <span class="${statusClass}"><span class="dot"></span>${escapeHtml(statusText)}</span>
          </div>
          <div class="history-row">
            <span class="label">${escapeHtml(t.history7d)}</span>
            <span class="percent">${escapeHtml(percentText)}</span>
          </div>
          <div class="chart" aria-label="${escapeHtml(t.history7d)}">${chart}</div>
        </article>
      `;
    }).join('');
  };

  const renderError = (message) => {
    siteGrid.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
  };

  const fetchStatus = async () => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      renderError(t.needConfig);
      return;
    }
    try {
      const response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
      const payload = await response.json();
      renderCards(payload);
    } catch (error) {
      renderError(error instanceof Error ? `${t.loadError}: ${error.message}` : t.loadError);
    }
  };

  fetchStatus();
  setInterval(fetchStatus, refreshMs);
})();
