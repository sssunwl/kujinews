const DATA_URL = "./data/kuji.json";
const NEWS_URL = "./data/ip_news.json";

// ── Brand directory data ──────────────────────────────
const BRANDS = [
  { name:"一番くじ", name_zh:"一番賞", company:"Bandai Spirits",
    url:"https://1kuji.com/", url2:"https://online.1kuji.com/", url2_label:"線上抽",
    twitter:"@ichibanKUJI", twitter_url:"https://x.com/ichibanKUJI",
    desc:"日本規模最大的一番賞品牌，幾乎囊括所有熱門 IP，全國便利店、書店、動漫店皆有販售。",
    tags:["航海王","七龍珠","咒術迴戰","Pokémon","吉伊卡哇","鬼滅之刃","NARUTO","進擊的巨人"] },
  { name:"Happyくじ", name_zh:"Happy 抽獎", company:"Happy",
    url:"https://www.h-kuji.com/",
    twitter:"@HappyKuji", twitter_url:"https://x.com/HappyKuji",
    desc:"空くじなし，主打 Disney、PIXAR、MARVEL、哈利波特及動漫聯名，設計路線較偏西洋系。",
    tags:["Disney","PIXAR","MARVEL","哈利波特"] },
  { name:"グッスマくじ", name_zh:"Good Smile Kuji", company:"Good Smile Company",
    url:"https://kuji.goodsmile.com/", url2:"https://kuji.goodsmile.com/en/", url2_label:"英文版",
    twitter:"@GOODSMILEKUJI", twitter_url:"https://x.com/GOODSMILEKUJI",
    desc:"Good Smile 旗下，景品品質高，近年成長快速，初音未來、葬送的芙莉蓮、Persona 常見。",
    tags:["初音未來","排球少年","Persona","葬送的芙莉蓮"] },
  { name:"コトブキヤくじ", name_zh:"壽屋 Kuji", company:"Kotobukiya",
    url:"https://kuji.kotobukiya.co.jp/",
    twitter:"@kotobukiya_kuji", twitter_url:"https://x.com/kotobukiya_kuji",
    desc:"壽屋旗下，模型品質較高，偏向收藏玩家，線上抽獎模式完善。",
    tags:["模型系","收藏向","線上抽"] },
  { name:"エニマイくじ", name_zh:"Anymy Kuji", company:"Anymy",
    url:"https://anymykuji.com/",
    twitter:"@Anymy_info", twitter_url:"https://x.com/Anymy_info",
    desc:"新興品牌，近期開始與葬送的芙莉蓮等熱門作品合作，成長中。",
    tags:["葬送的芙莉蓮","新興品牌"] },
  { name:"くじメイト", name_zh:"Kujimate（Animate）", company:"Animate",
    url:"https://kujimate.com/",
    twitter:"@kujimate", twitter_url:"https://x.com/kujimate",
    desc:"Animate 經營，幾乎全線上抽，女性向作品比例高，BL/乙女常見。",
    tags:["Animate","女性向","線上抽"] },
  { name:"みんなのくじ", name_zh:"大家的抽獎", company:"FuRyu",
    url:"https://charahiroba.com/minkuji/",
    twitter:"@minnanokuji", twitter_url:"https://x.com/minnanokuji",
    desc:"FuRyu 推出，女性向動漫比例高，SSS 系列景品設計精緻，品質口碑佳。",
    tags:["女性向","SSS系列","FuRyu"] },
  { name:"タイトーくじ", name_zh:"TAITO Kuji", company:"Taito",
    url:"https://www.taito.co.jp/taitokuji",
    twitter:"@Taito_Toys", twitter_url:"https://x.com/Taito_Toys",
    desc:"動漫、遊戲作品為主，偶爾推出大型模型獎品，全家便利店為主要通路。",
    tags:["動漫","遊戲","全家便利店"] },
  { name:"セガラッキーくじ", name_zh:"SEGA Lucky Kuji", company:"Sega",
    url:"https://segaplaza.jp/lp/lottery/",
    twitter:"@SegaPrize", twitter_url:"https://x.com/SegaPrize",
    desc:"SEGA 旗下，名偵探柯南、藍色監獄、LoveLive 等作品常見，景品偏向 SEGA PRIZE 風格。",
    tags:["名偵探柯南","藍色監獄","LoveLive"] },
  { name:"DMMくじ", name_zh:"DMM 線上抽獎", company:"DMM",
    url:"https://kuji.dmm.com/",
    twitter:"@DMM_kuji", twitter_url:"https://x.com/DMM_kuji",
    desc:"純線上平台，品項豐富，成人向及一般向作品皆有。",
    tags:["線上","成人向","一般向"] },
  { name:"DRAW!DRAW!", name_zh:"DRAW!DRAW!", company:"DRAW!DRAW!",
    url:"https://drawdraw.jp/",
    twitter:"@drawdraw_jp", twitter_url:"https://x.com/drawdraw_jp",
    desc:"線上くじ平台，品項多元，常見熱門動漫 IP 合作。",
    tags:["線上","動漫"] },
  { name:"くじ引き堂", name_zh:"くじ引き堂", company:"Kujibikido",
    url:"https://kujibikido.com/",
    twitter:"@kujibikido", twitter_url:"https://x.com/kujibikido",
    desc:"線上くじ平台，商品種類廣，定期推出新系列。",
    tags:["線上"] },
  { name:"くじラック", name_zh:"Kuji Luck", company:"GEE!STORE",
    url:"https://kujiluck.com/",
    twitter:null,
    desc:"GEE!STORE 旗下，偏向 2.5 次元、舞台、聲優周邊，女性向為主。",
    tags:["2.5次元","聲優","舞台"] },
  { name:"サンリオ当りくじ", name_zh:"三麗鷗抽獎", company:"Sanrio",
    url:"https://www.sanrio.co.jp/", twitter:"@sanrioatarikuji",
    twitter_url:"https://x.com/sanrioatarikuji",
    desc:"三麗鷗自家授權，Hello Kitty、大耳狗、布丁狗等全線角色，設計風格統一精緻。",
    tags:["Hello Kitty","大耳狗","布丁狗","Cinnamoroll"] },
  { name:"カプコンくじ", name_zh:"Capcom Kuji", company:"Capcom",
    url:"https://www.capcom.co.jp/", twitter:"@Capcom_capkuji",
    twitter_url:"https://x.com/Capcom_capkuji",
    desc:"Capcom 官方授權，魔物獵人、惡靈古堡、快打旋風等遊戲 IP 為主。",
    tags:["魔物獵人","惡靈古堡","遊戲"] },
];

