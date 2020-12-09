"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
Promise.prototype.useDefaultCatch = function () {
    return this.catch(function (err) {
        console.error('Default Catch :: ');
        if (err.response) {
            console.error(err.response);
        }
        else {
            console.error(err.message);
        }
    });
};
var AppScript = (function () {
    function AppScript() {
        this.ajax = {
            get: axios_1.default.get,
            post: axios_1.default.post,
            put: function (url, data, config) {
                if (data instanceof FormData) {
                    data.append('_method', 'PUT');
                }
                else if (typeof data === 'object') {
                    data._method = 'PUT';
                }
                return axios_1.default.post(url, data, config);
            },
            delete: function (url, config) {
                return axios_1.default.post(url, {
                    _method: 'DELETE',
                }, config);
            },
        };
        this.pageScripts = {
            common: {},
        };
        this.vues = {};
    }
    AppScript.prototype.getRouteParams = function (pattern, pathname) {
        var path = pathname || location.pathname;
        var paramKeyValue = {};
        var splitedPathname = path.replace(/^\//, '').split('/');
        while (pattern.match(/\.\.\.\d/)) {
            var match = pattern.match(/\.\.\.\d/);
            if (match !== null) {
                var skipCount = Number.parseInt(match[0].replace(/^\.\.\./, ''));
                var pos = match.index;
                var placeholders = [];
                for (var index = 0; index < skipCount; index++) {
                    placeholders.push('{_}');
                }
                var before = pattern.substring(0, pos);
                var after = pattern.substring(pos + match[0].length);
                pattern = [before, placeholders.join('/'), after].join('');
            }
        }
        pattern
            .replace(/^\//, '')
            .split('/')
            .forEach(function (section, index) {
            if (section !== '{_}' &&
                section.includes('{') &&
                section.includes('}') &&
                splitedPathname[index]) {
                paramKeyValue[section.replace(/^{/, '').replace(/}$/, '')] =
                    splitedPathname[index];
            }
        });
        return paramKeyValue;
    };
    AppScript.prototype.getRouteParamAt = function (position, pathname) {
        var path = pathname || location.pathname;
        var splitedPathname = path.replace(/^\//, '').split('/');
        if (position < 0) {
            return splitedPathname[splitedPathname.length + position] || null;
        }
        else {
            return splitedPathname[position] || null;
        }
    };
    AppScript.prototype.getQueryParam = function (paramKey, querystring) {
        var query = querystring || location.search;
        var params = this.getQueryParams(query);
        var sections = paramKey
            .split('[')
            .map(function (section) { return section.replace(/\]$/, ''); })
            .filter(function (section) { return section !== ''; });
        var target = params;
        sections.forEach(function (section) {
            if (target === null) {
                return;
            }
            if (!target[section]) {
                target = null;
            }
            else {
                target = target[section];
            }
        });
        return target || null;
    };
    AppScript.prototype.getQueryParams = function (querystring) {
        var _this = this;
        var query = querystring || location.search;
        var params = {};
        query
            .replace(/^\?/, '')
            .split('&')
            .filter(function (pairString) { return pairString !== ''; })
            .map(function (pairString) {
            var splited = pairString.split('=');
            var key = splited[0];
            var value = splited[1] || '';
            var match = key.match(/\[([^\[\]]*)\]/);
            if (match !== null && match.index) {
                var slicedKey = key.substring(0, match.index);
                var restKey = key.substring(match.index);
                if (restKey === '[]') {
                    if (!params[slicedKey]) {
                        params[slicedKey] = [];
                    }
                    params[slicedKey] = params[slicedKey];
                    params[slicedKey].push(_this.formatQueryParamValue(value));
                }
                else {
                    if (!params[slicedKey]) {
                        params[slicedKey] = {};
                    }
                    var matches = restKey.match(/\[([^\[\]]*)\]/g) || [];
                    var targetObject = params[slicedKey];
                    for (var index = 0; index < matches.length; index++) {
                        var cuttedKey = matches[index]
                            .replace(/^\[/, '')
                            .replace(/\]$/, '');
                        if (!targetObject[cuttedKey]) {
                            targetObject[cuttedKey] = {};
                        }
                        if (index === matches.length - 1) {
                            targetObject[cuttedKey] = _this.formatQueryParamValue(value);
                        }
                        else {
                            targetObject = targetObject[cuttedKey];
                        }
                    }
                }
            }
            else {
                params[key] = _this.formatQueryParamValue(value);
            }
        });
        return params;
    };
    AppScript.prototype.formatQueryParamValue = function (value) {
        if (value === 'true') {
            return true;
        }
        else if (value === 'false') {
            return false;
        }
        else if (!isNaN(Number.parseFloat(value))) {
            return Number.parseFloat(value);
        }
        else {
            return decodeURIComponent(value);
        }
    };
    AppScript.prototype.addAction = function (selector, args) {
        var options = args || {};
        if (selector && args) {
            if (typeof args === 'function') {
                options = {
                    callback: args,
                };
            }
            if (!options.callback) {
                return;
            }
            options.eventType = options.eventType || 'click';
            var targets_1;
            if (selector instanceof HTMLElement) {
                targets_1 = [selector];
            }
            else if (selector instanceof NodeList) {
                targets_1 = selector;
            }
            else if (selector === 'window') {
                targets_1 = [window];
            }
            else if (selector === 'document') {
                targets_1 = [document];
            }
            else {
                targets_1 = document.querySelectorAll(selector || 'temp.not-exist-selector');
            }
            for (var i = 0; i < targets_1.length; i++) {
                var target = targets_1[i];
                var eventTypeArray = options.eventType.split(',');
                for (var j = 0; j < eventTypeArray.length; j++) {
                    var eventType = eventTypeArray[j].trim();
                    if (eventType == '$enter') {
                        target.addEventListener('keyup', function (event) {
                            if (event && event.keyCode === 13) {
                                options.callback.call(this, targets_1);
                            }
                        });
                    }
                    else if (eventType == '$esc') {
                        target.addEventListener('keyup', function (event) {
                            if (event && event.keyCode === 27) {
                                options.callback.call(this, targets_1);
                            }
                        });
                    }
                    else {
                        target.addEventListener(eventType, function () {
                            options.callback.call(this, targets_1);
                        });
                    }
                }
            }
        }
    };
    AppScript.prototype.runAction = function (selector, func) {
        if (selector && func && typeof func === 'function') {
            var targets = void 0;
            if (selector instanceof HTMLElement) {
                targets = [selector];
            }
            else if (selector instanceof NodeList) {
                targets = selector;
            }
            else if (selector === 'window') {
                targets = [window];
            }
            else if (selector === 'document') {
                targets = [document];
            }
            else {
                targets = document.querySelectorAll(selector || 'temp.not-exist-selector');
            }
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                func.call(target, targets);
            }
        }
        else {
            throw new Error('대상 선택기준이 없거나 실행할 함수가 없습니다.');
        }
    };
    AppScript.prototype.login = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.ajax
                .post('/login', data)
                .then(function (res) {
                _this.sendRecentViewGoodsToServer()
                    .then(function () {
                    localStorage.removeItem('_recent_view_goods');
                    resolve(res);
                })
                    .catch(reject);
            })
                .catch(reject);
        });
    };
    AppScript.prototype.logout = function (redirectAfterLogout) {
        if (!this.isLoggedIn()) {
            top.location.href = redirectAfterLogout || '/';
            return;
        }
        this.ajax
            .delete('/logout')
            .then(function () {
            top.location.href = redirectAfterLogout || '/';
        })
            .useDefaultCatch();
    };
    AppScript.prototype.isLoggedIn = function () {
        return false;
    };
    AppScript.prototype.getRecentSearches = function () {
        return new Promise(function (resolve, reject) {
            try {
                var recentSearchesString = localStorage.getItem('_recent_search_words');
                if (recentSearchesString !== null) {
                    resolve(JSON.parse(recentSearchesString).reverse());
                }
                else {
                    resolve([]);
                }
            }
            catch (error) {
                reject(error);
            }
        });
    };
    AppScript.prototype.addRecentSearch = function (searchInfo) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getRecentSearches()
                .then(function (list) {
                var recentSearches = list
                    .reverse()
                    .filter(function (search) { return search.word !== searchInfo.word; });
                recentSearches.push({
                    word: searchInfo.word,
                    searchAt: searchInfo.searchAt,
                });
                localStorage.setItem('_recent_search_words', JSON.stringify(recentSearches));
                resolve();
            })
                .catch(reject);
        });
    };
    AppScript.prototype.getRecentViewGoods = function () {
        var _this = this;
        if (this.isLoggedIn()) {
            return new Promise(function (resolve, reject) {
                _this.ajax.get('/recent-view-goods').then(resolve).catch(reject);
            });
        }
        else {
            var recentViewGoodsString_1 = localStorage.getItem('_recent_view_goods');
            return new Promise(function (resolve, reject) {
                try {
                    if (recentViewGoodsString_1 !== null) {
                        resolve(JSON.parse(recentViewGoodsString_1).reverse());
                    }
                    else {
                        resolve([]);
                    }
                }
                catch (error) {
                    reject(error);
                }
            });
        }
    };
    AppScript.prototype.addRecentViewGoods = function (goodsInfo) {
        var _this = this;
        if (this.isLoggedIn()) {
            return new Promise(function (resolve, reject) {
                _this.ajax.post('/add-recent-view-goods').then(resolve).catch(reject);
            });
        }
        else {
            return new Promise(function (resolve, reject) {
                _this.getRecentViewGoods()
                    .then(function (list) {
                    var recentViewGoods = list
                        .reverse()
                        .filter(function (goods) { return goods.id !== goodsInfo.id; });
                    recentViewGoods.push({
                        id: goodsInfo.id,
                        name: goodsInfo.name,
                        imageUrl: goodsInfo.imageUrl,
                        viewAt: goodsInfo.viewAt,
                    });
                    localStorage.setItem('_recent_view_goods', JSON.stringify(recentViewGoods));
                    resolve();
                })
                    .catch(reject);
            });
        }
    };
    AppScript.prototype.sendRecentViewGoodsToServer = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.isLoggedIn()) {
                resolve();
            }
            else {
                _this.getRecentViewGoods()
                    .then(function (list) {
                    if (list.length > 0) {
                        _this.ajax
                            .post('/sync-recent-view-goods', list)
                            .then(resolve)
                            .catch(reject);
                    }
                    else {
                        resolve();
                    }
                })
                    .catch(reject);
            }
        });
    };
    return AppScript;
}());
window.App = new AppScript();
