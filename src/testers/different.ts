import { Tester } from '..'

const differentTester: Tester = {
  name: 'different',
  defaultMessageOnFailure: ':param(은/는) :$0(와/과) 달라야해요',
  handler: (value, extras, nullable, pack) => {
    if (value === null || value === undefined) {
      return true
    }

    const compareValue = extras[0].value

    if (typeof value === 'string') {
      if (value.match(/[^0-9.]/) === null && !isNaN(parseFloat(value))) {
        return parseFloat(value) !== compareValue
      }

      return value !== compareValue
    }

    if (typeof value === 'number') {
      if (typeof compareValue === 'string') {
        return compareValue.match(/[^0-9.]/) === null && !isNaN(parseFloat(compareValue)) && value !== parseFloat(compareValue)
      }

      return value !== compareValue
    }

    if (Array.isArray(value)) {
      return !Array.isArray(compareValue) ||
          value.length !== compareValue.length ||
          value.some((element, index) => element !== compareValue[index])
    }

    // TODO : File

    return value !== compareValue
  }
}

export default differentTester