const IP_MAP = {
  "ワンピース":    { zh:"航海王",  official:"https://one-piece.com/news/index.html", twitter:"https://x.com/onepiecehunter" },
  "ドラゴンボール": { zh:"七龍珠",  official:"https://dragon-ball-official.com/news/", twitter:"https://x.com/DB_official_" },
  "REBORN!":     { zh:"REBORN!", official:"https://khreborn-anime.jp/", twitter:"https://x.com/khreborn_anime" },
  "ちいかわ":     { zh:"吉伊卡哇", official:"https://chiikawaworld.com/news/", twitter:"https://x.com/ngnchiikawa" },
  "ジョジョ":     { zh:"JOJO",    official:"https://jojoweb.jp/", twitter:"https://x.com/anime_jojo" },
};

let kujiData = null;
let newsData = null;
let currentIP = "ワンピース";
let calState = { year: 0, month: 0, selectedDate: null };

// ── Init ──────────────────────────────────────────────
async function init() {
  const now = new Date();
  calState.year = now.getFullYear();
  calState.month = now.getMonth() + 1;

  await Promise.all([loadData(), loadNews()]);
  setupNav();
  renderToday();
  setupIPTabs();
  renderBrands();
}

async function loadData() {
  try { kujiData = await (await fetch(DATA_URL)).json(); }
  catch { kujiData = { months: [], generated_at: null }; }
}

