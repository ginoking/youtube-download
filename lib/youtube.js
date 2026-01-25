const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 從環境變數讀取 cookies 內容，寫入臨時檔案
const COOKIES_PATH = path.join(os.tmpdir(), 'youtube_cookies.txt');

function initCookies() {
	const cookiesContent = process.env.YOUTUBE_COOKIES;
	if (cookiesContent) {
		// 確保有 Netscape cookies header
		const header = '# Netscape HTTP Cookie File\n';
		const content = cookiesContent.startsWith('# Netscape')
			? cookiesContent
			: header + cookiesContent;
		fs.writeFileSync(COOKIES_PATH, content);
		console.log('已從環境變數載入 cookies');
		return true;
	}
	return false;
}

// 啟動時初始化
const hasCookies = initCookies();

/**
 * 取得 cookies 參數（如果有設定）
 */
function getCookiesArgs() {
	if (hasCookies) {
		return ['--cookies', COOKIES_PATH];
	}
	return [];
}

/**
 * 使用 yt-dlp 取得影片資訊
 * @param {string} videoUrl - YouTube 影片網址
 * @returns {Promise<{title: string, filename: string}>}
 */
async function getVideoInfo(videoUrl) {
	return new Promise((resolve, reject) => {
		const args = [
			...getCookiesArgs(),
			'--print', '%(title)s',
			'--no-warnings',
			videoUrl,
		];

		console.log('取得影片資訊...');
		const proc = spawn('yt-dlp', args);

		let stdout = '';
		let stderr = '';

		proc.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		proc.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		proc.on('close', (code) => {
			if (code !== 0) {
				console.error('yt-dlp 錯誤:', stderr);
				reject(new Error(`yt-dlp 錯誤: ${stderr || '未知錯誤'}`));
				return;
			}

			const title = stdout.trim() || 'youtube_audio';
			console.log('影片標題:', title);
			resolve({ title });
		});

		proc.on('error', (err) => {
			reject(new Error(`無法執行 yt-dlp: ${err.message}`));
		});
	});
}

/**
 * 使用 yt-dlp 下載音訊並串流回應
 * @param {string} videoUrl - YouTube 影片網址
 * @param {import('express').Response} res - Express response
 */
async function downloadAudio(videoUrl, res) {
	return new Promise((resolve, reject) => {
		const args = [
			...getCookiesArgs(),
			'-f', 'bestaudio[ext=m4a]/bestaudio',
			'--no-warnings',
			'--no-playlist',
			'-o', '-',  // 輸出到 stdout
			videoUrl,
		];

		console.log('開始下載音訊...');
		const proc = spawn('yt-dlp', args);

		let stderr = '';
		let hasData = false;

		proc.stdout.on('data', (chunk) => {
			hasData = true;
			res.write(chunk);
		});

		proc.stderr.on('data', (data) => {
			stderr += data.toString();
			// 顯示進度
			const progress = data.toString();
			if (progress.includes('%')) {
				process.stdout.write(`\r${progress.trim()}`);
			}
		});

		proc.on('close', (code) => {
			console.log('\n下載完成');
			if (code !== 0 && !hasData) {
				reject(new Error(`下載失敗: ${stderr || '未知錯誤'}`));
				return;
			}
			res.end();
			resolve();
		});

		proc.on('error', (err) => {
			reject(new Error(`無法執行 yt-dlp: ${err.message}`));
		});

		// 如果客戶端斷開連接，終止下載
		res.on('close', () => {
			if (!proc.killed) {
				proc.kill();
			}
		});
	});
}

module.exports = {
	getVideoInfo,
	downloadAudio,
};
