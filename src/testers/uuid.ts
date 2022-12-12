import { Tester } from '..'

const uuidTester: Tester = {
  name: 'uuid',
  defaultMessageOnFailure: ':param(은/는) UUID 형태여야해요',
  handler: (value, extras, nullable, pack) => {
    if (value === null || value === undefined) {
      return true
    }

    if (typeof value !== 'string') {
      return false
    }

    return value.match(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi) !== null
  }
}

export default uuidTester
