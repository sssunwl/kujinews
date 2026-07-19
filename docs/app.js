const DATA_URL = "./data/kuji.json";
const NEWS_URL = "./data/ip_news.json";
const TCG_URL  = "./data/tcg.json";

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
  ["セガラッキーくじ","SEGA 幸運賞"],["タイトーくじ","TAITO 賞"],
  ["エニマイくじ","Anymy 賞"],["くじ引き堂","くじ引き堂"],
  ["グッスマくじ","Good Smile 賞"],["コトブキヤくじ","壽屋 賞"],
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
  { name:"グッスマくじ", name_zh:"Good Smile 賞", company:"Good Smile Company", domain:"goodsmile.com",
    url:"https://kuji.goodsmile.com/", url2:"https://kuji.goodsmile.com/en/", url2_label:"英文版",
    twitter:"@GOODSMILEKUJI", twitter_url:"https://x.com/GOODSMILEKUJI",
    desc:"Good Smile 旗下，景品品質高，近年成長快速，初音未來、葬送的芙莉蓮、Persona 常見。",
    tags:["初音未來","排球少年","Persona","葬送的芙莉蓮"] },
  { name:"コトブキヤくじ", name_zh:"壽屋 賞", company:"Kotobukiya", domain:"kotobukiya.co.jp",
    url:"https://kuji.kotobukiya.co.jp/",
    twitter:"@kotobukiya_kuji", twitter_url:"https://x.com/kotobukiya_kuji",
    desc:"壽屋旗下，模型品質較高，偏向收藏玩家，線上抽獎模式完善。",
    tags:["模型系","收藏向","線上抽"] },
  { name:"エニマイくじ", name_zh:"Anymy 賞", company:"Anymy", domain:"anymykuji.com",
    url:"https://anymykuji.com/",
    twitter:"@Anymy_info", twitter_url:"https://x.com/Anymy_info",
    desc:"新興品牌，近期開始與葬送的芙莉蓮等熱門作品合作，成長中。",
    tags:["葬送的芙莉蓮","新興品牌"] },
  { name:"くじメイト", name_zh:"Kujimate（Animate 旗下）", company:"Animate", domain:"animate-onlineshop.jp",
    url:"https://www.animate-onlineshop.jp/corner/corner.php?corner_id=3992",
    twitter:"@kujimate", twitter_url:"https://x.com/kujimate",
    desc:"Animate 經營，幾乎全線上抽，女性向作品比例高，BL/乙女常見。現於 Animate 通販站內營運。",
    tags:["Animate","女性向","線上抽"] },
  { name:"アニプレックス オンラインくじ", name_zh:"Aniplex 線上抽", company:"Aniplex", domain:"aniplex.co.jp",
    url:"https://kuji.aniplex.co.jp/",
    twitter:"@aniplex_plus", twitter_url:"https://x.com/aniplex_plus",
    desc:"Aniplex 官方線上抽，鬼滅之刃等 Aniplex 系作品限定企劃，不定期開催。",
    tags:["鬼滅之刃","Aniplex","線上抽"] },
  { name:"みんなのくじ", name_zh:"大家的抽獎", company:"FuRyu", domain:"charahiroba.com",
    url:"https://charahiroba.com/minkuji/",
    twitter:"@minnanokuji", twitter_url:"https://x.com/minnanokuji",
    desc:"FuRyu 推出，女性向動漫比例高，SSS 系列景品設計精緻，品質口碑佳。",
    tags:["女性向","SSS系列","FuRyu"] },
  { name:"タイトーくじ", name_zh:"TAITO 賞", company:"Taito", domain:"taito.co.jp",
    url:"https://www.taito.co.jp/taitokuji",
    twitter:"@Taito_Toys", twitter_url:"https://x.com/Taito_Toys",
    desc:"動漫、遊戲作品為主，偶爾推出大型模型獎品，全家便利店為主要通路。",
    tags:["動漫","遊戲","全家便利店"] },
  { name:"セガラッキーくじ", name_zh:"SEGA 幸運賞", company:"Sega", domain:"sega.co.jp",
    url:"https://segaplaza.jp/lp/lottery/",
    twitter:"@SegaPrize", twitter_url:"https://x.com/SegaPrize",
    desc:"SEGA 旗下，名偵探柯南、藍色監獄、LoveLive 等作品常見，景品偏向 SEGA PRIZE 風格。",
    tags:["名偵探柯南","藍色監獄","LoveLive"] },
  { name:"DMMスクラッチ", name_zh:"DMM 刮刮樂抽獎", company:"DMM", domain:"dmm.com",
    url:"https://scratch.dmm.com/",
    twitter:"@DMM_kuji", twitter_url:"https://x.com/DMM_kuji",
    desc:"DMM 線上刮刮樂式抽獎（舊 DMM くじ線上版後繼），動漫、VTuber、偶像品項豐富。",
    tags:["線上","VTuber","動漫"] },
  { name:"くじ引き堂", name_zh:"抽獎堂", company:"Kujibikido", domain:"kujibikido.com",
    url:"https://kujibikido.com/",
    twitter:"@kujibikido", twitter_url:"https://x.com/kujibikido",
    desc:"線上くじ平台，商品種類廣，定期推出新系列。",
    tags:["線上"] },
  { name:"くじラックオンライン", name_zh:"Kuji Luck", company:"GEE!STORE", domain:"kujiluck-online.com",
    url:"https://kujiluck-online.com/",
    twitter:"@kujiluck_online", twitter_url:"https://x.com/kujiluck_online",
    desc:"GEE!STORE 旗下，偏向 2.5 次元、舞台、聲優周邊，女性向為主。",
    tags:["2.5次元","聲優","舞台"] },
  { name:"サンリオ当りくじ", name_zh:"三麗鷗抽獎", company:"Sanrio", domain:"sanrio.co.jp",
    url:"https://www.sanrio.co.jp/", twitter:"@sanrioatarikuji",
    twitter_url:"https://x.com/sanrioatarikuji",
    desc:"三麗鷗自家授權，Hello Kitty、大耳狗、布丁狗等全線角色，設計風格統一精緻。",
    tags:["Hello Kitty","大耳狗","布丁狗","Cinnamoroll"] },
  { name:"カプくじオンライン", name_zh:"Capcom 線上抽", company:"Capcom", domain:"capcom-capkujionline.com",
    url:"https://capcom-capkujionline.com/", twitter:"@Capcom_capkuji",
    twitter_url:"https://x.com/Capcom_capkuji",
    desc:"Capcom 官方線上抽，逆轉裁判、大神、魔物獵人等遊戲 IP 為主。",
    tags:["逆轉裁判","魔物獵人","遊戲","線上抽"] },
];

