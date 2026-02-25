const { spawn } = require('child_process');
const fs = require('fs');

/**
 * 取得影片資訊 (Stealth 模式)
 */
async function getVideoInfo(videoUrl) {
	return new Promise((resolve, reject) => {
		const args = [
			'--no-playlist',
			'--force-ipv4',
			'--extractor-args', 'youtube:player_client=android,ios;player_skip=web,web_embedded',
			'--print', '%(title)s',
			'--no-warnings',
			videoUrl,
		];

		console.log('取得影片資訊...');
		const proc = spawn('/usr/local/bin/yt-dlp', args);

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
 * 下載音訊並透過 FFmpeg 轉碼為 MP3 (最穩定的串流格式)
 */
async function downloadAudio(videoUrl, res) {
	return new Promise((resolve, reject) => {
		const ytArgs = [
			'--no-playlist',
			'--force-ipv4',
			'--no-check-certificates',
			'--extractor-args', 'youtube:player_client=android,ios;player_skip=web,web_embedded',
			'--concurrent-fragments', '5',
			'-f', 'ba/ba*/best',
			'--no-warnings',
			'-o', '-', 
			videoUrl,
		];

		// 改用 mp3 封裝，這在串流傳輸時最為穩定
		const ffArgs = [
			'-i', 'pipe:0',
			'-vn',
			'-acodec', 'libmp3lame',
			'-ab', '192k',
			'-ar', '44100',
			'-f', 'mp3',
			'pipe:1'
		];

		console.log('啟動 yt-dlp + ffmpeg (MP3 轉碼)...');
		const ytProc = spawn('/usr/local/bin/yt-dlp', ytArgs);
		const ffProc = spawn('ffmpeg', ffArgs);

		ytProc.stdout.pipe(ffProc.stdin);

		let ytStderr = '';
		let ffStderr = '';
		let hasData = false;

		ffProc.stdout.on('data', (chunk) => {
			hasData = true;
			res.write(chunk);
		});

		ytProc.stderr.on('data', (data) => ytStderr += data.toString());
		ffProc.stderr.on('data', (data) => ffStderr += data.toString());

		ffProc.on('close', (code) => {
			console.log('FFmpeg 處理結束, Code:', code);
			if (code !== 0 && !hasData) {
				reject(new Error(`下載處理失敗: ${ffStderr || ytStderr}`));
				return;
			}
			res.end();
			resolve();
		});

		ytProc.on('error', (err) => reject(new Error(`yt-dlp 啟動失敗: ${err.message}`)));
		ffProc.on('error', (err) => reject(new Error(`ffmpeg 啟動失敗: ${err.message}`)));

		res.on('close', () => {
			if (!ytProc.killed) ytProc.kill('SIGKILL');
			if (!ffProc.killed) ffProc.kill('SIGKILL');
		});
	});
}

module.exports = {
	getVideoInfo,
	downloadAudio,
};
