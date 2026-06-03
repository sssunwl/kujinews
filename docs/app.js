const DATA_URL = "./data/kuji.json";
const NEWS_URL = "./data/ip_news.json";

// ── Japanese → Chinese keyword map ───────────────────
const JP_ZH = [
  ["一番くじちょこっと","一番賞 mini"],["一番くじ","一番賞"],["みんなのくじ","大家的抽獎"],
  ["TVアニメ","電視動畫"],["劇場版アニメ","劇場版動畫"],["劇場版","劇場版"],
  ["ワンピース","航海王"],["ONE PIECE","航海王"],["ドラゴンボール","七龍珠"],
  ["ちいかわ","吉伊卡哇"],["鬼滅の刃","鬼滅之刃"],["呪術廻戦","咒術迴戰"],
  ["僕のヒーローアカデミア","我的英雄學院"],["進撃の巨人","進擊的巨人"],
  ["ジョジョの奇妙な冒険","JOJO的奇妙冒險"],["ジョジョ","JOJO"],
  ["NARUTO-ナルト-","火影忍者"],["NARUTO","火影忍者"],["疾風伝","疾風傳"],
  ["名探偵コナン","名偵探柯南"],["ハイキュー","排球少年"],
  ["鋼の錬金術師","鋼之鍊金術師"],["銀魂","銀魂"],["スラムダンク","灌籃高手"],
  ["東京リベンジャーズ","東京復仇者"],["ブルーロック","藍色監獄"],
  ["チェンソーマン","鏈鋸人"],["葬送のフリーレン","葬送的芙莉蓮"],
  ["薬屋のひとりごと","藥師少女的獨語"],["ダンダダン","丹丹丹丹"],
  ["家庭教師ヒットマンREBORN","家庭教師 REBORN!"],
  ["ポケットモンスター","Pokémon 寶可夢"],["スティッチ","史迪奇"],["〈スティッチ〉","史迪奇"],
  ["北斗の拳","北斗神拳"],["STEEL BALL RUN","鋼之球場賽跑"],
  ["ガンダム","鋼彈"],["機動戦士","機動戰士"],["BLEACH","死神"],
  ["プリキュア","光之美少女"],["アイカツ","偶像學園"],["アイカツ!","偶像學園!"],
  ["学園アイドルマスター","學園偶像大師"],["ラブライブ","LoveLive!"],
  ["アズールレーン","碧藍航線"],["ウマ娘","賽馬娘"],["ブルーアーカイブ","藍色檔案"],
  ["サッカー日本代表","日本足球代表"],["Disney","迪士尼"],["〈Disney〉","迪士尼"],
  ["スター・ウォーズ","星際大戰"],["MARVEL","漫威"],
  ["ホワイトタイガー","白老虎"],["ブラックタイガー","黑老虎"],
  ["MOTHER2","MOTHER 2"],["赤髪海賊団","紅髮海賊團"],["エルバフ編","艾爾巴夫篇"],
  ["ケロロ軍曹","Keroro 軍曹"],["森永製菓","森永製菓"],
  ["ジョジョ奇妙な冒険","JOJO的奇妙冒險"],["風影奪還編","風影奪還篇"],
  ["発売","發售"],["再販","再版"],["予定","預定"],["限定","限定"],
  ["新作","新作"],["公開","公開"],["登場","登場"],["情報","資訊"],
  ["バンプレスト","萬代南夢宮景品"],["メガハウス","MegaHouse"],
  ["麦わらストア","麥稈帽商店"],["商品","商品"],["フィギュア","Figure"],
  ["ぬいぐるみ","布偶"],["タオル","毛巾"],["グッズ","周邊"],
  ["モデル","模型"],["コップ","杯子"],["バッグ","包包"],
];

function zhHint(title) {
  let r = title;
  for (const [jp, zh] of JP_ZH) r = r.split(jp).join(zh);
  // if still has Japanese chars and barely changed, not useful enough
  const hasJp = /[぀-ヿ一-鿿]/.test(r);
  const changed = r !== title;
  return changed ? r : null;
}

