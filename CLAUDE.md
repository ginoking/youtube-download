# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

個人用 YouTube 音樂下載器，使用生日密碼驗證後可下載 YouTube 影片的音訊（M4A 格式）。

## 常用指令

```bash
# 開發模式（熱重載）
npm run dev

# 正式環境
npm start

# Docker 開發
docker-compose up --build

# Git push（需要用 token）
git push https://ginoking:<GITHUB_TOKEN>@github.com/ginoking/youtube-download.git master
```

## 環境變數

- `PORT` - 伺服器埠號（預設 8080）
- `BIRTHDAY` - 驗證用的生日密碼
- `SESSION_SECRET` - Express session 密鑰
- `COBALT_API_URL` - Cobalt API 位址（預設 `http://localhost:9000`）

## 架構

**Express.js MVC 結構：**
- `app.js` - 主程式，middleware 設定
- `routes/index.js` - 頁面路由（首頁、下載頁，含 session 驗證）
- `routes/download.js` - API 路由：`POST /check` 驗證生日、`POST /download` 下載處理
- `views/` - Pug 模板（check.pug 驗證頁、index.pug 下載頁）

**下載流程：**
1. 使用者在 `/` 輸入生日 → 驗證成功設定 session
2. 進入 `/download` 頁面輸入 YouTube 網址
3. 呼叫 Cobalt API（localhost:9000）取得下載 URL
4. 串流轉傳音訊給使用者

## 部署架構

**GCP Cloud Run + Sidecar：**
- 主容器：Node.js Express 應用程式
- Sidecar：Cobalt（`ghcr.io/imputnet/cobalt:10`，透過 Artifact Registry 遠端存放區代理）
- 兩個容器透過 `localhost:9000` 內網通訊

**Cloud Build 觸發器：**
- push 到 master 會自動觸發 Cloud Build
- 只更新主容器 image，Cobalt sidecar 設定會保留
