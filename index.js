"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callback, thisArg) {
        var T, k;
        if (this === null) {
            throw new TypeError(' this is null or not defined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = thisArg;
        }
        k = 0;
        while (k < len) {
            var kValue = void 0;
            if (k in O) {
                kValue = O[k];
                callback.call(T, kValue, k, O);
            }
            k++;
        }
    };
}
require('formdata-polyfill');
require('weakmap-polyfill');
var moment_1 = __importDefault(require("moment"));
var TesterNotFoundError = (function (_super) {
    __extends(TesterNotFoundError, _super);
    function TesterNotFoundError(message) {
        return _super.call(this, message) || this;
    }
    return TesterNotFoundError;
}(Error));
var InvalidRuleError = (function (_super) {
    __extends(InvalidRuleError, _super);
    function InvalidRuleError(message) {
        return _super.call(this, message) || this;
    }
    return InvalidRuleError;
}(Error));
var InvalidValueError = (function (_super) {
    __extends(InvalidValueError, _super);
    function InvalidValueError(message) {
        return _super.call(this, message) || this;
    }
    return InvalidValueError;
}(Error));
var is = {
    empty: function (__target) {
        var isEmpty = __target === undefined ||
            __target === null ||
            (!isNaN(__target.length) && __target.length === 0) ||
            (__target instanceof FileList && __target.length === 0);
        return isEmpty;
    },
    number: function (__target) {
        return !isNaN(__target);
    },
    file: function (__target, __type, __extensions) {
        if (__type === void 0) { __type = ''; }
        if (!(__target instanceof File)) {
            return false;
        }
        if (__type !== '*/*') {
            var regxResult = __type.match(/(.*\/)\*/);
            if (regxResult) {
                if (__target.type.indexOf(regxResult[1]) !== 0) {
                    return false;
                }
            }
            else {
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
    },
};
var Kalidator = (function () {
    function Kalidator(data, rules, messages) {
        var _this = this;
        this.data = {};
        this.$rules = {};
        this.$testers = {};
        this.$messages = {};
        this.$unlabeledRules = {};
        this.$keyAndLabels = {};
        this.$requiredKeys = [];
        this.$customTester = {};
        this.$customMessages = {};
        this.errors = {};
        this.isPassed = false;
        this.$is = is;
        this.firstErrorMessage = '';
        this.$defaults = {
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
                earlierThan: ':param(은/는) :$0보다 이른 날짜여야합니다.',
                earlierOrEqualThan: ':param(은/는) :$0과 같거나 :$0보다 이른 날짜여야합니다.',
                laterThan: ':param(은/는) :$0보다 늦은 날짜여야합니다.',
                laterOrEqualThan: ':param(은/는) :$0과 같거나 :$0보다 늦은 날짜여야합니다.',
            },
            testers: {
                required: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    return !_this.$is.empty(Kalidator.getTargetValue(data, key));
                },
                requiredIf: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    var whitelist = extraValue.slice(1);
                    var targetValue = Kalidator.getTargetValue(data, extraValue[0]);
                    if (!_this.$is.empty(targetValue)) {
                        if (whitelist.length === 0 || whitelist.indexOf(targetValue) !== -1) {
                            return !_this.$is.empty(Kalidator.getTargetValue(data, key));
                        }
                        else {
                            return true;
                        }
                    }
                    else {
                        return true;
                    }
                },
                requiredNotIf: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    var blacklist = extraValue.slice(1);
                    var targetValue = Kalidator.getTargetValue(data, extraValue[0]);
                    if (!targetValue) {
                        return !_this.$is.empty(Kalidator.getTargetValue(data, key));
                    }
                    else if (targetValue !== null &&
                        blacklist.indexOf(targetValue) !== -1) {
                        return !_this.$is.empty(Kalidator.getTargetValue(data, key));
                    }
                    else {
                        return true;
                    }
                },
                minLength: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('minLength', key)) {
                        return true;
                    }
                    var minLength = extraValue[0];
                    if (isNaN(Number.parseInt(minLength))) {
                        throw new InvalidRuleError("\uAE38\uC774\uAC12 [" + minLength + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    if (targetValue === null) {
                        return false;
                    }
                    if (!isNaN(targetValue.length)) {
                        return targetValue.length >= minLength;
                    }
                    return targetValue.toString().length >= minLength;
                },
                maxLength: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('maxLength', key)) {
                        return true;
                    }
                    var maxLength = extraValue[0];
                    if (isNaN(Number.parseInt(maxLength))) {
                        throw new InvalidRuleError("\uAE38\uC774\uAC12 [" + maxLength + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    if (targetValue === null) {
                        return false;
                    }
                    if (!isNaN(targetValue.length)) {
                        return targetValue.length <= maxLength;
                    }
                    return targetValue.toString().length <= maxLength;
                },
                betweenLength: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('betweenLength', key)) {
                        return true;
                    }
                    var minLength = extraValue[0];
                    var maxLength = extraValue[1];
                    if (isNaN(Number.parseInt(minLength))) {
                        throw new InvalidRuleError("\uCD5C\uC18C \uAE38\uC774\uAC12 [" + minLength + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    else if (isNaN(Number.parseInt(maxLength))) {
                        throw new InvalidRuleError("\uCD5C\uB300 \uAE38\uC774\uAC12 [" + maxLength + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    return (_this.$defaults.testers.minLength(key, [minLength], data) &&
                        _this.$defaults.testers.maxLength(key, [maxLength], data));
                },
                minValue: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('minValue', key)) {
                        return true;
                    }
                    var minValue = extraValue[0];
                    if (isNaN(Number.parseInt(minValue))) {
                        throw new InvalidRuleError("\uCD5C\uC18C \uC870\uAC74\uAC12 [" + minValue + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    return is.number(targetValue) && targetValue * 1 >= minValue;
                },
                maxValue: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('maxValue', key)) {
                        return true;
                    }
                    var maxValue = extraValue[0];
                    if (isNaN(Number.parseInt(maxValue))) {
                        throw new InvalidRuleError("\uCD5C\uB300 \uC870\uAC74\uAC12 [" + extraValue + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    return is.number(targetValue) && targetValue * 1 <= maxValue;
                },
                betweenValue: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('betweenValue', key)) {
                        return true;
                    }
                    var minValue = extraValue[0];
                    var maxValue = extraValue[1];
                    if (isNaN(Number.parseInt(minValue))) {
                        throw new InvalidRuleError("\uCD5C\uC18C \uC870\uAC74\uAC12 [" + minValue + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    else if (isNaN(Number.parseInt(maxValue))) {
                        throw new InvalidRuleError("\uCD5C\uB300 \uC870\uAC74\uAC12 [" + maxValue + "]\uB294 \uC22B\uC790\uB85C \uBCC0\uD658\uD560 \uC218 \uC5C6\uB294 \uAC12\uC785\uB2C8\uB2E4.");
                    }
                    return (_this.$defaults.testers.minValue(key, minValue, data) &&
                        _this.$defaults.testers.maxValue(key, maxValue, data));
                },
                in: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('in', key)) {
                        return true;
                    }
                    var extraValueArray = extraValue.filter(function (ev) { return ev !== undefined && ev !== null; });
                    var targetValue = Kalidator.getTargetValue(data, key);
                    return extraValueArray.indexOf(targetValue.toString()) !== -1;
                },
                notIn: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('notIn', key)) {
                        return true;
                    }
                    var extraValueArray = extraValue.filter(function (ev) { return ev !== undefined && ev !== null; });
                    var targetValue = Kalidator.getTargetValue(data, key);
                    return extraValueArray.indexOf(targetValue.toString()) === -1;
                },
                empty: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('empty', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    if (targetValue === null) {
                        return true;
                    }
                    if (is.empty(targetValue)) {
                        return true;
                    }
                    return (targetValue
                        .toString()
                        .replace(/<br\s?\/?>/g, '')
                        .replace(/<\/?p\s?>/g, '')
                        .trim() === '');
                },
                notEmpty: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('notEmpty', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    return (targetValue !== null &&
                        !is.empty(targetValue) &&
                        targetValue
                            .toString()
                            .replace(/<br\s?\/?>/g, '')
                            .replace(/<\/?p\s?>/g, '')
                            .trim() !== '');
                },
                number: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('number', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    return is.number(targetValue);
                },
                email: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('email', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    if (typeof targetValue !== 'string') {
                        throw new InvalidValueError("\uC804\uB2EC\uB41C \uAC12 [" + targetValue + "]\uC774 \uBB38\uC790\uC5F4\uC774 \uC544\uB2D9\uB2C8\uB2E4.");
                    }
                    return (targetValue.match(/@/g) !== null &&
                        (targetValue.match(/@/g) || []).length === 1 &&
                        targetValue[0] !== '@' &&
                        targetValue[targetValue.length - 1] !== '@');
                },
                date: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('date', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    try {
                        return moment_1.default(targetValue).isValid();
                    }
                    catch (error) {
                        return false;
                    }
                },
                file: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('file', key)) {
                        return true;
                    }
                    var type = extraValue[0];
                    var extensions = extraValue.slice(1);
                    var isPassed = true;
                    var targetValue = Kalidator.getTargetValue(data, key);
                    if (targetValue instanceof FileList || Array.isArray(targetValue)) {
                        for (var index = 0; index < targetValue.length; index++) {
                            var file = targetValue[index];
                            isPassed = isPassed && is.file(file, type, extensions);
                        }
                    }
                    else if (targetValue instanceof File) {
                        isPassed = is.file(targetValue, type, extensions);
                    }
                    else {
                        isPassed = false;
                    }
                    return isPassed;
                },
                earlierThan: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('earlierThan', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    var compareValue = Kalidator.getTargetValue(data, extraValue[0]) !== null
                        ? Kalidator.getTargetValue(data, extraValue[0])
                        : extraValue;
                    var valueDate = moment_1.default(targetValue);
                    var compareDate = moment_1.default(compareValue);
                    return valueDate.isValid() && compareDate.isValid() && valueDate.diff(compareDate) < 0;
                },
                earlierOrEqualThan: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('earlierOrEqualThan', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    var compareValue = Kalidator.getTargetValue(data, extraValue[0]) !== null
                        ? Kalidator.getTargetValue(data, extraValue[0])
                        : extraValue;
                    var valueDate = moment_1.default(targetValue);
                    var compareDate = moment_1.default(compareValue);
                    return valueDate.isValid() && compareDate.isValid() && valueDate.diff(compareDate) <= 0;
                },
                laterThan: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('laterThan', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    var compareValue = Kalidator.getTargetValue(data, extraValue[0]) !== null
                        ? Kalidator.getTargetValue(data, extraValue[0])
                        : extraValue;
                    var valueDate = moment_1.default(targetValue);
                    var compareDate = moment_1.default(compareValue);
                    return valueDate.isValid() && compareDate.isValid() && valueDate.diff(compareDate) > 0;
                },
                laterOrEqualThan: function (key, extraValue, data) {
                    if (extraValue === void 0) { extraValue = []; }
                    if (data === void 0) { data = {}; }
                    if (_this.__isTestNotRequired('laterOrEqualThan', key)) {
                        return true;
                    }
                    var targetValue = Kalidator.getTargetValue(data, key);
                    var compareValue = Kalidator.getTargetValue(data, extraValue[0]) !== null
                        ? Kalidator.getTargetValue(data, extraValue[0])
                        : extraValue;
                    var valueDate = moment_1.default(targetValue);
                    var compareDate = moment_1.default(compareValue);
                    return valueDate.isValid() && compareDate.isValid() && valueDate.diff(compareDate) >= 0;
                },
            },
        };
        this.$conditionalRequiredRules = ['requiredIf', 'requiredNotIf'];
        this.setData(data);
        this.setRules(rules);
        this.setMessages(messages);
    }
    Kalidator.setGlobalMessage = function (ruleName, message) {
        Kalidator.globalMessage[ruleName] = message;
        return Kalidator;
    };
    Kalidator.registGlobalTester = function (testerName, tester) {
        Kalidator.globalTester[testerName] = tester;
        return Kalidator;
    };
    Kalidator.getTargetValue = function (targetData, key) {
        var keyList = key.split('.');
        var targetValue = Object.assign({}, targetData);
        for (var index = 0; index < keyList.length; index++) {
            var targetKey = keyList[index];
            if (targetValue === null || targetValue === undefined) {
                targetValue = null;
            }
            else if (targetValue[targetKey] == null ||
                targetValue[targetKey] == undefined) {
                targetValue = null;
            }
            else {
                targetValue = targetValue[targetKey];
            }
        }
        return targetValue;
    };
    Kalidator.prototype.__isRequired = function (key) {
        return this.$requiredKeys.indexOf(key) !== -1;
    };
    Kalidator.prototype.__isTestNotRequired = function (testerName, dataKey) {
        return (this.$conditionalRequiredRules.indexOf(testerName) === -1 &&
            !this.__isRequired(dataKey) &&
            is.empty(Kalidator.getTargetValue(this.data, dataKey)));
    };
    Kalidator.prototype.applyZosa = function (targetString) {
        var result = targetString;
        var checkpoints = [
            '(은/는)',
            '(이/가)',
            '(을/를)',
            '(과/와)',
            '(아/야)',
            '(이여/여)',
            '(이랑/랑)',
            '(으로/로)',
            '(으로서/로서)',
            '(으로써/로써)',
            '(으로부터/로부터)',
        ];
        checkpoints.forEach(function (cp) {
            var fir = cp.split('/')[0].replace('(', '');
            var sec = cp.split('/')[1].replace(')', '');
            result = result.replace(new RegExp("\\(" + sec + "/" + fir + "\\)", 'g'), cp);
        });
        for (var index = 0; index < checkpoints.length; index++) {
            var checkpoint = checkpoints[index];
            if (targetString.indexOf(checkpoint) !== -1) {
                var code = targetString.charCodeAt(targetString.indexOf(checkpoint) - 1) - 44032;
                if (code >= 0 || code <= 11171) {
                    result = result.replace(checkpoint, code % 28 !== 0
                        ? checkpoint.split('/')[0].replace('(', '')
                        : checkpoint.split('/')[1].replace(')', ''));
                }
            }
        }
        return result;
    };
    Kalidator.prototype.setData = function (data) {
        var _this = this;
        this.data = {};
        if (data instanceof FormData) {
            data.forEach(function (value, key) {
                if (_this.data[key] && Array.isArray(_this.data[key])) {
                    _this.data[key].push(value);
                }
                else if (_this.data[key] && !Array.isArray(_this.data[key])) {
                    _this.data[key] = [_this.data[key], value];
                }
                else {
                    _this.data[key] = value;
                }
            });
        }
        else if (data instanceof HTMLElement) {
            var inputs = data.querySelectorAll('[name]');
            for (var index = 0; index < inputs.length; index++) {
                var input = inputs[index];
                var type = input.getAttribute('type');
                var name_1 = input.getAttribute('name') || 'noname';
                if (input instanceof HTMLInputElement) {
                    if (type == 'radio') {
                        if (input.checked) {
                            this.data[name_1] = input.value;
                        }
                    }
                    else if (type == 'checkbox') {
                        if (input.checked) {
                            this.data[name_1] = input.value;
                        }
                    }
                    else if (type == 'file') {
                        if (input.files && input.files.length === 1) {
                            this.data[name_1] = input.files[0];
                        }
                        else if (input.files && input.files.length > 1) {
                            this.data[name_1] = input.files;
                        }
                        else {
                            this.data[name_1] = null;
                        }
                    }
                    else {
                        this.data[name_1] = input.value;
                    }
                }
                else if (input instanceof HTMLSelectElement) {
                    var selectedOptions = input.selectedOptions;
                    if (selectedOptions.length > 1) {
                        this.data[name_1] = [];
                        for (var index_1 = 0; index_1 < selectedOptions.length; index_1++) {
                            this.data[name_1].push(selectedOptions[index_1].value);
                        }
                    }
                    else if (selectedOptions.length == 1) {
                        this.data[name_1] = selectedOptions[0].value;
                    }
                }
            }
        }
        else if (typeof data == 'object') {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    var value = data[key];
                    this.data[key] = value;
                }
            }
        }
        return this;
    };
    Kalidator.prototype.setRules = function (paramAndRules) {
        this.$rules = {};
        if (paramAndRules !== null && paramAndRules !== undefined) {
            for (var param in paramAndRules) {
                if (paramAndRules.hasOwnProperty(param)) {
                    var value = paramAndRules[param];
                    this.setRule(param, value);
                }
            }
        }
        return this;
    };
    Kalidator.prototype.setRule = function (param, rules) {
        var unlabeldParam = param;
        var label = '';
        this.$rules[param] = rules;
        if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
            var paramAndLabels = param.split('(');
            unlabeldParam = paramAndLabels[0];
            label = paramAndLabels.slice(1).join('(').replace(/\)$/, '');
        }
        this.$unlabeledRules[unlabeldParam] = rules;
        this.$keyAndLabels[unlabeldParam] = label;
        if (rules.indexOf('required') !== -1) {
            this.$requiredKeys.push(unlabeldParam);
        }
        return this;
    };
    Kalidator.prototype.setMessages = function (messages) {
        this.$customMessages = {};
        if (messages) {
            for (var paramAndRuleName in messages) {
                if (messages.hasOwnProperty(paramAndRuleName)) {
                    var message = messages[paramAndRuleName];
                    this.setMessage(paramAndRuleName, message);
                }
            }
        }
        return this;
    };
    Kalidator.prototype.setMessage = function (param, message) {
        this.$customMessages[param] = message;
        return this;
    };
    Kalidator.prototype.registTester = function (testerName, tester) {
        this.$customTester[testerName] = tester;
        return this;
    };
    Kalidator.prototype.run = function (options) {
        var _this = this;
        this.$testers = Object.assign(this.$defaults.testers, Kalidator.globalTester, this.$customTester);
        this.$messages = Object.assign(this.$defaults.messages, Kalidator.globalMessage, this.$customMessages);
        this.firstErrorMessage = '';
        var promises = Promise.all(Object.keys(this.$rules).map(function (paramName) {
            if (_this.$rules.hasOwnProperty(paramName)) {
                var ruleArray = _this.$rules[paramName];
                return ruleArray.map(function (ruleString) {
                    var param = paramName;
                    var label = '';
                    var testerName = '';
                    if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
                        var paramAndLabels = param.split('(');
                        param = paramAndLabels[0];
                        label = paramAndLabels.slice(1).join('(').replace(/\)$/, '');
                    }
                    var extraValue = [];
                    if (ruleString.indexOf(':') !== -1) {
                        var testerNameAndExtraValues = ruleString.split(':');
                        testerName = testerNameAndExtraValues[0];
                        if (testerNameAndExtraValues[1].indexOf(',') !== -1) {
                            extraValue = testerNameAndExtraValues[1].split(',');
                        }
                        else {
                            extraValue = [testerNameAndExtraValues[1]];
                        }
                    }
                    else {
                        testerName = ruleString;
                    }
                    var tester = _this.$testers[testerName];
                    if (!tester) {
                        throw new TesterNotFoundError("Tester [" + testerName + "] Not Found.");
                    }
                    var paramAsteriskFlatten = [param];
                    var noDataPafList = [];
                    var totalPafList = paramAsteriskFlatten.concat([]);
                    var _loop_1 = function () {
                        var replacedParams = [];
                        paramAsteriskFlatten
                            .filter(function (paf) {
                            return !noDataPafList.some(function (ndpaf) { return ndpaf === paf; });
                        })
                            .forEach(function (paf) {
                            var splitedPaf = paf.split('.');
                            var asteriskPosition = splitedPaf.indexOf('*');
                            if (asteriskPosition > -1) {
                                var beforeAsterisk = splitedPaf.slice(0, asteriskPosition);
                                var beforeAsteriskTargetValue = Kalidator.getTargetValue(_this.data, beforeAsterisk.join('.'));
                                if (beforeAsteriskTargetValue !== null) {
                                    totalPafList = totalPafList.filter(function (tpaf) { return tpaf !== paf; });
                                    for (var j = 0; j < beforeAsteriskTargetValue.length; j++) {
                                        var clone = splitedPaf.concat([]);
                                        clone.splice(asteriskPosition, 1, j.toString());
                                        replacedParams.push(clone.join('.'));
                                        totalPafList.push(clone.join('.'));
                                    }
                                }
                                else {
                                    noDataPafList.push(paf);
                                    replacedParams.push(splitedPaf.join('.'));
                                    totalPafList.push(paf);
                                }
                            }
                            else {
                                replacedParams.push(paf);
                                totalPafList.push(paf);
                            }
                        });
                        paramAsteriskFlatten = replacedParams;
                    };
                    while (paramAsteriskFlatten.length > 0
                        && !paramAsteriskFlatten.some(function (paf) { return paf.indexOf('*') === -1; })) {
                        _loop_1();
                    }
                    var getFailMessage = function (paramForRow) {
                        var messageKey = paramForRow;
                        var isNumericExist = messageKey
                            .split('.')
                            .some(function (splited) { return _this.$is.number(splited); });
                        if (isNumericExist) {
                            messageKey = messageKey
                                .split('.')
                                .map(function (splited) {
                                return _this.$is.number(splited) ? '*' : splited;
                            })
                                .join('.');
                        }
                        var message = (_this.$messages[paramForRow + '.' + testerName] ||
                            _this.$messages[messageKey + '.' + testerName] ||
                            _this.$defaults.messages[testerName] ||
                            _this.$defaults.messages[messageKey] ||
                            '')
                            .replace(/:param/g, label || paramForRow)
                            .replace(/:value/g, Kalidator.getTargetValue(_this.data, paramForRow));
                        if (isNumericExist) {
                            var asteriskSeq_1 = 0;
                            paramForRow.split('.').forEach(function (splited) {
                                if (_this.$is.number(splited)) {
                                    message = message.replace(new RegExp(":\\*" + asteriskSeq_1, 'g'), "" + (Number.parseInt(splited) + 1));
                                    asteriskSeq_1++;
                                }
                            });
                        }
                        var valueLabels = [];
                        extraValue.forEach(function (val) {
                            var evLabel = _this.$keyAndLabels[val];
                            if (!evLabel) {
                                var asteriskedKey = val.split('.').map(function (evSlice) { return isNaN(Number.parseFloat(evSlice)) ? evSlice : '*'; }).join('.');
                                evLabel = _this.$keyAndLabels[asteriskedKey];
                            }
                            if (!evLabel) {
                                evLabel = val;
                            }
                            valueLabels.push(evLabel);
                        });
                        message = message.replace(/:\$concat/g, "[" + valueLabels.join(', ') + "]");
                        extraValue.forEach(function (val, i) {
                            var evLabel = _this.$keyAndLabels[val];
                            if (!evLabel) {
                                var asteriskedKey = val.split('.').map(function (evSlice) { return isNaN(Number.parseFloat(evSlice)) ? evSlice : '*'; }).join('.');
                                evLabel = _this.$keyAndLabels[asteriskedKey];
                            }
                            if (!evLabel) {
                                evLabel = val;
                            }
                            message = message.replace(new RegExp(":\\$" + i, 'g'), evLabel);
                        });
                        return _this.applyZosa(message);
                    };
                    var testPromises = totalPafList.map(function (paramForRow) {
                        if (extraValue.some(function (ev) { return ev.indexOf('*') > -1; })) {
                            extraValue = extraValue.map(function (ev) {
                                var splitedPaf = paramForRow.split('.');
                                var splitedEv = ev.split('.');
                                var remadeEv = [];
                                for (var index = 0; index < splitedEv.length; index++) {
                                    var evSlice = splitedEv[index];
                                    if (evSlice === '*' && !isNaN(splitedPaf[index])) {
                                        remadeEv.push(splitedPaf[index]);
                                    }
                                    else {
                                        remadeEv.push(evSlice);
                                    }
                                }
                                return remadeEv.join('.');
                            });
                        }
                        var testResult = tester(paramForRow, extraValue, _this.data);
                        var failMessage = getFailMessage(paramForRow);
                        if (testResult instanceof Promise) {
                            return testResult.then(function (result) {
                                return Promise.resolve({
                                    isPass: result,
                                    testerName: testerName,
                                    paramForRow: paramForRow,
                                    failMessage: failMessage,
                                });
                            }).catch(Promise.reject);
                        }
                        else {
                            return Promise.resolve({
                                isPass: testResult,
                                testerName: testerName,
                                paramForRow: paramForRow,
                                failMessage: failMessage,
                            });
                        }
                    });
                    var flatten = [];
                    testPromises.forEach(function (promise) {
                        flatten.push(promise);
                    });
                    return Promise.all(flatten);
                });
            }
        }));
        return promises.then(function (results) {
            var flatten = [];
            results.forEach(function (promiseList) {
                promiseList.forEach(function (promise) {
                    flatten.push(promise);
                });
            });
            _this.isPassed = true;
            return Promise.all(flatten).then(function (totalResult) {
                totalResult.forEach(function (resultList) {
                    var resultSet = resultList;
                    resultSet.forEach(function (result) {
                        if (result.isPass !== true) {
                            _this.isPassed = false;
                            _this.errors[result.paramForRow] =
                                _this.errors[result.paramForRow] || {};
                            _this.errors[result.paramForRow][result.testerName] =
                                result.failMessage;
                        }
                    });
                });
                return new Promise(function (resolve, reject) {
                    if (_this.isPassed) {
                        if (options && options.pass && typeof options.pass === 'function') {
                            options.pass();
                        }
                        resolve();
                    }
                    else {
                        var firstErrorBag = _this.errors[Object.keys(_this.errors)[0]];
                        _this.firstErrorMessage =
                            firstErrorBag[Object.keys(firstErrorBag)[0]];
                        if (options && options.fail && typeof options.fail === 'function') {
                            options.fail(_this.errors, _this.firstErrorMessage);
                        }
                        reject({
                            errors: _this.errors,
                            firstErrorMessage: _this.firstErrorMessage,
                        });
                    }
                });
            });
        });
    };
    Kalidator.globalMessage = {};
    Kalidator.globalTester = {};
    return Kalidator;
}());
module.exports = Kalidator;
