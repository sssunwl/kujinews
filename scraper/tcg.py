"""
Generate docs/data/tcg.json — Pokemon TCG (ポケカ) + ONE PIECE カードゲーム 商品発売情報.

Pokemon: official JSON API  pokemon-card.com/products/resultAPI.php
OPTCG:   static HTML        onepiece-cardgame.com/products/
"""
import hashlib
import json
import re
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; KujiUniverse/1.0)"}
JST = timezone(timedelta(hours=9))
OUT = Path(__file__).parent.parent / "docs" / "data" / "tcg.json"
IMG_DIR = Path(__file__).parent.parent / "docs" / "images" / "tcg"


def _mirror_image(url: str, uid: str) -> str:
    """把商品圖抓回本站(Bandai 對外站 hotlink 有併發節流,直連會整批卡住)。
    失敗時退回原始 URL。"""
    if not url:
        return url
    low = url.lower()
    ext = ".webp" if ".webp" in low else ".png" if ".png" in low else ".jpg"
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    f = IMG_DIR / f"{uid}{ext}"
    if not f.exists():
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            r.raise_for_status()
            f.write_bytes(r.content)
            time.sleep(0.25)
        except Exception as e:
            print(f"[tcg] img mirror fail {uid}: {e}")
            return url
    return f"images/tcg/{f.name}"

PKM_BASE = "https://www.pokemon-card.com"
OP_BASE = "https://www.onepiece-cardgame.com"


def _pkm_parse_date(txt: str) -> Optional[str]:
    """'2026年 7月31日（金）' → '2026-07-31'"""
    m = re.search(r"(20\d\d)年\s*(\d{1,2})月\s*(\d{1,2})日", txt or "")
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    # 只有年月（例：'2026年 10月'）→ 掛在該月 1 日前不確定,回傳 None 讓 month_key 處理
    return None


def _pkm_month_key(txt: str) -> Optional[str]:
    m = re.search(r"(20\d\d)年\s*(\d{1,2})月", txt or "")
    return f"{m.group(1)}-{int(m.group(2)):02d}" if m else None


def fetch_pokemon(months_back: int = 2, months_ahead: int = 14) -> list[dict]:
    """抓拡張パック+構築デッキ+その他(含ハイクラスパック等)。"""
    now = datetime.now(JST)
    lo = now - timedelta(days=months_back * 31)
    hi = now + timedelta(days=months_ahead * 31)
    items: list[dict] = []
    for ptype, label in [("expansion", "拡張パック"), ("construction", "構築デッキ"), ("others", "その他")]:
        page = 1
        while page <= 5:
            url = (f"{PKM_BASE}/products/resultAPI.php?productType={ptype}"
                   f"&dateLowerY={lo.year}&dateLowerM={lo.month}&dateLowerD=1"
                   f"&dateUpperY={hi.year}&dateUpperM={hi.month}&dateUpperD=28"
                   f"&page={page}")
            try:
                data = requests.get(url, headers=HEADERS, timeout=15).json()
            except Exception as e:
                print(f"[tcg] pokemon {ptype} p{page} error: {e}")
                break
            for p in data.get("products", []):
                title = (p.get("productTitle") or "").strip()
                if not title:
                    continue
                rel = p.get("releaseDate") or ""
                date = _pkm_parse_date(rel)
                detail = p.get("link_detailPage") or ""
                if detail and detail.startswith("/"):
                    detail = PKM_BASE + detail
                img = p.get("tumbsImg") or ""
                if img and img.startswith("/"):
                    img = PKM_BASE + img
                pc_link = p.get("link_pokemonCenter") or ""
                # 多商品可能共用同一詳情頁(如 30th カードセット系列),uid 需摻入 title
                items.append({
                    "id": "pkm_" + re.sub(r"\W+", "_", (detail or title))[-40:].strip("_")
                          + "_" + hashlib.md5(title.encode()).hexdigest()[:6],
                    "game": "pokemon",
                    "category": p.get("productType") or label,
                    "title": title,
                    "date": date,
                    "date_raw": rel.strip(),
                    "month_key": date[:7] if date else _pkm_month_key(rel),
                    "price": (p.get("priceTxt") or "").strip(),
                    "image_url": img,
                    "url": detail or f"{PKM_BASE}/products/",
                    "buy_url": pc_link,
                    "stores": (p.get("storesAvailable") or "").strip(),
                })
            if data.get("thisPage", 1) >= data.get("maxPage", 1):
                break
            page += 1
    print(f"[tcg] pokemon: {len(items)} items")
    return items