const IP_MAP = {
  "バンダイ":      { zh:"萬代",    official:"https://1kuji.com/",                      twitter:"https://x.com/ichibanKUJI",
                    newsKey:"バンダイ", note:"一番くじ皆為 BANDAI SPIRITS 出品,此頁列出全部一番くじ近期品項。" },
  "ジャンプ":      { zh:"Jump",    official:"https://www.shonenjump.com/j/",           twitter:"https://x.com/jump_henshubu",
                    newsKey:"ジャンプ", note:"週刊少年ジャンプ相關情報 — 注意特定期數不時附贈 ONE PIECE 卡/遊戲王卡等特典。" },
  "ワンピース":    { zh:"航海王",  official:"https://one-piece.com/news/index.html",   twitter:"https://x.com/OPspoiler" },
  "ポケモン":      { zh:"寶可夢",  official:"https://www.pokemon-card.com/products/",  twitter:"https://x.com/pokemon_cojp",
                    newsKey:"ポケカ" },
  "ドラゴンボール": { zh:"七龍珠",  official:"https://dragon-ball-official.com/news/",  twitter:"https://x.com/DB_official_jp" },
  "REBORN!":     { zh:"REBORN!", official:"https://khreborn-anime.jp/",              twitter:"https://x.com/khreborn_anime" },
  "ちいかわ":     { zh:"吉伊卡哇", official:"https://chiikawa-online.jp/",            twitter:"https://x.com/anime_chiikawa" },
  "ジョジョ":     { zh:"JOJO",    official:"https://jojo-portal.com/news/",           twitter:"https://x.com/araki_jojo" },
};

