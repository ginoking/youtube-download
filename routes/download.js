var express = require('express');
var router = express.Router();

const COBALT_API_URL = process.env.COBALT_API_URL || 'http://localhost:9000';

router.post('/check', async function (req, res) {
    console.log(req.body.birthday);
    const birthday = req.body.birthday;
    if (birthday === process.env.BIRTHDAY) {
        // session 設定驗證成功，存活時間1小時
        req.session.verified = true;
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
        console.log('呼叫 Cobalt API:', COBALT_API_URL);

        // 呼叫 Cobalt API 取得下載資訊
        const cobaltResponse = await fetch(`${COBALT_API_URL}/`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: req.body.url,
                downloadMode: 'audio',
                audioFormat: 'mp3',
            }),
        });

        const cobaltData = await cobaltResponse.json();
        console.log('Cobalt 回應:', cobaltData);

        if (cobaltData.status === 'error') {
            console.error('Cobalt 錯誤:', cobaltData.error?.code);
            return res.redirect('/download?error=2');
        }

        // 取得下載 URL
        let downloadUrl;
        let filename;

        if (cobaltData.status === 'tunnel' || cobaltData.status === 'redirect') {
            downloadUrl = cobaltData.url;
            filename = cobaltData.filename || 'audio.mp3';
        } else if (cobaltData.status === 'picker') {
            // 如果有多個選項，取第一個音訊
            const audioItem = cobaltData.picker?.find(item => item.type === 'audio') || cobaltData.picker?.[0];
            if (audioItem) {
                downloadUrl = audioItem.url;
                filename = audioItem.filename || 'audio.mp3';
            }
        }

        if (!downloadUrl) {
            console.error('無法取得下載 URL');
            return res.redirect('/download?error=2');
        }

        console.log('下載 URL:', downloadUrl);
        console.log('檔案名稱:', filename);

        // 串流下載內容給用戶
        const downloadResponse = await fetch(downloadUrl);

        if (!downloadResponse.ok) {
            console.error('下載失敗:', downloadResponse.status);
            return res.redirect('/download?error=2');
        }

        // 設定回應標頭
        const safeFilename = encodeURIComponent(filename.replace(/[<>:"/\\|?*]/g, '_'));
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // 如果有 Content-Length，也設定
        const contentLength = downloadResponse.headers.get('content-length');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }

        // 串流轉傳
        const { Readable } = require('stream');
        const nodeStream = Readable.fromWeb(downloadResponse.body);
        nodeStream.pipe(res);

        nodeStream.on('error', (err) => {
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
