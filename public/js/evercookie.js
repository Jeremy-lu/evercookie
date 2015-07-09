var evercookie = {};

evercookie.get = function(key, callback) {
    var resultArr = [];
    resultArr.push('cookie  --->   ' + ecCookie(key));
    callback(resultArr);
};

evercookie.set = function(key, val) {
    ecCookie(key, val);
};

function ecCookie(key, val) {
    if (val) {
        var d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        document.cookie = key + '=' + val + '; expires=' + d.toUTCString();
    } else {
        return getValueFromStr(document.cookie, key);
    }
}

function getValueFromStr(str, key, splitChar) {
    splitChar = splitChar || ';';
    var cookieArray = str.split(splitChar);
    for (var i = 0, il = cookieArray.length; i < il; i++) {
        var cookie = cookieArray[i];
        var splitIndex = cookie.indexOf('=');
        var tmpKey = cookie.slice(0, splitIndex).trim();
        var val = cookie.slice(splitIndex + 1).trim();

        if (tmpKey === key) return val;
    }
    return null;
}
