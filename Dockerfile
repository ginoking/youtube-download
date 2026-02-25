FROM node:20-slim

WORKDIR /app

# 安裝系統工具、yt-dlp、ffmpeg 和必要工具
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
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

EXPOSE $PORT

CMD ["npm", "start"]
