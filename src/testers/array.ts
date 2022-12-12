import { Tester } from '..'

const arrayTester: Tester = {
  name: 'array',
  defaultMessageOnFailure: ':param(은/는) 배열 형태여야해요',
  handler: (value, extras, nullable, pack) => {
    if (value === null || value === undefined) {
      return true
    }

    return Array.isArray(value)
  }
}

export default arrayTester
