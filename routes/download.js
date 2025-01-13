var express = require('express');
var router = express.Router();
const fs = require('fs');
// const { Downloader } = require('ytdl-mp3');

const ytdl = require('@distube/ytdl-core');

router.post('/download', async function (req, res) {
    // res.send(req.body.url);
    // const downloader = new Downloader({
    //     outputDir: './',
    //     getTags: true
    // });
    // await downloader.downloadSong(req.body.url);
    const output = 'audio.mp3'; // 输出文件名
    const stream = ytdl('https://www.youtube.com/watch?v=UQrP7l2AAVk&list=RDUQrP7l2AAVk', { filter: 'audioonly', highWaterMark: 1 << 25  })
        .pipe(require("fs").createWriteStream(output));

    ytdl.getBasicInfo("https://www.youtube.com/watch?v=UQrP7l2AAVk&list=RDUQrP7l2AAVk").then(info => {
        console.log(info.videoDetails.title);
    });

    // const stream = ytdl(req.body.url, { filter: 'audioonly' }) // 只提取音频
    //     .pipe(fs.createWriteStream(output));

    // stream.on('drain', (info) => {
    //     console.log('下载进度: ' + info.videoDetails.title);
    // });

    stream.on('open', () => {
        console.log('下载开始');
    });

    stream.on('data', (chunk) => {
        console.log('下载进度: ' + chunk.length);
    });

    stream.on('error', (err) => {
        console.log('下载失败: ' + err.message);
    });

    stream.on('close', () => {
        console.log('下载结束');
    });

    stream.on('drain', () => {
        console.log('下载进度drain: ' + stream.bytesRead);
    });

    stream.on('pipe', () => {
        console.log('下载进度pipe: ' + stream.bytesRead);
    });

    stream.on('ready', () => {
        console.log('下载进度ready: ' + stream.bytesRead);
    });

    stream.on('unpipe', () => {
        console.log('下载进度unpipe: ' + stream.bytesRead);
    });

    stream.on('finish', () => {
        // res.send('MP3 下载完成');
        // 下载完成后，提供下载链接
        res.download(output, 'downloaded_audio.mp3', (err) => {
            if (err) {
                res.status(500).send('下载失败: ' + err.message);
            }
            // 可选：下载完成后删除文件
            fs.unlink(output, (err) => {
                if (err) console.error('无法删除文件: ' + err.message);
            });
        });
    });

    stream.on('error', (err) => {
        res.status(500).send('下载失败: ' + err.message);
    });
    // res.send('download post');
});

router.get('/download', function (req, res, next) {
    res.send('download get');
});

module.exports = router;
