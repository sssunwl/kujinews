import re
import time
import requests
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}


def _hours_ago(hours: int) -> float:
    return (datetime.now(timezone.utc) - timedelta(hours=hours)).timestamp()


def _fetch_rss(url: str, label: str, cutoff_ts: float) -> list[dict]:
    try:
        feed = feedparser.parse(url)
        items = []
        for entry in feed.entries:
            pub = entry.get("published_parsed") or entry.get("updated_parsed")
            if pub and time.mktime(pub) < cutoff_ts:
                continue
            items.append({
                "uid": entry.get("id") or entry.get("link", ""),
                "title": entry.get("title", ""),
                "url": entry.get("link", ""),
                "source": label,
            })
        return items
    except Exception as e:
        print(f"[news] RSS {label} error: {e}")
        return []


def _fetch_one_piece(max_items: int = 15) -> list[dict]:
    try:
        resp = requests.get("https://one-piece.com/news/index.html", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            # 新聞頁格式：/news/NNNNN/index.html
            if not re.match(r"^/news/\d+/", href):
                continue
            title = a.get_text(strip=True)
            # 去除開頭的 "NEW" 標籤
            title = re.sub(r"^NEW\s*", "", title).strip()
            # 去除末尾的日期與分類（例：2026/06/03イベント・施設）
            title = re.sub(r"\d{4}/\d{2}/\d{2}.*$", "", title).strip()
            if not title or len(title) < 5:
                continue
            full_url = "https://one-piece.com" + href
            uid = href.split("/")[2]  # news ID 數字
            items.append({"uid": f"op_{uid}", "title": title, "url": full_url, "source": "ワンピース"})
            if len(items) >= max_items:
                break
        return items
    except Exception as e:
        print(f"[news] One Piece error: {e}")
        return []


def _fetch_reborn(max_items: int = 15) -> list[dict]:
    try:
        resp = requests.get("https://khreborn-anime.jp/", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"khreborn-anime\.jp/news/\d+", href):
                continue
            raw = a.get_text(strip=True)
            # 去除開頭的日期（格式：2026.05.15INFORMATION...）
            title = re.sub(r"^\d{4}\.\d{2}\.\d{2}[A-Z\s]*", "", raw).strip()
            if not title or len(title) < 5:
                continue
            uid_match = re.search(r"/news/(\d+)", href)
            uid = f"reborn_{uid_match.group(1)}" if uid_match else href
            items.append({"uid": uid, "title": title, "url": href, "source": "REBORN!"})
            if len(items) >= max_items:
                break
        return items
    except Exception as e:
        print(f"[news] REBORN! error: {e}")
        return []


def _fetch_dragonball(cutoff_ts: float) -> list[dict]:
    # 先試 RSS
    items = _fetch_rss("https://dragon-ball-official.com/rss.xml", "ドラゴンボール", cutoff_ts)
    if items:
        return items
    # fallback：爬新聞頁
    try:
        resp = requests.get("https://dragon-ball-official.com/news/", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        result = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"/news/\d+_\d+", href):
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 5:
                continue
            if href.startswith("/"):
                href = "https://dragon-ball-official.com" + href
            uid_match = re.search(r"/news/(\w+)", href)
            uid = f"db_{uid_match.group(1)}" if uid_match else href
            result.append({"uid": uid, "title": title, "url": href, "source": "ドラゴンボール"})
            if len(result) >= 15:
                break
        return result
    except Exception as e:
        print(f"[news] Dragon Ball error: {e}")
        return []


def _fetch_chiikawa(max_items: int = 15) -> list[dict]:
    try:
        resp = requests.get("https://chiikawaworld.com/news/", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"chiikawaworld\.com/news/\d+|/news/\d+", href):
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 5:
                continue
            if href.startswith("/"):
                href = "https://chiikawaworld.com" + href
            uid_match = re.search(r"/news/(\d+)", href)
            uid = f"chii_{uid_match.group(1)}" if uid_match else href
            items.append({"uid": uid, "title": title, "url": href, "source": "ちいかわ"})
            if len(items) >= max_items:
                break
        return items
    except Exception as e:
        print(f"[news] Chiikawa error: {e}")
        return []


def _fetch_jojo(max_items: int = 15) -> list[dict]:
    try:
        resp = requests.get("https://jojoweb.jp/", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"jojoweb\.jp/(?:news|information|topics)/\d+|/(?:news|information)/\d+", href):
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 5:
                continue
            if href.startswith("/"):
                href = "https://jojoweb.jp" + href
            uid_match = re.search(r"/(\w+)/(\d+)", href)
            uid = f"jojo_{uid_match.group(2)}" if uid_match else href
            items.append({"uid": uid, "title": title, "url": href, "source": "ジョジョ"})
            if len(items) >= max_items:
                break
        return items
    except Exception as e:
        print(f"[news] JOJO error: {e}")
        return []


def fetch_all_news(lookback_hours: int = 9) -> list[dict]:
    cutoff = _hours_ago(lookback_hours)
    news = []
    news += _fetch_one_piece()
    news += _fetch_dragonball(cutoff)
    news += _fetch_reborn()
    news += _fetch_chiikawa()
    news += _fetch_jojo()
    return news


def filter_new(items: list[dict], seen_ids: list[str]) -> list[dict]:
    seen_set = set(seen_ids)
    return [i for i in items if i["uid"] not in seen_set]
