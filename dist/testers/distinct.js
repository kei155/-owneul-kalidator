"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const distinctTester = {
    name: 'distinct',
    defaultMessageOnFailure: ':param(은/는) 고유한 값이어야해요',
    handler: (value, extras, nullable, { getDataValue, getGroupDataValue }) => {
        if (value === null || value === undefined) {
            return true;
        }
        const groupDataValue = getGroupDataValue();
        const values = Object.values(groupDataValue);
        const valueSet = new Set([...values]);
        return values.length === valueSet.size;
    }
};
exports.default = distinctTester;
