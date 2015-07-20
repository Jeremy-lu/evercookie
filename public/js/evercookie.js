// Add trim function
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

var evercookie = {};

evercookie.get = function(name, callback) {
    var result = {};
    ecEtag(name, null, function(etagVal) {
        ecLso(name, null, function(lsoVal) {
            ecCache(name, null, function(pngVal) {
                ecCache(name, null, function(cacheVal) {
                    ecCache(name, null, function(dbVal) {
                        result['cookie'] = ecCookie(name);
                        result['session'] = ecSessionStorage(name);
                        result['local storage'] = ecLocalStorage(name);
                        result['etag'] = etagVal;
                        result['flash(lso)'] = lsoVal;
                        result['cache'] = cacheVal;
                        result['png'] = pngVal;
                        result['database'] = dbVal;
                        result['user data'] = ecUserData(name);
                        callback(result);
                    });
                });
            });
        });
    });
};

evercookie.set = function(name, val) {
    ecCookie(name, val);
    ecSessionStorage(name, val);
    ecLocalStorage(name, val);
    ecEtag(name, val);
    ecLso(name, val);
    ecCache(name, val);
    ecPng(name, val);
    ecDb(name, val);
    ecUserData(name, val);
};

evercookie.setCookie = function(name, val) {
    ecCookie(name, val);
};

evercookie.recover = function(name, callback) {
    evercookie.get(name, function(result) {
        var occurTimes = {};
        var key, val;

        for(key in result) {
            val = result[key];
            if(val) {
                if(occurTimes[val]) {
                    occurTimes[val] += 1;
                } else {
                    occurTimes[val] = 1;
                }
            }
        }

        var maxOccurTime = 0;
        var select = null;
        for(key in occurTimes) {
            if(occurTimes[key] > maxOccurTime) {
                maxOccurTime = occurTimes[key];
                select = key;
            }
        }
        console.log(select);
        if(select) evercookie.set(name, select);
        callback();
    });
};

function ecCookie(name, val) {
    if ((val !== undefined) && val !== null) {
        var d = new Date();
        d.setFullYear(d.getFullYear() + 10);
        document.cookie = name + '=' + val + '; expires=' + d.toUTCString();
    } else {
        return getValueFromStr(document.cookie, name);
    }
}

function ecSessionStorage(name, val) {
    if (!window.sessionStorage) return;

    if ((val !== undefined) && val !== null) {
        window.sessionStorage.setItem(name, val);
    } else {
        return window.sessionStorage.getItem(name);
    }
}

function ecLocalStorage(name, val) {
    if (!window.localStorage) return;

    if ((val !== undefined) && val !== null) {
        window.localStorage.setItem(name, val);
    } else {
        return window.localStorage.getItem(name);
    }
}

function ecEtag(name, val, callback) {
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

function ecLso(name, val, callback) {
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
        flashvars.everdata = name + '=' + val;
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
                    callback(getValueFromStr(_global_lso, name, '&'));
                }
            } else if(!_global_lso) {
                if(tryCount < maxTryCount) {
                    tryCount = tryCount + 1;
                    reqSwf();
                    getData();
                } else {
                    callback(getValueFromStr(_global_lso, name, '&'));
                }
            } else {
                callback(getValueFromStr(_global_lso, name, '&'));
                _global_lso = null;
            }
        };

        getData();
    }
}

function ecCache(name, val, callback) {
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

function ecPng(name, val, callback) {
    var cookieName = 'evercookie_png';
    var canvas = document.createElement('canvas');

    if(!canvas || !canvas.getContext) {
        if(callback) callback(null);
        return;
    }

    if (val) {
        document.cookie = cookieName + '=' + val + '; path=/';
        ajax({
            url: '/evercookie/png?name=' + cookieName,
            nocache: true,
            success: function() {}
        });
    } else {
        canvas.style.visibility = 'hidden';
        canvas.style.position = 'absolute';
        canvas.width = 200;
        canvas.height = 1;

        document.cookie = cookieName + '=';

        var image = document.createElement('img');
        image.style.visibility = 'hidden';
        image.style.position = 'absolute';

        image.onload = function() {
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            var imgData;
            var tmp = ctx.getImageData(0, 0, 200, 1);

            if(!tmp) {
                if(callback) callback(null);
                return;
            }

            imgData = tmp.data;
            var data = '';

            for(var i=0, il=imgData.length; i<il; i += 4) {
                if(imgData[i] === 0) break;
                data += String.fromCharCode(imgData[i]);

                if(imgData[i+1] === 0) break;
                data += String.fromCharCode(imgData[i+1]);

                if(imgData[i+2] === 0) break;
                data += String.fromCharCode(imgData[i+2]);
            }

            if(callback) callback(data);
        };

        image.src = '/evercookie/png?name=' + cookieName;
    }
}

function ecDb(name, val, callback) {
    if(!window.openDatabase) {
        if(callback) callback(null);
        return;
    }

    var db = window.openDatabase('db_bwoslq', '', 'bwoslq', 1024*1024);

    if((val !== undefined) && (val !== null)) {
        db.transaction(function(tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS bwosq (' +
                'id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                'name TEXT NOT NULL ,' +
                'val TEXT NOT NULL ,' +
                'UNIQUE (name) ,' +
                ')', [], function(tx, result) {}, function(tx, err) {});

            tx.executeSql('INSERT OR REPLACE INTO bwosq (name, val) VALUES (?, ?)' +
                [name, val], function(tx, result) {}, function(tx, err) {});
        });
    } else {
        db.transaction(function(tx) {
            tx.executeSql('select val from bwosq where name = ?',
                [name], function(tx, result) {
                    if(result && result.rows.length) {
                        if(callback) callback(result.rows[0].val);
                    } else {
                        if(callback) callback(null);
                    }
                }, function(tx, err) {});
        });
    }
}

// TODO
// The user data will disappear after the browser be closed.
// And, the data didn't shared between two tabs;
function ecUserData(name, val) {
    try {
        var el;
        if(document.getElementById('rfvbgt')) {
            el = document.getElementById('rfvbgt');
        } else {
            el = document.createElement('div');
            el.id = 'rfvbgt';
            el.style.display = 'hidden';
            el.style.position = 'absolute';
            document.body.appendChild(el);
        }
        el.style.behavior = 'url("#default#userData")';

        if((val !== undefined) && (val !== null)) {
            var d = new Date();
            d.setFullYear(d.getFullYear() + 10);

            el.expires = d.toUTCString();
            el.setAttribute(name, val);
            el.save(name);
        } else {
            el.load(name);
            return el.getAttribute(name);
        }
    } catch (e) {
        return null;
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
