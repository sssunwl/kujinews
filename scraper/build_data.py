"""
Generate docs/data/kuji.json for the KujiUniverse web calendar.
Scrapes kujimap.com month pages + detail pages for release dates.
"""
import json
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}
BASE = "https://kujimap.com"
OUT = Path(__file__).parent.parent / "docs" / "data" / "kuji.json"
OUT_NEWS = Path(__file__).parent.parent / "docs" / "data" / "ip_news.json"

OFFICIAL_DOMAINS = [
    "1kuji.com", "h-kuji.com", "charahiroba.com", "kuji.goodsmile.com",
    "kuji.kotobukiya.co.jp", "anymy.jp", "anymykuji.com",
    "kujibikido.com", "kujiluck-online.com", "scratch.dmm.com",
    "animate-onlineshop.jp", "capcom-capkujionline.com",
    "taito.co.jp/taitokuji", "segaluckykujionline.net", "sega.jp/segaluckykuji",
    "segaplaza.jp", "kuji.aniplex.co.jp",
]
JST = timezone(timedelta(hours=9))

IP_KEYWORDS = {
    "ワンピース":    ["ワンピース", "ONE PIECE", "麦わら"],
    "ドラゴンボール": ["ドラゴンボール", "DRAGON BALL"],
    "REBORN!":     ["リボーン", "REBORN", "家庭教師ヒットマン"],
    "ちいかわ":     ["ちいかわ", "Chiikawa"],
    "ジョジョ":     ["ジョジョ", "JOJO", "JoJo"],
    "ポケモン":     ["ポケモン", "ポケットモンスター", "Pokemon", "POKEMON", "ポケカ"],
    "ジャンプ":     ["ジャンプ", "JUMP FESTA", "ジャンフェス"],
}


def tag_ip(title: str) -> list[str]:
    tags = []
    for ip, keywords in IP_KEYWORDS.items():
        if any(k in title for k in keywords):
            tags.append(ip)
    return tags


def get(url: str) -> Optional[BeautifulSoup]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        return BeautifulSoup(r.content, "lxml")  # bytes → BS4 handles encoding
    except Exception as e:
        print(f"  GET error {url}: {e}")
        return None


def scrape_detail(url: str) -> dict:
    soup = get(url)
    if not soup:
        return {}
    date = None
    for text in soup.find_all(string=re.compile(r"20\d\d年\d+月\d+日")):
        m = re.search(r"(20\d\d)年(\d+)月(\d+)日", text)
        if m:
            date = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
            break
    price = None
    for text in soup.find_all(string=re.compile(r"\d{3}円")):
        m = re.search(r"(\d{3,4})円", text)
        if m:
            price = int(m.group(1))
            break
    official_url = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if any(d in href for d in OFFICIAL_DOMAINS) and "kujimap" not in href:
            official_url = href
            break
    # Extract product-specific og:image (filter out generic site images)
    image_url = None
    GENERIC_IMGS = ["ogp.jpg", "ogp.png", "ogp_new", "summary.jpg", "opengraph", "default_ogp", "banner.png"]
    og_tag = soup.find("meta", property="og:image")
    if og_tag:
        img = og_tag.get("content", "")
        if img and not any(g in img for g in GENERIC_IMGS):
            image_url = img
    return {"date": date, "price": price, "official_url": official_url, "image_url": image_url}


_SUPPORTED_IMG_DOMAINS = ["1kuji.com", "h-kuji.com", "charahiroba.com", "kujibikido.com"]
_GENERIC_IMGS = ["ogp.jpg", "ogp.png", "ogp_new", "default_ogp", "opengraph", "banner.png"]


