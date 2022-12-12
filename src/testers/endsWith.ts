import { Tester } from '..'

const endsWithTester: Tester = {
  name: 'endsWith',
  defaultMessageOnFailure: ':param(은/는) :extras 중의 하나로 끝나는 값이어야해요',
  handler: (value, extras, nullable, { fail }) => {
    if (value === null || value === undefined) {
      return true
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      return fail(':param(이/가) 문자 또는 숫자 형태가 아니에요')
    }

    const stringifyValue = `${value}`
    const suffixes = extras.map(extra => extra.toString())

    return suffixes.some(suffix => stringifyValue.endsWith(suffix))
  }
}

export default endsWithTester
