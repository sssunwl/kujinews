import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}
BASE = "https://kujimap.com"

# 抓當月 + 未來兩個月的一番くじ月份頁面
def _month_urls() -> list[tuple[str, str]]:
    now = datetime.now(timezone(timedelta(hours=9)))
    urls = []
    for delta in range(3):
        year = now.year + (now.month + delta - 1) // 12
        month = (now.month + delta - 1) % 12 + 1
        slug = f"1bankuji_{year}{month:02d}"
        urls.append((f"{BASE}/1bankuji/{slug}", "一番くじ"))
    return urls


def _scrape_month_page(url: str, label: str) -> list[dict]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            # 具體くじ項目的連結格式：/.../1bankuji_XXXXXX（含子路徑）
            if not re.search(r"/(1bankuji|minkuji|min)_\d{4,}", href):
                continue
            # 排除月份分類頁（只有兩層路徑）
            parts = [p for p in href.split("/") if p]
            if len(parts) < 3:
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 4:
                continue
            if href.startswith("/"):
                href = BASE + href
            uid = parts[-1]
            items.append({"uid": uid, "title": title, "url": href, "brand": label})
        return items
    except Exception as e:
        print(f"[kuji] {label} {url} error: {e}")
        return []


def _scrape_minkuji() -> list[dict]:
    try:
        resp = requests.get(f"{BASE}/minkuji", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"/minkuji/min_\d+", href):
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 4:
                continue
            if href.startswith("/"):
                href = BASE + href
            uid = href.split("/")[-1]
            items.append({"uid": uid, "title": title, "url": href, "brand": "みんなのくじ"})
        return items
    except Exception as e:
        print(f"[kuji] みんなのくじ error: {e}")
        return []


def _scrape_others() -> list[dict]:
    try:
        resp = requests.get(f"{BASE}/others", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/others/" not in href:
                continue
            parts = [p for p in href.split("/") if p]
            if len(parts) < 2:
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 4:
                continue
            if href.startswith("/"):
                href = BASE + href
            uid = parts[-1]
            items.append({"uid": uid, "title": title, "url": href, "brand": "その他くじ"})
        return items
    except Exception as e:
        print(f"[kuji] その他 error: {e}")
        return []


def fetch_kuji_listings() -> list[dict]:
    items = []
    for url, label in _month_urls():
        items += _scrape_month_page(url, label)
    items += _scrape_minkuji()
    items += _scrape_others()

    seen_uids: set[str] = set()
    unique = []
    for item in items:
        if item["uid"] not in seen_uids:
            seen_uids.add(item["uid"])
            unique.append(item)
    return unique


def filter_new(items: list[dict], seen_ids: list[str]) -> list[dict]:
    seen_set = set(seen_ids)
    return [i for i in items if i["uid"] not in seen_set]
