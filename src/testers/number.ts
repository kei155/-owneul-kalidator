import { Tester } from '..'

const numberTester: Tester = {
  name: 'number',
  defaultMessageOnFailure: ':param(은/는) 숫자만 입력할 수 있어요',
  handler: (value, extras, nullable, pack) => {
    if (value === undefined || value === null) {
      return true
    }

    if (typeof value === 'number') {
      return true
    }

    if (typeof value === 'string') {
      return value.match(/[^0-9]/) === null && !isNaN(parseFloat(value))
    }

    return false
  }
}

export default numberTester
