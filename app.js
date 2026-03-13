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
      loading3: '接口仍未返回',
      cached: '已先显示最近一次缓存结果',
      issueTime: '异常时间',
      issueNow: '当前检测时间',
      issueHistory: '近7天异常',
      none: '无',
      unknown: '待检测'
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
      loading3: '介面仍未返回',
      cached: '已先顯示最近一次快取結果',
      issueTime: '異常時間',
      issueNow: '目前檢測時間',
      issueHistory: '近7天異常',
      none: '無',
      unknown: '待檢測'
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
      loading3: 'The API has not returned yet',
      cached: 'Showing the most recent cached result first',
      issueTime: 'Issue time',
      issueNow: 'Current check',
      issueHistory: 'Issues in 7 days',
      none: 'None',
      unknown: 'Pending'
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

  const formatMmDd = (value) => {
    const raw = String(value || '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(5);
    return raw;
  };

  const formatTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  };

  const getDisplayName = (host) => {
    const names = config.siteNames || {};
    const entry = names[host];
    if (!entry) return host;
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object') {
      if (locale === 'zh-Hans' && entry['zh-Hans']) return String(entry['zh-Hans']);
      if (locale === 'zh-Hant' && entry['zh-Hant']) return String(entry['zh-Hant']);
      if (entry.en && locale === 'en') return String(entry.en);
      return String(entry['zh-Hans'] || entry['zh-Hant'] || entry.en || host);
    }
    return host;
  };

  const historyDaysFromPayload = (site) => {
    const history = site?.history_7d || {};
    return Array.isArray(history.days) ? history.days : [];
  };

  const buildPercentBars = (site) => {
    const history = site?.history_7d || {};
    const percent = typeof history.availability_percent === 'number' ? Math.max(0, Math.min(100, Math.round(history.availability_percent))) : null;
    if (percent == null) {
      return Array.from({ length: 100 }, (_, i) => `<span class="micro-bar is-unknown" aria-hidden="true" style="animation-delay:${Math.min(i * 6, 600)}ms"></span>`).join('');
    }
    return Array.from({ length: 100 }, (_, i) => {
      const cls = i < percent ? 'is-ok' : 'is-bad';
      return `<span class="micro-bar ${cls}" aria-hidden="true" style="animation-delay:${Math.min(i * 6, 600)}ms"></span>`;
    }).join('');
  };

  const getIssueText = (site, generatedAt) => {
    if (site.ok === false) return formatTime(generatedAt) || t.unknown;
    const historyDays = historyDaysFromPayload(site)
      .filter((entry) => typeof entry?.availability_percent === 'number' && entry.availability_percent < 100)
      .map((entry) => formatMmDd(entry.date));
    if (historyDays.length) return historyDays.join(' / ');
    return t.none;
  };

  const renderCards = (payload) => {
    const results = Array.isArray(payload?.results) ? payload.results : [];
    const generatedAt = payload?.generated_at || '';
    if (!results.length) {
      siteGrid.innerHTML = `<div class="message-card">${escapeHtml(t.noData)}</div>`;
      return;
    }
    siteGrid.innerHTML = results.map((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      const displayName = getDisplayName(host);
      const history = site?.history_7d || {};
      const statusText = site.ok ? t.available : t.unavailable;
      const statusClass = site.ok ? 'badge badge-ok' : 'badge badge-bad';
      const percentText = history.availability_percent == null ? '--' : `${Number(history.availability_percent).toFixed(2)}%`;
      const issueText = getIssueText(site, generatedAt);
      const issueLabel = site.ok ? t.issueHistory : t.issueNow;
      const percentBars = buildPercentBars(site);
      return `
        <article class="site-card ${site.ok ? '' : 'site-card-bad'}">
          <div class="site-head">
            <h2 class="site-name">${escapeHtml(displayName)}</h2>
            <div class="site-host">${escapeHtml(host)}</div>
          </div>
          <div class="status-row">
            <span class="label">${escapeHtml(t.realtime)}</span>
            <span class="${statusClass}"><span class="dot"></span>${escapeHtml(statusText)}</span>
          </div>
          <div class="history-row">
            <span class="label">${escapeHtml(t.history7d)}</span>
            <span class="percent">${escapeHtml(percentText)}</span>
          </div>
          <div class="micro-chart" aria-label="${escapeHtml(t.history7d)}">${percentBars}</div>
          <div class="issue-row">
            <span class="label">${escapeHtml(t.issueTime)}</span>
            <span class="issue-text">${escapeHtml(issueLabel)}：${escapeHtml(issueText)}</span>
          </div>
        </article>
      `;
    }).join('');
  };

  const renderSkeletons = (count = 3) => {
    const bars = Array.from({ length: 100 }, (_, i) => `<span class="micro-bar is-unknown" aria-hidden="true" style="animation-delay:${Math.min(i * 6, 600)}ms"></span>`).join('');
    siteGrid.innerHTML = Array.from({ length: count }, () => `
      <article class="site-card skeleton-card" aria-hidden="true">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-host"></div>
        <div class="status-row skeleton-row">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-pill"></div>
        </div>
        <div class="history-row skeleton-row">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line tiny"></div>
        </div>
        <div class="micro-chart skeleton-micro-chart">${bars}</div>
        <div class="issue-row skeleton-row">
          <div class="skeleton skeleton-line mid"></div>
          <div class="skeleton skeleton-line long"></div>
        </div>
      </article>
    `).join('');
  };

  const setLoadState = (message = '', variant = 'loading') => {
    loadStateEl.className = `load-state ${variant}${message ? '' : ' hidden'}`;
    loadStateEl.textContent = message || '\u00A0';
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
