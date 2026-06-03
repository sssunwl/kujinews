import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}

SOURCES = [
    {"label": "一番くじ", "url": "https://kujimap.com/1bankuji"},
    {"label": "みんなのくじ", "url": "https://kujimap.com/minkuji"},
    {"label": "その他くじ", "url": "https://kujimap.com/others"},
]


def fetch_kuji_listings() -> list[dict]:
    items = []
    for source in SOURCES:
        try:
            resp = requests.get(source["url"], headers=HEADERS, timeout=15)
            soup = BeautifulSoup(resp.text, "lxml")
            # kujimap.com uses article cards with links and titles
            for card in soup.select("article a, .kuji-item a, .list-item a, h2 a, h3 a"):
                title = card.get_text(strip=True)
                href = card.get("href", "")
                if not title or not href:
                    continue
                if href.startswith("/"):
                    href = "https://kujimap.com" + href
                uid = href.split("/")[-1] or href
                items.append({
                    "uid": uid,
                    "title": title,
                    "url": href,
                    "brand": source["label"],
                })
        except Exception as e:
            print(f"[kuji] {source['label']} fetch error: {e}")
    # deduplicate by uid
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