async function loadNews() {
  try { newsData = await (await fetch(NEWS_URL)).json(); }
  catch { newsData = {}; }
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
  const allItems = getAllItems();
  const now = new Date();
  const todayKey = fmtDate(now);
  const in7 = fmtDate(new Date(now.getTime() + 7*86400000));
  const in30 = fmtDate(new Date(now.getTime() + 30*86400000));

  const todayItems = allItems.filter(i => i.date === todayKey);
  const weekItems  = allItems.filter(i => i.date && i.date > todayKey && i.date <= in7);
  const monthItems = allItems.filter(i => i.date && i.date > in7 && i.date <= in30);

  const weekday = ["日","一","二","三","四","五","六"][now.getDay()];
  const updStr = kujiData.generated_at ? new Date(kujiData.generated_at).toLocaleString("zh-TW") : "—";

  let html = `
    <div class="today-header">
      <div class="today-date">${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日（週${weekday}）</div>
      <div class="today-sub">資料最後更新：${updStr}</div>
    </div>
  `;
  html += section("🎲 今日發售", todayItems.length
    ? todayItems.map(i => itemHTML(i, true)).join("")
    : empty("今日暫無發售"));
  html += section("📅 本週發售（7日內）", weekItems.length
    ? weekItems.map(i => itemHTML(i)).join("")
    : empty("本週暫無發售"));
  html += section("🗓 本月其餘", monthItems.length
    ? monthItems.slice(0,15).map(i => itemHTML(i)).join("")
    : empty("本月暫無安排"));

  content.innerHTML = html;
}

// ── Calendar View ─────────────────────────────────────
function renderCalendar() {
  const months = kujiData.months || [];
  const nav = document.getElementById("month-nav");
  const content = document.getElementById("calendar-content");

  nav.innerHTML = months.map(m =>
    `<button class="month-btn" data-key="${m.key}" onclick="jumpToCalMonth('${m.key}')">${m.label}</button>`
  ).join("");

  renderCalGrid(content);
  highlightMonthNav();
}

function jumpToCalMonth(key) {
  if (key === "unknown") return;
  const [y, m] = key.split("-").map(Number);
  calState.year = y; calState.month = m; calState.selectedDate = null;
  const content = document.getElementById("calendar-content");
  renderCalGrid(content);
  document.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.month-btn[data-key="${key}"]`)?.classList.add("active");
}

function renderCalGrid(container) {
  const { year, month, selectedDate } = calState;
  const allItems = getAllItems();
  const todayKey = fmtDate(new Date());

  // Build date → items map
  const dateMap = {};
  allItems.forEach(i => {
    if (i.date) { if (!dateMap[i.date]) dateMap[i.date] = []; dateMap[i.date].push(i); }
  });

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDow = firstDay.getDay(); // 0=Sun

  let calHTML = `
    <div class="generated-at">資料最後更新：${kujiData.generated_at ? new Date(kujiData.generated_at).toLocaleString("zh-TW") : "—"}</div>
    <div class="cal-header">
      <button class="cal-nav-btn" onclick="changeCalMonth(-1)">‹</button>
      <span class="cal-title">${year}年${month}月</span>
      <button class="cal-nav-btn" onclick="changeCalMonth(1)">›</button>
    </div>
    <div class="cal-grid">
      ${["日","一","二","三","四","五","六"].map(d => `<div class="cal-dow">${d}</div>`).join("")}
  `;

  // Blank cells before first day
  for (let i = 0; i < startDow; i++) calHTML += `<div class="cal-day other-month"></div>`;

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateKey = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const hasKuji = !!dateMap[dateKey];
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedDate;
    let cls = "cal-day";
    if (isToday) cls += " today";
    if (isSelected && !isToday) cls += " selected";
    if (hasKuji) cls += " has-kuji";
    calHTML += `<div class="${cls}" onclick="selectCalDay('${dateKey}')">${d}</div>`;
  }

  calHTML += `</div>`;

  // Selected date kuji list
  if (selectedDate && dateMap[selectedDate]) {
    const [, , dd] = selectedDate.split("-");
    calHTML += `
      <div class="cal-detail">
        <div class="cal-detail-title">${month}月${parseInt(dd)}日 的くじ</div>
        ${dateMap[selectedDate].map(i => itemHTML(i)).join("")}
      </div>
    `;
  } else if (selectedDate) {
    const [, , dd] = selectedDate.split("-");
    calHTML += `<div class="cal-detail">${empty(`${month}月${parseInt(dd)}日 暫無くじ`)}</div>`;
  }

  container.innerHTML = calHTML;
}

function changeCalMonth(delta) {
  calState.month += delta;
  if (calState.month > 12) { calState.month = 1; calState.year++; }
  if (calState.month < 1)  { calState.month = 12; calState.year--; }
  calState.selectedDate = null;
  const key = `${calState.year}-${String(calState.month).padStart(2,"0")}`;
  document.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.month-btn[data-key="${key}"]`)?.classList.add("active");
  renderCalGrid(document.getElementById("calendar-content"));
}

