var evercookie = {};

evercookie.get = function(key, callback) {
    var resultArr = [];
    ecEtag(key, null, function(etagVal) {
        resultArr.push('cookie ---> ' + ecCookie(key));
        resultArr.push('session ---> ' + ecSessionStorage(key));
        resultArr.push('local storage ---> ' + ecLocalStorage(key));
        resultArr.push('etag ---> ' + etagVal);
        callback(resultArr);
    });
};

evercookie.set = function(key, val) {
    ecCookie(key, val);
    ecSessionStorage(key, val);
    ecLocalStorage(key, val);
    ecEtag(key, val);
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

function ecSessionStorage(key, value) {
    if (!window.sessionStorage) return;

    if (value) {
        window.sessionStorage.setItem(key, value);
    } else {
        return window.sessionStorage.getItem(key);
    }
}

function ecLocalStorage(key, value) {
    if (!window.localStorage) return;

    if (value) {
        window.localStorage.setItem(key, value);
    } else {
        return window.localStorage.getItem(key);
    }
}

function ecEtag(key, value, callback) {
    var cookieName = 'evercookie_etag';

    if (value) {
        document.cookie = cookieName + '=' + value + '; path=/';
        ajax({
            url: '/evercookie/etag.html?name=' + cookieName,
            nocache: true,
            success: function() {}
        });
    } else {
        document.cookie = cookieName + '=';
        ajax({
            url: '/evercookie/etag.html?name=' + cookieName,
            success: function(data) {
                if (callback) callback(data);
            }
        });
    }
}



function ajax(settings) {
    var headers, name, transports, transport, i, length;

    headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if(settings.nocache) {
        // Force IE to ignore cache
        if(isIE()) headers['If-Modified-Since'] = new Date(0);
    }

    transports = [
        function() {
            return new XMLHttpRequest();
        },
        function() {
            return new ActiveXObject('Msxml2.XMLHTTP');
        },
        function() {
            return new ActiveXObject('Microsoft.XMLHTTP');
        }
    ];

    for (i = 0, length = transports.length; i < length; i++) {
        transport = transports[i];
        try {
            transport = transport();
            break;
        } catch (e) {}
    }

    transport.onreadystatechange = function() {
        if (transport.readyState !== 4) {
            return;
        }
        settings.success(transport.responseText);
    };
    transport.open('get', settings.url, true);
    for (name in headers) {
        transport.setRequestHeader(name, headers[name]);
    }
    transport.send();
}

function isIE() {
    if (!navigator.userAgent) return false;

    var agent = navigator.userAgent.toLowerCase();
    //IE
    if ((agent.indexOf('msie') > 0) || (agent.indexOf('trident') > 0)) {
        return true;
    } else {
        return false;
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
