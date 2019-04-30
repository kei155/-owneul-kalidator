var Kate = require('@owneul/kate');

interface Data {
    [key: string]: any;
}

interface Rules {
    [key: string]: any;
}

interface Messages {
    [key: string]: string;
}

interface Testers {
    [key: string]: (__key: string, __extraValue?: any, __data?: Data) => boolean;
}

interface Errors {
    [key: string]: any;
}

interface Defaults {
    [key: string]: any;
}

interface Option {
    pass?: () => {};
    fail?: (errors: Errors) => {};
}

class TesterNotFoundError extends Error {
    constructor(__message?: string) {
        super(__message);
    }
}

class InvalidRuleError extends Error {
    constructor(__message?: string) {
        super(__message);
    }
}

class InvalidValueError extends Error {
    constructor(__message?: string) {
        super(__message);
    }
}

var is = {
    empty(__target: any): boolean {
        return !__target || __target === null || __target === '' || (__target instanceof FileList && __target.length === 0);
    },

    number(__target: any): boolean {
        return !isNaN(__target);
    },

    file(__target: any, __type: string = '', __extensions: any): boolean {
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
}

class Kalidator {
    private data: Data = {};
    private rules: Rules = {};
    private unlabeledRules: Rules = {};

    private keyAndLabels: {[key: string]: any} = {};

    private requiredKeys: Array<string> = [];

    private messages: Messages = {};

    private errors: Errors = {};

    public isPassed: boolean = false;

    public is = is;

    private languages: any = {
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

    private defaults: Defaults = {};

    private tester: Testers = {
        // 데이터 내에 __key 값이 반드시 존재해야 한다
        required: function (__key: string, __extraValue = null, __data = {}): boolean {
            return !is.empty(__data[__key]);
        },

        // [START] length validate section
        // 최소 n의 길이어야 한다
        minLength: (__key, __extraValue, __data = {}): boolean => {
            return (__data[__key].toString().length >= __extraValue);
        },

        // 최대 n의 길이어야 한다
        maxLength: (__key, __extraValue, __data = {}): boolean => {
            return (__data[__key].toString().length <= __extraValue);
        },

        // 최소 n1, 최대 n2의 길이어야 한다
        betweenLength: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue[0] || !__extraValue[1]) {
                throw new InvalidRuleError('Rule betweenLength has invalid format(format: \'betweenLength:min,max\')');
            }

            return (this.tester.minLength(__key, __extraValue[0], __data) && this.tester.maxLength(__key, __extraValue[1], __data));
        },
        // [END] length validate section

        // [START] valueSize validate section
        // 최소 n의 값이어야 한다
        minValue: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue) {
                throw new InvalidRuleError('Rule minValue has invalid format(format: \'minValue:min\')');
            } else if (isNaN(__extraValue)) {
                throw new InvalidValueError(`Invalid value detected(minValue testing value must be number. ${__extraValue} is not a number)`);
            }

            return (is.number(__data[__key]) && __data[__key] >= __extraValue);
        },

        // 최대 n의 값이어야 한다
        maxValue: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue) {
                throw new InvalidRuleError('Rule maxValue has invalid format(format: \'maxValue:max\')');
            } else if (isNaN(__extraValue)) {
                throw new InvalidValueError(`Invalid value detected(maxValue testing value must be number. ${__extraValue} is not a number)`);
            }

            return (is.number(__data[__key]) && __data[__key] <= __extraValue);
        },

        // 최소 n1, 최대 n2의 값이어야 한다
        betweenValue: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue[0] || !__extraValue[1]) {
                throw new InvalidRuleError('Rule betweenValue has invalid format(format: \'betweenValue:min,max\')');
            }

            return is.number(__data[__key]) 
                    && (this.tester.minValue(__key, __extraValue[0], __data) && this.tester.maxValue(__key, __extraValue[1], __data));
        },
        // [END] valueSize validate section

        // [START] value validate section
        // 주어진 값들 중 하나여야 한다
        in: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue) {
                throw new InvalidRuleError('Rule in has invalid format(format: \'in:a,b,c...\')');
            }

            __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];

            return (__extraValue.indexOf(__data[__key]) != -1);
        },

        // 주어진 값들 중에 존재하지 않아야 한다
        notIn: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue) {
                throw new InvalidRuleError('Rule notIn has invalid format(format: \'notIn:a,b,c...\')');
            }

            __extraValue = Array.isArray(__extraValue) ? __extraValue : [__extraValue];

            return (__extraValue.indexOf(__data[__key]) === -1);
        },
        // [END] value validate section

        // [START] value type validate section
        // 주어진 값이 숫자여야 한다
        number: (__key, __extraValue, __data = {}): boolean => {
            return (is.number(__data[__key]));
        },

        // 주어진 값이 이메일 주소여야 한다(@로 시작하거나 끝나지 않으며 @를 가지고 있는 여부만 체크함)
        email: (__key, __extraValue, __data = {}): boolean => {
            if (typeof __data[__key] !== 'string') {
                throw new InvalidValueError(`Invalid value detected(email testing value must be string. [${__data[__key]}] is not a string)`);
            }

            return (
                        __data[__key].match(/@/g) 
                    && (__data[__key].match(/@/g).length === 1) 
                    && __data[__key][0] !== '@' 
                    && __data[__key][__data[__key].length - 1] !== '@'
            );
        },

        // 주어진 값이 날짜로 추출 가능한 값이어야 한다
        date: (__key, __extraValue, __data = {}): boolean => {
            try {
                return Kate(__data[__key]) && true;
            } catch (error) {
                return false;
            }
        },

        // 주어진 값이 파일 객체여야 한다
        file: (__key, __extraValue, __data = {}): boolean => {
            var type = Array.isArray(__extraValue) ? __extraValue[0] : __extraValue,
                extensions = Array.isArray(__extraValue) ? __extraValue.slice(1) : [];
            var isPassed = true;
            if (__data[__key] instanceof FileList) {
                for (let index = 0; index < __data[__key].length; index++) {
                    const file = __data[__key][index];
                    isPassed = isPassed && is.file(file, type, extensions);
                }
            } else if (__data[__key] instanceof File) {
                isPassed = is.file(__data[__key], type, extensions);
            } else {
                isPassed = false;
            }
            return isPassed;
        },
        // [END] value type validate section

        // [START] date validate section
        // 주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터와 빠른 날짜여야 한다
        earlierThan: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue) {
                throw new InvalidRuleError('Rule earlierThan has invalid format(format: \'earlierThan:date or key\')');
            }

            var valueDate = new Date(__data[__key]);
            var compareDate = new Date(this.data[__extraValue] ? this.data[__extraValue] : __extraValue);

            if (!this.data[__extraValue] && isNaN(compareDate.getFullYear())) {
                throw new InvalidRuleError(`Invalid rule detected(earlierThan testing rule must be possible to parse date. cannot parse date from [${__extraValue}].)`);
            }

            return (
                !isNaN(compareDate.getFullYear())
                && !isNaN(valueDate.getFullYear())
                && valueDate.getTime() < compareDate.getTime()
            );
        },

        // 주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터보다 늦은 날짜여야 한다
        laterThan: (__key, __extraValue, __data = {}): boolean => {
            if (!__extraValue) {
                throw new InvalidRuleError('Rule laterThan has invalid format(format: \'laterThan:date or key\')');
            }

            var valueDate = new Date(__data[__key]);
            var compareDate = new Date(this.data[__extraValue] ? this.data[__extraValue] : __extraValue);

            if (!this.data[__extraValue] && isNaN(compareDate.getFullYear())) {
                throw new InvalidRuleError(`Invalid rule detected(laterThan testing rule must be possible to parse date. cannot parse date from [${__extraValue}].)`);
            }

            return (
                !isNaN(compareDate.getFullYear())
                && !isNaN(valueDate.getFullYear())
                && valueDate.getTime() > compareDate.getTime()
            );
        },
        // [END] date validate section
    };

    constructor(__data?: any, __rules?: Rules, __messages?: any) {
        this.languages.basic = this.languages.ko,
        this.defaults.messages = this.languages.basic.messages;

        this.setData(__data);
        this.setRules(__rules);
        this.setMessages(__messages);
    }

    // 특정 키값이 필수 항목을 가지고 있는지 체크하는 내부호출용 메소드
    __isRequired(__key:string): boolean {
        return this.requiredKeys.indexOf(__key) != -1;
    }

    applyZosa(__string: string): string {
        var result = __string,
            checkpoints = ['(은/는)', '(이/가)', '(을/를)', '(과/와)', '(아/야)', '(이여/여)', '(이랑/랑)', '(으로/로)', '(으로서/로서)', '(으로써/로써)', '(으로부터/로부터)'];

        for (let index = 0; index < checkpoints.length; index++) {
            const checkpoint = checkpoints[index];
            if (__string.indexOf(checkpoint) !== -1) {
                var code = __string.charCodeAt(__string.indexOf(checkpoint) - 1) - 44032;
            
                if (code >= 0 || code <= 11171) {
                    result = result.replace(checkpoint, code % 28 !== 0 ? checkpoint.split('/')[0].replace('(', '') : checkpoint.split('/')[1].replace(')', ''));
                }
            }
        }

        return result;
    }

    test(__key: string, __tester: any) {
        var param = __key,
            label = null;

        if (param.indexOf('(') !== -1 && param.indexOf(')') !== -1) {
            var tmpArr2 = param.split('(');
            param = tmpArr2[0];
            label = tmpArr2[1].substring(0, tmpArr2[1].length - 1);
        }

        var testerName = __tester,
            extraValue: any = '';

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
            throw new TesterNotFoundError(`Tester [${testerName}] Not Found.`);
        }

        // 필수값이 아니고 값이 없으면 테스트 통과처리
        if (!this.__isRequired(param) && is.empty(this.data[param])) return;

        if (!tester(param, extraValue, this.data)) {
            var message = (this.messages[param + '.' + testerName] || this.defaults.messages[testerName] || '')
                .replace(':param', label || param);

            if (Array.isArray(extraValue)) {
                var valueLabels: string[] = [];
                extraValue.forEach(val => {
                    valueLabels.push(this.keyAndLabels[val] ? this.keyAndLabels[val] : val);
                });
                message.replace(':$concat', `[${valueLabels.join(', ')}]`)

                extraValue.forEach((val, i) => { 
                    var replaceValue = this.keyAndLabels[val] ? this.keyAndLabels[val] : val;
                    message = message.replace(`:$${i}`, replaceValue); 
                });
            } else {
                message.replace(':$concat', `[${this.keyAndLabels[extraValue] ? this.keyAndLabels[extraValue] : extraValue}]`)

                var replaceValue = this.keyAndLabels[extraValue] ? this.keyAndLabels[extraValue] : extraValue;
                message = message.replace(':$0', replaceValue);
            }

            this.errors[param] = this.errors[param] || {};
            this.errors[param][testerName] = this.applyZosa(message);
        }
    }

    setData(__data: any): Kalidator {
        this.data = {};
        if (__data instanceof FormData) {
            __data.forEach((value, key) => {
                this.data[key] = value;
            });
        } else if (__data instanceof HTMLElement) {
            var inputs = __data.querySelectorAll('[name]');
            for (let index = 0; index < inputs.length; index++) {
                const input = inputs[index],
                      type = input.getAttribute('type'),
                      name = input.getAttribute('name') || 'noname';
                if (input instanceof HTMLInputElement) {
                    if (type == 'radio' && input.checked) {
                        this.data[name] = input.value;
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
        } else if (typeof __data == 'object') {
            for(var key in __data) { 
                if (__data.hasOwnProperty(key)) {
                    var value = __data[key];
                    this.data[key] = value;
                }
             }
        }
        return this;
    }

    setRules(__rules?: Rules): Kalidator {
        this.rules = {};
        if (__rules) {
            for(var key in __rules) { 
                if (__rules.hasOwnProperty(key)) {
                    var value = __rules[key];
                    this.setRule(key, value);
                }
             }
        }
        return this;
    }

    setRule(__param: string, __rule: Array<any>): Kalidator {
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

        if (__rule.indexOf('required') != -1) {
            this.requiredKeys.push(unlabeldParam);
        }

        return this;
    }

    setMessages(__messages?: Messages): Kalidator {
        this.messages = {};
        if (__messages) {
            for(var key in __messages) { 
                if (__messages.hasOwnProperty(key)) {
                    var value = __messages[key];
                    this.setMessage(key, value);
                }
             }
        }
        return this;
    }

    setMessage(__param: string, __message: string): Kalidator {
        this.messages[__param] = __message;
        return this;
    }

    registTester(__testerName: string, __tester: (__key: string, __extraValue?: any, __data?: Data) => boolean): Kalidator {
        this.tester[__testerName] = __tester;
        return this;
    }

    run(__options?: Option) {
        for(var param in this.rules) { 
            if (this.rules.hasOwnProperty(param)) {
                var ruleArray = this.rules[param];
                for (let index = 0; index < ruleArray.length; index++) {
                    let rule = ruleArray[index];
                    this.test(param, rule);
                }
            }
         }
         this.isPassed = Object.keys(this.errors).length === 0 && JSON.stringify(this.errors) === JSON.stringify({});

         if (this.isPassed && __options && __options.pass) {
            __options.pass();
         } else if (!this.isPassed && __options && __options.fail) {
             __options.fail(this.errors);
         }
    }
}

export = Kalidator;