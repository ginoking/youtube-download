var express = require('express');
var router = express.Router();
// const { Downloader } = require('ytdl-mp3');

router.post('/download', async function (req, res, next) {
    res.send('download post');
    // const downloader = new Downloader({
    //     getTags: true
    // });
    // await downloader.downloadSong(req.body.url);
    // res.send('download post');
});

router.get('/download', function (req, res, next) {
    res.send('download get');
});

module.exports = router;