def get_official_image(official_url: str) -> Optional[str]:
    """Get product-specific image from official page. Only processes known-accessible domains."""
    if not official_url or not any(d in official_url for d in _SUPPORTED_IMG_DOMAINS):
        return None
    soup = get(official_url)
    if not soup:
        return None

    # 1kuji.com: look for top_banner img in assets.1kuji.com
    if "1kuji.com" in official_url:
        for img in soup.find_all("img"):
            src = img.get("src", "")
            if "top_banner" in src and "assets.1kuji.com" in src:
                return src if src.startswith("http") else "https:" + src

    # h-kuji.com / kujibikido.com: og:image is product-specific
    if "h-kuji.com" in official_url or "kujibikido.com" in official_url:
        og = soup.find("meta", property="og:image")
        if og:
            src = og.get("content", "")
            if src and not any(g in src for g in _GENERIC_IMGS):
                return src

    # charahiroba.com (みんなのくじ): lazy-load data-src images
    if "charahiroba.com" in official_url:
        for img in soup.find_all("img"):
            for attr in ("data-src", "src"):
                src = img.get(attr, "")
                if src and "file.charahiroba.com" in src and "trans/contents" in src:
                    return "https:" + src if src.startswith("//") else src

    return None


def scrape_month(year: int, month: int, brand_label: str, brand_slug: str) -> list[dict]:
    url = f"{BASE}/{brand_slug}/{brand_slug}_{year}{month:02d}"
    soup = get(url)
    if not soup:
        return []
    items = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not re.search(rf"/{brand_slug}_{year}{month:02d}/\w+", href):
            continue
        parts = [p for p in href.split("/") if p]
        if len(parts) < 3:
            continue
        title = a.get_text(strip=True)
        if not title or len(title) < 4:
            continue
        if href.startswith("/"):
            href = BASE + href
        uid = parts[-1]
        items.append({
            "id": uid,
            "title": title,
            "brand": brand_label,
            "url": href,
            "month_key": f"{year}-{month:02d}",
            "ip_tags": tag_ip(title),
        })
    seen: set[str] = set()
    return [i for i in items if not (i["id"] in seen or seen.add(i["id"]))]  # type: ignore


def _make_item(uid: str, title: str, url: str, brand: str,
               date: Optional[str] = None, official_url: Optional[str] = None,
               image_url: Optional[str] = None, end_date: Optional[str] = None) -> dict:
    month = date[:7] if date else (end_date[:7] if end_date else None)
    return {"id": uid, "title": title, "brand": brand, "url": url,
            "month_key": month, "ip_tags": tag_ip(title),
            "date": date, "price": None, "official_url": official_url,
            "image_url": image_url, "end_date": end_date}


_PERIOD_DATE = re.compile(r"(20\d\d)年\s*(\d{1,2})月\s*(\d{1,2})日")


def _parse_period(text: str) -> tuple[Optional[str], Optional[str]]:
    """從「販売期間 2026年7月17日(金)12:00～2026年8月23日(日)23:59」抽出 (開始, 結束)。"""
    dates = [f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
             for m in _PERIOD_DATE.finditer(text)]
    if len(dates) >= 2:
        return dates[0], dates[1]
    if len(dates) == 1:
        # 只有一個日期時,「まで」語境視為結束日
        return (None, dates[0]) if "まで" in text else (dates[0], None)
    return None, None


def scrape_happykuji() -> list[dict]:
    print("\n[Happyくじ] listing")
    soup = get("https://www.h-kuji.com/goods/")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/goods/" not in href or href in ("https://www.h-kuji.com/goods/", "https://www.h-kuji.com/goods"):
            continue
        text = a.get_text(strip=True)
        if not text or len(text) < 4:
            continue
        m = re.search(r"(20\d\d)年(\d+)月(\d+)日", text)
        date = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None
        # Extract clean title: remove date and price info
        title = re.sub(r"\d{4}年\d+月\d+日.*$", "", text).strip()
        title = re.sub(r"\d+(\.\d+)?円.*$", "", title).strip()
        title = re.sub(r"\s+", " ", title).strip()
        if not title:
            title = text[:60]
        uid = href.rstrip("/").split("/")[-1]
        if uid in seen:
            continue
        seen.add(uid)
        items.append(_make_item(uid, title, href, "Happyくじ", date, href))
    # Enrich og:image from each h-kuji.com product page
    for item in items:
        img = get_official_image(item["official_url"])
        if img:
            item["image_url"] = img
        time.sleep(0.3)
    return items


