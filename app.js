(() => {
  const config = window.STATUS_APP_CONFIG || {};
  const apiBase = String(config.apiBase || '').replace(/\/$/, '');
  const apiToken = String(config.apiToken || '').trim();
  const refreshMs = Number(config.refreshMs) > 0 ? Number(config.refreshMs) : 60000;
  const storageKey = String(config.historyStorageKey || 'jsw-status-history-v1');
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

  const todayKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveHistory = (history) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch {}
  };

  const pruneHistory = (history) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const next = {};
    Object.entries(history).forEach(([host, days]) => {
      if (!days || typeof days !== 'object') return;
      const kept = {};
      Object.entries(days).forEach(([day, stats]) => {
        const time = new Date(`${day}T00:00:00`).getTime();
        if (!Number.isNaN(time) && time >= cutoff - 24 * 60 * 60 * 1000) kept[day] = stats;
      });
      next[host] = kept;
    });
    return next;
  };

  const recordSamples = (results) => {
    const history = pruneHistory(loadHistory());
    const day = todayKey(new Date());
    results.forEach((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      if (!history[host] || typeof history[host] !== 'object') history[host] = {};
      if (!history[host][day] || typeof history[host][day] !== 'object') history[host][day] = { total: 0, ok: 0 };
      history[host][day].total += 1;
      history[host][day].ok += site.ok ? 1 : 0;
    });
    saveHistory(history);
    return history;
  };

  const getLast7Days = () => {
    const list = [];
    const base = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      list.push(d);
    }
    return list;
  };

  const getHistorySummary = (history, host) => {
    const days = getLast7Days();
    const entries = days.map((date) => {
      const key = todayKey(date);
      const stats = history?.[host]?.[key] || { total: 0, ok: 0 };
      const percent = stats.total > 0 ? (stats.ok / stats.total) * 100 : null;
      return { key, label: date.toLocaleDateString(locale, { weekday: 'short' }), percent };
    });
    const totals = entries.reduce((acc, item) => {
      const stats = history?.[host]?.[item.key] || { total: 0, ok: 0 };
      acc.total += stats.total;
      acc.ok += stats.ok;
      return acc;
    }, { total: 0, ok: 0 });
    const overall = totals.total > 0 ? (totals.ok / totals.total) * 100 : null;
    return { overall, entries };
  };

  const barClass = (percent) => {
    if (percent == null) return 'bar-wrap';
    if (percent < 80) return 'bar-wrap bar-bad';
    if (percent < 99.9) return 'bar-wrap bar-low';
    return 'bar-wrap';
  };

  const renderCards = (payload, history) => {
    const results = Array.isArray(payload?.results) ? payload.results : [];
    if (!results.length) {
      siteGrid.innerHTML = `<div class="empty">${escapeHtml(t.noData)}</div>`;
      return;
    }
    siteGrid.innerHTML = results.map((site) => {
      const host = String(site.hostname || site.site_id || 'unknown');
      const summary = getHistorySummary(history, host);
      const statusText = site.ok ? t.available : t.unavailable;
      const statusClass = site.ok ? 'badge badge-ok' : 'badge badge-bad';
      const percentText = summary.overall == null ? '--' : `${summary.overall.toFixed(2)}%`;
      const chart = summary.entries.map((entry) => {
        const percent = entry.percent == null ? 0 : entry.percent;
        const height = Math.max(6, Math.min(100, Math.round(percent)));
        return `<div class="${barClass(entry.percent)}"><div class="bar"><div class="bar-fill" style="height:${height}px"></div></div><div class="day">${escapeHtml(entry.label)}</div></div>`;
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
      const history = recordSamples(Array.isArray(payload?.results) ? payload.results : []);
      renderCards(payload, history);
    } catch (error) {
      renderError(error instanceof Error ? `${t.loadError}: ${error.message}` : t.loadError);
    }
  };

  fetchStatus();
  setInterval(fetchStatus, refreshMs);
})();
