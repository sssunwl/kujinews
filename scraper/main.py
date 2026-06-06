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
    # 品牌/系列詞
    ("アイドルマスター","偶像大師"),("シャイニーカラーズ","閃耀色彩"),
    ("シャイニー","閃耀"),("アイカツ!","偶像學園!"),("プリキュア","光之美少女"),
    ("仮面ライダー","假面騎士"),("ウルトラマン","超人力霸王"),
    ("ドラゴンクエスト","勇者鬥惡龍"),("ファイナルファンタジー","Final Fantasy"),
    ("ペルソナ","Persona"),("ダンジョン飯","迷宮飯"),
    ("葬送のフリーレン","葬送的芙莉蓮"),("日本三國","日本三國"),
    ("都市伝説解体センター","都市傳說解體中心"),
    ("SAKAMOTO DAYS","坂本日常"),("HUNDRED LINE","百行"),
    ("IDOLY PRIDE","IDOLY PRIDE"),
    ("Happyくじ","Happy 抽獎"),("グッスマくじ","Good Smile 抽獎"),
    ("コトブキヤくじ","壽屋抽獎"),("タイトーくじ","TAITO 抽獎"),
    # 通用詞
    ("発売","發售"),("発売予定","預定發售"),("開催決定","舉辦確定"),
    ("新作","新作"),("公開","公開"),("登場","登場"),("再販","再版"),
    ("オンライン","線上"),("店頭","門市"),("限定","限定"),
    ("フィギュア","Figure"),("ぬいぐるみ","布偶"),("グッズ","周邊"),
    ("アクリル","壓克力"),("缶バッジ","徽章"),("タオル","毛巾"),
    ("まで","為止"),("より","起"),("予定","預定"),
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
def upcoming_kuji(before: int = 3, after: int = 3) -> list[dict]:
    """Return kuji releasing from today-before to today+after (inclusive)."""
    now = datetime.now(JST)
    target_dates = {
        (now + timedelta(days=d)).strftime("%Y-%m-%d")
        for d in range(-before, after + 1)
    }
    items = [i for i in load_kuji_json() if i.get("date") in target_dates]
    items.sort(key=lambda x: x["date"])
    return items


def _link(text: str, url: str) -> str:
    """Wrap text in Telegram HTML hyperlink if URL exists."""
    if url:
        return f'<a href="{url}">{text}</a>'
    return text


def fmt_upcoming(items: list[dict]) -> str:
    if not items:
        return "（近三天暫無發售）"
    lines = []
    for item in items:
        date_str = item["date"]
        m, d = int(date_str[5:7]), int(date_str[8:10])
        zh = zh_hint(item["title"])
        url = item.get("official_url") or item.get("url", "")
        title_linked = _link(item["title"], url)
        lines.append(f"📅 <b>{m}月{d}日</b>  {title_linked}")
        if zh:
            lines.append(f"   → {zh}")
    return "\n".join(lines)


def new_kuji_announcements(seen_ids: list[str]) -> list[dict]:
    all_items = load_kuji_json()
    seen_set = set(seen_ids)
    return [i for i in all_items if i["id"] not in seen_set][:10]


def fmt_announcements(items: list[dict]) -> str:
    if not items:
        return "（今日暫無新公告）"
    lines = []
    for item in items[:6]:
        zh = zh_hint(item["title"])
        url = item.get("official_url") or item.get("url", "")
        title_linked = _link(item["title"], url)
        lines.append(f"▸ {title_linked}")
        if zh:
            lines.append(f"   → {zh}")
    return "\n".join(lines)


def fmt_ip_news(seen_news: list[str]) -> tuple[str, list[str]]:
    """Returns (formatted block, list of new news UIDs seen this run)."""
    news = load_news_json()
    if not news:
        return "（暫無最新消息）", []
    seen_set = set(seen_news)
    lines = []
    new_uids: list[str] = []

    for ip_key, zh_name in IP_ZH.items():
        all_items = news.get(ip_key, [])
        # 只顯示未推送過、且標題夠長（避免抓到導航標籤）的項目
        new_items = [
            n for n in all_items
            if n.get("url", "") not in seen_set and len(n.get("title", "")) >= 10
        ][:2]
        if not new_items:
            continue
        lines.append(f"<b>[{zh_name}]</b>")
        for n in new_items:
            title = n.get("title", "")
            title_zh = n.get("title_zh", "") or zh_hint(title)
            url = n.get("url", "")
            uid = url or title
            new_uids.append(uid)
            title_linked = _link(title, url)
            lines.append(f"・{title_linked}")
            if title_zh and title_zh != title:
                lines.append(f"  → {title_zh}")
        lines.append("")

    block = "\n".join(lines).strip() if lines else "（今日暫無 IP 新消息）"
    return block, new_uids


# ── 主程序 ────────────────────────────────────────────────
def main() -> None:
    seen = load_seen()
    if "news" not in seen:
        seen["news"] = []

    now = datetime.now(JST)
    weekday = ["一","二","三","四","五","六","日"][now.weekday()]
    date_label = f"{now.year}年{now.month}月{now.day}日（週{weekday}）"

    upcoming = upcoming_kuji(before=3, after=3)
    new_announcements = new_kuji_announcements(seen["kuji"])
    ip_block, new_news_uids = fmt_ip_news(seen["news"])

    sep = "──────────────"
    msg_parts = [
        f"🌟 <b>Kuji宇宙 每日報告</b>\n📅 {date_label}",
        f"{sep}\n⏰ <b>近期發售くじ（前後3天）</b>\n\n{fmt_upcoming(upcoming)}",
        f"{sep}\n🆕 <b>今日新公告</b>\n\n{fmt_announcements(new_announcements)}",
        f"{sep}\n📰 <b>IP 最新消息</b>\n\n{ip_block}",
        f"{sep}\n🌐 <a href=\"{SITE_URL}\">Kuji宇宙</a>",
    ]

    message = "\n\n".join(msg_parts)
    notify.send(message)
    print(f"Sent: {len(upcoming)} upcoming, {len(new_announcements)} new kuji, {len(new_news_uids)} new news")

    # 更新 seen.json（kuji + news 都去重）
    all_items = load_kuji_json()
    seen["kuji"] = list(set(seen["kuji"]) | {i["id"] for i in all_items})
    seen["kuji"] = seen["kuji"][-1000:]
    seen["news"] = list(set(seen["news"]) | set(new_news_uids))
    seen["news"] = seen["news"][-2000:]
    save_seen(seen)


if __name__ == "__main__":
    main()