// ── Brand directory data ──────────────────────────────
const BRANDS = [
  { name:"一番くじ", name_zh:"一番賞", company:"Bandai Spirits", domain:"1kuji.com",
    url:"https://1kuji.com/", url2:"https://online.1kuji.com/", url2_label:"線上抽",
    twitter:"@ichibanKUJI", twitter_url:"https://x.com/ichibanKUJI",
    desc:"日本規模最大的一番賞品牌，幾乎囊括所有熱門 IP，全國便利店、書店、動漫店皆有販售。",
    tags:["航海王","七龍珠","咒術迴戰","Pokémon","吉伊卡哇","鬼滅之刃","NARUTO"] },
  { name:"Happyくじ", name_zh:"Happy 抽獎", company:"Happy", domain:"h-kuji.com",
    url:"https://www.h-kuji.com/",
    twitter:"@HappyKuji", twitter_url:"https://x.com/HappyKuji",
    desc:"空くじなし，主打 Disney、PIXAR、MARVEL、哈利波特及動漫聯名，設計路線較偏西洋系。",
    tags:["Disney","PIXAR","MARVEL","哈利波特"] },
  { name:"グッスマくじ", name_zh:"Good Smile Kuji", company:"Good Smile Company", domain:"goodsmile.com",
    url:"https://kuji.goodsmile.com/", url2:"https://kuji.goodsmile.com/en/", url2_label:"英文版",
    twitter:"@GOODSMILEKUJI", twitter_url:"https://x.com/GOODSMILEKUJI",
    desc:"Good Smile 旗下，景品品質高，近年成長快速，初音未來、葬送的芙莉蓮、Persona 常見。",
    tags:["初音未來","排球少年","Persona","葬送的芙莉蓮"] },
  { name:"コトブキヤくじ", name_zh:"壽屋 Kuji", company:"Kotobukiya", domain:"kotobukiya.co.jp",
    url:"https://kuji.kotobukiya.co.jp/",
    twitter:"@kotobukiya_kuji", twitter_url:"https://x.com/kotobukiya_kuji",
    desc:"壽屋旗下，模型品質較高，偏向收藏玩家，線上抽獎模式完善。",
    tags:["模型系","收藏向","線上抽"] },
  { name:"エニマイくじ", name_zh:"Anymy Kuji", company:"Anymy", domain:"anymykuji.com",
    url:"https://anymykuji.com/",
    twitter:"@Anymy_info", twitter_url:"https://x.com/Anymy_info",
    desc:"新興品牌，近期開始與葬送的芙莉蓮等熱門作品合作，成長中。",
    tags:["葬送的芙莉蓮","新興品牌"] },
  { name:"くじメイト", name_zh:"Kujimate（Animate）", company:"Animate", domain:"kujimate.com",
    url:"https://kujimate.com/",
    twitter:"@kujimate", twitter_url:"https://x.com/kujimate",
    desc:"Animate 經營，幾乎全線上抽，女性向作品比例高，BL/乙女常見。",
    tags:["Animate","女性向","線上抽"] },
  { name:"みんなのくじ", name_zh:"大家的抽獎", company:"FuRyu", domain:"charahiroba.com",
    url:"https://charahiroba.com/minkuji/",
    twitter:"@minnanokuji", twitter_url:"https://x.com/minnanokuji",
    desc:"FuRyu 推出，女性向動漫比例高，SSS 系列景品設計精緻，品質口碑佳。",
    tags:["女性向","SSS系列","FuRyu"] },
  { name:"タイトーくじ", name_zh:"TAITO Kuji", company:"Taito", domain:"taito.co.jp",
    url:"https://www.taito.co.jp/taitokuji",
    twitter:"@Taito_Toys", twitter_url:"https://x.com/Taito_Toys",
    desc:"動漫、遊戲作品為主，偶爾推出大型模型獎品，全家便利店為主要通路。",
    tags:["動漫","遊戲","全家便利店"] },
  { name:"セガラッキーくじ", name_zh:"SEGA Lucky Kuji", company:"Sega", domain:"sega.co.jp",
    url:"https://segaplaza.jp/lp/lottery/",
    twitter:"@SegaPrize", twitter_url:"https://x.com/SegaPrize",
    desc:"SEGA 旗下，名偵探柯南、藍色監獄、LoveLive 等作品常見，景品偏向 SEGA PRIZE 風格。",
    tags:["名偵探柯南","藍色監獄","LoveLive"] },
  { name:"DMMくじ", name_zh:"DMM 線上抽獎", company:"DMM", domain:"dmm.com",
    url:"https://kuji.dmm.com/",
    twitter:"@DMM_kuji", twitter_url:"https://x.com/DMM_kuji",
    desc:"純線上平台，品項豐富，成人向及一般向作品皆有。",
    tags:["線上","成人向","一般向"] },
  { name:"DRAW!DRAW!", name_zh:"DRAW!DRAW!", company:"DRAW!DRAW!", domain:"drawdraw.jp",
    url:"https://drawdraw.jp/",
    twitter:"@drawdraw_jp", twitter_url:"https://x.com/drawdraw_jp",
    desc:"線上くじ平台，品項多元，常見熱門動漫 IP 合作。",
    tags:["線上","動漫"] },
  { name:"くじ引き堂", name_zh:"くじ引き堂", company:"Kujibikido", domain:"kujibikido.com",
    url:"https://kujibikido.com/",
    twitter:"@kujibikido", twitter_url:"https://x.com/kujibikido",
    desc:"線上くじ平台，商品種類廣，定期推出新系列。",
    tags:["線上"] },
  { name:"くじラック", name_zh:"Kuji Luck", company:"GEE!STORE", domain:"kujiluck.com",
    url:"https://kujiluck.com/",
    twitter:null,
    desc:"GEE!STORE 旗下，偏向 2.5 次元、舞台、聲優周邊，女性向為主。",
    tags:["2.5次元","聲優","舞台"] },
  { name:"サンリオ当りくじ", name_zh:"三麗鷗抽獎", company:"Sanrio", domain:"sanrio.co.jp",
    url:"https://www.sanrio.co.jp/", twitter:"@sanrioatarikuji",
    twitter_url:"https://x.com/sanrioatarikuji",
    desc:"三麗鷗自家授權，Hello Kitty、大耳狗、布丁狗等全線角色，設計風格統一精緻。",
    tags:["Hello Kitty","大耳狗","布丁狗","Cinnamoroll"] },
  { name:"カプコンくじ", name_zh:"Capcom Kuji", company:"Capcom", domain:"capcom.co.jp",
    url:"https://www.capcom.co.jp/", twitter:"@Capcom_capkuji",
    twitter_url:"https://x.com/Capcom_capkuji",
    desc:"Capcom 官方授權，魔物獵人、惡靈古堡、快打旋風等遊戲 IP 為主。",
    tags:["魔物獵人","惡靈古堡","遊戲"] },
];