function selectCalDay(dateKey) {
  calState.selectedDate = calState.selectedDate === dateKey ? null : dateKey;
  renderCalGrid(document.getElementById("calendar-content"));
}

function highlightMonthNav() {
  const key = `${calState.year}-${String(calState.month).padStart(2,"0")}`;
  const btn = document.querySelector(`.month-btn[data-key="${key}"]`);
  if (btn) { btn.classList.add("active"); btn.scrollIntoView({ inline:"center", behavior:"smooth" }); }
  else document.querySelector(".month-btn")?.classList.add("active");
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
  const info = IP_MAP[ip] || {};
  const allItems = getAllItems();
  const ipKuji = allItems.filter(i => i.ip_tags?.includes(ip));
  const ipNews = (newsData[ip] || []).slice(0, 15);

  let html = section("🎲 相關くじ", ipKuji.length
    ? ipKuji.map(i => itemHTML(i)).join("")
    : empty("暫無相關くじ"));

  if (ipNews.length) {
    html += section("📰 最新消息",
      ipNews.map(n => `
        <a class="news-item" href="${n.url || info.official}" target="_blank" rel="noopener">
          <span class="news-dot"></span>
          <span class="news-title">${escHtml(n.title)}</span>
        </a>
      `).join("")
    );
  }

  html += `
    <div class="section-wrap" style="display:flex;gap:8px;flex-wrap:wrap">
      ${info.official ? `<a class="news-source-link" href="${info.official}" target="_blank" rel="noopener">官方網站 ↗</a>` : ""}
      ${info.twitter ? `<a class="news-source-link" style="background:#111" href="${info.twitter}" target="_blank" rel="noopener">𝕏 官方帳號 ↗</a>` : ""}
    </div>
  `;

  content.innerHTML = html;
}

// ── Brands View ───────────────────────────────────────
function renderBrands() {
  const content = document.getElementById("brands-content");
  let html = `<div class="brands-grid">`;
  for (const b of BRANDS) {
    const links = [
      b.url ? `<a class="brand-link" href="${b.url}" target="_blank">官網 ↗</a>` : "",
      b.url2 ? `<a class="brand-link" href="${b.url2}" target="_blank">${b.url2_label || "線上抽"} ↗</a>` : "",
      b.twitter ? `<a class="brand-link twitter" href="${b.twitter_url}" target="_blank">${b.twitter} ↗</a>` : "",
    ].filter(Boolean).join("");

    const tags = (b.tags || []).map(t => `<span class="brand-tag">${escHtml(t)}</span>`).join("");

    html += `
      <div class="brand-card">
        <div class="brand-header">
          <div class="brand-name-wrap">
            <div class="brand-name">${escHtml(b.name)}</div>
            <div class="brand-name-zh">${escHtml(b.name_zh)} · ${escHtml(b.company)}</div>
          </div>
          <div class="brand-links">${links}</div>
        </div>
        <div class="brand-desc">${escHtml(b.desc)}</div>
        ${tags ? `<div class="brand-tags">${tags}</div>` : ""}
      </div>
    `;
  }
  html += `</div>`;
  content.innerHTML = html;
}

// ── Shared helpers ─────────────────────────────────────
function getAllItems() {
  return (kujiData.months || []).flatMap(m => m.items || []);
}

function itemHTML(item, highlight = false) {
  const day = item.date ? `${parseInt(item.date.split("-")[2])}日` : "—";
  const ipTag = item.ip_tags?.[0] ? `<span class="ip-tag">${item.ip_tags[0]}</span>` : "";
  const url = item.official_url || item.url || "#";
  return `
    <a class="kuji-item${highlight ? " today-release" : ""}" href="${url}" target="_blank" rel="noopener">
      <span class="kuji-date">${day}</span>
      <span class="kuji-title">${escHtml(item.title)}</span>
      ${ipTag}
      <span class="kuji-brand">${escHtml(item.brand)}</span>
      <span class="kuji-arrow">↗</span>
    </a>
  `;
}

function section(label, inner) {
  return `<div class="section-wrap"><div class="section-label">${label}</div>${inner}</div>`;
}

function empty(msg) {
  return `<div class="empty" style="padding:14px 0;font-size:13px">${msg}</div>`;
}

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function escHtml(s) {
  return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

init();
