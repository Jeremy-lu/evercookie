var express = require('express');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');

var app = express();

app.use(cookieParser());
app.use(morgan(':method :url :status'));
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    switch(req.path) {
        case '/favicon.ico':
            res.writeHead(200, {'Content-Type': 'image/x-icon'});
            break;
        case '/evercookie/etag.html':
            var val = req.cookies[req.query.name];
            console.log();
            console.log('***********  cookie: ', val);
            console.log('****  If-None-Match: ', req.get('If-None-Match'));
            console.log();
            if (!val) val = req.get('If-None-Match');

            if (val) {
                res.set('Etag', val);
                res.send(val);
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