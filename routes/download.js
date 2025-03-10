var express = require('express');
var router = express.Router();
const fs = require('fs');
const youtubedl = require('youtube-dl-exec')
const { spawn } = require('child_process');

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

    // 驗證是否為youtube網址
    if (!req.body.url.includes('youtube.com')) {
        return res.redirect('/download?error=2');
    }

    youtubedl(req.body.url, {
        audioQuality: 0,
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        extractAudio: true,
        audioFormat: 'm4a',
        format: 'bestaudio[ext=m4a]',
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
        output: '%(title)s.%(ext)s',
        // httpChunkSize: '1M',
        // postprocessorArgs: ['-threads', '4'],
        // externalDownloader: 'aria2c',
        // externalDownloaderArgs: ['--max-connection-per-server=16', '--split=16', '--min-split-size=1M', '--max-concurrent-downloads=16']
    }).then(info => {
        console.log(info.url);
        const downloadUrl = info.url;
        // 使用 aria2c 來下載
        const aria2 = spawn('aria2c', [
            '--max-connection-per-server=16',
            '--split=16',
            '--min-split-size=1M',
            '--max-concurrent-downloads=16',
            '-o', `${info.title}.m4a`,  // 設定輸出檔案名稱
            downloadUrl
        ]);

        // 監聽下載過程
        aria2.stdout.on('data', (data) => {
            console.log(`aria2c: ${data}`);
        });

        aria2.stderr.on('data', (data) => {
            console.error(`aria2c 錯誤: ${data}`);
        });

        aria2.on('close', (code) => {
            console.log(`aria2c 下載完成，退出碼: ${code}`);
            res.download(`${info.title}.m4a`, `${info.title}.m4a`, (err) => {
                if (err) {
                    console.error('下載錯誤:', err);
                    res.status(500).send('下載失敗');
                } else {
                    fs.unlink(`${info.title}.m4a`, (err) => {
                        if (err) {
                            console.error('刪除錯誤:', err);
                        }
                    });
                }
            });
        });
    }).catch(err => {
        console.error('下載錯誤:', err); // 打印錯誤信息
        console.error('錯誤類型:', err.name); // 打印錯誤類型
        console.error('錯誤消息:', err.message); // 打印錯誤消息
        console.error('錯誤堆棧:', err.stack); // 打印錯誤堆棧
        res.status(500).send(err);
    })
});

module.exports = router;
