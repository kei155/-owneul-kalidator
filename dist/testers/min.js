"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minTester = {
    name: 'min',
    defaultMessageOnFailure: ':param(은/는) 최소 :$0부터 설정할 수 있어요',
    handler: (value, extras, nullable, { fail }) => {
        if (value === undefined || value === null) {
            return true;
        }
        const size = parseInt(extras[0].toString());
        if (isNaN(size)) {
            return fail('min:size 형식의 규칙을 정의해주세요');
        }
        if (typeof value === 'number') {
            return value >= size;
        }
        if (typeof value === 'string') {
            if (value.match(/[^0-9]/) === null && !isNaN(parseInt(value))) {
                return parseInt(value) >= size;
            }
            if (value.length >= size) {
                return true;
            }
            return fail(':param(은/는) 최소 :$0자부터 설정할 수 있어요');
        }
        if (Array.isArray(value)) {
            if (value.length >= size) {
                return true;
            }
            return fail(':param(은/는) 최소 :$0개부터 설정할 수 있어요');
        }
        // TODO : FILE SIZE
        return false;
    }
};
exports.default = minTester;
