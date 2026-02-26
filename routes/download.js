var express = require('express');
var router = express.Router();
const { getVideoInfo, downloadAudio } = require('../lib/youtube');
const { cleanYoutubeUrl } = require('../lib/utils');

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

	let url = req.body.url;

	// 使用工具函數清理並驗證網址
	url = cleanYoutubeUrl(url);
	if (!url) {
		return res.redirect('/download?error=網址無效');
	}

	try {
		console.log('開始處理清理後的網址:', url);

		// 取得影片資訊
		const { title } = await getVideoInfo(url);

		// 移除檔名中的非法字元
		const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_');
		const encodedTitle = encodeURIComponent(safeTitle);

		// 恢復為音訊類型，前端將透過 Blob 處理下載
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
