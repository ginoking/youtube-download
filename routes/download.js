var express = require('express');
const https = require("https");
var router = express.Router();
const fs = require('fs');
const youtubedl = require('youtube-dl-exec')

router.post('/download', async function (req, res) {

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
        httpChunkSize: '1M',
        postprocessorArgs: ['-threads', '4'],
        externalDownloader: 'aria2c',
        externalDownloaderArgs: ['--max-connection-per-server=16', '--split=16', '--min-split-size=1M', '--max-concurrent-downloads=16']
    }).then(info => {
        https.get(info.url, function (file) {
            requestedDownloads = info.requested_downloads
            downloadOption = requestedDownloads[0]
            res.set('Content-disposition', 'attachment; filename=' + encodeURI(downloadOption.filename));
            res.set('Content-Type', 'audio/m4a');
            file.pipe(res);
        });
    }).catch(err => {
        console.error('下載錯誤:', err); // 打印錯誤信息
        console.error('錯誤類型:', err.name); // 打印錯誤類型
        console.error('錯誤消息:', err.message); // 打印錯誤消息
        console.error('錯誤堆棧:', err.stack); // 打印錯誤堆棧
        res.status(500).send(err);
    })
});

router.get('/download', function (req, res, next) {
    res.send('download get');
});

module.exports = router;