def _scrape_kujimap_listing(path: str, link_pattern: str, brand: str) -> list[dict]:
    """共用：從 kujimap 列表頁抓出候選項目（不含日期）。"""
    soup = get(f"{BASE}/{path}")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not re.search(link_pattern, href):
            continue
        title = a.get_text(strip=True)
        if not title or len(title) < 4:
            continue
        if href.startswith("/"):
            href = BASE + href
        uid = href.split("/")[-1]
        if uid in seen:
            continue
        seen.add(uid)
        items.append({
            "id": uid, "title": title, "brand": brand,
            "url": href, "month_key": None, "ip_tags": tag_ip(title),
            "date": None, "price": None, "official_url": None, "image_url": None,
        })
    return items


def _month_hint_from_title(title: str) -> Optional[str]:
    """詳情頁沒有日期時的備案：嘗試從標題裡的「年.月」線索推算 month_key
    （例：「クロミ当りくじ（2022.02）」→ "2022-02"）。只接受「年+月」都明確的格式，
    避免只有年份時用猜的月份污染日曆顯示。"""
    m = re.search(r"(20\d\d)[.．](\d{1,2})", title)
    if m and 1 <= int(m.group(2)) <= 12:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    return None


def _enrich_all(items: list[dict], brand: str) -> list[dict]:
    """走訪每個項目的 KujiMap 詳情頁拿真實日期/官網/圖片 —— 與 みんなのくじ・エニマイくじ
    用的是同一套手法。不在這裡篩選新舊：enrich 後每個項目會有真實 date，
    自然會被分進正確的月份分類，不會再落入「未定」。"""
    print(f"  enriching {len(items)} {brand} items...")
    for item in items:
        detail = scrape_detail(item["url"])
        item["date"] = detail.get("date")
        item["month_key"] = item["date"][:7] if item.get("date") else _month_hint_from_title(item["title"])
        item["official_url"] = detail.get("official_url")
        item["image_url"] = detail.get("image_url")
        if not item["image_url"] and item.get("official_url"):
            item["image_url"] = get_official_image(item["official_url"])
            if item["image_url"]:
                time.sleep(0.3)
        time.sleep(0.3)
    return items


def scrape_segaluck() -> list[dict]:
    """Scrape セガラッキーくじ from kujimap.com/segaluck."""
    print("\n[セガラッキーくじ] listing")
    items = _scrape_kujimap_listing("segaluck", r"/segaluck/sega_", "セガラッキーくじ")
    return _enrich_all(items, "セガラッキーくじ")


def scrape_taito() -> list[dict]:
    """Scrape タイトーくじ from kujimap.com/honpo."""
    print("\n[タイトーくじ] listing")
    items = _scrape_kujimap_listing("honpo", r"/honpo/honpo_", "タイトーくじ")
    return _enrich_all(items, "タイトーくじ")


def scrape_anymykuji() -> list[dict]:
    """Scrape エニマイくじ from kujimap.com/others (anymy_ prefix)."""
    print("\n[エニマイくじ] listing")
    items = _scrape_kujimap_listing("others", r"/others/anymy", "エニマイくじ")
    return _enrich_all(items, "エニマイくじ")


