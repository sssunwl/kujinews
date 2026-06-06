"""
KujiUniverse 每日 TG 通知
格式：近三天開售くじ / 今日新公告 / IP 最新消息 / 網站連結
"""
import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
SEEN_FILE = ROOT / "data" / "seen.json"
KUJI_JSON = ROOT / "docs" / "data" / "kuji.json"
NEWS_JSON = ROOT / "docs" / "data" / "ip_news.json"
SITE_URL = "https://sssunwl.github.io/kujinews/"
JST = timezone(timedelta(hours=9))

sys.path.insert(0, str(Path(__file__).parent))
import notify

# ── 日中關鍵字替換（與 app.js 同步） ─────────────────────
JP_ZH = [
    ("一番くじちょこっと","一番賞 mini"),("一番くじ","一番賞"),("みんなのくじ","大家的抽獎"),
    ("TVアニメ","電視動畫"),("劇場版アニメ","劇場版動畫"),("劇場版","劇場版"),
    ("ワンピース","航海王"),("ONE PIECE","航海王"),("ドラゴンボール","七龍珠"),
    ("ちいかわ","吉伊卡哇"),("鬼滅の刃","鬼滅之刃"),("呪術廻戦","咒術迴戰"),
    ("僕のヒーローアカデミア","我的英雄學院"),("進撃の巨人","進擊的巨人"),
    ("ジョジョの奇妙な冒険","JOJO的奇妙冒險"),("ジョジョ","JOJO"),
    ("NARUTO-ナルト-","火影忍者"),("NARUTO","火影忍者"),("疾風伝","疾風傳"),
    ("名探偵コナン","名偵探柯南"),("ハイキュー","排球少年"),
    ("スラムダンク","灌籃高手"),("東京リベンジャーズ","東京復仇者"),
    ("ブルーロック","藍色監獄"),("チェンソーマン","鏈鋸人"),
    ("葬送のフリーレン","葬送的芙莉蓮"),("薬屋のひとりごと","藥師少女的獨語"),
    ("ダンダダン","丹丹丹丹"),("家庭教師ヒットマンREBORN","家庭教師 REBORN!"),
    ("ポケットモンスター","Pokémon"),("スティッチ","史迪奇"),("〈スティッチ〉","史迪奇"),
    ("北斗の拳","北斗神拳"),("STEEL BALL RUN","鋼之球場賽跑"),
    ("ガンダム","鋼彈"),("機動戦士","機動戰士"),("BLEACH","死神"),
    ("学園アイドルマスター","學園偶像大師"),("ラブライブ","LoveLive!"),
    ("ウマ娘","賽馬娘"),("ブルーアーカイブ","藍色檔案"),
    ("サッカー日本代表","日本足球代表"),("Disney","迪士尼"),("〈Disney〉","迪士尼"),
    ("スター・ウォーズ","星際大戰"),("MARVEL","漫威"),
    ("赤髪海賊団","紅髮海賊團"),("エルバフ編","艾爾巴夫篇"),
    ("ケロロ軍曹","Keroro 軍曹"),
    ("発売","發售"),("新作","新作"),("公開","公開"),("登場","登場"),
    ("フィギュア","Figure"),("ぬいぐるみ","布偶"),("グッズ","周邊"),
]

IP_ZH = {
    "ワンピース": "航海王",
    "ドラゴンボール": "七龍珠",
    "REBORN!": "REBORN!",
    "ちいかわ": "吉伊卡哇",
    "ジョジョ": "JOJO",
}


def zh_hint(title: str) -> str:
    r = title
    for jp, zh in JP_ZH:
        r = r.replace(jp, zh)
    return r if r != title else ""


def load_seen() -> dict:
    if SEEN_FILE.exists():
        return json.loads(SEEN_FILE.read_text())
    return {"kuji": [], "news": []}


def save_seen(data: dict) -> None:
    SEEN_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def load_kuji_json() -> list[dict]:
    if not KUJI_JSON.exists():
        return []
    data = json.loads(KUJI_JSON.read_text())
    return [i for m in data.get("months", []) for i in m.get("items", [])]


def load_news_json() -> dict:
    if not NEWS_JSON.exists():
        return {}
    return json.loads(NEWS_JSON.read_text())


