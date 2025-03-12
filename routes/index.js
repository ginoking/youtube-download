var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('check', { error: req.query.error });
});

router.get('/download', function(req, res, next) {
  if (!req.session.verified) {
    return res.redirect('/');
  }
  res.render('index', { title: '下載Youtube音樂', error: req.query.error });
});

module.exports = router;
