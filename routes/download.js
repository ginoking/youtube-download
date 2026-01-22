var express = require('express');
var router = express.Router();
const ytdl = require('@distube/ytdl-core');

router.post('/check', async function (req, res) {
    console.log(req.body.birthday);
    const birthday = req.body.birthday;
    if (birthday === process.env.BIRTHDAY) {
        // session 設定驗證成功，存活時間1小時
        req.session.verified = true;
        // req.session.save();
        return res.redirect('/download');
    }

    res.redirect('/?error=1');
});

router.post('/download', async function (req, res) {

    console.log(req.session.verified);
    if (!req.session.verified) {
        return res.redirect('/');
    }

    // 驗證是不是網址格式
    if (!req.body.url.includes('http')) {
        return res.redirect('/download?error=2');
    }

    // 驗證是否為youtube網址
    if (!req.body.url.includes('youtube.com') && !req.body.url.includes('youtu.be')) {
        return res.redirect('/download?error=2');
    }

    try {
        // 取得影片資訊
        const info = await ytdl.getInfo(req.body.url);
        console.log('取得影片資訊:', info.videoDetails.title);

        // 設定回應標頭
        const filename = encodeURIComponent(info.videoDetails.title.replace(/[<>:"/\\|?*]/g, '_')) + '.m4a';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'audio/mp4');

        // 直接串流音訊
        const stream = ytdl(req.body.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
        });

        stream.pipe(res);

        stream.on('error', (err) => {
            console.error('串流錯誤:', err);
            if (!res.headersSent) {
                res.redirect('/download?error=2');
            }
        });

    } catch (err) {
        console.error('下載錯誤:', err);
        console.error('錯誤消息:', err.message);
        return res.redirect('/download?error=2');
    }
});

module.exports = router;
