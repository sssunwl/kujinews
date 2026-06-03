"""
執行這個腳本取得 Telegram Chat ID。
步驟：先對你的 Bot 發一則訊息，再執行這個腳本。
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
if not token:
    print("請先在 .env 設定 TELEGRAM_BOT_TOKEN")
    exit(1)

resp = requests.get(f"https://api.telegram.org/bot{token}/getUpdates", timeout=10)
data = resp.json()

if not data.get("result"):
    print("沒有收到訊息，請先對 Bot 發一則訊息再執行。")
    exit(1)

for update in data["result"]:
    msg = update.get("message") or update.get("channel_post") or {}
    chat = msg.get("chat", {})
    print(f"Chat ID : {chat.get('id')}")
    print(f"類型    : {chat.get('type')}")
    print(f"名稱    : {chat.get('title') or chat.get('first_name', '')}")
    print("---")
