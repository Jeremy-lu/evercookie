var evercookie = {};

evercookie.get = function(key, callback) {
    var result = 'result list: ';
    callback(result);
};

evercookie.set = function(key) {
    return true;
};