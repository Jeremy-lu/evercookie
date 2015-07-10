var express = require('express');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');

var app = express();

app.use(cookieParser());
app.use(morgan(':method :url :status'));
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    var cookieVal;

    switch(req.path) {
        case '/favicon.ico':
            res.writeHead(200, {'Content-Type': 'image/x-icon'});
            break;
        case '/evercookie/etag':
            cookieVal = req.cookies[req.query.name];
            // console.log();
            // console.log('***********  cookie: ', cookieVal);
            // console.log('****  If-None-Match: ', req.get('If-None-Match'));
            // console.log();
            if (!cookieVal) cookieVal = req.get('If-None-Match');

            if (cookieVal) {
                res.set('Etag', cookieVal);
                res.send(cookieVal);
            } else {
                res.sendStatus(304);
            }
            break;
        case '/evercookie/cache':
            console.log('cache');
            cookieVal = req.cookies[req.query.name];
            if(cookieVal) {
                var d = new Date();
                d.setFullYear(d.getFullYear() + 10);

                res.set({
                  'Content-Type': 'text/html',
                  'Expires': d.toUTCString(),
                  'Cache-Control': 'private, max-age=' + (10 * 365 * 24 * 60 * 60 * 1000)
                });
                res.send(cookieVal);
            } else {
                res.sendStatus(304);
            }
            break;
        default:
            next();
    }
});

app.set('port', process.env.PORT || 9334);
app.listen(app.get('port'), function() {
    console.log('Server listening on port ' + app.get('port'));
});