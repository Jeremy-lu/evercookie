var evercookie = {};

evercookie.get = function(key, callback) {
    var resultArr = [];
    ecEtag(key, null, function(etagVal) {
        ecLso(key, null, function(lsoVal) {
            ecCache(key, null, function(cacheVal) {
                resultArr.push('cookie ---> ' + ecCookie(key));
                resultArr.push('session ---> ' + ecSessionStorage(key));
                resultArr.push('local storage ---> ' + ecLocalStorage(key));
                resultArr.push('etag ---> ' + etagVal);
                resultArr.push('flash(lso) ---> ' + lsoVal);
                resultArr.push('cache ---> ' + cacheVal);
                callback(resultArr);
            });
        });
    });
};

evercookie.set = function(key, val) {
    ecCookie(key, val);
    ecSessionStorage(key, val);
    ecLocalStorage(key, val);
    ecEtag(key, val);
    ecLso(key, val);
    ecCache(key, val);
};

function ecCookie(key, val) {
    if ((val !== undefined) && val !== null) {
        var d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        document.cookie = key + '=' + val + '; expires=' + d.toUTCString();
    } else {
        return getValueFromStr(document.cookie, key);
    }
}

function ecSessionStorage(key, val) {
    if (!window.sessionStorage) return;

    if ((val !== undefined) && val !== null) {
        window.sessionStorage.setItem(key, val);
    } else {
        return window.sessionStorage.getItem(key);
    }
}

function ecLocalStorage(key, val) {
    if (!window.localStorage) return;

    if ((val !== undefined) && val !== null) {
        window.localStorage.setItem(key, val);
    } else {
        return window.localStorage.getItem(key);
    }
}

function ecEtag(key, val, callback) {
    var cookieName = 'evercookie_etag';

    if ((val !== undefined) && val !== null) {
        document.cookie = cookieName + '=' + val + '; path=/';
        ajax({
            url: '/evercookie/etag?name=' + cookieName,
            nocache: true,
            success: function() {}
        });
    } else {
        document.cookie = cookieName + '=';
        ajax({
            url: '/evercookie/etag?name=' + cookieName,
            success: function(data) {
                if (callback) callback(data);
            }
        });
    }
}

var _global_lso;
var reqCount = 0;
// Comunicate with local shared object(lso)
function _evercookie_flash_var(cookie) {
    reqCount = reqCount - 1;
    _global_lso = cookie;

    // remove the flash object now
    var swf = document.getElementById('myswf');
    if (swf && swf.parentNode) {
        swf.parentNode.removeChild(swf);
    }
}

function ecLso(key, val, callback) {
    var isGet = (val === undefined) || (val === null);

    var div = document.getElementById('swfcontainer'),
        flashvars = {},
        params = {},
        attributes = {};
    if (div === null || div === undefined || !div.length) {
        div = document.createElement('div');
        div.setAttribute('id', 'swfcontainer');
        document.body.appendChild(div);
    }

    if (!isGet) {
        flashvars.everdata = key + '=' + val;
    }
    params.swliveconnect = 'true';
    attributes.id = 'myswf';
    attributes.name = 'myswf';

    function reqSwf() {
        reqCount = reqCount + 1;
        window.swfobject.embedSWF('/assets/evercookie.swf', 'swfcontainer', '1', '1', '9.0.0', false, flashvars, params, attributes);
    }

    reqSwf();

    // window.swfobject.embedSWF('http://samy.pl/evercookie/evercookie.swf', 'swfcontainer', '1', '1', '9.0.0', false, flashvars, params, attributes);

    if (isGet) {
        var tryCount = 0;
        var maxTryCount = 3;
        var waitTime = 0;
        var maxWaitTime = 1000;

        var getData = function() {
            if(reqCount > 0) {
                waitTime += 50;
                if(waitTime < maxWaitTime) {
                    setTimeout(function() {
                        getData();
                    }, 50);
                } else {
                    callback(_global_lso);
                }
            } else if(!_global_lso) {
                if(tryCount < maxTryCount) {
                    tryCount = tryCount + 1;
                    reqSwf();
                    getData();
                } else {
                    callback(_global_lso);
                }
            } else {
                callback(getValueFromStr(_global_lso, key));
                _global_lso = null;
            }
        };

        getData();
    }
}

function ecCache(key, val, callback) {
    var cookieName = 'evercookie_cache';

    if (val) {
        document.cookie = cookieName + '=' + val + '; path=/';
        ajax({
            url: '/evercookie/cache?name=' + cookieName,
            nocache: true,
            success: function() {}
        });
    } else {
        document.cookie = cookieName + '=';
        ajax({
            url: '/evercookie/cache?name=' + cookieName,
            // nocache: true,
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
        // Force ignore cache
        if(isIE()) {
            headers['If-Modified-Since'] = new Date(0);
        } else {
            headers['Cache-Control'] = 'no-cache';
        }
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