def fetch_optcg() -> list[dict]:
    try:
        resp = requests.get(f"{OP_BASE}/products/", headers=HEADERS, timeout=15)
        soup = BeautifulSoup(resp.content, "lxml")
    except Exception as e:
        print(f"[tcg] optcg error: {e}")
        return []
    CAT_LABEL = {"boosters": "ブースターパック", "decks": "スタートデッキ", "others": "その他"}
    items: list[dict] = []
    seen: set[str] = set()
    for li in soup.select("li.linkListColBox"):
        a = li.find("a", href=True)
        title_el = li.select_one(".linkListColTitle")
        if not a or not title_el:
            continue
        href = a["href"]
        if href.startswith("/"):
            href = OP_BASE + href
        uid = "op_" + href.rstrip("/").split("/")[-1].replace(".html", "")
        if uid in seen:
            continue
        seen.add(uid)
        date = None
        t = li.find("time")
        if t and t.get("datetime"):
            dt = t["datetime"].strip()
            # datetime 屬性有時把「2026.10(月未定日)」補成 10-01,以顯示文字有無「日」為準
            if re.match(r"^20\d\d-\d\d-\d\d$", dt) and re.search(r"20\d\d\.\d{1,2}\.\d{1,2}", t.get_text()):
                date = dt
        # 只有年月的商品(例:発売日 2026.10)
        month_key = date[:7] if date else None
        if not month_key:
            date_p = li.select_one(".linkListColDate")
            if date_p:
                m = re.search(r"(20\d\d)\.(\d{1,2})", date_p.get_text())
                if m:
                    month_key = f"{m.group(1)}-{int(m.group(2)):02d}"
        price_el = li.select_one(".linkListColPrice .data")
        img_el = li.find("img")
        img = ""
        if img_el:
            img = img_el.get("data-src") or img_el.get("src") or ""
            if "img_thumbnail_sq" in img:
                img = ""
            if img.startswith("/"):
                img = OP_BASE + img
        date_p = li.select_one(".linkListColDate")
        items.append({
            "id": uid,
            "game": "onepiece",
            "category": CAT_LABEL.get(li.get("data-cat", ""), li.get("data-cat", "")),
            "title": title_el.get_text(strip=True),
            "date": date,
            "date_raw": date_p.get_text(" ", strip=True).replace("発売日", "").strip() if date_p else "",
            "month_key": month_key,
            "price": price_el.get_text(strip=True) if price_el else "",
            "image_url": img,
            "url": href,
            "buy_url": "",
            "stores": "",
        })
    print(f"[tcg] optcg: {len(items)} items")
    return items


def build_tcg() -> dict:
    pokemon = fetch_pokemon()
    onepiece = fetch_optcg()
    for it in pokemon + onepiece:
        it["image_url"] = _mirror_image(it["image_url"], it["id"])
    # 清掉不再被引用的鏡像圖,避免累積
    if IMG_DIR.exists():
        used = {it["image_url"].split("/")[-1] for it in pokemon + onepiece
                if it["image_url"].startswith("images/")}
        for f in IMG_DIR.iterdir():
            if f.name not in used:
                f.unlink()
    data = {
        "generated_at": datetime.now(JST).isoformat(),
        "pokemon": pokemon,
        "onepiece": onepiece,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"[tcg] saved → {OUT}")
    return data


if __name__ == "__main__":
    build_tcg()
