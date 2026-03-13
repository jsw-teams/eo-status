(() => {
  const config = window.STATUS_APP_CONFIG || {};
  const apiBase = String(config.apiBase || '').replace(/\/$/, '');
  const apiToken = String(config.apiToken || '').trim();
  const pageTitleEl = document.getElementById('pageTitle');
  const siteGrid = document.getElementById('siteGrid');
  const loadStateEl = document.getElementById('loadState');
  const fetchTimeoutMs = Number(config.fetchTimeoutMs) > 0 ? Number(config.fetchTimeoutMs) : 35000;
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
      needConfig: '请先在 config.js 中填写 apiToken',
      loading0: '正在载入站点状态',
      loading1: '状态接口响应较慢，请稍候',
      loading2: '仍在读取状态数据，请耐心等待',
      loading3: '接口仍未返回，稍后会显示结果或错误信息',
      cached: '已先显示最近一次缓存结果'
    },
    'zh-Hant': {
      title: String(config.titleZhHant || config.title || 'JSW 站點狀態'),
      available: '可用',
      unavailable: '不可用',
      realtime: '即時可用性',
      history7d: '7天可用率',
      noData: '暫無資料',
      loadError: '讀取失敗',
      needConfig: '請先在 config.js 中填寫 apiToken',
      loading0: '正在載入站點狀態',
      loading1: '狀態介面回應較慢，請稍候',
      loading2: '仍在讀取狀態資料，請耐心等待',
      loading3: '介面仍未返回，稍後會顯示結果或錯誤資訊',
      cached: '已先顯示最近一次快取結果'
    },
    en: {
      title: String(config.titleEn || config.title || 'JSW Status'),
      available: 'Available',
      unavailable: 'Unavailable',
      realtime: 'Live availability',
      history7d: '7-day uptime',
      noData: 'No data',
      loadError: 'Load failed',
      needConfig: 'Set apiToken in config.js first',
      loading0: 'Loading site status',
      loading1: 'The status API is responding slowly',
      loading2: 'Still loading status data, please wait',
      loading3: 'The API has not returned yet, the page will show results or an error soon',
      cached: 'Showing the most recent cached result first'
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

  const cacheKey = (() => {
    const base = apiBase || 'api';
    const tokenTail = apiToken ? apiToken.slice(-12) : 'token';
    return `jsw-status-cache:${base}:${tokenTail}`;
  })();

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

  const historyDaysFromPayload = (site) => {
    const history = site?.history_7d || {};
    return Array.isArray(history.days) ? history.days : [];
  };

  const renderCards = (payload) => {
    const results = Array.isArray(payload?.results) ? payload.results : [];
    if (!results.length) {
      siteGrid.innerHTML = `<div class="message-card">${escapeHtml(t.noData)}</div>`;
      return;
    }
    siteGrid.innerHTML = results.map((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      const history = site?.history_7d || {};
      const historyDays = historyDaysFromPayload(site);
      const statusText = site.ok ? t.available : t.unavailable;
      const statusClass = site.ok ? 'badge badge-ok' : 'badge badge-bad';
      const percentText = history.availability_percent == null ? '--' : `${Number(history.availability_percent).toFixed(2)}%`;
      const chart = historyDays.length ? historyDays.map((entry) => {
        const percent = typeof entry?.availability_percent === 'number' ? entry.availability_percent : 0;
        const height = Math.max(8, Math.min(100, Math.round(percent)));
        const label = String(entry?.date || '').slice(5);
        return `<div class="${barClass(entry?.availability_percent)}"><div class="bar"><div class="bar-fill" style="height:${height}%"></div></div><div class="day">${escapeHtml(label)}</div></div>`;
      }).join('') : `<div class="chart-empty">${escapeHtml(t.noData)}</div>`;
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

  const renderSkeletons = (count = 3) => {
    siteGrid.innerHTML = Array.from({ length: count }, () => `
      <article class="site-card skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-title"></div>
        <div class="status-row skeleton-row">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-pill"></div>
        </div>
        <div class="history-row skeleton-row">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line tiny"></div>
        </div>
        <div class="chart skeleton-chart">
          <div class="skeleton-bar"></div>
          <div class="skeleton-bar tall"></div>
          <div class="skeleton-bar"></div>
          <div class="skeleton-bar taller"></div>
          <div class="skeleton-bar short"></div>
          <div class="skeleton-bar tall"></div>
          <div class="skeleton-bar"></div>
        </div>
      </article>
    `).join('');
  };

  const setLoadState = (message = '', variant = 'loading') => {
    if (!message) {
      loadStateEl.className = 'load-state hidden';
      loadStateEl.textContent = '';
      return;
    }
    loadStateEl.className = `load-state ${variant}`;
    loadStateEl.textContent = message;
  };

  const renderError = (message, keepCards = false) => {
    setLoadState(message, 'error');
    if (!keepCards) siteGrid.innerHTML = `<div class="message-card error-card">${escapeHtml(message)}</div>`;
  };

  const loadCachedPayload = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveCachedPayload = (payload) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {}
  };

  const fetchStatusOnce = async () => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      renderError(t.needConfig);
      return;
    }

    const cached = loadCachedPayload();
    if (cached) {
      renderCards(cached);
      setLoadState(t.cached, 'loading');
    } else {
      renderSkeletons(3);
      setLoadState(t.loading0, 'loading');
    }

    const loadingTimers = [
      setTimeout(() => setLoadState(t.loading1, 'loading'), 3000),
      setTimeout(() => setLoadState(t.loading2, 'loading'), 9000),
      setTimeout(() => setLoadState(t.loading3, 'loading'), 18000)
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      const payload = await response.json();
      saveCachedPayload(payload);
      renderCards(payload);
      setLoadState('', 'loading');
    } catch (error) {
      const message = error && typeof error === 'object' && error.name === 'AbortError'
        ? `${t.loadError}: timeout`
        : (error instanceof Error ? `${t.loadError}: ${error.message}` : t.loadError);
      renderError(message, Boolean(cached));
    } finally {
      clearTimeout(timeoutId);
      loadingTimers.forEach(clearTimeout);
    }
  };

  fetchStatusOnce();
})();
