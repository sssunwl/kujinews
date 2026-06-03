import time
import requests
import feedparser
from bs4 import BeautifulSoup
from datetime import datetime, timezone, timedelta

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}
JST = timezone(timedelta(hours=9))


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


def _scrape_news_page(url: str, label: str, article_sel: str, title_sel: str, link_sel: str) -> list[dict]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        items = []
        for article in soup.select(article_sel)[:20]:
            title_el = article.select_one(title_sel)
            link_el = article.select_one(link_sel)
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            href = link_el.get("href", "") if link_el else ""
            if href and href.startswith("/"):
                from urllib.parse import urlparse
                base = urlparse(url)
                href = f"{base.scheme}://{base.netloc}{href}"
            uid = href or title
            items.append({"uid": uid, "title": title, "url": href, "source": label})
        return items
    except Exception as e:
        print(f"[news] scrape {label} error: {e}")
        return []


def fetch_all_news(lookback_hours: int = 9) -> list[dict]:
    cutoff = _hours_ago(lookback_hours)
    news = []

    # One Piece — official news page (no public RSS confirmed)
    news += _scrape_news_page(
        "https://one-piece.com/news/index.html",
        "ワンピース",
        article_sel="li.news_li, article, .news-item, li[class*='news']",
        title_sel="h2, h3, .title, strong",
        link_sel="a",
    )

    # Dragon Ball — official RSS
    news += _fetch_rss(
        "https://dragon-ball-official.com/rss.xml",
        "ドラゴンボール",
        cutoff,
    )
    # fallback scrape if RSS empty
    if not any(n["source"] == "ドラゴンボール" for n in news):
        news += _scrape_news_page(
            "https://dragon-ball-official.com/news/",
            "ドラゴンボール",
            article_sel="article, li.news-item, .news_list li",
            title_sel="h2, h3, .title",
            link_sel="a",
        )

    # REBORN! 20th anniversary — scrape official site
    news += _scrape_news_page(
        "https://khreborn-anime.jp/",
        "REBORN!",
        article_sel="article, li.news_item, .news-list li, .information li",
        title_sel="h2, h3, p, .title",
        link_sel="a",
    )

    return news


def filter_new(items: list[dict], seen_ids: list[str]) -> list[dict]:
    seen_set = set(seen_ids)
    return [i for i in items if i["uid"] not in seen_set]
