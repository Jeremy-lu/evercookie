var express = require('express');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');

var app = express();

app.use(cookieParser());
app.use(morgan(':method :url :status'));

app.get('/', function(req, res) {
    res.send('Welcome come evercookie!');
});

app.set('port', process.env.PORT || 9334);
app.listen(app.get('port'), function() {
    console.log('Server listening on port ' + app.get('port'));
});