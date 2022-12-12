import { Tester } from '..'

const notInTester: Tester = {
  name: 'notIn',
  defaultMessageOnFailure: ':param(은/는) :extras(이/가) 아니어야해요',
  handler: (value, extras, nullable, pack) => {
    if (value === null || value === undefined) {
      return true
    }

    return !extras.some(extra => extra.value === value)
  }
}

export default notInTester