const IP_MAP = {
  "ワンピース":    { zh:"航海王",  official:"https://one-piece.com/news/index.html",   twitter:"https://x.com/OPspoiler" },
  "ドラゴンボール": { zh:"七龍珠",  official:"https://dragon-ball-official.com/news/",  twitter:"https://x.com/DB_official_jp" },
  "REBORN!":     { zh:"REBORN!", official:"https://khreborn-anime.jp/",              twitter:"https://x.com/khreborn_anime" },
  "ちいかわ":     { zh:"吉伊卡哇", official:"https://chiikawamarket.jp/blogs/news",    twitter:"https://x.com/anime_chiikawa" },
  "ジョジョ":     { zh:"JOJO",    official:"https://jojo-portal.com/news/",           twitter:"https://x.com/araki_jojo" },
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
function goHome() {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-view="today"]').classList.add("active");
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById("view-today").classList.remove("hidden");
}

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
  const in7  = fmtDate(new Date(now.getTime() + 7*86400000));
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
  html += section("🎲 本日發售", todayItems.length ? todayItems.map(i => itemHTML(i, true)).join("") : empty("本日暫無發售"));
  html += section("📅 本週發售（7日內）", weekItems.length ? weekItems.map(i => itemHTML(i)).join("") : empty("本週暫無發售"));
  html += section("🗓 本月其餘", monthItems.length ? monthItems.slice(0,15).map(i => itemHTML(i)).join("") : empty("本月暫無安排"));
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
  if (key === "unknown") {
    // Show all undated items
    const content = document.getElementById("calendar-content");
    const allItems = getAllItems();
    const undated = allItems.filter(i => !i.date);
    content.innerHTML = `
      <div class="cal-detail">
        <div class="cal-detail-title">📦 発売日未定 全部（${undated.length}件）</div>
        ${undated.map(i => itemHTML(i)).join("")}
      </div>`;
    document.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('.month-btn[data-key="unknown"]')?.classList.add("active");
    return;
  }
  const [y, m] = key.split("-").map(Number);
  calState.year = y; calState.month = m; calState.selectedDate = null;
  renderCalGrid(document.getElementById("calendar-content"));
  document.querySelectorAll(".month-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.month-btn[data-key="${key}"]`)?.classList.add("active");
}

