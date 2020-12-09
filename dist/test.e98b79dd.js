// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/@owneul/kate/dist/index.js":[function(require,module,exports) {
"use strict";
var Kate = (function () {
    function Kate(__raw, __isTimestamp) {
        var _this = this;
        if (__isTimestamp === void 0) { __isTimestamp = false; }
        this.__interpreters = [
            function (__raw) {
                if (typeof __raw === 'number') {
                    var checkDateObject, __rawString = __raw.toString(), paddedRawString = __rawString;
                    while (paddedRawString.length < 14) {
                        paddedRawString = paddedRawString + "0";
                    }
                    var year = __rawString.slice(0, 4);
                    var month = __rawString.slice(4, 6);
                    var day = __rawString.slice(6, 8);
                    var hour = __rawString.slice(8, 10);
                    var minute = __rawString.slice(10, 12);
                    var second = __rawString.slice(12, 14);
                    checkDateObject = new Date(year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second);
                    if (!isNaN(checkDateObject.getFullYear())) {
                        return checkDateObject;
                    }
                    else if (!isNaN(new Date(__raw).getFullYear())) {
                        return new Date(__raw);
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            },
            function (__raw) {
                if (typeof __raw === 'string') {
                    if (!isNaN(new Date(__raw).getFullYear())) {
                        return new Date(__raw);
                    }
                    else {
                        __raw = __raw.replace(/\s/g, '')
                            .replace(/(\d*){1,4}.(\d*){1,2}.(\d*){1,2}/, '$1-$2-$3 ')
                            .replace('년', '-').replace('월', '-').replace('일', ' ')
                            .replace(/시$/, '').replace(/시(\d)/, ':$1')
                            .replace(/분$/, '').replace(/분(\d)/, ':$1')
                            .replace(/초$/, '').replace(/초(\d)/, '.$1');
                        if (__raw.match(/오전/)) {
                            __raw = __raw.replace('오전', '') + ' AM';
                        }
                        if (__raw.match(/오후/)) {
                            __raw = __raw.replace('오후', '') + ' PM';
                        }
                        return new Date(__raw);
                    }
                }
                else {
                    return false;
                }
            },
        ];
        this.__replacer = {
            yyyy: function () { return _this.__dateObject ? _this.__dateObject.getFullYear() : ''; },
            yy: function () { return ("" + _this.__replacer.yyyy()).substr(-2); },
            mm: function () { return ("0" + _this.__replacer.m()).substr(-2); },
            m: function () { return _this.__dateObject ? _this.__dateObject.getMonth() + 1 : ''; },
            dd: function () { return ("0" + _this.__replacer.d()).substr(-2); },
            d: function () { return _this.__dateObject ? _this.__dateObject.getDate() : ''; },
            E: function () { return _this.__dateObject ? Kate.__dayLabels[_this.__dateObject.getDay()] : ''; },
            HH: function () { return ("0" + _this.__replacer.H()).substr(-2); },
            H: function () { return _this.__dateObject ? _this.__dateObject.getHours() : ''; },
            hh: function () { return ("0" + _this.__replacer.h()).substr(-2); },
            h: function () {
                var h = _this.__dateObject ? (_this.__dateObject.getHours() % 12) : '';
                return h == 0 ? '12' : h;
            },
            ii: function () { return ("0" + _this.__replacer.i()).substr(-2); },
            i: function () { return _this.__dateObject ? _this.__dateObject.getMinutes() : ''; },
            ss: function () { return ("0" + _this.__replacer.s()).substr(-2); },
            s: function () { return _this.__dateObject ? _this.__dateObject.getSeconds() : ''; },
            ap: function () { return _this.__dateObject ? (_this.__dateObject.getHours() > 12 ? Kate.__meridiemLabels[1] : Kate.__meridiemLabels[0]) : ''; },
        };
        var dateFromRaw;
        if (__isTimestamp) {
            dateFromRaw = new Date(__raw);
        }
        else if (__raw instanceof Date) {
            dateFromRaw = __raw;
        }
        else if (!__raw) {
            dateFromRaw = new Date();
        }
        else {
            for (var index = 0; index < this.__interpreters.length; index++) {
                var interpreter = this.__interpreters[index];
                var result = interpreter(__raw);
                if (result) {
                    dateFromRaw = result;
                    break;
                }
            }
        }
        if (!dateFromRaw || (dateFromRaw && isNaN(dateFromRaw.getFullYear()))) {
            throw new Error('Date Object Not Found.');
        }
        else {
            this.__dateObject = dateFromRaw;
        }
    }
    Kate.prototype.getDateObject = function () {
        return this.__dateObject;
    };
    Kate.setMeridiemLabels = function (__labels) {
        console.log(__labels);
        if (!Array.isArray(__labels) || !__labels.length || __labels.length < 2) {
            throw new Error('meridiem label must be array and have 2 item(AM/PM).');
        }
        this.__meridiemLabels = __labels;
    };
    Kate.setDayLabels = function (__labels) {
        if (!Array.isArray(__labels) || !__labels.length || __labels.length < 7) {
            throw new Error('day label must be array and have 7 item(monday to sunday).');
        }
        this.__dayLabels = __labels;
    };
    Kate.prototype.setYear = function (__year) {
        this.__dateObject.setFullYear(__year);
        return this;
    };
    Kate.prototype.setMonth = function (__month) {
        this.__dateObject.setMonth(__month);
        return this;
    };
    Kate.prototype.setDate = function (__date) {
        this.__dateObject.setDate(__date);
        return this;
    };
    Kate.prototype.setHours = function (__hours) {
        this.__dateObject.setHours(__hours);
        return this;
    };
    Kate.prototype.setMinutes = function (__minute) {
        this.__dateObject.setMinutes(__minute);
        return this;
    };
    Kate.prototype.setSeconds = function (__seconds) {
        this.__dateObject.setSeconds(__seconds);
        return this;
    };
    Kate.prototype.addSeconds = function (__seconds) {
        return new Kate(this.__dateObject.getTime() + (1000 * __seconds), true);
    };
    Kate.prototype.addMinutes = function (__minutes) {
        return new Kate(this.__dateObject.getTime() + (1000 * 60 * __minutes), true);
    };
    Kate.prototype.addHours = function (__hours) {
        return new Kate(this.__dateObject.getTime() + (1000 * 60 * 60 * __hours), true);
    };
    Kate.prototype.addDays = function (__days) {
        return new Kate(this.__dateObject.getTime() + (1000 * 60 * 60 * 24 * __days), true);
    };
    Kate.prototype.addMonths = function (__months) {
        return new Kate(this.__dateObject.getTime() + (1000 * 60 * 60 * 24 * 30 * __months), true);
    };
    Kate.prototype.addYears = function (__years) {
        return new Kate(this.__dateObject.getTime() + (1000 * 60 * 60 * 24 * 365.25 * __years), true);
    };
    Kate.prototype.diffInSeconds = function (__raw) {
        var kate = new Kate(__raw);
        return Math.round((kate.__dateObject.getTime() - this.__dateObject.getTime()) / 1000);
    };
    Kate.prototype.diffInMinutes = function (__raw) {
        return Math.round(this.diffInSeconds(__raw) / 60);
    };
    Kate.prototype.diffInHours = function (__raw) {
        return Math.round(this.diffInSeconds(__raw) / 60 / 60);
    };
    Kate.prototype.diffInDays = function (__raw) {
        var kate = new Kate(__raw);
        return Math.round((kate.__dateObject.getTime() - this.__dateObject.getTime()) / 1000 / 60 / 60 / 24);
    };
    Kate.prototype.diffInMonths = function (__raw) {
        return Math.round(this.diffInDays(__raw) / 30);
    };
    Kate.prototype.diffInYears = function (__raw) {
        return Math.round(this.diffInDays(__raw) / 365.25);
    };
    Kate.prototype.copy = function () {
        return new Kate(this.format('yyyy-mm-dd HH:ii:ss'));
    };
    Kate.prototype.format = function (__format) {
        var _this = this;
        return __format.replace(/(yyyy|yy|mm|m|dd|d|E|HH|H|hh|h|ii|i|ss|s|ap)/gi, function ($1) {
            return _this.__replacer[$1] ? _this.__replacer[$1]() : $1;
        });
    };
    Kate.__dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    Kate.__meridiemLabels = ['오전', '오후'];
    return Kate;
}());
module.exports = Kate;

},{}],"lib/index.ts":[function(require,module,exports) {
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var Kate = require('@owneul/kate');

var TesterNotFoundError = function (_super) {
  __extends(TesterNotFoundError, _super);

  function TesterNotFoundError(__message) {
    return _super.call(this, __message) || this;
  }

  return TesterNotFoundError;
}(Error);

var InvalidRuleError = function (_super) {
  __extends(InvalidRuleError, _super);

  function InvalidRuleError(__message) {
    return _super.call(this, __message) || this;
  }

  return InvalidRuleError;
}(Error);

var InvalidValueError = function (_super) {
  __extends(InvalidValueError, _super);

  function InvalidValueError(__message) {
    return _super.call(this, __message) || this;
  }

  return InvalidValueError;
}(Error);

var is = {
  empty: function empty(__target) {
    return !__target || __target === null || __target === '' || __target instanceof FileList && __target.length === 0;
  },
  number: function number(__target) {
    return !isNaN(__target);
  },
  file: function file(__target, __type, __extensions) {
    if (__type === void 0) {
      __type = '';
    }

    if (!(__target instanceof File)) {
      return false;
    }

    if (__type !== '*/*') {
      var regxResult = __type.match(/(.*\/)\*/);

      if (regxResult) {
        if (__target.type.indexOf(regxResult[1]) !== 0) {
          return false;
        }
      } else {
        if (__type !== '' && __target.type !== __type) {
          return false;
        }
      }
    }

    __extensions = Array.isArray(__extensions) ? __extensions : [__extensions];

    if (!is.empty(__extensions)) {
      var splited = __target.name.split('.');

      if (splited.length > 0) {
        var extension = splited[splited.length - 1];

        if (__extensions.indexOf(extension) === -1) {
          return false;
        }
      }
    }

    return true;
  }
};

var Kalidator = function () {
  function Kalidator(__data, __rules, __messages) {
    var _this = this;

    this.data = {};
    this.rules = {};
    this.unlabeledRules = {};
    this.keyAndLabels = {};
    this.requiredKeys = [];
    this.messages = {};
    this.errors = {};
    this.isPassed = false;
    this.is = is;
    this.languages = {
      ko: {
        messages: {
          required: ':param(은/는) 필수입력사항입니다.',
          requiredIf: '[:$0] 값이 있는 경우 :param(은/는) 필수입력사항입니다.',
          minLength: ':param(은/는) 최소 :$0자를 입력해야합니다.',
          maxLength: ':param(은/는) 최대 :$0자까지 입력할 수 있습니다.',
          betweenLength: ':param(은/는) :$0자 ~ :$1자 사이에서 입력할 수 있습니다.',
          minValue: ':param의 값은 최소 :$0입니다.',
          maxValue: ':param의 값은 최대 :$0입니다.',
          betweenValue: ':param의 값은 :$0 ~ :$1 사이만 가능합니다.',
          in: ':param의 값은 :$concat 중 하나여야합니다.',
          notIn: ':param의 값은 :$concat 이외의 값이어야합니다.',
          empty: ':param의 값은 비어있어야 합니다.',
          notEmpty: ':param의 값은 비어있지 않아야 합니다.',
          number: ':param의 값은 숫자여야합니다.',
          email: ':param의 값은 유효한 이메일 주소여야합니다.',
          date: ':param의 값은 날짜여야합니다.',
          file: ':param 파일이 정상적으로 첨부되지 않았습니다.',
          earlierThan: ':param은 :$0보다 이른 날짜여야합니다.',
          laterThan: ':param은 :$0보다 늦은 날짜여야합니다.'
        }
      }
    };
    this.firstErrorMessage = '';
    this.defaults = {};
    this.conditionalRequiredRules = ['requiredIf', 'requiredNotIf'];
    this.tester = {
      required: function required(__key, __extraValue, __data) {
        if (__extraValue === void 0) {
          __extraValue = null;
        }

        if (__data === void 0) {
          __data = {};
        }

        return !is.empty(Kalidator._getTargetValue(__data, __key));
      },
      requiredIf: function requiredIf(__key, __extraValue, __data) {
        if (__extraValue === void 0) {
          __extraValue = null;
        }

        if (__data === void 0) {
          __data = {};
        }

        __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];

        var whitelist = __extraValue.slice(1);

        var targetValue = Kalidator._getTargetValue(__data, __extraValue[0]);

        if (!is.empty(targetValue)) {
          if (whitelist.length === 0 || whitelist.indexOf(targetValue) !== -1) {
            return !is.empty(Kalidator._getTargetValue(__data, __key));
          } else {
            return true;
          }
        } else {
          return true;
        }
      },
      requiredNotIf: function requiredNotIf(__key, __extraValue, __data) {
        if (__extraValue === void 0) {
          __extraValue = null;
        }

        if (__data === void 0) {
          __data = {};
        }

        __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];

        var blacklist = __extraValue.slice(1);

        var targetValue = Kalidator._getTargetValue(__data, __extraValue[0]);

        if (!targetValue) {
          return !is.empty(Kalidator._getTargetValue(__data, __key));
        } else if (__data[__extraValue[0]] && blacklist.indexOf(targetValue) !== -1) {
          return !is.empty(Kalidator._getTargetValue(__data, __key));
        } else {
          return true;
        }
      },
      minLength: function minLength(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        return _this.__isTestNotRequired('minLength', __key) || Kalidator._getTargetValue(__data, __key) && Kalidator._getTargetValue(__data, __key).toString().length >= __extraValue;
      },
      maxLength: function maxLength(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        return _this.__isTestNotRequired('maxLength', __key) || Kalidator._getTargetValue(__data, __key) && Kalidator._getTargetValue(__data, __key).toString().length <= __extraValue;
      },
      betweenLength: function betweenLength(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue[0] || !__extraValue[1]) {
          throw new InvalidRuleError("Rule betweenLength has invalid format(format: 'betweenLength:min,max')");
        }

        return _this.__isTestNotRequired('betweenLength', __key) || _this.tester.minLength(__key, __extraValue[0], __data) && _this.tester.maxLength(__key, __extraValue[1], __data);
      },
      minValue: function minValue(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue) {
          throw new InvalidRuleError("Rule minValue has invalid format(format: 'minValue:min')");
        } else if (isNaN(__extraValue)) {
          throw new InvalidValueError("Invalid value detected(minValue testing value must be number. " + __extraValue + " is not a number)");
        }

        return _this.__isTestNotRequired('minValue', __key) || is.number(Kalidator._getTargetValue(__data, __key)) && Kalidator._getTargetValue(__data, __key) * 1 >= __extraValue;
      },
      maxValue: function maxValue(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue) {
          throw new InvalidRuleError("Rule maxValue has invalid format(format: 'maxValue:max')");
        } else if (isNaN(__extraValue)) {
          throw new InvalidValueError("Invalid value detected(maxValue testing value must be number. " + __extraValue + " is not a number)");
        }

        return _this.__isTestNotRequired('maxValue', __key) || is.number(Kalidator._getTargetValue(__data, __key)) && Kalidator._getTargetValue(__data, __key) * 1 <= __extraValue;
      },
      betweenValue: function betweenValue(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue[0] || !__extraValue[1]) {
          throw new InvalidRuleError("Rule betweenValue has invalid format(format: 'betweenValue:min,max')");
        }

        return _this.__isTestNotRequired('betweenValue', __key) || is.number(Kalidator._getTargetValue(__data, __key)) && _this.tester.minValue(__key, __extraValue[0], __data) && _this.tester.maxValue(__key, __extraValue[1], __data);
      },
      in: function _in(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue) {
          throw new InvalidRuleError("Rule in has invalid format(format: 'in:a,b,c...')");
        }

        __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];
        return _this.__isTestNotRequired('in', __key) || __extraValue.indexOf(Kalidator._getTargetValue(__data, __key)) != -1;
      },
      notIn: function notIn(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue) {
          throw new InvalidRuleError("Rule notIn has invalid format(format: 'notIn:a,b,c...')");
        }

        __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];
        return _this.__isTestNotRequired('notIn', __key) || __extraValue.indexOf(Kalidator._getTargetValue(__data, __key)) === -1;
      },
      empty: function empty(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        return _this.__isTestNotRequired('empty', __key) || Kalidator._getTargetValue(__data, __key) && Kalidator._getTargetValue(__data, __key).replace(/<br\s?\/?>/g, '').replace(/<\/?p\s?>/g, '').trim() == '';
      },
      notEmpty: function notEmpty(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        return _this.__isTestNotRequired('notEmpty', __key) || Kalidator._getTargetValue(__data, __key) && Kalidator._getTargetValue(__data, __key).replace(/<br\s?\/?>/g, '').replace(/<\/?p\s?>/g, '').trim() != '';
      },
      number: function number(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        return _this.__isTestNotRequired('number', __key) || is.number(Kalidator._getTargetValue(__data, __key));
      },
      email: function email(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!_this.__isTestNotRequired('email', __key) && typeof Kalidator._getTargetValue(__data, __key) !== 'string') {
          throw new InvalidValueError("Invalid value detected(email testing value must be string. [" + Kalidator._getTargetValue(__data, __key) + "] is not a string)");
        }

        return _this.__isTestNotRequired('email', __key) || Kalidator._getTargetValue(__data, __key).match(/@/g) && Kalidator._getTargetValue(__data, __key).match(/@/g).length === 1 && Kalidator._getTargetValue(__data, __key)[0] !== '@' && Kalidator._getTargetValue(__data, __key)[Kalidator._getTargetValue(__data, __key).length - 1] !== '@';
      },
      date: function date(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (_this.__isTestNotRequired('date', __key)) {
          return true;
        }

        try {
          return new Kate(Kalidator._getTargetValue(__data, __key)) && true;
        } catch (error) {
          return false;
        }
      },
      file: function file(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        var type = Array.isArray(__extraValue) ? __extraValue[0] : __extraValue,
            extensions = Array.isArray(__extraValue) ? __extraValue.slice(1) : [];
        var isPassed = true;

        if (Kalidator._getTargetValue(__data, __key) instanceof FileList || Array.isArray(Kalidator._getTargetValue(__data, __key))) {
          for (var index = 0; index < Kalidator._getTargetValue(__data, __key).length; index++) {
            var file = Kalidator._getTargetValue(__data, __key)[index];

            isPassed = isPassed && is.file(file, type, extensions);
          }
        } else if (Kalidator._getTargetValue(__data, __key) instanceof File) {
          isPassed = is.file(Kalidator._getTargetValue(__data, __key), type, extensions);
        } else {
          isPassed = false;
        }

        return _this.__isTestNotRequired('file', __key) || isPassed;
      },
      earlierThan: function earlierThan(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue) {
          throw new InvalidRuleError("Rule earlierThan has invalid format(format: 'earlierThan:date or key')");
        }

        var valueDate = new Date(Kalidator._getTargetValue(__data, __key));
        var compareDate = new Date(Kalidator._getTargetValue(__data, __extraValue) ? Kalidator._getTargetValue(__data, __extraValue) : __extraValue);

        if (isNaN(compareDate.getFullYear())) {
          return false;
        }

        if (!_this.data[__extraValue] && isNaN(compareDate.getFullYear())) {
          throw new InvalidRuleError("Invalid rule detected(earlierThan testing rule must be possible to parse date. cannot parse date from [" + __extraValue + "].)");
        }

        return _this.__isTestNotRequired('earlierThan', __key) || !isNaN(compareDate.getFullYear()) && !isNaN(valueDate.getFullYear()) && valueDate.getTime() < compareDate.getTime();
      },
      laterThan: function laterThan(__key, __extraValue, __data) {
        if (__data === void 0) {
          __data = {};
        }

        if (!__extraValue) {
          throw new InvalidRuleError("Rule laterThan has invalid format(format: 'laterThan:date or key')");
        }

        var valueDate = new Date(Kalidator._getTargetValue(__data, __key));
        var compareDate = new Date(Kalidator._getTargetValue(__data, __extraValue) ? Kalidator._getTargetValue(__data, __extraValue) : __extraValue);

        if (isNaN(compareDate.getFullYear())) {
          return false;
        }

        if (!_this.data[__extraValue] && isNaN(compareDate.getFullYear())) {
          throw new InvalidRuleError("Invalid rule detected(laterThan testing rule must be possible to parse date. cannot parse date from [" + __extraValue + "].)");
        }

        return _this.__isTestNotRequired('laterThan', __key) || !isNaN(compareDate.getFullYear()) && !isNaN(valueDate.getFullYear()) && valueDate.getTime() > compareDate.getTime();
      }
    };
    ;
    this.languages.basic = this.languages.ko, this.defaults.messages = this.languages.basic.messages;
    this.setData(__data);
    this.setRules(__rules);
    this.setMessages(__messages);
  }

  Kalidator.setGlobalMessage = function (__ruleName, __message) {
    Kalidator.globalMessage[__ruleName] = __message;
    return Kalidator;
  };

  Kalidator.registGlobalTester = function (__testerName, __tester) {
    Kalidator.globalTester[__testerName] = __tester;
    return Kalidator;
  };

  Kalidator._getTargetValue = function (__targetData, __key) {
    var keyList = __key.split('.');

    var targetValue = Object.assign({}, __targetData);

    for (var index = 0; index < keyList.length; index++) {
      var targetKey = keyList[index];

      if (targetValue === null || targetValue === undefined) {
        targetValue = null;
      } else {
        targetValue = targetValue[targetKey];
      }
    }

    return targetValue;
  };

  Kalidator.prototype.__isRequired = function (__key) {
    return this.requiredKeys.indexOf(__key) != -1;
  };

  Kalidator.prototype.__isTestNotRequired = function (__testerName, __dataKey) {
    return this.conditionalRequiredRules.indexOf(__testerName) === -1 && !this.__isRequired(__dataKey) && is.empty(Kalidator._getTargetValue(this.data, __dataKey));
  };

  Kalidator.prototype.applyZosa = function (__string) {
    var result = __string,
        checkpoints = ['(은/는)', '(이/가)', '(을/를)', '(과/와)', '(아/야)', '(이여/여)', '(이랑/랑)', '(으로/로)', '(으로서/로서)', '(으로써/로써)', '(으로부터/로부터)'];

    for (var index = 0; index < checkpoints.length; index++) {
      var checkpoint = checkpoints[index];

      if (__string.indexOf(checkpoint) !== -1) {
        var code = __string.charCodeAt(__string.indexOf(checkpoint) - 1) - 44032;

        if (code >= 0 || code <= 11171) {
          result = result.replace(checkpoint, code % 28 !== 0 ? checkpoint.split('/')[0].replace('(', '') : checkpoint.split('/')[1].replace(')', ''));
        }
      }
    }

    return result;
  };

  Kalidator.prototype.test = function (__key, __tester) {
    var _this = this;

    var param = __key,
        label = null;

    if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
      var tmpArr2 = param.split('(');
      param = tmpArr2[0];
      label = tmpArr2[1].substring(0, tmpArr2[1].length - 1);
    }

    var testerName = __tester,
        extraValue = '';

    if (testerName.indexOf(':') !== -1) {
      var tmpArr = testerName.split(':');
      testerName = tmpArr[0];

      if (tmpArr[1].indexOf(',') !== -1) {
        extraValue = tmpArr[1].split(',');
      } else {
        extraValue = tmpArr[1];
      }
    }

    var tester = this.tester[testerName];

    if (!tester) {
      throw new TesterNotFoundError("Tester [" + testerName + "] Not Found.");
    }

    if (!tester(param, extraValue, this.data)) {
      var message = (this.messages[param + '.' + testerName] || this.defaults.messages[testerName] || '').replace(':param', label || param);

      if (Array.isArray(extraValue)) {
        var valueLabels = [];
        extraValue.forEach(function (val) {
          valueLabels.push(_this.keyAndLabels[val] ? _this.keyAndLabels[val] : val);
        });
        message = message.replace(':$concat', "[" + valueLabels.join(', ') + "]");
        extraValue.forEach(function (val, i) {
          var replaceValue = _this.keyAndLabels[val] ? _this.keyAndLabels[val] : val;
          message = message.replace(":$" + i, replaceValue);
        });
      } else {
        message = message.replace(':$concat', "[" + (this.keyAndLabels[extraValue] ? this.keyAndLabels[extraValue] : extraValue) + "]");
        var replaceValue = this.keyAndLabels[extraValue] ? this.keyAndLabels[extraValue] : extraValue;
        message = message.replace(':$0', replaceValue);
      }

      this.errors[param] = this.errors[param] || {};
      this.errors[param][testerName] = this.applyZosa(message);
    }
  };

  Kalidator.prototype.setData = function (__data) {
    var _this = this;

    this.data = {};

    if (__data instanceof FormData) {
      __data.forEach(function (value, key) {
        _this.data[key] = value;
      });
    } else if (__data instanceof HTMLElement) {
      var inputs = __data.querySelectorAll('[name]');

      for (var index = 0; index < inputs.length; index++) {
        var input = inputs[index],
            type = input.getAttribute('type'),
            name = input.getAttribute('name') || 'noname';

        if (input instanceof HTMLInputElement) {
          if (type == 'radio') {
            if (input.checked) {
              this.data[name] = input.value;
            }
          } else if (type == 'checkbox') {
            if (input.checked) {
              this.data[name] = input.value;
            }
          } else if (type == 'file') {
            if (input.files && input.files.length === 1) {
              this.data[name] = input.files[0];
            } else if (input.files) {
              this.data[name] = input.files;
            }
          } else {
            this.data[name] = input.value;
          }
        } else if (input instanceof HTMLSelectElement) {
          this.data[name] = input.value;
        }
      }
    } else if (_typeof(__data) == 'object') {
      for (var key in __data) {
        if (__data.hasOwnProperty(key)) {
          var value = __data[key];
          this.data[key] = value;
        }
      }
    }

    return this;
  };

  Kalidator.prototype.setRules = function (__rules) {
    this.rules = {};

    if (__rules) {
      for (var key in __rules) {
        if (__rules.hasOwnProperty(key)) {
          var value = __rules[key];
          this.setRule(key, value);
        }
      }
    }

    return this;
  };

  Kalidator.prototype.setRule = function (__param, __rule) {
    var unlabeldParam = __param,
        label = '';
    this.rules[__param] = __rule;

    if (__param.indexOf('(') !== -1 && __param.indexOf(')') !== -1) {
      var tmpArr2 = __param.split('(');

      unlabeldParam = tmpArr2[0];
      label = tmpArr2[1].slice(0, -1);
    }

    this.unlabeledRules[unlabeldParam] = __rule;
    this.keyAndLabels[unlabeldParam] = label;

    if (this.data[unlabeldParam] === undefined) {
      this.data[unlabeldParam] = '';
    }

    if (__rule.indexOf('required') !== -1) {
      this.requiredKeys.push(unlabeldParam);
    }

    return this;
  };

  Kalidator.prototype.setMessages = function (__messages) {
    this.messages = {};

    if (__messages) {
      for (var key in __messages) {
        if (__messages.hasOwnProperty(key)) {
          var value = __messages[key];
          this.setMessage(key, value);
        }
      }
    }

    return this;
  };

  Kalidator.prototype.setMessage = function (__param, __message) {
    this.messages[__param] = __message;
    return this;
  };

  Kalidator.prototype.registTester = function (__testerName, __tester) {
    this.tester[__testerName] = __tester;
    return this;
  };

  Kalidator.prototype.run = function (__options) {
    this.tester = Object.assign(this.tester, Kalidator.globalTester);
    this.languages.ko.messages = Object.assign(this.languages.ko.messages, Kalidator.globalMessage);
    this.firstErrorMessage = '';

    for (var param in this.rules) {
      if (this.rules.hasOwnProperty(param)) {
        var ruleArray = this.rules[param];

        for (var index = 0; index < ruleArray.length; index++) {
          var rule = ruleArray[index];
          this.test(param, rule);
        }
      }
    }

    this.isPassed = Object.keys(this.errors).length === 0 && JSON.stringify(this.errors) === JSON.stringify({});

    if (!this.isPassed) {
      var firstErrorBag = this.errors[Object.keys(this.errors)[0]];
      this.firstErrorMessage = firstErrorBag[Object.keys(firstErrorBag)[0]];
    }

    if (this.isPassed && __options && __options.pass) {
      __options.pass();
    } else if (!this.isPassed && __options && __options.fail) {
      __options.fail(this.errors, this.firstErrorMessage);
    }
  };

  Kalidator.globalMessage = {};
  Kalidator.globalTester = {};
  return Kalidator;
}();

module.exports = Kalidator;
},{"@owneul/kate":"node_modules/@owneul/kate/dist/index.js"}],"test.js":[function(require,module,exports) {
window.Kalidator = require('./lib/index.ts');
},{"./lib/index.ts":"lib/index.ts"}],"../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "56777" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../../usr/local/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","test.js"], null)
//# sourceMappingURL=/test.e98b79dd.js.map