def scrape_kujibikido(max_items: int = 20) -> list[dict]:
    """Scrape くじ引き堂 from kujibikido.com homepage (static HTML)."""
    print("\n[くじ引き堂] listing")
    soup = get("https://kujibikido.com/")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if not re.search(r"/lp/", href):
            continue
        text = a.get_text(strip=True)
        if not text or len(text) < 8:
            continue
        m = re.search(r"(20\d\d)\.(\d+)\.(\d+)", text)
        date = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None
        title = re.sub(r"販売中!+\s*|20\d\d\.\d+\.\d+\(.\).*$", "", text).strip()
        title = re.sub(r"\s+", " ", title).strip()
        if not title or len(title) < 4:
            continue
        if href.startswith(".."):
            href = "https://kujibikido.com/" + href.lstrip("./")
        elif href.startswith("/"):
            href = "https://kujibikido.com" + href
        uid = href.rstrip("/").split("/")[-1]
        if uid in seen:
            continue
        seen.add(uid)
        month_key = date[:7] if date else None
        items.append({
            "id": uid, "title": title, "brand": "くじ引き堂",
            "url": href, "month_key": month_key, "ip_tags": tag_ip(title),
            "date": date, "price": None, "official_url": href, "image_url": None,
        })
        if len(items) >= max_items:
            break
    # Enrich og:image from each LP page
    for item in items:
        img = get_official_image(item["url"])
        if img:
            item["image_url"] = img
        time.sleep(0.35)
    return items


def scrape_capkuji(max_items: int = 20) -> list[dict]:
    """カプくじオンライン(capcom-capkujionline.com)。與くじ引き堂同一套引擎:
    首頁 /lp/ 連結,文字帶「販売中!! ... 2026.8.28(金)まで」→ まで日期是結束日。"""
    print("\n[カプくじ] listing")
    base = "https://capcom-capkujionline.com"
    soup = get(f"{base}/")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/lp/" not in href:
            continue
        text = a.get_text(strip=True)
        if not text or len(text) < 8 or "販売終了" in text:
            continue
        m = re.search(r"(20\d\d)\.(\d+)\.(\d+)", text)
        end_date = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None
        title = re.sub(r"販売中!+\s*|20\d\d\.\d+\.\d+（?\(?.\)?）?\s*まで.*$", "", text).strip()
        title = re.sub(r"\s+", " ", title).strip()
        if not title or len(title) < 4:
            continue
        if href.startswith(".."):
            href = base + "/" + href.lstrip("./")
        elif href.startswith("/"):
            href = base + href
        uid = "capkuji_" + href.rstrip("/").split("/")[-1]
        if uid in seen:
            continue
        seen.add(uid)
        item = _make_item(uid, title, href, "カプくじ", None, href, end_date=end_date)
        # og:image from LP page
        detail = get(href)
        if detail:
            og = detail.find("meta", property="og:image")
            if og and og.get("content"):
                item["image_url"] = og["content"]
        items.append(item)
        time.sleep(0.3)
        if len(items) >= max_items:
            break
    return items


def scrape_kujimate(max_items: int = 20) -> list[dict]:
    """くじメイト(Animate 線上抽)。kujimate.com 網域已死,現在是
    animate-onlineshop.jp 的 corner 頁;詳情頁有「販売期間 X～Y」。"""
    print("\n[くじメイト] listing")
    base = "https://www.animate-onlineshop.jp"
    soup = get(f"{base}/corner/corner.php?corner_id=3992")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for li in soup.select("#related_products li"):
        a = li.select_one("h3 a[href*='/pd/']")
        if not a:
            continue
        title = a.get_text(strip=True)
        title = re.sub(r"^【くじメイト】", "", title).strip()
        if not title or len(title) < 4:
            continue
        href = a["href"]
        if href.startswith("/"):
            href = base + href
        m = re.search(r"/pd/(\d+)/?", href)
        uid = f"kujimate_{m.group(1)}" if m else "kujimate_" + href.split("/")[-2]
        if uid in seen:
            continue
        seen.add(uid)
        img = li.select_one(".item_list_thumb img")
        image_url = img.get("src") if img else None
        items.append(_make_item(uid, title, href, "くじメイト", None, href, image_url))
        if len(items) >= max_items:
            break
    # 詳情頁抽 販売期間(開始+結束)
    print(f"  enriching {len(items)} くじメイト items...")
    for item in items:
        detail = get(item["url"])
        if detail:
            node = detail.find(string=re.compile("販売期間"))
            ctx = ""
            if node and node.parent:
                ctx = node.parent.parent.get_text(" ", strip=True) if node.parent.parent else str(node)
            if not ctx:
                ctx = detail.get_text(" ", strip=True)[:3000]
            start, end = _parse_period(ctx)
            item["date"], item["end_date"] = start, end
            item["month_key"] = start[:7] if start else (end[:7] if end else None)
        time.sleep(0.4)
    return items


