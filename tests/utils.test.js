const { cleanYoutubeUrl } = require('../lib/utils');

describe('cleanYoutubeUrl 深入測試', () => {
    
    describe('標準與清理邏輯', () => {
        test('應該從帶有播放清單的網址中提取純影片 ID', () => {
            const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123456&index=5';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        test('應該移除時間戳記參數', () => {
            const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        test('應該移除分享與功能參數 (feature, si)', () => {
            const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&si=123';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });
    });

    describe('不同子網域與協議', () => {
        test('應該支援行動版網址 (m.youtube.com)', () => {
            const input = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        test('應該支援 YouTube Music (music.youtube.com)', () => {
            const input = 'https://music.youtube.com/watch?v=dQw4w9WgXcQ';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        test('應該支援 http 協議', () => {
            const input = 'http://www.youtube.com/watch?v=dQw4w9WgXcQ';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });
    });

    describe('Shorts 與 Embed', () => {
        test('應該處理帶有參數的 Shorts 網址', () => {
            const input = 'https://www.youtube.com/shorts/8wN_MNDlI-E?feature=share';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=8wN_MNDlI-E');
        });

        test('應該處理 Embed 嵌入式網址', () => {
            const input = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });
    });

    describe('安全與邊緣案例', () => {
        test('不應匹配偽造域名 (fakeyoutube.com)', () => {
            const input = 'https://fakeyoutube.com/watch?v=dQw4w9WgXcQ';
            expect(cleanYoutubeUrl(input)).toBe(null);
        });

        test('不應匹配 YouTube 搜尋頁或頻道頁', () => {
            expect(cleanYoutubeUrl('https://www.youtube.com/results?search_query=test')).toBe(null);
            expect(cleanYoutubeUrl('https://www.youtube.com/c/Google')).toBe(null);
        });

        test('處理 youtu.be 帶有子路徑的情況', () => {
            const input = 'https://youtu.be/dQw4w9WgXcQ/extra/path';
            expect(cleanYoutubeUrl(input)).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        });

        test('對於 ID 長度異常的輸入應回傳 null', () => {
            expect(cleanYoutubeUrl('https://www.youtube.com/watch?v=too-short')).toBe(null);
        });
    });
});
