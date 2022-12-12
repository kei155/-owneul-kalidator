import { Tester } from '..'

const startsWithTester: Tester = {
  name: 'startsWith',
  defaultMessageOnFailure: ':param(은/는) :extras 중의 하나로 시작하는 값이어야해요',
  handler: (value, extras, nullable, { fail }) => {
    if (value === null || value === undefined) {
      return true
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      return fail(':param(이/가) 문자 또는 숫자 형태가 아니에요')
    }

    const stringifyValue = `${value}`
    const prefixes = extras.map(extra => extra.toString())

    return prefixes.some(prefix => stringifyValue.startsWith(prefix))
  }
}

export default startsWithTester