def scrape_dmm_scratch(max_items: int = 25) -> list[dict]:
    """DMMスクラッチ(scratch.dmm.com,舊 DMMくじ 線上版後繼)。
    首頁卡片 /kuji/<slug>/,詳情頁有「販売期間:X〜Y」。"""
    print("\n[DMMスクラッチ] listing")
    base = "https://scratch.dmm.com"
    soup = get(f"{base}/")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        m = re.match(r"https://scratch\.dmm\.com/kuji/([\w-]+)/?$", href)
        if not m:
            continue
        block_text = a.get_text(" ", strip=True)
        if "販売終了" in block_text:
            continue
        img = a.find("img")
        title = (img.get("alt", "").strip() if img else "") or block_text
        title = re.sub(r"\s*(販売予定|販売中|NEW)\s*", " ", title).strip()
        title = re.sub(r"\s*20\d\d年\d{1,2}月\d{1,2}日.*$", "", title).strip()
        if not title or len(title) < 4 or "お試し" in title:
            continue
        uid = f"dmmscr_{m.group(1)}"
        if uid in seen:
            continue
        seen.add(uid)
        image_url = None
        if img:
            src = img.get("src", "")
            if "/s3/kuji/" in src:
                image_url = src.split("?")[0] + "?w=586"
        items.append(_make_item(uid, title, href, "DMMスクラッチ", None, href, image_url))
        if len(items) >= max_items:
            break
    print(f"  enriching {len(items)} DMMスクラッチ items...")
    for item in items:
        detail = get(item["url"])
        if detail:
            node = detail.find(string=re.compile("販売期間"))
            ctx = ""
            if node and node.parent:
                parent = node.parent.parent or node.parent
                ctx = parent.get_text(" ", strip=True)
            start, end = _parse_period(ctx)
            item["date"], item["end_date"] = start, end
            item["month_key"] = start[:7] if start else (end[:7] if end else None)
        time.sleep(0.4)
    return items


def scrape_sanrio() -> list[dict]:
    """Scrape サンリオ当りくじ items from kujimap/others (sanrio_ prefix).
    KujiMap 上的サンリオ列表其實是品牌 2012~現在的完整歷史檔案（並非僅近期上架），
    舊版只列標題、從不 enrich，所以全數變成「未定」。改走 enrich 後每個項目會有
    真實日期，會像 みんなのくじ 一樣分別落入各自的歷史月份分類，不再是一整片未定。"""
    print("\n[サンリオ当りくじ] listing")
    items = _scrape_kujimap_listing("others", r"/others/sanrio", "サンリオ当りくじ")
    return _enrich_all(items, "サンリオ当りくじ")


def scrape_goodsmile() -> list[dict]:
    print("\n[グッスマくじ] listing")
    soup = get("https://kuji.goodsmile.com/lineup/")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/products/" not in href:
            continue
        text = a.get_text(strip=True)
        if not text or len(text) < 8:
            continue
        m = re.search(r"(20\d\d)年(\d+)月(\d+)日", text)
        date = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None
        title = re.sub(r"(店頭販売|オンラインくじ|schedule.*|\d{4}年.*)", "", text).strip()
        title = re.sub(r"\s+", " ", title).strip()
        if not title or len(title) < 4:
            continue
        slug = href.rstrip("/").split("/")[-1]
        if slug in seen:
            continue
        seen.add(slug)
        full_url = "https://kuji.goodsmile.com" + href if href.startswith("/") else href
        items.append(_make_item(slug, title, full_url, "グッスマくじ", date, full_url))
    return items


