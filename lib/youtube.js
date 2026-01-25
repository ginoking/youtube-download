const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Secret 掛載的 cookies 檔案路徑
const MOUNTED_COOKIES_PATH = '/secrets/cookies.txt';
const COOKIES_PATH = path.join(os.tmpdir(), 'youtube_cookies.txt');

// 複製 cookies 到暫存目錄（因為掛載的 secret 是唯讀的）
function initCookies() {
	if (fs.existsSync(MOUNTED_COOKIES_PATH)) {
		const content = fs.readFileSync(MOUNTED_COOKIES_PATH, 'utf-8');
		fs.writeFileSync(COOKIES_PATH, content);
		console.log('已複製 cookies 到:', COOKIES_PATH);
		return true;
	}
	console.log('Cookies 檔案不存在:', MOUNTED_COOKIES_PATH);
	return false;
}

const hasCookiesFile = initCookies();

// 檢查 cookies 檔案是否存在
function hasCookies() {
	return hasCookiesFile;
}

/**
 * 取得 cookies 參數（如果有設定）
 */
function getCookiesArgs() {
	if (hasCookies()) {
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
			'--extractor-args', 'youtube:player_client=ios,web',
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
			'--extractor-args', 'youtube:player_client=ios,web',
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
