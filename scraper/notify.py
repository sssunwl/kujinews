import os
import re
import requests


def send(text: str) -> None:
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]
    requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        },
        timeout=10,
    ).raise_for_status()


def html_to_discord(text: str) -> str:
    """Telegram HTML → Discord markdown。連結用 [t](<url>) 抑制預覽嵌入。"""
    text = re.sub(r"<b>(.*?)</b>", r"**\1**", text, flags=re.S)
    text = re.sub(r'<a href="([^"]+)">(.*?)</a>', r"[\2](<\1>)", text, flags=re.S)
    text = re.sub(r"<[^>]+>", "", text)
    return text


def send_discord(text: str) -> None:
    """發到 Discord webhook(DISCORD_WEBHOOK_URL 未設定就跳過)。
    單則上限 2000 字,依行切塊送出。"""
    url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
    if not url:
        print("[notify] DISCORD_WEBHOOK_URL not set, skip discord")
        return
    chunks: list[str] = []
    cur = ""
    for line in text.split("\n"):
        if len(cur) + len(line) + 1 > 1900:
            chunks.append(cur)
            cur = line
        else:
            cur = f"{cur}\n{line}" if cur else line
    if cur:
        chunks.append(cur)
    for chunk in chunks:
        requests.post(url, json={"content": chunk}, timeout=10).raise_for_status()
