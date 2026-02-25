FROM node:20-slim

WORKDIR /app

# 安裝系統工具、yt-dlp、ffmpeg 和 Cloudflare WARP
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    gnupg \
    lsb-release \
    && curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | gpg --yes --dearmor --output /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflare-client.list \
    && apt-get update && apt-get install -y cloudflare-warp \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 確保 yt-dlp 在 PATH
ENV PATH="/usr/local/bin:${PATH}"

# 複製 package.json
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm ci --only=production || npm install --only=production

# 複製程式碼
COPY . ./

# 設定 Entrypoint 腳本
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE $PORT

ENTRYPOINT ["entrypoint.sh"]
CMD ["npm", "start"]