# ── 近三天開售 ───────────────────────────────────────────
def upcoming_kuji(days: int = 3) -> list[dict]:
    now = datetime.now(JST)
    target_dates = {
        (now + timedelta(days=d)).strftime("%Y-%m-%d")
        for d in range(days + 1)
    }
    items = [i for i in load_kuji_json() if i.get("date") in target_dates]
    items.sort(key=lambda x: x["date"])
    return items


def fmt_upcoming(items: list[dict]) -> str:
    if not items:
        return "（近三天暫無發售）"
    lines = []
    for item in items:
        date_str = item["date"]
        m, d = int(date_str[5:7]), int(date_str[8:10])
        zh = zh_hint(item["title"])
        url = item.get("official_url") or item.get("url", "")
        lines.append(f"📅 <b>{m}月{d}日</b>")
        lines.append(f"{item['title']}")
        if zh:
            lines.append(f"→ {zh}")
        if url:
            lines.append(f"🔗 {url}")
        lines.append("")
    return "\n".join(lines).strip()


# ── 今日新公告（seen.json 去重） ─────────────────────────
def new_kuji_announcements(seen_ids: list[str]) -> list[dict]:
    all_items = load_kuji_json()
    seen_set = set(seen_ids)
    new = [i for i in all_items if i["id"] not in seen_set]
    return new[:15]


def fmt_announcements(items: list[dict]) -> str:
    if not items:
        return "（今日暫無新公告）"
    lines = []
    for item in items[:8]:
        zh = zh_hint(item["title"])
        url = item.get("official_url") or item.get("url", "")
        lines.append(f"▸ {item['title']}")
        if zh:
            lines.append(f"   → {zh}")
        if url:
            lines.append(f"   🔗 {url}")
    return "\n".join(lines)


# ── IP 最新消息 ──────────────────────────────────────────
def fmt_ip_news() -> str:
    news = load_news_json()
    if not news:
        return "（暫無最新消息）"
    lines = []
    for ip_key, zh_name in IP_ZH.items():
        items = news.get(ip_key, [])[:4]
        if not items:
            continue
        lines.append(f"<b>[{zh_name}]</b>")
        for n in items:
            title = n.get("title", "")
            title_zh = n.get("title_zh", "") or zh_hint(title)
            url = n.get("url", "")
            lines.append(f"・{title}")
            if title_zh and title_zh != title:
                lines.append(f"  → {title_zh}")
            if url:
                lines.append(f"  🔗 {url}")
        lines.append("")
    return "\n".join(lines).strip()


# ── 主程序 ────────────────────────────────────────────────
def main() -> None:
    seen = load_seen()
    now = datetime.now(JST)
    weekday = ["一","二","三","四","五","六","日"][now.weekday()]
    date_label = f"{now.year}年{now.month}月{now.day}日（週{weekday}）"

    # 近三天開售
    upcoming = upcoming_kuji(days=3)

    # 新公告（今日全新未推送過的くじ）
    new_announcements = new_kuji_announcements(seen["kuji"])

    # IP 新聞（從 ip_news.json 讀，不另行爬取）
    ip_block = fmt_ip_news()

    # 如果三個都沒有內容，仍然送出每日報告
    sep = "──────────────"
    msg_parts = [
        f"🌟 <b>Kuji宇宙 每日報告</b>\n📅 {date_label}",
        f"{sep}\n⏰ <b>近三天發售くじ</b>\n\n{fmt_upcoming(upcoming)}",
        f"{sep}\n🆕 <b>今日新公告</b>\n\n{fmt_announcements(new_announcements)}",
        f"{sep}\n📰 <b>IP 最新消息</b>\n\n{ip_block}",
        f"{sep}\n🌐 {SITE_URL}",
    ]

    message = "\n\n".join(msg_parts)
    notify.send(message)
    print(f"Sent daily report: {len(upcoming)} upcoming, {len(new_announcements)} new")

    # 更新 seen.json
    all_items = load_kuji_json()
    seen["kuji"] = list(set(seen["kuji"]) | {i["id"] for i in all_items})
    seen["kuji"] = seen["kuji"][-1000:]
    save_seen(seen)


if __name__ == "__main__":
    main()
