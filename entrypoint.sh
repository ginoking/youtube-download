#!/bin/bash
set -e

# 啟動 Cloudflare WARP 服務（背景執行）
echo "Starting Cloudflare WARP service..."
warp-svc &

# 等待服務啟動
sleep 2

# 註冊並連線 WARP
echo "Registering and connecting to WARP..."
# 如果已經註冊過，register 可能會失敗，所以忽略錯誤
warp-cli --accept-tos register || true
warp-cli --accept-tos connect

# 等待連線建立
sleep 3

# 檢查 IP（可選，用於偵錯）
echo "Checking current IP info..."
curl -s https://www.cloudflare.com/cdn-cgi/trace | grep -E "ip|warp"

# 執行原始指令（npm start）
echo "Starting application..."
exec "$@"
