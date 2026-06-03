import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
SEEN_FILE = ROOT / "data" / "seen.json"

import kuji
import ip_news
import notify


def load_seen() -> dict:
    if SEEN_FILE.exists():
        return json.loads(SEEN_FILE.read_text())
    return {"kuji": [], "news": []}


def save_seen(data: dict) -> None:
    SEEN_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def format_kuji_block(items: list[dict]) -> str:
    lines = ["🎲 <b>新くじ情報</b>"]
    for item in items[:10]:
        lines.append(f"▸ [{item['brand']}] {item['title']}")
        if item["url"]:
            lines.append(f"  🔗 {item['url']}")
    return "\n".join(lines)


def format_news_block(items: list[dict]) -> str:
    lines = ["📰 <b>IP 最新ニュース</b>"]
    for item in items[:10]:
        lines.append(f"▸ [{item['source']}] {item['title']}")
        if item["url"]:
            lines.append(f"  🔗 {item['url']}")
    return "\n".join(lines)


def main() -> None:
    seen = load_seen()

    kuji_items = kuji.fetch_kuji_listings()
    new_kuji = kuji.filter_new(kuji_items, seen["kuji"])

    news_items = ip_news.fetch_all_news(lookback_hours=9)
    new_news = ip_news.filter_new(news_items, seen["news"])

    if not new_kuji and not new_news:
        print("No new items found.")
        return

    blocks = []
    if new_kuji:
        blocks.append(format_kuji_block(new_kuji))
    if new_news:
        blocks.append(format_news_block(new_news))

    message = "🌟 <b>KujiUniverse 更新</b>\n\n" + "\n\n".join(blocks)
    notify.send(message)
    print(f"Sent: {len(new_kuji)} kuji, {len(new_news)} news")

    seen["kuji"] = list(set(seen["kuji"]) | {i["uid"] for i in new_kuji})
    seen["news"] = list(set(seen["news"]) | {i["uid"] for i in new_news})
    # keep only last 500 entries to avoid unbounded growth
    seen["kuji"] = seen["kuji"][-500:]
    seen["news"] = seen["news"][-500:]
    save_seen(seen)


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).parent))
    main()
