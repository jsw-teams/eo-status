(() => {
  const config = window.STATUS_APP_CONFIG || {};
  const apiBase = String(config.apiBase || "").replace(/\/$/, "");
  const apiToken = String(config.apiToken || "").trim();
  const refreshMs = Number(config.refreshMs) > 0 ? Number(config.refreshMs) : 60000;

  const subtitle = document.getElementById("subtitle");
  const modeValue = document.getElementById("modeValue");
  const siteCountValue = document.getElementById("siteCountValue");
  const healthyCountValue = document.getElementById("healthyCountValue");
  const generatedAtValue = document.getElementById("generatedAtValue");
  const statusBox = document.getElementById("statusBox");
  const rawJson = document.getElementById("rawJson");
  const siteTableBody = document.getElementById("siteTableBody");
  const refreshButton = document.getElementById("refreshButton");
  const refreshHint = document.getElementById("refreshHint");
  const searchInput = document.getElementById("searchInput");

  let latestPayload = null;

  document.title = String(config.title || document.title);
  if (subtitle && config.subtitle) {
    subtitle.textContent = String(config.subtitle);
  }

  const getApiUrl = () => {
    if (!apiBase || !apiToken || apiToken === "REPLACE_WITH_YOUR_TOKEN") {
      return "";
    }
    return `${apiBase}/healthy-api/${encodeURIComponent(apiToken)}`;
  };

  const formatTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  };

  const toBadge = (text, type) => `<span class="badge badge-${type}">${escapeHtml(text)}</span>`;

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const summarizeCheck = (site) => {
    const status = site.status == null ? "-" : site.status;
    return `${site.code} / ${status} / ${site.duration_ms}ms`;
  };

  const summarizeAction = (action) => {
    if (!action) return "-";
    return `${action.action} / ${action.reason}`;
  };

  const renderTable = (payload) => {
    const keyword = String(searchInput.value || "").trim().toLowerCase();
    const rows = Array.isArray(payload.results) ? payload.results : [];
    const filtered = keyword ? rows.filter((item) => String(item.hostname).toLowerCase().includes(keyword)) : rows;
    siteTableBody.innerHTML = filtered.map((site) => {
      const okBadge = site.ok ? toBadge("healthy", "ok") : toBadge("unhealthy", "bad");
      const stateBadge = site.state === "cloudflare_takeover" ? toBadge(site.state, "warn") : toBadge(site.state, "info");
      const actualBadge = toBadge(site.action?.action || "none", site.action?.action === "takeover" ? "warn" : site.action?.action === "restore" ? "ok" : "info");
      const previewBadge = toBadge(site.would_auto?.action || "none", site.would_auto?.action === "takeover" ? "warn" : site.would_auto?.action === "restore" ? "ok" : "info");
      const warmText = site.warm || site.would_auto?.warm || "-";
      return `
        <tr>
          <td><strong>${escapeHtml(site.hostname)}</strong></td>
          <td>${okBadge}</td>
          <td>${stateBadge}</td>
          <td>${escapeHtml(summarizeCheck(site))}</td>
          <td>${actualBadge}<div class="muted">${escapeHtml(summarizeAction(site.action))}</div></td>
          <td>${previewBadge}<div class="muted">${escapeHtml(summarizeAction(site.would_auto))}</div></td>
          <td>${escapeHtml(warmText)}</td>
        </tr>
      `;
    }).join("");

    if (!filtered.length) {
      siteTableBody.innerHTML = `<tr><td colspan="7" class="empty">没有匹配结果</td></tr>`;
    }
  };

  const renderSummary = (payload) => {
    const rows = Array.isArray(payload.results) ? payload.results : [];
    const healthyCount = rows.filter((item) => item.ok).length;
    modeValue.textContent = `${payload.requested_mode || "-"} → ${payload.effective_mode || "-"}`;
    siteCountValue.textContent = String(payload.site_count ?? rows.length ?? 0);
    healthyCountValue.textContent = `${healthyCount}/${rows.length}`;
    generatedAtValue.textContent = formatTime(payload.generated_at);
    statusBox.textContent = JSON.stringify({
      ok: payload.ok,
      requested_mode: payload.requested_mode,
      effective_mode: payload.effective_mode,
      warm: payload.warm || null,
      preview_auto_manage: payload.preview_auto_manage,
      site_count: payload.site_count,
      generated_at: payload.generated_at
    }, null, 2);
    rawJson.textContent = JSON.stringify(payload, null, 2);
    renderTable(payload);
  };

  const renderError = (message) => {
    modeValue.textContent = "-";
    siteCountValue.textContent = "-";
    healthyCountValue.textContent = "-";
    generatedAtValue.textContent = "-";
    statusBox.textContent = message;
    rawJson.textContent = message;
    siteTableBody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(message)}</td></tr>`;
  };

  const fetchStatus = async () => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      renderError("请先在 config.js 中填写 apiBase 与 apiToken");
      return;
    }
    refreshButton.disabled = true;
    refreshHint.textContent = "读取中";
    try {
      const response = await fetch(apiUrl, { method: "GET", cache: "no-store" });
      const payload = await response.json();
      latestPayload = payload;
      renderSummary(payload);
      refreshHint.textContent = `已刷新 ${new Date().toLocaleTimeString()}`;
    } catch (error) {
      renderError(error instanceof Error ? error.message : "读取失败");
      refreshHint.textContent = "读取失败";
    } finally {
      refreshButton.disabled = false;
    }
  };

  refreshButton.addEventListener("click", fetchStatus);
  searchInput.addEventListener("input", () => {
    if (latestPayload) renderTable(latestPayload);
  });

  fetchStatus();
  setInterval(fetchStatus, refreshMs);
})();