def scrape_kotobukiya() -> list[dict]:
    print("\n[コトブキヤくじ] listing")
    soup = get("https://kuji.kotobukiya.co.jp/index.html")
    if not soup:
        return []
    items = []
    seen: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/lp/" not in href:
            continue
        text = a.get_text(strip=True)
        if not text or len(text) < 6:
            continue
        # Date format: 2026.6.30(火)まで → 這是受付「結束日」不是發售日
        m = re.search(r"(20\d\d)\.(\d+)\.(\d+)", text)
        end_date = f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None
        title = re.sub(r"20\d\d\.\d+\.\d+.*", "", text).strip()
        title = re.sub(r"\s+", " ", title).strip()
        if not title or len(title) < 4:
            continue
        slug = href.rstrip("/").split("/")[-1]
        if slug in seen:
            continue
        seen.add(slug)
        full_url = "https://kuji.kotobukiya.co.jp" + href if href.startswith("/") else href
        items.append(_make_item(slug, title, full_url, "コトブキヤくじ", None, full_url, end_date=end_date))
    return items


def enrich_dates(items: list[dict]) -> list[dict]:
    for item in items:
        print(f"  fetching detail: {item['title'][:40]}")
        detail = scrape_detail(item["url"])
        item["date"] = detail.get("date")
        item["price"] = detail.get("price")
        item["official_url"] = detail.get("official_url")
        item["image_url"] = detail.get("image_url")
        if not item["image_url"] and item.get("official_url"):
            item["image_url"] = get_official_image(item["official_url"])
            if item["image_url"]:
                time.sleep(0.3)
        time.sleep(0.4)
    return items


