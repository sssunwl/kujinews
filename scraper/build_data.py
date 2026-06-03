"""
Generate docs/data/kuji.json for the KujiUniverse web calendar.
Scrapes kujimap.com month pages + detail pages for release dates.
"""
import json
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}
BASE = "https://kujimap.com"
OUT = Path(__file__).parent.parent / "docs" / "data" / "kuji.json"
JST = timezone(timedelta(hours=9))

IP_KEYWORDS = {
    "ワンピース":    ["ワンピース", "ONE PIECE", "麦わら"],
    "ドラゴンボール": ["ドラゴンボール", "DRAGON BALL"],
    "REBORN!":     ["リボーン", "REBORN", "家庭教師ヒットマン"],
    "ちいかわ":     ["ちいかわ", "Chiikawa"],
    "ジョジョ":     ["ジョジョ", "JOJO", "JoJo"],
}


def tag_ip(title: str) -> list[str]:
    tags = []
    for ip, keywords in IP_KEYWORDS.items():
        if any(k in title for k in keywords):
            tags.append(ip)
    return tags


def get(url: str) -> BeautifulSoup | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        return BeautifulSoup(r.text, "lxml")
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
    return {"date": date, "price": price}


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


def enrich_dates(items: list[dict]) -> list[dict]:
    for item in items:
        print(f"  fetching detail: {item['title'][:40]}")
        detail = scrape_detail(item["url"])
        item["date"] = detail.get("date")
        item["price"] = detail.get("price")
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

    # みんなのくじ doesn't use month-based URLs — scrape listing directly
    print("\n[みんなのくじ] listing")
    soup = get(f"{BASE}/minkuji")
    if soup:
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if not re.search(r"/minkuji/min_\d+$", href):
                continue
            title = a.get_text(strip=True)
            if not title or len(title) < 4:
                continue
            if href.startswith("/"):
                href = BASE + href
            uid = href.split("/")[-1]
            if any(i["id"] == uid for i in all_items):
                continue
            all_items.append({
                "id": uid,
                "title": title,
                "brand": "みんなのくじ",
                "url": href,
                "month_key": None,
                "ip_tags": tag_ip(title),
                "date": None,
                "price": None,
            })

    # Sort within each month by date, then by id
    all_items.sort(key=lambda x: (x.get("month_key") or "9999", x.get("date") or "9999", x["id"]))

    # Group by month
    months_map: dict[str, list] = {}
    for item in all_items:
        key = item.get("month_key") or "unknown"
        months_map.setdefault(key, []).append(item)

    months_out = []
    for key in sorted(months_map.keys()):
        if key == "unknown":
            label = "発売月未定"
        else:
            y, m = key.split("-")
            label = f"{y}年{int(m)}月"
        months_out.append({"key": key, "label": label, "items": months_map[key]})

    data = {
        "generated_at": datetime.now(JST).isoformat(),
        "months": months_out,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"\nSaved {len(all_items)} items to {OUT}")


if __name__ == "__main__":
    main()
