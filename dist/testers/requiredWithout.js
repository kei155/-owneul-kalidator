"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const requiredWithoutTester = {
    name: 'requiredWithout',
    defaultMessageOnFailure: ':param(은/는) 반드시 존재해야 해요',
    handler: (value, extras, nullable, pack) => {
        if (extras.some(extra => !extra.isRefField || extra.isEmpty())) {
            if (value === null || value === undefined || value === '') {
                return false;
            }
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            if (typeof value === 'object') {
                return Object.keys(value).length > 0;
            }
        }
        return true;
    }
};
exports.default = requiredWithoutTester;
