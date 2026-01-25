var express = require('express');
var router = express.Router();
const { getVideoInfo, downloadAudio } = require('../lib/youtube');

router.post('/check', async function (req, res) {
	const birthday = req.body.birthday;

	if (birthday === process.env.BIRTHDAY) {
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

		const filename =
			encodeURIComponent(title.replace(/[<>:"/\\|?*]/g, '_')) + '.m4a';

		res.setHeader(
			'Content-Disposition',
			`attachment; filename="${filename}"`
		);
		res.setHeader('Content-Type', 'audio/mp4');

		// 下載並串流音訊
		await downloadAudio(url, res);

	} catch (err) {
		console.error('下載錯誤:', err);
		console.error('錯誤訊息:', err.message);

		if (!res.headersSent) {
			return res.redirect('/download?error=2');
		}
	}
});

module.exports = router;
