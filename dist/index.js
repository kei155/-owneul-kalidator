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
var TesterNotFoundError = (function (_super) {
    __extends(TesterNotFoundError, _super);
    function TesterNotFoundError(__message) {
        return _super.call(this, __message) || this;
    }
    return TesterNotFoundError;
}(Error));
var InvalidRuleError = (function (_super) {
    __extends(InvalidRuleError, _super);
    function InvalidRuleError(__message) {
        return _super.call(this, __message) || this;
    }
    return InvalidRuleError;
}(Error));
var InvalidValueError = (function (_super) {
    __extends(InvalidValueError, _super);
    function InvalidValueError(__message) {
        return _super.call(this, __message) || this;
    }
    return InvalidValueError;
}(Error));
var is = {
    empty: function (__target) {
        return !__target || __target === null || __target === '' || (__target instanceof FileList && __target.length === 0);
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
    }
};
var Validator = (function () {
    function Validator(__data, __rules, __messages) {
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
                    minLength: ':param(은/는) 최소 :$0자를 입력해야합니다.',
                    maxLength: ':param(은/는) 최대 :$0자까지 입력할 수 있습니다.',
                    betweenLength: ':param(은/는) :$0자 ~ :$1자 사이에서 입력할 수 있습니다.',
                    minValue: ':param의 값은 최소 :$0입니다.',
                    maxValue: ':param의 값은 최대 :$0입니다.',
                    betweenValue: ':param의 값은 :$0 ~ :$1 사이만 가능합니다.',
                    in: ':param의 값은 :$concat 중 하나여야합니다.',
                    notIn: ':param의 값은 :$concat 이외의 값이어야합니다.',
                    number: ':param의 값은 숫자여야합니다.',
                    email: ':param의 값은 유효한 이메일 주소여야합니다.',
                    date: ':param의 값은 날짜여야합니다.',
                    file: ':param 파일이 정상적으로 첨부되지 않았습니다.',
                    earlierThan: ':param은 :$0보다 이른 날짜여야합니다.',
                },
            },
        };
        this.defaults = {};
        this.tester = {
            required: function (__key, __extraValue, __data) {
                if (__extraValue === void 0) { __extraValue = null; }
                if (__data === void 0) { __data = {}; }
                return !is.empty(__data[__key]);
            },
            minLength: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                return (__data[__key].toString().length >= __extraValue);
            },
            maxLength: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                return (__data[__key].toString().length <= __extraValue);
            },
            betweenLength: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue[0] || !__extraValue[1]) {
                    throw new InvalidRuleError('Rule betweenLength has invalid format(format: \'betweenLength:min,max\')');
                }
                return (_this.tester.minLength(__key, __extraValue[0], __data) && _this.tester.maxLength(__key, __extraValue[1], __data));
            },
            minValue: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue) {
                    throw new InvalidRuleError('Rule minValue has invalid format(format: \'minValue:min\')');
                }
                else if (isNaN(__extraValue)) {
                    throw new InvalidValueError("Invalid value detected(minValue testing value must be number. " + __extraValue + " is not a number)");
                }
                return (is.number(__data[__key]) && __data[__key] >= __extraValue);
            },
            maxValue: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue) {
                    throw new InvalidRuleError('Rule maxValue has invalid format(format: \'maxValue:max\')');
                }
                else if (isNaN(__extraValue)) {
                    throw new InvalidValueError("Invalid value detected(maxValue testing value must be number. " + __extraValue + " is not a number)");
                }
                return (is.number(__data[__key]) && __data[__key] <= __extraValue);
            },
            betweenValue: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue[0] || !__extraValue[1]) {
                    throw new InvalidRuleError('Rule betweenValue has invalid format(format: \'betweenValue:min,max\')');
                }
                return is.number(__data[__key])
                    && (_this.tester.minValue(__key, __extraValue[0], __data) && _this.tester.maxValue(__key, __extraValue[1], __data));
            },
            in: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue) {
                    throw new InvalidRuleError('Rule in has invalid format(format: \'in:a,b,c...\')');
                }
                __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];
                return (__extraValue.indexOf(__data[__key]) != -1);
            },
            notIn: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue) {
                    throw new InvalidRuleError('Rule notIn has invalid format(format: \'notIn:a,b,c...\')');
                }
                __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];
                return (__extraValue.indexOf(__data[__key]) === -1);
            },
            number: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                return (is.number(__data[__key]));
            },
            email: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (typeof __data[__key] !== 'string') {
                    throw new InvalidValueError("Invalid value detected(email testing value must be string. [" + __data[__key] + "] is not a string)");
                }
                return (__data[__key].match(/@/g)
                    && (__data[__key].match(/@/g).length === 1)
                    && __data[__key][0] !== '@'
                    && __data[__key][__data[__key].length - 1] !== '@');
            },
            date: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                return !isNaN(Date.parse(__data[__key]));
            },
            file: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                var type = Array.isArray(__extraValue) ? __extraValue[0] : __extraValue, extensions = Array.isArray(__extraValue) ? __extraValue.slice(1) : [];
                var isPassed = true;
                if (__data[__key] instanceof FileList) {
                    for (var index = 0; index < __data[__key].length; index++) {
                        var file = __data[__key][index];
                        isPassed = isPassed && is.file(file, type, extensions);
                    }
                }
                else if (__data[__key] instanceof File) {
                    isPassed = is.file(__data[__key], type, extensions);
                }
                else {
                    isPassed = false;
                }
                return isPassed;
            },
            earlierThan: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue) {
                    throw new InvalidRuleError('Rule earlierThan has invalid format(format: \'earlierThan:date or key\')');
                }
                var valueDate = new Date(__data[__key]);
                var compareDate = new Date(_this.data[__extraValue] ? _this.data[__extraValue] : __extraValue);
                if (!_this.data[__extraValue] && isNaN(compareDate.getFullYear())) {
                    throw new InvalidRuleError("Invalid rule detected(earlierThan testing rule must be possible to parse date. cannot parse date from [" + __extraValue + "].)");
                }
                return (!isNaN(compareDate.getFullYear())
                    && !isNaN(valueDate.getFullYear())
                    && valueDate.getTime() < compareDate.getTime());
            },
            laterThan: function (__key, __extraValue, __data) {
                if (__data === void 0) { __data = {}; }
                if (!__extraValue) {
                    throw new InvalidRuleError('Rule laterThan has invalid format(format: \'laterThan:date or key\')');
                }
                var valueDate = new Date(__data[__key]);
                var compareDate = new Date(_this.data[__extraValue] ? _this.data[__extraValue] : __extraValue);
                if (!_this.data[__extraValue] && isNaN(compareDate.getFullYear())) {
                    throw new InvalidRuleError("Invalid rule detected(laterThan testing rule must be possible to parse date. cannot parse date from [" + __extraValue + "].)");
                }
                return (!isNaN(compareDate.getFullYear())
                    && !isNaN(valueDate.getFullYear())
                    && valueDate.getTime() > compareDate.getTime());
            },
        };
        this.languages.basic = this.languages.ko,
            this.defaults.messages = this.languages.basic.messages;
        this.setData(__data);
        this.setRules(__rules);
        this.setMessages(__messages);
    }
    Validator.prototype.__isRequired = function (__key) {
        return this.requiredKeys.indexOf(__key) != -1;
    };
    Validator.prototype.applyZosa = function (__string) {
        var result = __string, checkpoints = ['(은/는)', '(이/가)', '(을/를)', '(과/와)', '(아/야)', '(이여/여)', '(이랑/랑)', '(으로/로)', '(으로서/로서)', '(으로써/로써)', '(으로부터/로부터)'];
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
    Validator.prototype.test = function (__key, __tester) {
        var _this = this;
        var param = __key, label = null;
        if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
            var tmpArr2 = param.split('(');
            param = tmpArr2[0];
            label = tmpArr2[1].substring(0, tmpArr2[1].length - 1);
        }
        var testerName = __tester, extraValue = '';
        if (testerName.indexOf(':') !== -1) {
            var tmpArr = testerName.split(':');
            testerName = tmpArr[0];
            if (tmpArr[1].indexOf(',') !== -1) {
                extraValue = tmpArr[1].split(',');
            }
            else {
                extraValue = tmpArr[1];
            }
        }
        var tester = this.tester[testerName];
        if (!tester) {
            throw new TesterNotFoundError("Tester [" + testerName + "] Not Found.");
        }
        if (!this.__isRequired(param) && is.empty(this.data[param]))
            return;
        if (!tester(param, extraValue, this.data)) {
            var message = (this.messages[param + '.' + testerName] || this.defaults.messages[testerName] || '')
                .replace(':param', label || param);
            if (Array.isArray(extraValue)) {
                var valueLabels = [];
                extraValue.forEach(function (val) {
                    valueLabels.push(_this.keyAndLabels[val] ? _this.keyAndLabels[val] : val);
                });
                message.replace(':$concat', "[" + valueLabels.join(', ') + "]");
                extraValue.forEach(function (val, i) {
                    var replaceValue = _this.keyAndLabels[val] ? _this.keyAndLabels[val] : val;
                    message = message.replace(":$" + i, replaceValue);
                });
            }
            else {
                message.replace(':$concat', "[" + (this.keyAndLabels[extraValue] ? this.keyAndLabels[extraValue] : extraValue) + "]");
                var replaceValue = this.keyAndLabels[extraValue] ? this.keyAndLabels[extraValue] : extraValue;
                message = message.replace(':$0', replaceValue);
            }
            this.errors[param] = this.errors[param] || {};
            this.errors[param][testerName] = this.applyZosa(message);
        }
    };
    Validator.prototype.setData = function (__data) {
        var _this = this;
        this.data = {};
        if (__data instanceof FormData) {
            __data.forEach(function (value, key) {
                _this.data[key] = value;
            });
        }
        else if (__data instanceof HTMLElement) {
            var inputs = __data.querySelectorAll('[name]');
            for (var index = 0; index < inputs.length; index++) {
                var input = inputs[index], type = input.getAttribute('type'), name_1 = input.getAttribute('name') || 'noname';
                if (input instanceof HTMLInputElement) {
                    if (type == 'radio' && input.checked) {
                        this.data[name_1] = input.value;
                    }
                    else if (type == 'file') {
                        if (input.files && input.files.length === 1) {
                            this.data[name_1] = input.files[0];
                        }
                        else if (input.files) {
                            this.data[name_1] = input.files;
                        }
                    }
                    else {
                        this.data[name_1] = input.value;
                    }
                }
                else if (input instanceof HTMLSelectElement) {
                    this.data[name_1] = input.value;
                }
            }
        }
        else if (typeof __data == 'object') {
            for (var key in __data) {
                if (__data.hasOwnProperty(key)) {
                    var value = __data[key];
                    this.data[key] = value;
                }
            }
        }
        return this;
    };
    Validator.prototype.setRules = function (__rules) {
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
    Validator.prototype.setRule = function (__param, __rule) {
        var unlabeldParam = __param, label = '';
        this.rules[__param] = __rule;
        if (__param.indexOf('(') !== -1 && __param.indexOf(')') !== -1) {
            var tmpArr2 = __param.split('(');
            unlabeldParam = tmpArr2[0];
            label = tmpArr2[1].slice(0, -1);
        }
        this.unlabeledRules[unlabeldParam] = __rule;
        this.keyAndLabels[unlabeldParam] = label;
        if (__rule.indexOf('required') != -1) {
            this.requiredKeys.push(unlabeldParam);
        }
        return this;
    };
    Validator.prototype.setMessages = function (__messages) {
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
    Validator.prototype.setMessage = function (__param, __message) {
        this.messages[__param] = __message;
        return this;
    };
    Validator.prototype.registTester = function (__testerName, __tester) {
        this.tester[__testerName] = __tester;
        return this;
    };
    Validator.prototype.run = function (__options) {
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
        if (this.isPassed && __options && __options.pass) {
            __options.pass();
        }
        else if (!this.isPassed && __options && __options.fail) {
            __options.fail(this.errors);
        }
    };
    return Validator;
}());
module.exports = Validator;
