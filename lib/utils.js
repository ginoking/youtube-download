/**
 * 清理並提取 YouTube 影片網址，過濾掉播放清單、分享追蹤等多餘參數
 * @param {string} url - 原始 YouTube 網址
 * @returns {string|null} - 清理後的乾淨網址，若格式錯誤則回傳 null
 */
function cleanYoutubeUrl(url) {
    if (!url || typeof url !== 'string' || !url.includes('http')) return null;

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;
        const searchParams = urlObj.searchParams;

        // YouTube 影片 ID 通常是 11 位字元，我們設定一個合理的檢查範圍
        const isValidId = (id) => id && id.length >= 10 && id.length <= 12;

        // 1. 處理所有以 youtube.com 結尾的域名 (包含 m., music., www.)
        if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
            // 標準影片播放頁
            if (pathname === '/watch') {
                const videoId = searchParams.get('v');
                return isValidId(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;
            }
            // Shorts 或 Embed 格式
            if (pathname.startsWith('/shorts/') || pathname.startsWith('/embed/')) {
                const parts = pathname.split('/');
                const videoId = parts[2];
                return isValidId(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;
            }
        }

        // 2. 處理縮網址 (youtu.be/...)
        if (hostname === 'youtu.be') {
            const videoId = pathname.substring(1).split('/')[0];
            return isValidId(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;
        }

        return null;
    } catch (e) {
        return null;
    }
}

module.exports = {
    cleanYoutubeUrl
};