const BRAND_DOT = {
  "一番くじ": "ichiban",
  "みんなのくじ": "minna",
};
function brandDot(brand) {
  return BRAND_DOT[brand] || "other";
}

function renderCalGrid(container) {
  const { year, month, selectedDate } = calState;
  const allItems = getAllItems();
  const todayKey = fmtDate(new Date());
  const monthKey = `${year}-${String(month).padStart(2,"0")}`;

  const dateMap = {};
  allItems.forEach(i => {
    if (i.date) { if (!dateMap[i.date]) dateMap[i.date] = []; dateMap[i.date].push(i); }
  });

  // All items in this calendar month (with date)
  const monthDatedItems = allItems.filter(i => i.date && i.date.startsWith(monthKey));
  // Undated items from this month_key or 発売月未定
  const monthUndatedItems = allItems.filter(i => !i.date && i.month_key === monthKey);
  // みんなのくじ etc with no month set — show under "未定"
  const unknownItems = allItems.filter(i => !i.date && !i.month_key);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay  = new Date(year, month, 0);
  const startDow = firstDay.getDay();

  // Build calendar grid HTML
  let gridHTML = `<div class="cal-grid">
    ${["日","一","二","三","四","五","六"].map(d => `<div class="cal-dow">${d}</div>`).join("")}`;

  for (let i = 0; i < startDow; i++) gridHTML += `<div class="cal-day other-month"></div>`;

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dk = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const items = dateMap[dk] || [];
    const isToday = dk === todayKey;
    const isSelected = dk === selectedDate;
    let cls = "cal-day";
    if (isToday) cls += " today";
    if (isSelected && !isToday) cls += " selected";
    if (items.length) cls += " has-kuji";

    // Unique brand dots
    const dotBrands = [...new Set(items.map(i => i.brand))];
    const dots = dotBrands.length
      ? `<div class="cal-dots">${dotBrands.map(b => `<div class="cal-dot ${brandDot(b)}"></div>`).join("")}</div>`
      : "";

    gridHTML += `<div class="${cls}" onclick="selectCalDay('${dk}')">${d}${dots}</div>`;
  }
  gridHTML += `</div>`;

  // Right panel: kuji list
  const displayItems = selectedDate
    ? (dateMap[selectedDate] || [])
    : monthDatedItems;

  const [, , dd] = (selectedDate || "").split("-");
  const listLabel = selectedDate
    ? `${month}月${parseInt(dd)}日 の くじ`
    : `${year}年${month}月 全部（${monthDatedItems.length}件）`;

  let listHTML = `
    <div class="cal-detail-title">${listLabel}</div>
    ${displayItems.length
      ? displayItems.map(i => itemHTML(i)).join("")
      : `<div class="empty" style="padding:12px 0">暫無くじ</div>`}
  `;

  // Show undated items at bottom
  const undated = [...monthUndatedItems, ...(selectedDate ? [] : unknownItems.slice(0, 20))];
  if (!selectedDate && undated.length) {
    listHTML += `
      <div class="cal-detail-title" style="margin-top:16px">📦 未定日期（${undated.length}件）</div>
      ${undated.map(i => itemHTML(i)).join("")}
    `;
  }

  const calLeft = `
    <div class="generated-at">最後更新：${kujiData.generated_at ? new Date(kujiData.generated_at).toLocaleString("zh-TW") : "—"}</div>
    <div class="cal-header">
      <button class="cal-nav-btn" onclick="changeCalMonth(-1)">‹</button>
      <span class="cal-title">${year}年${month}月</span>
      <button class="cal-nav-btn" onclick="changeCalMonth(1)">›</button>
    </div>
    ${gridHTML}
    <div class="cal-legend">
      <span class="cal-dot ichiban"></span>一番くじ
      <span class="cal-dot minna"></span>みんなのくじ
    </div>
  `;

  container.innerHTML = `
    <div class="cal-layout">
      <div class="cal-left">${calLeft}</div>
      <div class="cal-right cal-detail">${listHTML}</div>
    </div>
  `;
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