// 舊資料 ip_tags 還沒含新 IP 時的前端備援關鍵字
const IP_TITLE_KEYWORDS = {
  "ポケモン": ["ポケモン","ポケットモンスター","Pokemon","POKEMON","ポケカ"],
  "ジャンプ": ["ジャンプ","JUMP FESTA","ジャンフェス"],
};

// くじ購買通路提示(展開面板用)
const BRAND_BUY = {
  "一番くじ":       { note:"便利商店(Lawson/全家)、書店、動漫店販售;部分品項可官網線上抽", online:"https://online.1kuji.com/", online_label:"一番くじONLINE" },
  "みんなのくじ":    { note:"全家/Lawson 門市販售;官網可線上抽", online:"https://charahiroba.com/minkuji/", online_label:"線上抽" },
  "Happyくじ":     { note:"7-11、イトーヨーカドー等通路販售", online:"https://www.h-kuji.com/", online_label:"官網" },
  "グッスマくじ":    { note:"官網線上抽為主", online:"https://kuji.goodsmile.com/", online_label:"線上抽" },
  "コトブキヤくじ":  { note:"官網線上抽為主", online:"https://kuji.kotobukiya.co.jp/", online_label:"線上抽" },
  "セガラッキーくじ": { note:"GiGO 等遊戲中心、量販店販售", online:"https://segaplaza.jp/lp/lottery/", online_label:"官網" },
  "タイトーくじ":    { note:"全家便利店、タイトー店舖販售", online:"https://www.taito.co.jp/taitokuji", online_label:"官網" },
  "エニマイくじ":    { note:"官網線上抽", online:"https://anymykuji.com/", online_label:"線上抽" },
  "くじ引き堂":     { note:"官網線上抽", online:"https://kujibikido.com/", online_label:"線上抽" },
  "サンリオ当りくじ": { note:"便利商店、三麗鷗門市販售" },
  "カプくじ":       { note:"Capcom 官方線上抽,遊戲 IP 為主", online:"https://capcom-capkujionline.com/", online_label:"線上抽" },
  "くじメイト":     { note:"Animate 線上抽,女性向作品比例高", online:"https://www.animate-onlineshop.jp/corner/corner.php?corner_id=3992", online_label:"線上抽" },
  "DMMスクラッチ":  { note:"DMM 線上刮刮樂式抽獎,動漫/VTuber/偶像 IP 多", online:"https://scratch.dmm.com/", online_label:"線上抽" },
  "ポケカ":        { note:"寶可夢中心、量販店、卡牌專門店販售", online:"https://www.pokemoncenter-online.com/", online_label:"寶可夢中心Online" },
  "ワンピカード":    { note:"TCG 取扱店、動漫店販售;限定品走 P-Bandai", online:"https://p-bandai.jp/", online_label:"Premium Bandai" },
};

let kujiData = null;
let newsData = null;
let tcgData  = null;
let currentIP = "バンダイ";
let currentGame = "pokemon";
let calState = { year: 0, month: 0, selectedDate: null, filter: "all" };

// ── Init ──────────────────────────────────────────────
async function init() {
  initStars();
  const now = new Date();
  calState.year = now.getFullYear();
  calState.month = now.getMonth() + 1;
  await Promise.all([loadData(), loadNews(), loadTcg()]);
  setupNav();
  renderToday();
  setupIPTabs();
  setupTCGTabs();
  setupCalFilter();
  renderBrands();
}

function setupCalFilter() {
  document.querySelectorAll("#cal-filter .filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#cal-filter .filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      calState.filter = btn.dataset.filter;
      renderCalGrid(document.getElementById("calendar-content"));
    });
  });
}

function calFilteredItems() {
  const all = getAllItems();
  if (calState.filter === "kuji") return all.filter(i => !i._tcg);
  if (calState.filter === "tcg")  return all.filter(i => i._tcg);
  return all;
}

