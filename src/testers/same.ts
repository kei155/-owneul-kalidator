import { Tester } from '..'

const sameTester: Tester = {
  name: 'same',
  defaultMessageOnFailure: ':param(은/는) :$0(와/과) 같아야해요',
  handler: (value, extras, nullable, pack) => {
    if (value === null || value === undefined) {
      return true
    }

    return extras[0].isRefField && extras[0].value === value
  }
}

export default sameTester