def main() -> None:
    now = datetime.now(JST)
    months_to_scrape = 6  # current + 5 months ahead

    all_items: list[dict] = []

    for delta in range(months_to_scrape):
        total_months = now.month + delta - 1
        year = now.year + total_months // 12
        month = total_months % 12 + 1
        label = f"{year}年{month}月"
        print(f"\n[{label}] 一番くじ")
        items = scrape_month(year, month, "一番くじ", "1bankuji")
        items = enrich_dates(items)
        all_items += items

        print(f"[{label}] みんなのくじ")
        min_items = scrape_month(year, month, "みんなのくじ", "minkuji")
        # みんなのくじ uses different URL pattern — scrape minkuji listing instead
        # (handled separately below)
        all_items += min_items

    # Other brands
    all_items += scrape_happykuji()
    all_items += scrape_goodsmile()
    all_items += scrape_kotobukiya()
    all_items += scrape_sanrio()
    all_items += scrape_segaluck()
    all_items += scrape_taito()
    all_items += scrape_anymykuji()
    all_items += scrape_kujibikido()
    all_items += scrape_capkuji()
    all_items += scrape_kujimate()
    all_items += scrape_dmm_scratch()

    # みんなのくじ — scrape from kujimap, extract charahiroba official link
    print("\n[みんなのくじ] listing")
    minkuji_new: list[dict] = []
    soup = get(f"{BASE}/minkuji")
    if soup:
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"/minkuji/min_", href):
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 4:
                continue
            if href.startswith("/"):
                href = BASE + href
            uid = href.split("/")[-1]
            if any(i["id"] == uid for i in all_items):
                continue
            # Derive charahiroba URL: min_100 → detail?id=100; others via scrape_detail
            num_m = re.search(r"min_(\d+)$", uid)
            official: Optional[str] = f"https://charahiroba.com/minkuji/lineup/detail?id={num_m.group(1)}" if num_m else None
            minkuji_new.append({
                "id": uid, "title": title, "brand": "みんなのくじ",
                "url": href, "month_key": None, "ip_tags": tag_ip(title),
                "date": None, "price": None, "official_url": official,
            })
    # Enrich dates (also picks up non-numeric official URLs)
    print(f"  enriching {len(minkuji_new)} みんなのくじ items...")
    for item in minkuji_new:
        detail = scrape_detail(item["url"])
        item["date"] = detail.get("date")
        item["month_key"] = item["date"][:7] if item.get("date") else None
        if not item["official_url"]:
            item["official_url"] = detail.get("official_url")
        item["image_url"] = detail.get("image_url")
        if not item["image_url"] and item.get("official_url"):
            item["image_url"] = get_official_image(item["official_url"])
            if item["image_url"]:
                time.sleep(0.3)
        time.sleep(0.3)
    all_items += minkuji_new

    # Sort within each month by date, then by id
    all_items.sort(key=lambda x: (x.get("month_key") or "9999", x.get("date") or "9999", x["id"]))

    # Group by month (new data)
    new_map: dict[str, list] = {}
    for item in all_items:
        key = item.get("month_key") or "unknown"
        new_map.setdefault(key, []).append(item)

    # Load existing data and preserve past months
    current_key = f"{now.year}-{now.month:02d}"
    existing_past: dict[str, list] = {}
    if OUT.exists():
        try:
            old = json.loads(OUT.read_text())
            for m in old.get("months", []):
                if m["key"] != "unknown" and m["key"] < current_key:
                    existing_past[m["key"]] = m["items"]
        except Exception:
            pass

    # Merge: keep past months, update current/future
    merged_map = {**existing_past, **new_map}

    months_out = []
    for key in sorted(merged_map.keys()):
        if key == "unknown":
            label = "発売月未定"
        else:
            y, m_str = key.split("-")
            label = f"{y}年{int(m_str)}月"
        months_out.append({"key": key, "label": label, "items": merged_map[key]})

    data = {
        "generated_at": datetime.now(JST).isoformat(),
        "months": months_out,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"\nSaved {len(all_items)} items to {OUT}")

    # TCG 発売情報 (ポケカ + ワンピカード)
    print("\n[TCG] 抓取中...")
    try:
        import sys as _sys
        _sys.path.insert(0, str(Path(__file__).parent))
        from tcg import build_tcg
        build_tcg()
    except Exception as e:
        print(f"[TCG] error: {e}")

    # Save IP news for web (with translation)
    print("\n[IP新聞] 抓取並翻譯中...")
    import sys, urllib.parse
    sys.path.insert(0, str(Path(__file__).parent))
    from ip_news import fetch_all_news
    raw_news = fetch_all_news(lookback_hours=9999)

    _translate_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    def translate_zh(text: str) -> str:
        try:
            params = {"client": "gtx", "sl": "ja", "tl": "zh-TW", "dt": "t", "q": text}
            r = requests.get("https://translate.googleapis.com/translate_a/single",
                             params=params, headers=_translate_headers, timeout=6)
            data = r.json()
            result = "".join(seg[0] for seg in data[0] if seg[0]).strip()
            return result
        except Exception as e:
            print(f"    translate error: {e}")
            return ""

    ip_news_out: dict = {}
    for item in raw_news:
        src = item.get("source", "")
        title = item.get("title", "")
        title_zh = translate_zh(title) if title else ""
        if title_zh == title:
            title_zh = ""  # no point storing same text
        print(f"  [{src}] {title[:30]} → {title_zh[:30]}")
        ip_news_out.setdefault(src, []).append({
            "title": title,
            "title_zh": title_zh,
            "url": item.get("url", ""),
        })
        time.sleep(0.25)
    OUT_NEWS.write_text(json.dumps(ip_news_out, ensure_ascii=False, indent=2))
    print(f"Saved IP news to {OUT_NEWS}")


if __name__ == "__main__":
    main()
