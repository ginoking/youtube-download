var express = require('express');
var router = express.Router();
const { getVideoInfo, downloadAudio } = require('../lib/youtube');

router.post('/check', async function (req, res) {
	const birthday = req.body.birthday;

	// 恢復驗證完整的出生年月日
	if (birthday === '1997-03-26') {
		req.session.verified = true;
		return res.redirect('/download');
	}

	res.redirect('/?error=1');
});

router.post('/download', async function (req, res) {
	if (!req.session.verified) {
		return res.redirect('/');
	}

	const url = req.body.url;

	// 驗證網址
	if (!url || !url.includes('http')) {
		return res.redirect('/download?error=2');
	}

	if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
		return res.redirect('/download?error=2');
	}

	try {
		console.log('開始處理:', url);

		// 取得影片資訊
		const { title } = await getVideoInfo(url);

		// 移除檔名中的非法字元
		const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_');
		const encodedTitle = encodeURIComponent(safeTitle);

		// 關鍵修正：改用 MP3 格式以獲得最強播放相容性
		res.setHeader(
			'Content-Disposition',
			`attachment; filename="audio.mp3"; filename*=UTF-8''${encodedTitle}.mp3`
		);
		res.setHeader('Content-Type', 'audio/mpeg');

		// 下載並串流音訊
		await downloadAudio(url, res);

	} catch (err) {
		console.error('下載錯誤:', err.message);
		if (!res.headersSent) {
			// 將錯誤訊息帶回頁面以便診斷
			return res.redirect(`/download?error=${encodeURIComponent(err.message)}`);
		}
	}
});

module.exports = router;
