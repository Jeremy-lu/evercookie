// Add trim function
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

var evercookie = {};
var dmp = {
    errors: []
};

var protocol = location.protocol === 'https:' ? 'https:' : 'http:';

evercookie.get = function(name, callback) {
    var result = {};
    var etagFinish = false;
    var lsoFinish = false;
    var cacheFinish = false;
    var dbFinish = false;
    var pngFinish = false;

    ecEtag(name, null, function(val) {
        result.etag = val;
        etagFinish = true;
    });
    ecLso(name, null, function(val) {
        result.lso = val;
        lsoFinish = true;
    });
    ecCache(name, null, function(val) {
        result.cache = val;
        cacheFinish = true;
    });
    ecDb(name, null, function(val) {
        result.db = val;
        dbFinish = true;
    });
    ecPng(name, null, function(val) {
        result.png = val;
        pngFinish = true;
    });

    result.cookie = ecCookie(name);
    result.session = ecSessionStorage(name);
    result.local = ecLocalStorage(name);
    result.userdata = ecUserData(name);

    var tryCount = 10;
    var waitTime = 100;
    var isFinished = false;

    var tryBack = function() {
        if(isFinished) return;

        if(etagFinish && lsoFinish && cacheFinish && dbFinish && pngFinish) {
            isFinished = true;
            callback(result);
        } else {
            tryCount = tryCount - 1;
            if(tryCount > 0) {
                setTimeout(function() {
                    tryBack();
                }, waitTime);
            } else {
                callback(result);
            }
        }
    };

    tryBack();
};

evercookie.set = function(name, val) {
    ecCookie(name, val);
    ecSessionStorage(name, val);
    ecLocalStorage(name, val);
    ecEtag(name, val);
    ecLso(name, val);
    ecCache(name, val);
    ecDb(name, val);
    ecUserData(name, val);
    ecPng(name, val);
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
        if(select) evercookie.set(name, select);
        if(callback) callback();
    });
};

function ecCookie(name, val) {
    if (val) {
        setCookieValue(name, val, 10 * 365);
    } else {
        return getValueFromStr(document.cookie, name);
    }
}

function ecSessionStorage(name, val) {
    if (!window.sessionStorage) return null;

    if (val) {
        window.sessionStorage.setItem(name, val);
    } else {
        return window.sessionStorage.getItem(name);
    }
}

function ecLocalStorage(name, val) {
    if (!window.localStorage) {
        dmp.errors.push({
            name: 'not support window.localStorage'
        });
        return null;
    }

    if (val) {
        window.localStorage.setItem(name, val);
    } else {
        return window.localStorage.getItem(name);
    }
}

function ecEtag(name, val, callback) {
    var cookieName = 'ec_etag';

    if (val) {
        setCookieValue(cookieName, val, 10 * 365);
        ajax({
            url: '/evercookie/etag?name=' + cookieName,
            nocache: true,
            success: function() {}
        });
    } else {
        setCookieValue(cookieName, '', -3);
        ajax({
            url: '/evercookie/etag?name=' + cookieName,
            success: function(data) {
                if(!data) data = null;
                if (callback) callback(data);
            }
        });
    }
}

var _global_lso = null;
// Comunicate with local shared object(lso)
function _evercookie_flash_var(cookie) {
    if(cookie && cookie !== 'undefined') _global_lso = cookie;

    // remove the flash object now
    var swf = document.getElementById('myswf');
    if (swf && swf.parentNode) {
        swf.parentNode.removeChild(swf);
    }
}

function ecLso(name, val, callback) {
    var div = document.getElementById('swfcontainer'),
        flashvars = {},
        params = {},
        attributes = {};
    if (!div) {
        div = document.createElement('div');
        div.setAttribute('id', 'swfcontainer');
        document.body.appendChild(div);
    }

    if (val) {
        flashvars.everdata = name + '=' + val;
    }
    params.swliveconnect = 'true';
    attributes.id = 'myswf';
    attributes.name = 'myswf';

    window.swfobject.embedSWF(protocol + '//www.evercookie.com/assets/evercookie.swf', 'swfcontainer', '1', '1', '9.0.0', false, flashvars, params, attributes);

    if (!val) {
        var tryCount = 10;
        var waitTime = 100;
        var isFinished = false;

        var getData = function() {
            if(isFinished) return;

            if(_global_lso) {
                isFinished = true;
                if(callback) callback(getValueFromStr(_global_lso, name, '&'));
            } else {
                tryCount = tryCount - 1;
                if(tryCount > 0) {
                    setTimeout(function() {
                        getData();
                    }, waitTime);
                } else {
                    if(callback) callback(null);
                }
            }
        };

        getData();
    }
}

function ecCache(name, val, callback) {
    var cookieName = 'ec_cache';

    if (val) {
        setCookieValue(cookieName, val, 10 * 365);
        ajax({
            url: '/evercookie/cache?name=' + cookieName,
            nocache: true,
            success: function() {
                if(callback) callback();
            }
        });
    } else {
        setCookieValue(cookieName, '', -3);
        ajax({
            url: '/evercookie/cache?name=' + cookieName,
            // nocache: true,
            success: function(data) {
                if (callback) callback(data);
            }
        });
    }
}

