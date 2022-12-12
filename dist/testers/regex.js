"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regexTester = {
    name: 'regex',
    defaultMessageOnFailure: ':param(이/가) 허용되지 않는 형식이에요',
    handler: (value, extras, nullable, { fail }) => {
        if (value === null || value === undefined) {
            return true;
        }
        if (typeof value !== 'string') {
            return fail(':param(이/가) string 타입의 데이터가 아니에요');
        }
        if (!(extras[0].value instanceof RegExp) &&
            typeof extras[0].value !== 'string') {
            return fail(':$0(이/가) RegExp, string 타입의 데이터가 아니에요');
        }
        if (typeof extras[0].value === 'string') {
            const match = extras[0].value.match(/^\/(.*)\/([gimsuy]{1,})?$/);
            if (match === null) {
                return fail(':$0(이/가) 유효한 정규식이 아니에요');
            }
            return value.match(new RegExp(match[1], match[2])) !== null;
        }
        else {
            return extras[0].value !== null;
        }
    }
};
exports.default = regexTester;
