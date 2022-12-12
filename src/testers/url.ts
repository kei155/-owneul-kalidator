import { Tester } from '..'

const urlTester: Tester = {
  name: 'url',
  defaultMessageOnFailure: ':param(은/는) URL 형태여야해요',
  handler: (value, extras, nullable, pack) => {
    if (value === null || value === undefined) {
      return true
    }

    if (typeof value !== 'string') {
      return false
    }

    try {
      return Boolean(new URL(value.toString()))
    } catch (error) {
      return false
    }
  }
}

export default urlTester
