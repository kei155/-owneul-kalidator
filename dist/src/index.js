"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = exports.ValidationFailError = void 0;
const number_1 = __importDefault(require("./testers/number"));
class ValidationFailError extends Error {
    constructor(message, fails) {
        super(message);
        this.fails = fails;
        this.name = 'ValidationError';
    }
}
exports.ValidationFailError = ValidationFailError;
class Kalidator {
    $getDataValue(paramSelector) {
        return this.$data[paramSelector];
    }
    $resolveMessage(tester, destructedParamSelector) {
        return tester.defaultMessageOnFailure;
    }
    /**
     * 파라미터 선택자 문자열에서 정보 해체추출
     *
     * @param paramSelector 파라미터 선택자
     * @returns 해체분석된 파라미터 선택정보
     *
     * @example
     * ```
     * // { origin: 'schools.*.students.*.grade(학년)', paramName: schools.*.students.*.grade, indexes: ['마포고등학교', 144002], label: '학년' }
     * $destructParamSelector('schools.*.students.*.grade(학년)')
     * ```
     */
    $destructParamSelector(paramSelector) {
        return {
            origin: paramSelector,
            paramName: '',
            indexes: [],
            label: paramSelector
        };
    }
    constructor(data) {
        this.$testerPack = {
            getDataValue: this.$getDataValue,
            setMessage: (paramSelector, messageOnFailure) => { this.$messages[paramSelector] = messageOnFailure; }
        };
        this.$data = data;
        this.$rule = {};
        this.$messages = {};
        this.$testers = [
            number_1.default
        ];
    }
    rule(rule) {
        this.$rule = rule;
        return this;
    }
    message(message) {
        this.$messages = message;
        return this;
    }
    tester(name, handler) {
        this.$testers.push({
            name,
            handler
        });
        return this;
    }
    run() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const testerTasks = [];
            for (const paramSelector in this.$rule) {
                if (Object.prototype.hasOwnProperty.call(this.$rule, paramSelector)) {
                    const destructedParamSelector = this.$destructParamSelector(paramSelector);
                    const rulesOfParam = this.$rule[paramSelector];
                    for (let index = 0; index < rulesOfParam.length; index++) {
                        const rule = rulesOfParam[index];
                        const [ruleName, extraString] = typeof rule === 'string' ? rule.split(':') : `fn_${index}`;
                        const extras = (extraString !== null && extraString !== void 0 ? extraString : '').split(',').map(s => s.trim());
                        const tester = typeof rule === 'string'
                            ? (_a = this.$testers.find(tester => tester.name === ruleName)) !== null && _a !== void 0 ? _a : {
                                name: ruleName,
                                defaultMessageOnFailure: `${ruleName}(은/는) 존재하지 않는 테스트 규칙입니다`,
                                handler: () => false
                            }
                            : rule;
                        testerTasks.push(Promise
                            .all([
                            tester.handler(this.$getDataValue(paramSelector), extras, paramSelector, this.$testerPack)
                        ])
                            .then(([isPass]) => ({
                            pass: isPass,
                            rule,
                            paramSelector,
                            message: this.$resolveMessage(tester, destructedParamSelector)
                        }))
                            .catch((error) => ({
                            // 테스터 구동 오류
                            pass: false,
                            rule,
                            paramSelector,
                            message: error.message
                        })));
                    }
                }
            }
            return yield new Promise((success, failure) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const taskResults = yield Promise.all(testerTasks);
                    const fails = taskResults.filter(result => !result.pass);
                    const failMessages = {};
                    for (let index = 0; index < fails.length; index++) {
                        const failResult = fails[index];
                        failMessages[`${failResult.paramSelector}.${failResult.rule}`] = failResult.message;
                    }
                    if (fails.length === 0) {
                        success({
                            message: '',
                            fails: {}
                        });
                    }
                    else {
                        failure(new ValidationFailError(fails[0].message, failMessages));
                    }
                }
                catch (error) {
                    failure(error);
                }
            }));
        });
    }
}
function validator(data) {
    return new Kalidator(data);
}
exports.validator = validator;
