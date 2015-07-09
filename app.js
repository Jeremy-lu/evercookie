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
        default:
            next();
    }
});

app.set('port', process.env.PORT || 9334);
app.listen(app.get('port'), function() {
    console.log('Server listening on port ' + app.get('port'));
});