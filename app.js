(() => {
  const config = window.STATUS_APP_CONFIG || {};
  const apiBase = String(config.apiBase || '').trim().replace(/\/$/, '');
  const realtimePath = String(config.realtimePath || '/api/realtime').trim() || '/api/realtime';
  const historyPath = String(config.historyPath || '/api/history?window=7').trim() || '/api/history?window=7';
<<<<<<< HEAD
=======
  const legacyCombinedPath = String(config.legacyCombinedPath || '/healthy-api').trim() || '/healthy-api';
  const legacyToken = String(config.apiToken || '').trim();
>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35
  const pageTitleEl = document.getElementById('pageTitle');
  const siteGrid = document.getElementById('siteGrid');
  const loadStateEl = document.getElementById('loadState');
  const fetchTimeoutMs = Number(config.fetchTimeoutMs) > 0 ? Number(config.fetchTimeoutMs) : 15000;
<<<<<<< HEAD
  const refreshMs = config.refreshMs == null ? 0 : Math.max(0, Number(config.refreshMs) || 0);
  const historyRefreshMs = config.historyRefreshMs == null ? 0 : Math.max(0, Number(config.historyRefreshMs) || 0);
=======
  const refreshMs = Number(config.refreshMs) > 0 ? Number(config.refreshMs) : 60000;
  const historyRefreshMs = Number(config.historyRefreshMs) > 0 ? Number(config.historyRefreshMs) : Math.max(refreshMs * 10, 600000);
>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35
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
      pending: '待刷新',
      realtime: '实时可用性',
      history7d: '7天可用率',
      historyIssue: '历史波动',
      noData: '暂无数据',
      loadError: '读取失败',
      needConfig: '请先在 config.js 中填写 apiBase',
      loading0: '正在载入站点状态',
      loading1: '状态接口响应较慢，请稍候',
      loading2: '仍在读取状态数据，请耐心等待',
      loading3: '接口仍未返回',
      cached: '已先显示最近一次缓存结果',
      partialHistory: '历史数据已加载，实时状态更新中',
      partialRealtime: '实时状态已加载，历史数据更新中',
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
      pending: '待重新整理',
      realtime: '即時可用性',
      history7d: '7天可用率',
      historyIssue: '歷史波動',
      noData: '暫無資料',
      loadError: '讀取失敗',
      needConfig: '請先在 config.js 中填寫 apiBase',
      loading0: '正在載入站點狀態',
      loading1: '狀態介面回應較慢，請稍候',
      loading2: '仍在讀取狀態資料，請耐心等待',
      loading3: '介面仍未返回',
      cached: '已先顯示最近一次快取結果',
      partialHistory: '歷史資料已載入，即時狀態更新中',
      partialRealtime: '即時狀態已載入，歷史資料更新中',
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
      pending: 'Pending',
      realtime: 'Live availability',
      history7d: '7-day uptime',
      historyIssue: 'Past issue',
      noData: 'No data',
      loadError: 'Load failed',
      needConfig: 'Set apiBase in config.js first',
      loading0: 'Loading site status',
      loading1: 'The status API is responding slowly',
      loading2: 'Still loading status data, please wait',
      loading3: 'The API has not returned yet',
      cached: 'Showing the most recent cached result first',
      partialHistory: 'History loaded, live status is still updating',
      partialRealtime: 'Live status loaded, history is still updating',
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

  const buildUrl = (path) => {
    if (!apiBase) return '';
    try {
      return new URL(path, apiBase.endsWith('/') ? apiBase : `${apiBase}/`).toString();
    } catch {
      return '';
    }
  };

  const getRealtimeUrl = () => buildUrl(realtimePath);
  const getHistoryUrl = () => buildUrl(historyPath);
<<<<<<< HEAD
=======
  const getLegacyUrl = () => {
    const raw = buildUrl(legacyCombinedPath);
    if (!raw) return '';
    if (!legacyToken || legacyToken === 'REPLACE_WITH_YOUR_TOKEN') return raw;
    const url = new URL(raw);
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/${encodeURIComponent(legacyToken)}`;
    return url.toString();
  };
>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35

  const realtimeCacheKey = String(config.realtimeStorageKey || `jsw-status-realtime-v3:${apiBase}:${realtimePath}`);
  const historyCacheKey = String(config.historyStorageKey || `jsw-status-history-v3:${apiBase}:${historyPath}`);

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

  const allocateBars = (values, total = 100) => {
    const safeValues = values.map((value) => Math.max(0, Number(value) || 0));
    const bases = safeValues.map((value) => Math.floor(value));
    let remain = total - bases.reduce((sum, value) => sum + value, 0);
    const fractions = safeValues.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction);
    for (let i = 0; i < fractions.length && remain > 0; i += 1) {
      bases[fractions[i].index] += 1;
      remain -= 1;
    }
    return bases;
  };

  const historyDaysFromSite = (site) => {
    const history = site?.history_7d || {};
    const days = Array.isArray(history.days) ? history.days : [];
    return days.slice(0, 31);
  };

  const buildPercentBars = (site) => {
    const days = historyDaysFromSite(site);
    if (!days.length) {
      return Array.from({ length: 100 }, (_, i) => `<span class="micro-bar is-unknown" aria-hidden="true" style="animation-delay:${Math.min(i * 4, 320)}ms"></span>`).join('');
    }

    const dayWidths = allocateBars(Array.from({ length: days.length }, () => 100 / days.length), 100);
    const states = [];
    const liveKnown = typeof site.ok === 'boolean';
    const badClass = liveKnown && site.ok === false ? 'is-bad' : 'is-past-bad';

    days.forEach((entry, dayIndex) => {
      const width = dayWidths[dayIndex] || 0;
      if (width <= 0) return;
      const percent = entry && typeof entry.availability_percent === 'number'
        ? Math.max(0, Math.min(100, Number(entry.availability_percent)))
        : null;

      if (percent == null) {
        for (let i = 0; i < width; i += 1) states.push('is-unknown');
        return;
      }

      const okUnitsRaw = (width * percent) / 100;
      const badUnitsRaw = width - okUnitsRaw;
      const [okUnits, badUnits] = allocateBars([okUnitsRaw, badUnitsRaw], width);
      for (let i = 0; i < okUnits; i += 1) states.push('is-ok');
      for (let i = 0; i < badUnits; i += 1) states.push(badClass);
    });

    while (states.length < 100) states.push('is-unknown');
    return states.slice(0, 100).map((cls, i) => `<span class="micro-bar ${cls}" aria-hidden="true" style="animation-delay:${Math.min(i * 4, 320)}ms"></span>`).join('');
  };

  const loadCachedPayload = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  };

  const saveCachedPayload = (key, payload) => {
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {}
  };

  const primaryState = {
    realtime: loadCachedPayload(realtimeCacheKey),
<<<<<<< HEAD
    history: loadCachedPayload(historyCacheKey)
=======
    history: loadCachedPayload(historyCacheKey),
    usingLegacyFallback: false
>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35
  };

  const getSiteMap = (payload) => {
    const items = Array.isArray(payload?.results) ? payload.results : [];
    const map = new Map();
    items.forEach((item) => {
      const host = String(item?.hostname || '');
      const id = String(item?.site_id || '');
      if (host) map.set(`host:${host}`, item);
      if (id) map.set(`id:${id}`, item);
    });
    return map;
  };

  const mergePayloads = (realtimePayload, historyPayload) => {
    const realtimeItems = Array.isArray(realtimePayload?.results) ? realtimePayload.results : [];
    const historyItems = Array.isArray(historyPayload?.results) ? historyPayload.results : [];
    const realtimeMap = getSiteMap(realtimePayload);
    const historyMap = getSiteMap(historyPayload);
    const orderedHosts = [
      ...Object.keys(config.siteNames || {}),
      ...realtimeItems.map((item) => String(item.hostname || '')).filter(Boolean),
      ...historyItems.map((item) => String(item.hostname || '')).filter(Boolean)
    ].filter(Boolean);
    const uniqueHosts = [...new Set(orderedHosts)];

    return uniqueHosts.map((host) => {
      const live = realtimeMap.get(`host:${host}`) || null;
      const history = historyMap.get(`host:${host}`) || null;
      return {
        hostname: host,
        site_id: String(live?.site_id || history?.site_id || host),
        ...(history && history.history_7d ? { history_7d: history.history_7d } : {}),
        ...(live || {})
      };
    });
  };

  const getIssueText = (site, generatedAt) => {
    if (site.ok === false) return formatTime(generatedAt) || t.unknown;
    const historyDays = historyDaysFromSite(site)
      .filter((entry) => typeof entry?.availability_percent === 'number' && entry.availability_percent < 100)
      .map((entry) => formatMmDd(entry.date));
    if (historyDays.length) return historyDays.join(' / ');
    return t.none;
  };

  const getIssueLabel = (site) => {
    if (site.ok === false) return t.issueNow;
    const historyDays = historyDaysFromSite(site)
      .filter((entry) => typeof entry?.availability_percent === 'number' && entry.availability_percent < 100);
    return historyDays.length ? t.historyIssue : t.issueHistory;
  };

  const renderCards = () => {
    const sites = mergePayloads(primaryState.realtime, primaryState.history);
    const generatedAt = primaryState.realtime?.generated_at || primaryState.history?.generated_at || '';

    if (!sites.length) {
      siteGrid.innerHTML = `<div class="message-card">${escapeHtml(t.noData)}</div>`;
      return;
    }

    siteGrid.innerHTML = sites.map((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      const displayName = getDisplayName(host);
      const history = site?.history_7d || {};
      const liveKnown = typeof site.ok === 'boolean';
      const statusText = liveKnown ? (site.ok ? t.available : t.unavailable) : t.pending;
      const statusClass = liveKnown ? (site.ok ? 'badge badge-ok' : 'badge badge-bad') : 'badge badge-pending';
      const percentText = history.availability_percent == null ? '--' : `${Number(history.availability_percent).toFixed(2)}%`;
      const issueText = getIssueText(site, generatedAt);
      const issueLabel = getIssueLabel(site);
      const percentBars = buildPercentBars(site);
      return `
        <article class="site-card ${liveKnown && site.ok === false ? 'site-card-bad' : ''}">
          <div class="site-head">
            <h2 class="site-name">${escapeHtml(displayName)}</h2>
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

  const updateLoadStateAfterSuccess = () => {
    if (primaryState.realtime && primaryState.history) {
      setLoadState('', 'loading');
      return;
    }
    if (primaryState.history && !primaryState.realtime) {
      setLoadState(t.partialHistory, 'loading');
      return;
    }
    if (primaryState.realtime && !primaryState.history) {
      setLoadState(t.partialRealtime, 'loading');
      return;
    }
    setLoadState(t.loading0, 'loading');
  };

  const fetchJson = async (url, { cache = 'default' } = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache,
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

<<<<<<< HEAD

  const fetchHistory = async () => {
    const url = getHistoryUrl();
    if (!url) throw new Error('history_url_missing');
    const payload = await fetchJson(url, { cache: 'default' });
    primaryState.history = payload;
    saveCachedPayload(historyCacheKey, payload);
    renderCards();
    updateLoadStateAfterSuccess();
  };

=======
  const splitLegacyPayload = (payload) => {
    const results = Array.isArray(payload?.results) ? payload.results : [];
    return {
      realtime: {
        ok: true,
        requested_mode: payload?.requested_mode,
        effective_mode: payload?.effective_mode,
        warm: payload?.warm,
        preview_auto_manage: Boolean(payload?.preview_auto_manage),
        site_count: results.length,
        generated_at: payload?.generated_at,
        results: results.map((site) => {
          const copy = { ...site };
          delete copy.history_7d;
          return copy;
        })
      },
      history: {
        ok: true,
        history_window_days: Number(payload?.history_window_days) > 0 ? Number(payload.history_window_days) : 7,
        site_count: results.length,
        generated_at: payload?.generated_at,
        results: results.map((site) => ({
          site_id: site.site_id,
          hostname: site.hostname,
          history_7d: site.history_7d || null
        })).filter((site) => site.history_7d)
      }
    };
  };

  const fetchHistory = async () => {
    const url = getHistoryUrl();
    if (!url) throw new Error('history_url_missing');
    const payload = await fetchJson(url, { cache: 'default' });
    primaryState.history = payload;
    saveCachedPayload(historyCacheKey, payload);
    renderCards();
    updateLoadStateAfterSuccess();
  };

>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35
  const fetchRealtime = async () => {
    const url = getRealtimeUrl();
    if (!url) throw new Error('realtime_url_missing');
    const payload = await fetchJson(url, { cache: 'no-store' });
    primaryState.realtime = payload;
    saveCachedPayload(realtimeCacheKey, payload);
    renderCards();
    updateLoadStateAfterSuccess();
  };

<<<<<<< HEAD
=======
  const tryLegacyFallback = async () => {
    if (primaryState.usingLegacyFallback) return false;
    const url = getLegacyUrl();
    if (!url) return false;
    try {
      const payload = await fetchJson(url, { cache: 'no-store' });
      const split = splitLegacyPayload(payload);
      primaryState.realtime = split.realtime;
      primaryState.history = split.history;
      primaryState.usingLegacyFallback = true;
      saveCachedPayload(realtimeCacheKey, split.realtime);
      saveCachedPayload(historyCacheKey, split.history);
      renderCards();
      updateLoadStateAfterSuccess();
      return true;
    } catch {
      return false;
    }
  };
>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35

  const bootstrap = async () => {
    if (!apiBase) {
      renderError(t.needConfig);
      return;
    }

    if (primaryState.realtime || primaryState.history) {
      renderCards();
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

    const [historyResult, realtimeResult] = await Promise.allSettled([
      fetchHistory(),
      fetchRealtime()
    ]);

    loadingTimers.forEach(clearTimeout);

<<<<<<< HEAD
=======
    const bothFailed = historyResult.status === 'rejected' && realtimeResult.status === 'rejected';
    if (bothFailed) {
      const fallbackOk = await tryLegacyFallback();
      if (!fallbackOk) {
        const reason = historyResult.reason instanceof Error ? historyResult.reason.message : t.loadError;
        renderError(`${t.loadError}: ${reason}`, Boolean(primaryState.realtime || primaryState.history));
        return;
      }
    }
>>>>>>> 2fce889d62d766d655d97e55e92ec5db86d44d35

    updateLoadStateAfterSuccess();

    if (historyResult.status === 'rejected' && primaryState.realtime) {
      const message = historyResult.reason instanceof Error ? `${t.loadError}: ${historyResult.reason.message}` : t.loadError;
      setLoadState(message, 'error');
    }
    if (realtimeResult.status === 'rejected' && primaryState.history) {
      const message = realtimeResult.reason instanceof Error ? `${t.loadError}: ${realtimeResult.reason.message}` : t.loadError;
      setLoadState(message, 'error');
    }

    if (refreshMs > 0) {
      setInterval(() => {
        fetchRealtime().catch((error) => {
          const message = error instanceof Error ? `${t.loadError}: ${error.message}` : t.loadError;
          renderError(message, Boolean(primaryState.realtime || primaryState.history));
        });
      }, refreshMs);
    }

    if (historyRefreshMs > 0) {
      setInterval(() => {
        fetchHistory().catch((error) => {
          const message = error instanceof Error ? `${t.loadError}: ${error.message}` : t.loadError;
          renderError(message, Boolean(primaryState.realtime || primaryState.history));
        });
      }, historyRefreshMs);
    }
  };

  bootstrap();
})();