function selectCalDay(dk) {
  calState.selectedDate = calState.selectedDate === dk ? null : dk;
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

  let html = section("🎲 相關くじ", ipKuji.length ? ipKuji.map(i => itemHTML(i)).join("") : empty("暫無相關くじ"));

  if (ipNews.length) {
    html += section("📰 最新消息",
      ipNews.map(n => {
        // Prefer pre-translated title_zh from json, fallback to keyword hint
        const nzh = n.title_zh || zhHint(n.title);
        return `
        <a class="news-item" href="${n.url || info.official}" target="_blank" rel="noopener">
          <span class="news-dot"></span>
          <span>
            <div class="news-title">${escHtml(n.title)}</div>
            ${nzh && nzh !== n.title ? `<div class="news-zh">${escHtml(nzh)}</div>` : ""}
          </span>
        </a>`;
      }).join("")
    );
  } else {
    html += section("📰 最新消息", `
      <a class="news-source-link" href="${info.official || '#'}" target="_blank" rel="noopener" style="margin-top:0">
        前往官網查看最新資訊 ↗
      </a>`);
  }

  html += `
    <div class="section-wrap" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
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
    const logoUrl = b.domain
      ? `https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`
      : "";
    const links = [
      b.url  ? `<a class="brand-link" href="${b.url}" target="_blank">官網 ↗</a>` : "",
      b.url2 ? `<a class="brand-link" href="${b.url2}" target="_blank">${b.url2_label || "線上抽"} ↗</a>` : "",
      b.twitter ? `<a class="brand-link twitter" href="${b.twitter_url}" target="_blank">${b.twitter} ↗</a>` : "",
    ].filter(Boolean).join("");
    const tags = (b.tags || []).map(t => `<span class="brand-tag">${escHtml(t)}</span>`).join("");

    html += `
      <div class="brand-card">
        <div class="brand-header">
          <div class="brand-left">
            ${logoUrl ? `<img class="brand-logo" src="${logoUrl}" alt="" onerror="this.style.display='none'">` : ""}
            <div class="brand-name-wrap">
              <div class="brand-name">${escHtml(b.name)}</div>
              <div class="brand-name-zh">${escHtml(b.name_zh)} · ${escHtml(b.company)}</div>
            </div>
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
  const zh = zhHint(item.title);
  const titleBlock = zh
    ? `<span class="kuji-title-wrap"><span class="kuji-title">${escHtml(item.title)}</span><span class="kuji-zh">${escHtml(zh)}</span></span>`
    : `<span class="kuji-title">${escHtml(item.title)}</span>`;
  return `
    <a class="kuji-item${highlight ? " today-release" : ""}" href="${url}" target="_blank" rel="noopener">
      <span class="kuji-date">${day}</span>
      ${titleBlock}
      ${ipTag}
      <span class="kuji-brand">${escHtml(item.brand)}</span>
      <span class="kuji-arrow">↗</span>
    </a>`;
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
