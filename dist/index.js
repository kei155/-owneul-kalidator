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
exports.validator = exports.ExtraValue = exports.InvalidTesterArgumentError = exports.ValidationFailError = void 0;
const array_1 = __importDefault(require("./testers/array"));
const between_1 = __importDefault(require("./testers/between"));
const date_1 = __importDefault(require("./testers/date"));
const different_1 = __importDefault(require("./testers/different"));
const distinct_1 = __importDefault(require("./testers/distinct"));
const earlier_1 = __importDefault(require("./testers/earlier"));
const earlierOrEqual_1 = __importDefault(require("./testers/earlierOrEqual"));
const email_1 = __importDefault(require("./testers/email"));
const endsWith_1 = __importDefault(require("./testers/endsWith"));
const in_1 = __importDefault(require("./testers/in"));
const later_1 = __importDefault(require("./testers/later"));
const laterOrEqual_1 = __importDefault(require("./testers/laterOrEqual"));
const max_1 = __importDefault(require("./testers/max"));
const min_1 = __importDefault(require("./testers/min"));
const notIn_1 = __importDefault(require("./testers/notIn"));
const notRegex_1 = __importDefault(require("./testers/notRegex"));
const number_1 = __importDefault(require("./testers/number"));
const regex_1 = __importDefault(require("./testers/regex"));
const required_1 = __importDefault(require("./testers/required"));
const requiredIf_1 = __importDefault(require("./testers/requiredIf"));
const requiredUnless_1 = __importDefault(require("./testers/requiredUnless"));
const requiredWith_1 = __importDefault(require("./testers/requiredWith"));
const requiredWithAll_1 = __importDefault(require("./testers/requiredWithAll"));
const requiredWithout_1 = __importDefault(require("./testers/requiredWithout"));
const requiredWithoutAll_1 = __importDefault(require("./testers/requiredWithoutAll"));
const same_1 = __importDefault(require("./testers/same"));
const startsWith_1 = __importDefault(require("./testers/startsWith"));
const url_1 = __importDefault(require("./testers/url"));
const uuid_1 = __importDefault(require("./testers/uuid"));
class ValidationFailError extends Error {
    constructor(message, fails) {
        super(message);
        this.fails = fails;
        this.name = 'ValidationFailError';
    }
}
exports.ValidationFailError = ValidationFailError;
class InvalidTesterArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTesterArgumentError';
    }
}
exports.InvalidTesterArgumentError = InvalidTesterArgumentError;
class ExtraValue {
    constructor(value, rawValue, isRefField) {
        this.value = value;
        this.rawValue = rawValue;
        this.isRefField = isRefField;
        //
    }
    isEmpty() {
        if (this.value === null || this.value === undefined) {
            return true;
        }
        if (typeof this.value === 'boolean') {
            return false;
        }
        if (typeof this.value === 'string') {
            return this.value === '';
        }
        if (Array.isArray(this.value)) {
            return this.value.length === 0;
        }
        if (this.value instanceof Date) {
            return false;
        }
        // if (this.value instanceof File) {
        //   return this.value.size === 0
        // }
        if (this.value.constructor === Object) {
            return Object.keys(this.value).length === 0;
        }
        return false;
    }
    toString() {
        if (this.value === null || this.value === undefined) {
            return '';
        }
        if (typeof this.value === 'boolean') {
            return this.value.toString();
        }
        if (typeof this.value === 'string') {
            return this.value;
        }
        if (typeof this.value === 'number') {
            return this.value.toString();
        }
        if (Array.isArray(this.value)) {
            return JSON.stringify(this.value);
        }
        if (this.value instanceof Date) {
            return this.value.toISOString();
        }
        // if (this.value instanceof File) {
        //   return this.value.name
        // }
        return '';
    }
}
exports.ExtraValue = ExtraValue;
class Kalidator {
    $spreadAsterisk(paramName) {
        if (!paramName.includes('*')) {
            return [paramName];
        }
        // 'lesson.students.*.checks.*.by' => { 'lesson.students.0': dataValue, 'lesson.students.1': dataValue }
        // lesson.students 추출
        const split = paramName.split('.');
        const parentParamName = split.slice(0, split.findIndex(p => p === '*')).join('.');
        let spreads = [];
        const parentDataValue = this.$getDataValue(parentParamName);
        if (Array.isArray(parentDataValue)) {
            for (let index = 0; index < parentDataValue.length; index++) {
                const nextKey = `${parentParamName}.` +
                    split.slice(1, split.findIndex(p => p === '*')).concat(`${index}`).join('.') +
                    (split.slice(split.findIndex(p => p === '*') + 1).length > 0
                        ? `.${split.slice(split.findIndex(p => p === '*') + 1).join('.')}`
                        : '');
                spreads = spreads.concat(this.$spreadAsterisk(nextKey));
            }
        }
        else if (typeof parentDataValue === 'object') {
            for (const key in parentDataValue) {
                if (!Object.prototype.hasOwnProperty.call(parentDataValue, key)) {
                    continue;
                }
                const nextKey = `${parentParamName}.${key}`;
                spreads = spreads.concat(this.$spreadAsterisk(nextKey));
            }
        }
        return spreads;
    }
    /**
     * 데이터 값 조회
     * @param paramSelector 파라미터 선택자
     * @returns 조회된 데이터값
     */
    $getDataValue(paramSelector) {
        const { paramName } = this.$destructParamSelector(paramSelector);
        const paramNameByDepth = paramName.split('.');
        let refValue = this.$data;
        for (let index = 0; index < paramNameByDepth.length; index++) {
            const indexKey = paramNameByDepth[index];
            if (Array.isArray(refValue) && Number.isInteger(indexKey)) {
                refValue = refValue[parseInt(indexKey)];
            }
            else if (typeof refValue === 'object' &&
                refValue !== null) {
                refValue = refValue[indexKey];
            }
        }
        return refValue;
    }
    /**
     * 메세지 가변인자 해소처리
     * @param destructedRule 해체분석된 규칙정보
     * @param destructedParamSelector 해채분석된 파라미터 정보
     * @param spreadParamName 인덱싱 특정된 파라미터명
     * @returns 절차가 해소된 메세지
     */
    $resolveMessage(destructedRule, destructedParamSelector, spreadParamName) {
        var _a, _b, _c;
        const { tester, extras } = destructedRule;
        let message = ((_c = (_b = (_a = this.$messages[`${spreadParamName}.${tester.name}`]) !== null && _a !== void 0 ? _a : this.$messages[`${destructedParamSelector.paramName}.${tester.name}`]) !== null && _b !== void 0 ? _b : this.$messages[tester.name]) !== null && _c !== void 0 ? _c : tester.defaultMessageOnFailure);
        let label = destructedParamSelector.label;
        if (destructedParamSelector.paramName.includes('*')) {
            const splitDestructedParamSelector = destructedParamSelector.paramName.split('.');
            const splitSpreadParamName = spreadParamName.split('.');
            let asteriskSeq = 0;
            splitDestructedParamSelector.forEach((p, index) => {
                if (p !== '*') {
                    return;
                }
                message = message.replace(new RegExp(`:\\*${asteriskSeq}`, 'g'), splitSpreadParamName[index]);
                label = label.replace(new RegExp(`:\\*${asteriskSeq}`, 'g'), splitSpreadParamName[index]);
                asteriskSeq++;
            });
        }
        extras.forEach((extra, index) => {
            let replaceExtraName = extra.toString();
            if (extra.value !== extra.rawValue) {
                for (const key in this.$rule) {
                    if (!Object.prototype.hasOwnProperty.call(this.$rule, key)) {
                        continue;
                    }
                    const labelMatch = key.match(new RegExp(`^${extra.rawValue}\\(([^)]*)\\)$`));
                    if (labelMatch !== null) {
                        replaceExtraName = labelMatch[1];
                    }
                }
            }
            message = message.replace(new RegExp(`:\\$${index}`, 'g'), replaceExtraName);
        });
        return this.$korean(message
            .replace(/:param/g, label)
            .replace(/:extras/g, extras.map(e => e.toString()).join(', '))
            .split(destructedParamSelector.paramName)
            .join(spreadParamName));
    }
    /**
     * 한국어 조사 적용메소드
     * @param targetString 원본 문자열
     * @returns 조사 적용된 문자열
     * @example
     * ```typescript
     * $korean('개발자(이/가) 울며 야근(을/를) 한다') // -> '개발자가 울며 야근을 한다'
     * ```
     */
    $korean(targetString) {
        let result = targetString;
        // 확인할 조사 목록
        const checkpoints = [
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
            '(으로부터/로부터)'
        ];
        // 거꾸로 입력한 거 보정
        for (let index = 0; index < checkpoints.length; index++) {
            const checkpoint = checkpoints[index];
            const fir = checkpoint.split('/')[0].replace('(', '');
            const sec = checkpoint.split('/')[1].replace(')', '');
            result = result.replace(new RegExp(`\\(${sec}/${fir}\\)`, 'g'), checkpoint);
        }
        // 체크포인트 순회
        for (let index = 0; index < checkpoints.length; index++) {
            const checkpoint = checkpoints[index];
            if (!result.includes(checkpoint)) {
                continue;
            }
            const code = result.charCodeAt(result.indexOf(checkpoint) - 1) - 44032;
            if (code >= 0 || code <= 11171) {
                result = result.replace(checkpoint, code % 28 !== 0
                    ? checkpoint.split('/')[0].replace('(', '')
                    : checkpoint.split('/')[1].replace(')', ''));
            }
        }
        return result;
    }
    /**
     * 파라미터 선택자 문자열에서 정보 해체추출
     *
     * @param paramSelector 파라미터 선택자
     * @returns 해체분석된 파라미터 선택정보
     *
     * @example
     * ```
     * // { origin: 'schools.*.students.*.grade(학년)', paramName: schools.*.students.*.grade, label: '학년' }
     * $destructParamSelector('schools.*.students.*.grade(학년)')
     * ```
     */
    $destructParamSelector(paramSelector) {
        const labelMatch = paramSelector.match(/[^(]*\(([^)]*)\)$/);
        const label = labelMatch !== null ? labelMatch[1] : paramSelector;
        const paramName = paramSelector.replace(`(${label})`, '');
        return {
            origin: paramSelector,
            paramName,
            label
        };
    }
    /**
     * 검사규칙 해체분석
     * @param rule 해체분석대상 규칙
     * @param spreadParamName 인덱싱 배정된 파라미터명
     * @returns 규칙 해체분석 결과정보
     */
    $destructRule(rule, spreadParamName) {
        var _a;
        if (typeof rule === 'string') {
            const [ruleName, extraString] = rule.split(':');
            const extras = (extraString !== null && extraString !== void 0 ? extraString : '')
                .split(',')
                .map(s => s.trim())
                .filter(s => s)
                .map(extra => {
                const splitExtra = extra.split('.');
                const splitParamName = spreadParamName.split('.');
                const extraNameForData = splitExtra.map((e, index) => {
                    if (e === '*' && splitParamName.length > index) {
                        return splitParamName[index];
                    }
                    return e;
                }).join('.');
                const extraData = this.$getDataValue(extraNameForData);
                if (extraData === undefined) {
                    // extra value에 대한 타입 파싱
                    // 'true' => true, '10' => 10 ...
                    let parsedExtra = extra;
                    if (extra.toLowerCase() === 'true') {
                        parsedExtra = true;
                    }
                    else if (extra.toLowerCase() === 'false') {
                        parsedExtra = false;
                    }
                    else if (extra.match(/[^0-9.]/) === null && parseFloat(extra).toString() === extra) {
                        parsedExtra = parseFloat(extra);
                    }
                    return new ExtraValue(parsedExtra, extra, false);
                }
                return new ExtraValue(extraData, extra, true);
            });
            return {
                origin: rule,
                tester: (_a = this.$testers.find(tester => tester.name === ruleName)) !== null && _a !== void 0 ? _a : {
                    name: ruleName,
                    defaultMessageOnFailure: `${ruleName}(은/는) 존재하지 않는 테스트 규칙입니다`,
                    handler: () => false
                },
                extras
            };
        }
        else {
            return {
                origin: rule,
                tester: rule,
                extras: []
            };
        }
    }
    /**
     * 제외여부 체크(exclude, excludeIf, excludeUnless...)
     * @param destructedRule 해체분석된 규칙 정보
     * @returns excluded 여부
     */
    $checkExcluded(destructedRule) {
        if (destructedRule.tester.name === 'exclude') {
            return true;
        }
        if (destructedRule.tester.name === 'excludeIf') {
            return destructedRule.extras.length === 2 && destructedRule.extras[0].value === destructedRule.extras[1].value;
        }
        if (destructedRule.tester.name === 'excludeUnless') {
            return destructedRule.extras.length === 2 && destructedRule.extras[0].value !== destructedRule.extras[1].value;
        }
        if (destructedRule.tester.name === 'excludeWith') {
            return destructedRule.extras.length > 0 && destructedRule.extras.some(extra => extra.isRefField && !extra.isEmpty());
        }
        if (destructedRule.tester.name === 'excludeWithout') {
            return destructedRule.extras.length === 0 || destructedRule.extras.some(extra => !extra.isRefField || extra.isEmpty());
        }
        return false;
    }
    constructor(data) {
        this.$data = data;
        this.$rule = {};
        this.$messages = {};
        this.$testers = [
            required_1.default,
            requiredIf_1.default,
            requiredUnless_1.default,
            requiredWith_1.default,
            requiredWithAll_1.default,
            requiredWithout_1.default,
            requiredWithoutAll_1.default,
            number_1.default,
            max_1.default,
            min_1.default,
            between_1.default,
            array_1.default,
            date_1.default,
            later_1.default,
            laterOrEqual_1.default,
            earlier_1.default,
            earlierOrEqual_1.default,
            different_1.default,
            distinct_1.default,
            email_1.default,
            endsWith_1.default,
            startsWith_1.default,
            in_1.default,
            notIn_1.default,
            regex_1.default,
            notRegex_1.default,
            same_1.default,
            url_1.default,
            uuid_1.default
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
    tester(name, messageOnFailure, handler) {
        this.$testers.push({
            name,
            defaultMessageOnFailure: messageOnFailure,
            handler
        });
        return this;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const testerTasks = [];
            for (const paramSelector in this.$rule) {
                if (!Object.prototype.hasOwnProperty.call(this.$rule, paramSelector)) {
                    continue;
                }
                const destructedParamSelector = this.$destructParamSelector(paramSelector);
                const rulesOfParam = this.$rule[paramSelector].sort((a, b) => {
                    if (typeof a === 'string' && a.startsWith('exclude')) {
                        return -1;
                    }
                    return 0;
                });
                let excluded = false;
                const spreadParamNames = this.$spreadAsterisk(destructedParamSelector.paramName);
                spreadParamNames.forEach(spreadParamName => {
                    for (let index = 0; index < rulesOfParam.length; index++) {
                        const rule = rulesOfParam[index];
                        const destructedRule = this.$destructRule(rule, spreadParamName);
                        const dataValue = this.$getDataValue(spreadParamName);
                        // exclude 컨디션 처리
                        if (excluded || this.$checkExcluded(destructedRule)) {
                            excluded = true;
                            continue;
                        }
                        if (destructedRule.tester.name.startsWith('exclude')) {
                            // exclude 규칙은 테스터 취급하지 않음
                            continue;
                        }
                        testerTasks.push(Promise
                            .all([
                            destructedRule.tester.handler(dataValue, destructedRule.extras, rulesOfParam.some(r => typeof r === 'string' && r === 'nullable'), {
                                destructedParamSelector,
                                getGroupDataValue: () => {
                                    const groupDataValue = {};
                                    for (let index = 0; index < spreadParamNames.length; index++) {
                                        const spreadParamName = spreadParamNames[index];
                                        groupDataValue[spreadParamName] = this.$getDataValue(spreadParamName);
                                    }
                                    return groupDataValue;
                                },
                                getDataValue: (paramSelector) => this.$getDataValue(paramSelector),
                                fail: (messageOnFailure) => {
                                    const legacyMessage = this.$messages[`${destructedParamSelector.paramName}.${destructedRule.tester.name}`];
                                    if ((legacyMessage === '' ||
                                        legacyMessage === null ||
                                        legacyMessage === undefined) ||
                                        legacyMessage === destructedRule.tester.defaultMessageOnFailure) {
                                        this.$messages[`${destructedParamSelector.paramName}.${destructedRule.tester.name}`] = messageOnFailure;
                                    }
                                    return false;
                                }
                            })
                        ])
                            .then(([isPass]) => {
                            return {
                                tester: destructedRule.tester,
                                pass: isPass,
                                rule,
                                paramSelector: spreadParamName,
                                message: this.$resolveMessage(destructedRule, destructedParamSelector, spreadParamName)
                            };
                        })
                            .catch((error) => {
                            return {
                                // 테스터 구동 오류
                                tester: destructedRule.tester,
                                pass: false,
                                rule,
                                paramSelector: spreadParamName,
                                message: error.message
                            };
                        }));
                    }
                });
            }
            return yield new Promise((resolve, reject) => {
                Promise
                    .all(testerTasks)
                    .then(taskResults => {
                    const fails = taskResults.filter(result => !result.pass);
                    const failMessages = {};
                    for (let index = 0; index < fails.length; index++) {
                        const failResult = fails[index];
                        failMessages[`${failResult.paramSelector}.${failResult.tester.name}`] = failResult.message;
                    }
                    if (fails.length === 0) {
                        resolve({
                            message: '',
                            fails: {}
                        });
                    }
                    else {
                        reject(new ValidationFailError(fails[0].message, failMessages));
                    }
                })
                    .catch(error => {
                    reject(error);
                });
            });
        });
    }
}
function validator(data) {
    return new Kalidator(data);
}
exports.validator = validator;
