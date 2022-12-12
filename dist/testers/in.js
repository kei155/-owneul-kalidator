"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inTester = {
    name: 'in',
    defaultMessageOnFailure: ':param(은/는) :extras 중 하나여야해요',
    handler: (value, extras, nullable, pack) => {
        if (value === null || value === undefined) {
            return true;
        }
        return extras.some(extra => extra.value === value);
    }
};
exports.default = inTester;
