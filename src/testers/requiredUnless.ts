import { Tester } from '..'

const requiredUnlessTester: Tester = {
  name: 'requiredUnless',
  defaultMessageOnFailure: ':param(은/는) 반드시 존재해야 해요',
  handler: (value, extras, nullable, pack) => {
    const conditionExtras = extras.slice(1)
    if (conditionExtras.some(conditionExtra => conditionExtra.value === extras[0].value)) {
      return true
    }

    if (value === null || value === undefined || value === '') {
      return false
    }

    if (Array.isArray(value)) {
      return value.length > 0
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0
    }

    return true
  }
}

export default requiredUnlessTester