function ecDb(name, val, callback) {
    if(!window.openDatabase) {
        if(callback) callback(null);
        dmp.errors.push({
            name: 'not support window.openDatabase'
        });
        return;
    }

    var db = window.openDatabase('db_evercookie', '', 'evercookie', 1024*1024);

    if(val) {
        db.transaction(function(tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS ec_info (' +
                'id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                'name TEXT NOT NULL ,' +
                'val TEXT NOT NULL ,' +
                'UNIQUE (name)' +
                ')', [], function(tx) {
                    tx.executeSql('INSERT OR REPLACE INTO ec_info (name, val) VALUES (?, ?)',
                        [name, val], function() {
                            if(callback) callback();
                        }, function(tx, err) {
                            dmp.errors.push({
                                name: 'opendatabase insert or update error',
                                error: err
                            });
                            if(callback) callback();
                        });
            }, function(tx, err) {
                dmp.errors.push({
                    name: 'opendatabase create table error',
                    error: err
                });
                if(callback) callback();
            });
        });
    } else {
        db.transaction(function(tx) {
            tx.executeSql('select val from ec_info where name = ?',
                [name], function(tx, result) {
                    if(result && result.rows.length >= 1) {
                        if(callback) callback(result.rows.item(0).val);
                    } else {
                        if(callback) callback(null);
                    }
                }, function(tx, err) {
                    if(callback) callback(null);
                    dmp.errors.push({
                        name: 'opendatabase select table error',
                        error: err
                    });
                });
        });
    }
}

// TODO
// The user data will disappear after the browser be closed.
// And, the data didn't shared between two tabs;
function ecUserData(name, val) {
    try {
        var el = document.getElementById('ec-userdata');
        if(!el) {
            el = document.createElement('div');
            el.id = 'ec-userdata';
            el.style.display = 'hidden';
            el.style.position = 'absolute';
            document.body.appendChild(el);
        }
        el.style.behavior = 'url("#default#userData")';

        if(val) {
            var d = new Date();
            d.setFullYear(d.getFullYear() + 10);

            el.expires = d.toUTCString();
            el.setAttribute(name, val);
            // The method 'save' and 'load' not a function
            // Boolean(el.save) === false
            // typeof el.save === 'unknown'
            el.save(name);
        } else {
            el.load(name);
            return el.getAttribute(name) || null;
        }
    } catch (e) {
        dmp.errors.push({
            name: 'userdata error',
            error: e
        });
        return null;
    }
}

function ecPng(name, val, callback) {
    var cookieName = 'evercookie_png';
    var canvas = document.createElement('canvas');

    if(!canvas || !canvas.getContext) {
        dmp.errors.push({
            name: 'not support canvas'
        });
        if(callback) callback(null);
        return;
    }

    if (val) {
        setCookieValue(cookieName, val, 10);
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

        setCookieValue(cookieName, '', -3);

        var image = document.createElement('img');
        image.style.visibility = 'hidden';
        image.style.position = 'absolute';

        var isLoaded = false;

        setTimeout(function() {
            if(!isLoaded) {
                dmp.errors.push({
                    name: 'png did not load'
                });
                isLoaded = true;
                callback(null);
            }
        }, 500);

        addEvent(image, 'load', function() {
            if(isLoaded) {
                dmp.errors.push({
                    name: 'png loaded after callback(load too slow)'
                });
                return;
            }

            isLoaded = true;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            var imgData;
            var tmp = ctx.getImageData(0, 0, 200, 1);

            if(!tmp) {
                dmp.errors.push({
                    name: 'can not get image data'
                });
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
        });

        image.src = '/evercookie/png?name=' + cookieName;
    }
}

function ajax(settings) {
    var headers, name, transports, transport, i, length;

    headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
    };

    if(settings.nocache) {
        if(/*@cc_on!@*/false || !!document.documentMode) {
            headers['If-Modified-Since'] = new Date(0);
        } else {
            headers['Pragma'] = 'no-cache';
            headers['Cache-Control'] = 'no-cache, no-store, max-age=0, must-revalidate';
        }
    }

    transports = [
        function() {
            // For IE7+ and other browsers
            return new XMLHttpRequest();
        },
        function() {
            // For IE6+ standards model
            return new ActiveXObject('Msxml2.XMLHTTP');
        },
        function() {
            // For IE5.5
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

    if(!transport) {
        if(settings.success) settings.success(null);
        dmp.errors.push({
            name: 'not found a transport in AJAX'
        });
        return;
    }

    transport.onreadystatechange = function() {
        if (transport.readyState === 4) {
            if(settings.success) settings.success(transport.responseText);
        }
    };
    transport.open('get', protocol + '//www.evercookie.com' + settings.url, true);
    for (name in headers) {
        transport.setRequestHeader(name, headers[name]);
    }
    transport.send();
}

function getValueFromStr(str, key, splitChar) {
    if(!str) return null;

    splitChar = splitChar || '; ';
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

function setCookieValue(key, val, expiresDay) {
    var d = new Date();
    d.setTime(d.getTime() + (expiresDay * 24 * 60 * 60 * 1000));
    document.cookie = key + '=' + val + '; domain=.evercookie.com; path=/; expires=' + d.toUTCString();
}

function addEvent(el, eventName, callback) {
    if(el.addEventListener) {
        el.addEventListener(eventName, callback);
    } else {
        el.attachEvent('on' + eventName, callback);
    }
}
