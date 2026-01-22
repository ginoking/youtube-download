var express = require('express');
var router = express.Router();
const youtubedl = require('youtube-dl-exec');

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
    if (!req.body.url.includes('youtube.com')) {
        return res.redirect('/download?error=2');
    }

    youtubedl(req.body.url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        format: 'bestaudio[ext=m4a]/bestaudio',
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
    }).then(async (info) => {
        console.log('取得影片資訊:', info.title);
        console.log('音訊 URL:', info.url);

        // 設定回應標頭
        const filename = encodeURIComponent(info.title.replace(/[<>:"/\\|?*]/g, '_')) + '.m4a';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'audio/mp4');

        // 串流轉傳
        const response = await fetch(info.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.youtube.com/'
            }
        });

        if (!response.ok) {
            throw new Error(`下載失敗: ${response.status}`);
        }

        // 使用 Node.js 原生串流
        const { Readable } = require('stream');
        const readable = Readable.fromWeb(response.body);
        readable.pipe(res);

        readable.on('error', (err) => {
            console.error('串流錯誤:', err);
            if (!res.headersSent) {
                res.redirect('/download?error=2');
            }
        });
    }).catch(err => {
        console.error('下載錯誤:', err); // 打印錯誤信息
        console.error('錯誤類型:', err.name); // 打印錯誤類型
        console.error('錯誤消息:', err.message); // 打印錯誤消息
        console.error('錯誤堆棧:', err.stack); // 打印錯誤堆棧
        return res.redirect('/download?error=2');
    })
});

module.exports = router;
