"use strict";
// Small helpers shared by the dashboard, viewer and compare pages (no dependencies).
(function () {
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

  async function getJSON(url, options) {
    const response = await fetch(url, Object.assign({cache: "no-store"}, options || {}));
    let payload = null;
    try { payload = await response.json(); } catch (_e) { payload = null; }
    if (!response.ok) {
      const message = payload && payload.error ? payload.error : `${response.status} ${response.statusText}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function postJSON(url, body) {
    return getJSON(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body || {})});
  }

  function num(value, digits = 3) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "boolean") return value ? "yes" : "no";
    if (typeof value !== "number" || !Number.isFinite(value)) return esc(value);
    if (Number.isInteger(value) && Math.abs(value) >= 1000) return value.toLocaleString();
    if (Number.isInteger(value)) return String(value);
    const abs = Math.abs(value);
    if (abs !== 0 && (abs < 1e-3 || abs >= 1e6)) return value.toExponential(2);
    return value.toFixed(abs >= 100 ? 1 : digits).replace(/\.?0+$/, (m) => (m.startsWith(".") ? "" : m));
  }

  function bytes(value) {
    if (!Number.isFinite(value)) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
    return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
  }

  function duration(seconds) {
    if (!Number.isFinite(seconds)) return "—";
    seconds = Math.max(0, Math.round(seconds));
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
    if (m) return `${m}m ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
  }

  function when(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return esc(iso);
    return date.toLocaleString([], {month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
  }

  const STATE_BADGE = {
    succeeded: "", complete: "", running: "blue", queued: "muted", failed: "bad", cancelled: "warn", interrupted: "warn",
  };
  function stateBadge(state) {
    return `<span class="badge ${STATE_BADGE[state] ?? "muted"}">${esc(state)}</span>`;
  }

  function drawSpark(canvas, history, memTotal) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    if (!history || history.length < 2) return;
    const total = history.length;
    const line = (index, max, colour) => {
      ctx.beginPath();
      history.forEach((row, i) => {
        const x = (i / (total - 1)) * (width - 2) + 1;
        const value = Number(row[index]) || 0;
        const y = height - 2 - (Math.min(value, max) / max) * (height - 4);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.5 * ratio;
      ctx.stroke();
    };
    const maxMem = memTotal || Math.max(1, ...history.map((row) => Number(row[2]) || 0));
    line(1, 100, "#63d6b5");
    line(2, maxMem, "#7fb4ff");
  }

  window.CV802 = {esc, getJSON, postJSON, num, bytes, duration, when, stateBadge, drawSpark};
})();
