var express = require('express');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var Png = require('png').Png;

var app = express();

app.use(cookieParser());
app.use(morgan(':method :url :status'));
app.use(express.static(__dirname + '/public', {
   setHeaders: setHeaders
}));

app.use(function(req, res, next) {
    var cookieVal, date;

    switch(req.path) {
        case '/favicon.ico':
            res.writeHead(200, {'Content-Type': 'image/x-icon'});
            break;
        case '/evercookie/etag':
            cookieVal = req.cookies[req.query.name];
            if (!cookieVal) cookieVal = req.get('If-None-Match');

            if (cookieVal) {
                res.set('Etag', cookieVal);
                res.send(cookieVal);
            } else {
                res.sendStatus(304);
            }
            break;
        case '/evercookie/cache':
            cookieVal = req.cookies[req.query.name];
            if(cookieVal) {
                date = new Date();
                date.setFullYear(date.getFullYear() + 10);

                res.set({
                  'Content-Type': 'text/plain',
                  'Expires': date.toUTCString(),
                  'Cache-Control': 'public, max-age=' + (10 * 365 * 24 * 60 * 60 * 1000)
                });
                res.send(cookieVal);
            } else {
                res.sendStatus(304);
            }
            break;
        case '/evercookie/png':
            cookieVal = req.cookies[req.query.name];

            if(cookieVal) {
                var arr = [];
                for(var i=0, il=cookieVal.length; i<il; i++) {
                    arr.push(cookieVal.charCodeAt(i));
                }

                var png = new Png(new Buffer(arr), 200, 1);
                png = png.encodeSync();

                date = new Date();
                date.setFullYear(date.getFullYear() + 10);

                res.set({
                  'Content-Type': 'image/png',
                  'Expires': date.toUTCString(),
                  'Cache-Control': 'public, max-age=' + (10 * 365 * 24 * 60 * 60 * 1000)
                });

                res.send(png);
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

function setHeaders(res) {
    res.set('P3P', ['policyref="/w3c/p3p.xml", CP="IDC DSP COR ADM DEVi TAIi PSA PSD IVAi IVDi CONi HIS OUR IND CNT", CP="CAO PSA OUR"']);
    res.set('Access-Control-Allow-Origin', '*');
}
