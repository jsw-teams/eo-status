(() => {
  const config = window.STATUS_APP_CONFIG || {};
  const pageTitleEl = document.getElementById('pageTitle');
  const siteGrid = document.getElementById('siteGrid');
  const loadStateEl = document.getElementById('loadState');
  const assistAreaEl = document.getElementById('assistArea');

  if (!pageTitleEl || !siteGrid || !loadStateEl || !assistAreaEl) {
    console.error('[status-app] Required DOM nodes are missing');
    return;
  }

  const apiBase = String(config.apiBase || '').trim().replace(/\/$/, '');
  const realtimePath = String(config.realtimePath || '/api/realtime').trim() || '/api/realtime';
  const historyPath = String(config.historyPath || '/api/history?window=7').trim() || '/api/history?window=7';
  const fetchTimeoutMs = Number(config.fetchTimeoutMs) > 0 ? Number(config.fetchTimeoutMs) : 15000;
  const challengePath = String(config.challengePath || realtimePath || '/api/realtime').trim() || '/api/realtime';
  const historyStorageKey = String(config.historyStorageKey || 'jsw-status-history-v6').trim() || 'jsw-status-history-v6';
  const historyStorageMaxAgeMs = Number(config.historyStorageMaxAgeMs) > 0 ? Number(config.historyStorageMaxAgeMs) : 24 * 60 * 60 * 1000;

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
      partialHistory: '历史数据已加载，实时状态更新中',
      partialRealtime: '实时状态已加载，历史数据更新中',
      issueTime: '异常时间',
      issueNow: '当前检测时间',
      issueHistory: '近7天异常',
      none: '无',
      unknown: '待检测',
      cachedHistoryLoaded: '已显示本地历史数据，正在更新最新结果',
      cachedHistoryOnly: '网络更新失败，当前显示本地历史数据',
      likelyChallenge: '可能被托管质询、WAF 或跨域策略拦截',
      challengeTitle: '需要先通过浏览器验证',
      challengeBody: '你的行为有点可疑，API 现在要求先完成一次浏览器验证，验证通过后才能继续拉取站点状态数据流。',
      challengeHint: '请在新标签页打开验证入口，完成验证后回到本页再点重新获取。',
      challengeOpen: '打开验证入口',
      challengeRetry: '我已完成验证，重新获取'
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
      partialHistory: '歷史資料已載入，即時狀態更新中',
      partialRealtime: '即時狀態已載入，歷史資料更新中',
      issueTime: '異常時間',
      issueNow: '目前檢測時間',
      issueHistory: '近7天異常',
      none: '無',
      unknown: '待檢測',
      cachedHistoryLoaded: '已顯示本機歷史資料，正在更新最新結果',
      cachedHistoryOnly: '網路更新失敗，目前顯示本機歷史資料',
      likelyChallenge: '可能被託管質詢、WAF 或跨域策略攔截',
      challengeTitle: '需要先通過瀏覽器驗證',
      challengeBody: '你的行為看起來有點可疑，API 現在要求先完成一次瀏覽器驗證，通過後才能繼續拉取站點狀態資料流。',
      challengeHint: '請在新分頁打開驗證入口，完成驗證後回到本頁再點重新取得。',
      challengeOpen: '打開驗證入口',
      challengeRetry: '我已完成驗證，重新取得'
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
      partialHistory: 'History loaded, live status is still updating',
      partialRealtime: 'Live status loaded, history is still updating',
      issueTime: 'Issue time',
      issueNow: 'Current check',
      issueHistory: 'Issues in 7 days',
      none: 'None',
      unknown: 'Pending',
      cachedHistoryLoaded: 'Showing cached history while refreshing latest data',
      cachedHistoryOnly: 'Network refresh failed, showing cached history',
      likelyChallenge: 'Likely blocked by a managed challenge, WAF, or CORS policy',
      challengeTitle: 'Browser verification required',
      challengeBody: 'Your traffic looks a little suspicious, so the API is asking you to complete a browser challenge before it can stream fresh status data.',
      challengeHint: 'Open the verification page in a new tab, finish the check, then come back and retry.',
      challengeOpen: 'Open verification page',
      challengeRetry: 'I finished verification, retry'
    }
  };

  const t = textMap[locale] || textMap.en;
  document.documentElement.lang = locale === 'en' ? 'en' : locale;
  document.title = t.title;
  pageTitleEl.textContent = t.title;

  const state = {
    realtime: null,
    history: null
  };

  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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
      if (locale === 'en' && entry.en) return String(entry.en);
      return String(entry['zh-Hans'] || entry['zh-Hant'] || entry.en || host);
    }
    return host;
  };

  const buildUrl = (path) => {
    if (!apiBase) return '';
    try {
      return new URL(path, `${apiBase}/`).toString();
    } catch {
      return '';
    }
  };

  const historyDaysFromSite = (site) => {
    const history = site && site.history_7d ? site.history_7d : {};
    const days = Array.isArray(history.days) ? history.days : [];
    return days.slice(0, 31);
  };

  const allocateBars = (values, total = 100) => {
    const safeValues = values.map((value) => Math.max(0, Number(value) || 0));
    const bases = safeValues.map((value) => Math.floor(value));
    let remain = total - bases.reduce((sum, value) => sum + value, 0);
    const fractions = safeValues
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction);
    for (let i = 0; i < fractions.length && remain > 0; i += 1) {
      bases[fractions[i].index] += 1;
      remain -= 1;
    }
    return bases;
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

  const getSiteMap = (payload) => {
    const items = Array.isArray(payload && payload.results) ? payload.results : [];
    const map = new Map();
    items.forEach((item) => {
      const host = String((item && item.hostname) || '');
      const id = String((item && item.site_id) || '');
      if (host) map.set(`host:${host}`, item);
      if (id) map.set(`id:${id}`, item);
    });
    return map;
  };

  const mergePayloads = (realtimePayload, historyPayload) => {
    const realtimeItems = Array.isArray(realtimePayload && realtimePayload.results) ? realtimePayload.results : [];
    const historyItems = Array.isArray(historyPayload && historyPayload.results) ? historyPayload.results : [];
    const realtimeMap = getSiteMap(realtimePayload || {});
    const historyMap = getSiteMap(historyPayload || {});
    const orderedHosts = [
      ...Object.keys(config.siteNames || {}),
      ...realtimeItems.map((item) => String((item && item.hostname) || '')).filter(Boolean),
      ...historyItems.map((item) => String((item && item.hostname) || '')).filter(Boolean)
    ];
    const uniqueHosts = [...new Set(orderedHosts.filter(Boolean))];

    return uniqueHosts.map((host) => {
      const live = realtimeMap.get(`host:${host}`) || null;
      const history = historyMap.get(`host:${host}`) || null;
      return {
        hostname: host,
        site_id: String((live && live.site_id) || (history && history.site_id) || host),
        ...(history && history.history_7d ? { history_7d: history.history_7d } : {}),
        ...(live || {})
      };
    });
  };

  const getIssueText = (site, generatedAt) => {
    if (site.ok === false) return formatTime(generatedAt) || t.unknown;
    const historyDays = historyDaysFromSite(site)
      .filter((entry) => typeof (entry && entry.availability_percent) === 'number' && entry.availability_percent < 100)
      .map((entry) => formatMmDd(entry.date));
    if (historyDays.length) return historyDays.join(' / ');
    return t.none;
  };

  const getIssueLabel = (site) => {
    if (site.ok === false) return t.issueNow;
    const historyDays = historyDaysFromSite(site)
      .filter((entry) => typeof (entry && entry.availability_percent) === 'number' && entry.availability_percent < 100);
    return historyDays.length ? t.historyIssue : t.issueHistory;
  };

  const clearAssist = () => {
    assistAreaEl.innerHTML = '';
    assistAreaEl.className = 'assist-area hidden';
  };

  const renderChallengeAssist = (verifyUrl, detailMessage, keepCards = true) => {
    if (!verifyUrl) return;
    assistAreaEl.className = 'assist-area';
    assistAreaEl.innerHTML = `
      <div class="assist-card" role="status" aria-live="polite">
        <div class="assist-title">${escapeHtml(t.challengeTitle)}</div>
        <p class="assist-body">${escapeHtml(t.challengeBody)}</p>
        <p class="assist-hint">${escapeHtml(detailMessage || t.challengeHint)}</p>
        <div class="assist-actions">
          <a class="assist-button assist-button-primary" href="${escapeHtml(verifyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.challengeOpen)}</a>
          <button type="button" class="assist-button assist-button-secondary" data-action="retry-challenge">${escapeHtml(t.challengeRetry)}</button>
        </div>
      </div>
    `;
    const retryButton = assistAreaEl.querySelector('[data-action="retry-challenge"]');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        window.location.reload();
      });
    }
    if (!keepCards) {
      siteGrid.innerHTML = '';
    }
  };

  const setLoadState = (message = '', variant = 'loading') => {
    loadStateEl.className = `load-state ${variant}${message ? '' : ' hidden'}`;
    loadStateEl.textContent = message || '\u00A0';
  };

  const renderError = (message, keepCards = false) => {
    setLoadState(message, 'error');
    if (!keepCards) {
      clearAssist();
      siteGrid.innerHTML = `<div class="message-card error-card">${escapeHtml(message)}</div>`;
    }
  };

  const safeJsonParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const readHistoryCache = () => {
    try {
      const raw = window.localStorage.getItem(historyStorageKey);
      if (!raw) return null;
      const parsed = safeJsonParse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.payload) return null;
      const savedAt = Number(parsed.savedAt || 0);
      if (!Number.isFinite(savedAt) || savedAt <= 0) return null;
      if (Date.now() - savedAt > historyStorageMaxAgeMs) return null;
      const payload = parsed.payload;
      if (!payload || typeof payload !== 'object' || !Array.isArray(payload.results)) return null;
      return payload;
    } catch {
      return null;
    }
  };

  const writeHistoryCache = (payload) => {
    try {
      if (!payload || typeof payload !== 'object' || !Array.isArray(payload.results)) return;
      window.localStorage.setItem(historyStorageKey, JSON.stringify({
        savedAt: Date.now(),
        payload
      }));
    } catch {}
  };

  const isLikelyChallengeError = (error, url) => {
    const message = error && error.message ? String(error.message) : String(error || '');
    if (/managed challenge|cf-mitigated|non-json|html response/i.test(message)) return true;
    if (/failed to fetch|load failed|networkerror/i.test(message)) {
      try {
        const target = new URL(url, window.location.href);
        return target.origin !== window.location.origin;
      } catch {
        return true;
      }
    }
    return false;
  };

  const normalizeFetchError = (error, url) => {
    const fallback = t.loadError;
    if (!error) return fallback;
    const message = error && error.message ? String(error.message) : String(error);
    if (/aborted|aborterror|timeout/i.test(message)) return `${fallback}: timeout`;
    if (/managed challenge|cf-mitigated|non-json|html response/i.test(message)) return `${fallback}: ${t.likelyChallenge}`;
    if (/failed to fetch|load failed|networkerror/i.test(message)) {
      try {
        const target = new URL(url, window.location.href);
        if (target.origin !== window.location.origin) return `${fallback}: ${message}（${t.likelyChallenge}）`;
      } catch {}
      return `${fallback}: ${message}`;
    }
    return `${fallback}: ${message}`;
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

  const renderCards = () => {
    const sites = mergePayloads(state.realtime, state.history);
    const generatedAt = (state.realtime && state.realtime.generated_at)
      || (state.history && state.history.generated_at)
      || '';

    if (!sites.length) {
      siteGrid.innerHTML = `<div class="message-card">${escapeHtml(t.noData)}</div>`;
      return;
    }

    siteGrid.innerHTML = sites.map((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      const displayName = getDisplayName(host);
      const history = site && site.history_7d ? site.history_7d : {};
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

  const updateLoadStateAfterSuccess = () => {
    if (state.realtime && state.history) {
      clearAssist();
      setLoadState('', 'loading');
      return;
    }
    if (state.history && !state.realtime) {
      setLoadState(t.partialHistory, 'loading');
      return;
    }
    if (state.realtime && !state.history) {
      setLoadState(t.partialRealtime, 'loading');
      return;
    }
    setLoadState(t.loading0, 'loading');
  };

  const fetchJson = async (url, cacheMode) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), fetchTimeoutMs);
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: cacheMode,
        credentials: 'include',
        mode: 'cors',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      if (contentType && !contentType.includes('application/json')) {
        const bodyText = await response.text();
        if (/cf-mitigated|challenge|<html/i.test(bodyText)) throw new Error('managed challenge or html response');
        throw new Error('non-json response');
      }
      return await response.json();
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('timeout');
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const bootstrap = async () => {
    if (!apiBase) {
      renderError(t.needConfig);
      return;
    }

    const historyUrl = buildUrl(historyPath);
    const realtimeUrl = buildUrl(realtimePath);

    if (!historyUrl || !realtimeUrl) {
      renderError(t.needConfig);
      return;
    }

    clearAssist();

    const cachedHistory = readHistoryCache();
    if (cachedHistory) {
      state.history = cachedHistory;
      renderCards();
      setLoadState(t.cachedHistoryLoaded, 'loading');
    } else {
      renderSkeletons(3);
      setLoadState(t.loading0, 'loading');
    }

    const [historyResult, realtimeResult] = await Promise.allSettled([
      fetchJson(historyUrl, 'default'),
      fetchJson(realtimeUrl, 'no-store')
    ]);

    if (historyResult.status === 'fulfilled') {
      state.history = historyResult.value;
      writeHistoryCache(historyResult.value);
      renderCards();
      updateLoadStateAfterSuccess();
    }

    if (realtimeResult.status === 'fulfilled') {
      state.realtime = realtimeResult.value;
      renderCards();
      updateLoadStateAfterSuccess();
    }

    if (!state.history && !state.realtime) {
      const historyMessage = historyResult.status === 'rejected' ? normalizeFetchError(historyResult.reason, historyUrl) : '';
      const realtimeMessage = realtimeResult.status === 'rejected' ? normalizeFetchError(realtimeResult.reason, realtimeUrl) : '';
      const likelyChallenge = (historyResult.status === 'rejected' && isLikelyChallengeError(historyResult.reason, historyUrl))
        || (realtimeResult.status === 'rejected' && isLikelyChallengeError(realtimeResult.reason, realtimeUrl));
      const message = realtimeMessage || historyMessage || t.loadError;
      renderError(message);
      if (likelyChallenge) renderChallengeAssist(buildUrl(challengePath), t.challengeHint, false);
      return;
    }

    if (historyResult.status === 'rejected' && state.history) {
      const message = cachedHistory
        ? `${t.cachedHistoryOnly}；${normalizeFetchError(historyResult.reason, historyUrl)}`
        : normalizeFetchError(historyResult.reason, historyUrl);
      setLoadState(message, 'error');
      if (isLikelyChallengeError(historyResult.reason, historyUrl)) renderChallengeAssist(buildUrl(challengePath), t.challengeHint, true);
      if (!state.realtime) renderCards();
      return;
    }

    if (realtimeResult.status === 'rejected' && state.history) {
      const message = normalizeFetchError(realtimeResult.reason, realtimeUrl);
      setLoadState(cachedHistory ? `${t.cachedHistoryOnly}；${message}` : message, 'error');
      if (isLikelyChallengeError(realtimeResult.reason, realtimeUrl)) renderChallengeAssist(buildUrl(challengePath), t.challengeHint, true);
      return;
    }

    if (historyResult.status === 'rejected' && state.realtime && !state.history) {
      const message = normalizeFetchError(historyResult.reason, historyUrl);
      setLoadState(message, 'error');
      if (isLikelyChallengeError(historyResult.reason, historyUrl)) renderChallengeAssist(buildUrl(challengePath), t.challengeHint, true);
      return;
    }

    updateLoadStateAfterSuccess();
  };

  window.addEventListener('error', (event) => {
    const message = event && event.error && event.error.message ? event.error.message : t.loadError;
    renderError(`${t.loadError}: ${message}`, Boolean(state.history || state.realtime));
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event && event.reason;
    const message = reason && reason.message ? reason.message : t.loadError;
    renderError(`${t.loadError}: ${message}`, Boolean(state.history || state.realtime));
  });

  bootstrap().catch((error) => {
    const message = error instanceof Error ? error.message : t.loadError;
    renderError(`${t.loadError}: ${message}`, Boolean(state.history || state.realtime));
    console.error('[status-app] bootstrap failed', error);
  });
})();