function initStars() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;';
  document.body.prepend(canvas);
  let stars = [], raf;
  const resize = () => {
    canvas.width = innerWidth; canvas.height = innerHeight;
    stars = Array.from({length:220}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.2+0.2, base: Math.random()*0.45+0.15,
      spd: Math.random()*0.004+0.001, ph: Math.random()*Math.PI*2,
    }));
  };
  const draw = t => {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    stars.forEach(s => {
      const op = s.base + Math.sin(t*0.001*s.spd*1000+s.ph)*0.25;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0,op)})`; ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  };
  resize(); window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); requestAnimationFrame(draw); });
  requestAnimationFrame(draw);
}

async function loadData() {
  try { kujiData = await (await fetch(DATA_URL)).json(); }
  catch { kujiData = { months: [], generated_at: null }; }
}

async function loadNews() {
  try { newsData = await (await fetch(NEWS_URL)).json(); }
  catch { newsData = {}; }
}

async function loadTcg() {
  try { tcgData = await (await fetch(TCG_URL)).json(); }
  catch { tcgData = { pokemon: [], onepiece: [] }; }
}

// TCG 商品轉成 kuji item 形狀,融入年曆/本日/IP 視圖
function tcgItems() {
  const conv = (arr, brand, tags) => (arr || []).map(p => ({
    id: p.id, title: p.title, brand,
    url: p.url, official_url: p.buy_url || p.url,
    month_key: p.month_key, date: p.date,
    image_url: p.image_url, ip_tags: tags,
    _tcg: true, _category: p.category, _price: p.price, _date_raw: p.date_raw,
  }));
  return [
    ...conv(tcgData?.pokemon, "ポケカ", ["ポケモン"]),
    ...conv(tcgData?.onepiece, "ワンピカード", ["ワンピース"]),
  ];
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
      if (view === "tcg") renderTCG(currentGame);
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
  const liveItems = allItems.filter(isLive).sort((a, b) => a.end_date < b.end_date ? -1 : 1).slice(0, 15);
  if (liveItems.length) html += section("🎰 線上抽受付中（依截止日排序）", liveItems.map(i => itemHTML(i)).join(""));
  html += section("📅 本週發售（7日內）", weekItems.length ? weekItems.map(i => itemHTML(i)).join("") : empty("本週暫無發售"));
  html += section("🗓 本月其餘", monthItems.length ? monthItems.slice(0,15).map(i => itemHTML(i)).join("") : empty("本月暫無安排"));
  content.innerHTML = html;
}

// ── Calendar View ─────────────────────────────────────
function renderCalendar() {
  const months = kujiData.months || [];
  const content = document.getElementById("calendar-content");

  // Build year → months map from data (2025+ only)
  const yearSet = new Set();
  months.forEach(m => { if (m.key !== "unknown") yearSet.add(m.key.split("-")[0]); });
  const years = [...yearSet].sort().filter(y => parseInt(y) >= 2025);

  // Year nav
  const yearNav = document.getElementById("year-nav");
  yearNav.innerHTML = years.map(y =>
    `<button class="year-btn" data-year="${y}" onclick="selectCalYear('${y}')">${y}年</button>`
  ).join("") +
  `<button class="month-btn" data-key="unknown" onclick="jumpToCalMonth('unknown')">未定</button>`;

  // Month: 6×2 grid with "X月"
  const monthGrid = document.getElementById("month-grid");
  monthGrid.innerHTML = Array.from({length:12}, (_,i) => {
    const mn = i + 1;
    return `<button class="month-num-btn" data-month="${mn}" onclick="selectCalMonth(${mn})">${mn}月</button>`;
  }).join("");

  renderCalGrid(content);
  highlightCalSelectors();
}

function selectCalYear(year) {
  calState.year = parseInt(year);
  calState.selectedDate = null;
  renderCalGrid(document.getElementById("calendar-content"));
  highlightCalSelectors();
  scrollToCalTop();
}

function selectCalMonth(month) {
  calState.month = month;
  calState.selectedDate = null;
  renderCalGrid(document.getElementById("calendar-content"));
  highlightCalSelectors();
  scrollToCalTop();
}

function scrollToCalTop() {
  const content = document.getElementById("calendar-content");
  if (!content) return;
  const top = content.getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function highlightCalSelectors() {
  document.querySelectorAll(".year-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.year === String(calState.year));
  });
  document.querySelectorAll("#month-grid .month-num-btn").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.month) === calState.month);
  });
}

function jumpToCalMonth(key) {
  if (key === "unknown") {
    // Show all undated items
    const content = document.getElementById("calendar-content");
    const allItems = calFilteredItems();
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
  "一番くじ":       "ichiban",
  "みんなのくじ":    "minna",
  "Happyくじ":     "happy",
  "グッスマくじ":    "gsm",
  "コトブキヤくじ":  "koto",
  "セガラッキーくじ": "sega",
  "タイトーくじ":    "taito",
  "エニマイくじ":    "anymy",
  "くじ引き堂":     "bikido",
  "カプくじ":       "capkuji",
  "くじメイト":     "mate",
  "DMMスクラッチ":  "dmmscr",
  "ポケカ":        "pkm",
  "ワンピカード":    "opc",
};
function brandDot(brand) {
  return BRAND_DOT[brand] || "other";
}

const LEGEND_KUJI = [
  ["ichiban","一番くじ"],["minna","みんなのくじ"],["happy","Happyくじ"],
  ["gsm","グッスマくじ"],["koto","コトブキヤくじ"],["sega","セガラッキーくじ"],
  ["taito","タイトーくじ"],["anymy","エニマイくじ"],["bikido","くじ引き堂"],
  ["capkuji","カプくじ"],["mate","くじメイト"],["dmmscr","DMMスクラッチ"],
];
const LEGEND_TCG = [["pkm","ポケカ"],["opc","ワンピカード"]];

function calLegendHTML() {
  const entries = calState.filter === "tcg" ? LEGEND_TCG
    : calState.filter === "kuji" ? [...LEGEND_KUJI, ["other","その他"]]
    : [...LEGEND_KUJI, ...LEGEND_TCG, ["other","その他"]];
  return entries.map(([cls, label]) => `<span><div class="cal-dot ${cls}"></div>${label}</span>`).join("");
}

function renderCalGrid(container) {
  const { year, month, selectedDate } = calState;
  const allItems = calFilteredItems();
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
    ? `${month}月${parseInt(dd)}日`
    : `${year}年${month}月 全部（${monthDatedItems.length}件）`;

  // くじ / 卡牌 分區顯示
  const kujiPart = displayItems.filter(i => !i._tcg);
  const tcgPart  = displayItems.filter(i => i._tcg);
  const emptyRow = msg => `<div class="empty" style="padding:12px 0">${msg}</div>`;
  let bodyHTML = "";
  if (calState.filter === "all") {
    bodyHTML += `<div class="cal-sub-label">🎲 くじ（${kujiPart.length}件）</div>`;
    bodyHTML += kujiPart.length ? kujiPart.map(i => itemHTML(i)).join("") : emptyRow("暫無くじ");
    bodyHTML += `<div class="cal-sub-label">🃏 卡牌（${tcgPart.length}件）</div>`;
    bodyHTML += tcgPart.length ? tcgPart.map(i => itemHTML(i)).join("") : emptyRow("暫無卡牌商品");
  } else {
    bodyHTML += displayItems.length
      ? displayItems.map(i => itemHTML(i)).join("")
      : emptyRow(calState.filter === "tcg" ? "暫無卡牌商品" : "暫無くじ");
  }

  let listHTML = `
    <div class="cal-detail-title">${listLabel}</div>
    ${bodyHTML}
  `;

  // Show undated items — collapsible, default collapsed, always visible
  const undated = [...monthUndatedItems, ...unknownItems.slice(0, 60)];
  if (undated.length) {
    listHTML += `
      <div class="undated-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('hidden')">
        <span>📦 未定日期（${undated.length}件）</span>
        <span class="undated-arrow">▸</span>
      </div>
      <div class="undated-body hidden">${undated.map(i => itemHTML(i)).join("")}</div>
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
    <div class="cal-legend">${calLegendHTML()}</div>
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
  renderCalGrid(document.getElementById("calendar-content"));
  highlightCalSelectors();
}

