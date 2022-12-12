"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const numberTester = {
    name: 'number',
    defaultMessageOnFailure: ':param(은/는) 숫자만 입력할 수 있어요',
    handler: (value, extras, paramSelector, pack) => {
        if (typeof value === 'number') {
            return true;
        }
        if (typeof value === 'string') {
            return !isNaN(parseFloat(value));
        }
        return false;
    }
};
exports.default = numberTester;
