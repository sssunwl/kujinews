const DATA_URL = "./data/kuji.json";

const IP_OFFICIAL = {
  "ワンピース":    "https://one-piece.com/news/index.html",
  "ドラゴンボール": "https://dragon-ball-official.com/news/",
  "REBORN!":     "https://khreborn-anime.jp/",
  "ちいかわ":     "https://chiikawaworld.com/news/",
  "ジョジョ":     "https://jojoweb.jp/",
};

let kujiData = null;
let currentIP = "ワンピース";

// ── Init ──────────────────────────────────────────────
async function init() {
  await loadData();
  setupNav();
  renderToday();
  setupIPTabs();
}

async function loadData() {
  try {
    const r = await fetch(DATA_URL);
    kujiData = await r.json();
  } catch {
    kujiData = { months: [], generated_at: null };
  }
}

// ── Navigation ───────────────────────────────────────
function setupNav() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
      document.getElementById(`view-${view}`).classList.remove("hidden");
      if (view === "calendar") renderCalendar();
      if (view === "ip") renderIP(currentIP);
    });
  });
}

// ── Today View ───────────────────────────────────────
function renderToday() {
  const content = document.getElementById("today-content");
  const allItems = (kujiData.months || []).flatMap(m => m.items || []);

  const now = new Date();
  const todayKey = fmtDate(now);
  const in7 = new Date(now); in7.setDate(in7.getDate() + 7);
  const in30 = new Date(now); in30.setDate(in30.getDate() + 30);

  const todayItems   = allItems.filter(i => i.date === todayKey);
  const weekItems    = allItems.filter(i => i.date && i.date > todayKey && i.date <= fmtDate(in7));
  const monthItems   = allItems.filter(i => i.date && i.date > fmtDate(in7) && i.date <= fmtDate(in30));

  const weekday = ["日","一","二","三","四","五","六"][now.getDay()];
  const dateLabel = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（週${weekday}）`;

  let html = `
    <div class="today-header">
      <div class="today-date">${dateLabel}</div>
      <div class="today-sub">最後更新：${kujiData.generated_at ? new Date(kujiData.generated_at).toLocaleString("zh-TW") : "—"}</div>
    </div>
  `;

  html += renderSection("🎲 今日發售", todayItems.length
    ? todayItems.map(i => renderKujiItem(i, true)).join("")
    : '<div class="empty" style="padding:12px 0">今日暫無發售</div>'
  );

  html += renderSection("📅 本週發售（7日內）", weekItems.length
    ? weekItems.map(i => renderKujiItem(i, false)).join("")
    : '<div class="empty" style="padding:12px 0">本週暫無發售</div>'
  );

  html += renderSection("🗓 本月其餘", monthItems.length
    ? monthItems.slice(0, 15).map(i => renderKujiItem(i, false)).join("")
    : '<div class="empty" style="padding:12px 0">本月暫無安排</div>'
  );

  content.innerHTML = html;
}

function renderSection(label, inner) {
  return `
    <div class="section-wrap">
      <div class="section-label">${label}</div>
      ${inner}
    </div>
  `;
}

// ── Calendar View ─────────────────────────────────────
function renderCalendar() {
  const months = kujiData.months || [];
  const nav = document.getElementById("month-nav");
  const content = document.getElementById("calendar-content");

  if (!months.length) {
    content.innerHTML = '<div class="empty">暫無資料</div>';
    return;
  }

  nav.innerHTML = months.map(m =>
    `<button class="month-btn" data-key="${m.key}" onclick="scrollToMonth('${m.key}')">${m.label}</button>`
  ).join("");

  let html = kujiData.generated_at
    ? `<div class="generated-at">最後更新：${new Date(kujiData.generated_at).toLocaleString("zh-TW")}</div>`
    : "";

  for (const month of months) {
    const items = month.items || [];
    html += `
      <div class="month-section" id="month-${month.key}">
        <div class="month-title">
          ${month.label}
          <span class="month-count">${items.length}件</span>
        </div>
        ${items.length
          ? items.map(i => renderKujiItem(i, false)).join("")
          : '<div class="empty" style="padding:16px">暫無資料</div>'}
      </div>
    `;
  }
  content.innerHTML = html;
  highlightMonthNav();
}

function scrollToMonth(key) {
  const el = document.getElementById(`month-${key}`);
  if (!el) return;
  const offset = 56 + 48 + 10;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
  document.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.month-btn[data-key="${key}"]`)?.classList.add("active");
}

function highlightMonthNav() {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const btn = document.querySelector(`.month-btn[data-key="${key}"]`);
  if (btn) {
    btn.classList.add("active");
    btn.scrollIntoView({ inline: "center", behavior: "smooth" });
  } else {
    document.querySelector(".month-btn")?.classList.add("active");
  }
}

// ── IP View ───────────────────────────────────────────
function setupIPTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentIP = btn.dataset.ip;
      renderIP(currentIP);
    });
  });
}

function renderIP(ip) {
  const content = document.getElementById("ip-content");
  const allItems = (kujiData.months || []).flatMap(m => m.items || []);
  const ipKuji = allItems.filter(i => i.ip_tags?.includes(ip));
  const officialUrl = IP_OFFICIAL[ip] || "#";

  let html = renderSection(
    "🎲 相關くじ",
    ipKuji.length
      ? ipKuji.map(i => renderKujiItem(i, false)).join("")
      : '<div class="empty" style="padding:16px">暫無相關くじ</div>'
  );

  html += `
    <div class="section-wrap">
      <div class="section-label">📰 官方最新消息</div>
      <a class="news-link-btn" href="${officialUrl}" target="_blank" rel="noopener">
        前往官網查看最新資訊 ↗
      </a>
    </div>
  `;

  content.innerHTML = html;
}

// ── Shared render ─────────────────────────────────────
function renderKujiItem(item, highlight) {
  const day = item.date ? `${parseInt(item.date.split("-")[2])}日` : "—";
  const ipTag = item.ip_tags?.[0]
    ? `<span class="ip-tag">${item.ip_tags[0]}</span>` : "";
  return `
    <a class="kuji-item${highlight ? " today-release" : ""}" href="${item.url}" target="_blank" rel="noopener">
      <span class="kuji-date">${day}</span>
      <span class="kuji-title">${escHtml(item.title)}</span>
      ${ipTag}
      <span class="kuji-brand">${escHtml(item.brand)}</span>
      <span class="kuji-arrow">↗</span>
    </a>
  `;
}

// ── Utils ─────────────────────────────────────────────
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

init();