function selectCalDay(dk) {
  calState.selectedDate = calState.selectedDate === dk ? null : dk;
  renderCalGrid(document.getElementById("calendar-content"));
}

// ── IP View ───────────────────────────────────────────
function setupIPTabs() {
  document.querySelectorAll("#ip-tabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#ip-tabs .tab-btn").forEach(b => b.classList.remove("active"));
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
  const todayKey = fmtDate(new Date());
  let ipKuji;
  if (ip === "バンダイ") {
    // 萬代 = BANDAI SPIRITS 全部一番くじ:顯示未來檔期+近期未定
    ipKuji = allItems.filter(i => i.brand === "一番くじ" && (!i.date || i.date >= todayKey));
  } else {
    const kw = IP_TITLE_KEYWORDS[ip] || [];
    ipKuji = allItems.filter(i =>
      i.ip_tags?.includes(ip) || kw.some(k => (i.title || "").includes(k)));
  }
  const newsKey = info.newsKey || ip;
  const ipNews = (newsData[newsKey] || []).slice(0, 15);

  let html = info.note ? `<div class="ip-note">${escHtml(info.note)}</div>` : "";
  html += section("🎲 相關くじ・商品", ipKuji.length ? ipKuji.slice(0, 40).map(i => itemHTML(i)).join("") : empty("暫無相關くじ"));

  if (ipNews.length) {
    html += section("📰 最新消息",
      ipNews.map(n => {
        const nzh = n.title_zh || zhHint(n.title) || "";
        const url = n.url || info.official || "#";
        const mainTitle = (nzh && nzh !== n.title) ? nzh : n.title;
        const jpSub = (nzh && nzh !== n.title) ? n.title : "";
        return `
        <a class="news-item" href="${url}" target="_blank" rel="noopener">
          <span class="news-dot"></span>
          <span>
            <div class="news-title-zh">${escHtml(mainTitle)}</div>
            ${jpSub ? `<div class="news-title-jp"><a class="news-jp-link" href="${url}" target="_blank" rel="noopener">${escHtml(jpSub)} ↗</a></div>` : ""}
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

// ── TCG View ──────────────────────────────────────────
const TCG_INFO = {
  pokemon: {
    label: "Pokémon 卡", jp: "ポケモンカードゲーム", newsKey: "ポケカ",
    links: [
      { label:"官方商品頁", url:"https://www.pokemon-card.com/products/" },
      { label:"寶可夢中心 Online(預購/抽選)", url:"https://www.pokemoncenter-online.com/" },
      { label:"Amazon.co.jp 搜尋", url:"https://www.amazon.co.jp/s?k=ポケモンカード" },
      { label:"楽天ブックス", url:"https://books.rakuten.co.jp/search?g=009&sitem=ポケモンカード" },
    ],
    buyNote: "日本購買通路:寶可夢中心(門市/Online 抽選)、量販店(ヨドバシ/ビックカメラ)、便利商店、卡牌專門店。熱門彈數多為抽選制,留意寶可夢中心 Online 的抽選申込期間。",
  },
  onepiece: {
    label: "ONE PIECE 卡", jp: "ONE PIECEカードゲーム", newsKey: "ワンピカード",
    links: [
      { label:"官方商品頁", url:"https://www.onepiece-cardgame.com/products/" },
      { label:"Premium Bandai(限定/預購)", url:"https://p-bandai.jp/chara/c0187/" },
      { label:"Amazon.co.jp 搜尋", url:"https://www.amazon.co.jp/s?k=ワンピースカードゲーム" },
      { label:"楽天ブックス", url:"https://books.rakuten.co.jp/search?g=009&sitem=ワンピースカード" },
    ],
    buyNote: "日本購買通路:TCG 取扱店、動漫店(アニメイト等)、量販店、便利商店;會場限定品在 JUMP FESTA/ONE PIECE DAY 等活動販售,官網限定走 Premium Bandai。",
  },
};

function setupTCGTabs() {
  document.querySelectorAll("#tcg-tabs .tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#tcg-tabs .tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentGame = btn.dataset.game;
      renderTCG(currentGame);
    });
  });
}

function tcgCardHTML(p) {
  const dateLabel = p.date
    ? `${parseInt(p.date.split("-")[1])}月${parseInt(p.date.split("-")[2])}日`
    : (p.date_raw || (p.month_key ? `${parseInt(p.month_key.split("-")[1])}月` : "未定"));
  const zh = zhHint(p.title);
  const links = [
    `<a class="brand-link" href="${escHtml(p.url)}" target="_blank" rel="noopener">商品頁 ↗</a>`,
    p.buy_url ? `<a class="brand-link" href="${escHtml(p.buy_url)}" target="_blank" rel="noopener">預購/購買 ↗</a>` : "",
    `<a class="brand-link" href="https://jp.mercari.com/search?keyword=${encodeURIComponent(p.title.slice(0,40))}" target="_blank" rel="noopener">Mercari行情 ↗</a>`,
  ].filter(Boolean).join("");
  return `
    <div class="tcg-card">
      ${p.image_url ? `<a href="${escHtml(p.url)}" target="_blank" rel="noopener"><img class="tcg-thumb" src="${escHtml(p.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'"></a>` : ""}
      <div class="tcg-body">
        <div class="tcg-meta">
          <span class="kuji-date">${escHtml(dateLabel)}</span>
          <span class="kuji-brand">${escHtml(p.category || "")}</span>
          ${p.price ? `<span class="tcg-price">${escHtml(p.price)}</span>` : ""}
        </div>
        <div class="kuji-title-main">${escHtml(zh || p.title)}</div>
        ${zh ? `<div class="kuji-title-sub">${escHtml(p.title)}</div>` : ""}
        <div class="tcg-links">${links}</div>
      </div>
    </div>`;
}

function renderTCG(game) {
  const content = document.getElementById("tcg-content");
  const info = TCG_INFO[game];
  const items = (tcgData?.[game] || []).slice();
  const todayKey = fmtDate(new Date());
  const thisMonth = todayKey.slice(0, 7);

  const upcoming = items
    .filter(p => (p.date && p.date >= todayKey) || (!p.date && p.month_key && p.month_key >= thisMonth))
    .sort((a, b) => (a.date || (a.month_key + "-99")) < (b.date || (b.month_key + "-99")) ? -1 : 1);
  const released = items
    .filter(p => p.date && p.date < todayKey)
    .sort((a, b) => a.date < b.date ? 1 : -1)
    .slice(0, 12);
  const tbd = items.filter(p => !p.date && !p.month_key);

  const updStr = tcgData?.generated_at ? new Date(tcgData.generated_at).toLocaleString("zh-TW") : "—";
  const news = (newsData[info.newsKey] || []).slice(0, 10);

  let html = `
    <div class="today-header">
      <div class="today-date">${escHtml(info.label)} 発売カレンダー</div>
      <div class="today-sub">${escHtml(info.jp)} · 資料最後更新:${updStr}</div>
    </div>
    <div class="ip-note">${escHtml(info.buyNote)}</div>
  `;
  html += section("🔜 即將發售・預購中", upcoming.length ? upcoming.map(tcgCardHTML).join("") : empty("暫無已公開的新商品"));
  if (tbd.length) html += section("📦 発売日未定", tbd.map(tcgCardHTML).join(""));
  html += section("🛒 購買・預購入口", `<div class="section-wrap" style="display:flex;gap:8px;flex-wrap:wrap;margin:0">
    ${info.links.map(l => `<a class="news-source-link" style="margin-top:0" href="${escHtml(l.url)}" target="_blank" rel="noopener">${escHtml(l.label)} ↗</a>`).join("")}
  </div>`);
  html += section("📰 最新消息", news.length ? news.map(n => {
    const nzh = n.title_zh || zhHint(n.title) || "";
    const mainTitle = (nzh && nzh !== n.title) ? nzh : n.title;
    const jpSub = (nzh && nzh !== n.title) ? n.title : "";
    return `<a class="news-item" href="${escHtml(n.url)}" target="_blank" rel="noopener">
      <span class="news-dot"></span>
      <span><div class="news-title-zh">${escHtml(mainTitle)}</div>
      ${jpSub ? `<div class="news-title-jp">${escHtml(jpSub)}</div>` : ""}</span>
    </a>`;
  }).join("") : empty("暫無新聞"));
  if (released.length) html += section("📅 近期已發售", released.map(tcgCardHTML).join(""));
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
  return [...(kujiData.months || []).flatMap(m => m.items || []), ...tcgItems()];
}

function fmtMD(iso) {
  return `${parseInt(iso.split("-")[1])}月${parseInt(iso.split("-")[2])}日`;
}

// 線上抽「受付中」:結束日還沒過,且已開賣(或開賣日未知)
function isLive(item) {
  const t = fmtDate(new Date());
  return !!item.end_date && item.end_date >= t && (!item.date || item.date <= t);
}

function itemHTML(item, highlight = false) {
  const d = item.date;
  const dayLabel = d ? fmtMD(d) : (item.end_date ? `〜${fmtMD(item.end_date)}` : "—");
  const url = item.official_url || item.url || "#";
  const zh = zhHint(item.title);
  const displayTitle = zh || item.title;
  const hasImage = !!item.image_url;
  const uid = item.id || Math.random().toString(36).slice(2);
  const panelId = `ep-${uid}`;

  const subLine = zh
    ? `<a class="kuji-jp-link" href="${url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escHtml(item.title)} ↗</a>`
    : "";

  return `
    <div class="kuji-wrap">
      <div class="kuji-item${highlight ? " today-release" : ""}" onclick="toggleExpand('${panelId}',this.querySelector('.kuji-expand-btn'))">
        <span class="kuji-date">${dayLabel}</span>
        <span class="kuji-title-wrap">
          <span class="kuji-title-main">${escHtml(displayTitle)}</span>
          ${subLine ? `<span class="kuji-title-sub">${subLine}</span>` : ""}
        </span>
        ${isLive(item) ? `<span class="kuji-live">受付中</span>` : ""}
        <span class="kuji-brand">${escHtml(item.brand)}</span>
        <button class="kuji-expand-btn" title="展開">▾</button>
      </div>
      <div class="kuji-expand-panel hidden" id="${panelId}">
        ${hasImage
          ? `<a href="${url}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><img src="${escHtml(item.image_url)}" alt="${escHtml(displayTitle)}" loading="lazy" referrerpolicy="no-referrer"></a>`
          : `<a class="kuji-view-btn" href="${url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">→ 點此查看官網</a>`}
        ${expandExtras(item, url)}
      </div>
    </div>`;
}

// 展開面板:購買通路提示 + 官網/線上抽 + 二手行情搜尋
function expandExtras(item, url) {
  const buy = BRAND_BUY[item.brand];
  const q = encodeURIComponent((item.title || "").replace(/\s+/g, " ").slice(0, 40));
  const links = [
    `<a class="brand-link" href="${url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">官網/詳情 ↗</a>`,
    buy?.online ? `<a class="brand-link" href="${escHtml(buy.online)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escHtml(buy.online_label || "線上抽")} ↗</a>` : "",
    `<a class="brand-link" href="https://jp.mercari.com/search?keyword=${q}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Mercari行情 ↗</a>`,
    `<a class="brand-link" href="https://auctions.yahoo.co.jp/search/search?p=${q}" target="_blank" rel="noopener" onclick="event.stopPropagation()">ヤフオク行情 ↗</a>`,
  ].filter(Boolean).join("");
  return `
    <div class="expand-extras" onclick="event.stopPropagation()">
      ${buy?.note ? `<div class="expand-buy-note">🛒 ${escHtml(buy.note)}</div>` : ""}
      ${item.end_date ? `<div class="expand-buy-note">🗓 ${item.date ? escHtml(fmtMD(item.date)) : "販售中"} 〜 ${escHtml(fmtMD(item.end_date))}${isLive(item) ? "(受付中)" : ""}</div>` : ""}
      ${item._price ? `<div class="expand-buy-note">💴 ${escHtml(item._price)}${item._date_raw ? ` · 発売:${escHtml(item._date_raw)}` : ""}</div>` : ""}
      <div class="expand-links">${links}</div>
    </div>`;
}

function toggleExpand(panelId, btn) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const open = panel.classList.toggle("hidden") === false;
  btn.classList.toggle("open", open);
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
