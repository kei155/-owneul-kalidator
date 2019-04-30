# Kalidator

> (for View) Validation. you can validate html Element, javascript FormData, or Object data(javascript).

[![NPM Version][npm-image]][npm-url]

## Install

```bash
npm i @owneul/kalidator
```

## Usage

```javascript
// Kalidator 객체를 생성할 때 데이터화 대상, 검사규칙, 검사미통과시 메세지를 지정한다.
// 이는 생성자로 지정할 수도 있고, 세터를 통해 각각 지정할 수도 있다.
// new Kalidator(__data?, __rules?, __messages?);
// 데이터화 대상으로는 HTML 폼 엘리먼트, javascript FormData 객체, javascript Object 객체가 지정 가능하다.
// 지정이 완료된 후 run 메소드 실행을 통해 유효성 검사를 시작하며, run 함수는 인자값으로 통과, 미통과에 대한 콜백 함수를 받는다.
var kalidator = new Kalidator(document.querySelector('form#frm_regist'));
var rules = {
    'str_id(로그인 아이디)': ['required', 'betweenLength:5,10'],
    'str_password(비밀번호)': ['required'],
    'int_age(나이)': ['betweenValue:15,99', 'notIn:13,불명', 'number'],
    'str_email(메일주소)': ['email', 'isMailHostsIn:gmail.com,naver.com'],
    'str_telecom(이동통신사)': ['in:SKT,KT,LG U-'],
    'str_birthdate(생년월일)': ['required', 'date', 'earlierThan:str_today'],
    'str_today(오늘)': ['required'],
    'file_avatar(프로필 이미지)': ['required', 'file'],
    'file_addimages(첨부파일)': ['file:image/*,png,jpg,jpeg'],
    'str_code(보안코드)': ['required', 'isValueAbc'],
};
kalidator
    .setRules(rules)
    .setMessages({
        'str_id.required': ':param(은/는) 필수입니다.',
        'str_id.minLength': ':param(이/가) 최소 :$0자 이상은 되어야합니다.',
        'str_email.isMailHostsIn': ':param(은/는) 지정된 호스트(:$concat)만 사용할 수 있습니다.',
        'str_code.isValueAbc': ':param(이/가) 일치하지 않습니다.',
        'file_addimages.file': ':param(은/는) 이미지 파일만 등록할 수 있습니다.',
    })
    .registTester('isValueAbc', function (__param, __extraValue, __data) {
        return __data[__param] && __data[__param].toString().toLowerCase() == 'abc';
    })
    .registTester('isMailHostsIn', function (__param, __extraValue, __data) {
        return __data[__param] && __extraValue.indexOf(__data[__param]) !== -1;
    })
    .run({
        pass: function () {
            alert('all data Validated!');
        },
        fail: function (__errors) {
            console.error(__errors);
        },
    });
```

### rules
```javascript
// 데이터에 키값당 실행되어야하는 테스터의 이름을 배열로 지정한다.
// 키값(라벨)로 룰을 지정할 경우, 메세지에서 :param 문자열을 통해 라벨값을 사용할 수 있다.
kalidator.setRules({
    'str_id(로그인 아이디)': ['required', 'betweenLength:5,10'],
    'str_password(비밀번호)': ['required'],
    'int_age(나이)': ['betweenValue:15,99', 'notIn:13,불명', 'number'],
    'str_email(메일주소)': ['email', 'isMailHostsIn:gmail.com,naver.com'],
    'str_telecom(이동통신사)': ['in:SKT,KT,LG U-'],
    'str_birthdate(생년월일)': ['required', 'date', 'earlierThan:str_today'],
    'str_today(오늘)': ['required'],
    'file_avatar(프로필 이미지)': ['required', 'file'],
    'file_addimages(첨부파일)': ['file:image/*,png,jpg,jpeg'],
    'str_code(보안코드)': ['required', 'isValueAbc'],
});
```

| name | description | memo | 
|--------|-------|------|
|required|데이터 내에 __key 값이 반드시 존재해야 한다||
|minLength:n|데이터가 최소 n의 길이어야 한다||
|maxLength:n|데이터가 최대 n의 길이어야 한다||
|betweenLength:n1,n2|데이터가 최소 n1, 최대 n2의 길이어야 한다||
|minValue:n|데이터가 최소 n의 값이어야 한다||
|maxValue:n|데이터가 최대 n의 값이어야 한다||
|betweenValue:n1,n2|데이터가 최소 n1, 최대 n2의 값이어야 한다||
|in:x,y,z...|데이터가 주어진 값들 중 하나여야 한다||
|notIn:x,y,z...|데이터가 주어진 값들 중에 존재하지 않아야 한다||
|number|주어진 값이 숫자여야 한다||
|email|주어진 값이 이메일 주소여야 한다|@로 시작하거나 끝나지 않으며 @를 가지고 있는 여부만 체크함|
|date|주어진 값이 날짜로 추출 가능한 값이어야 한다|Kate 객체|
|file:mimetype,extension1,extension2...|주어진 값이 파일 객체여야 한다(mimetype 및 확장자 제어)|javascript File 객체 사용|
|earlierThan|주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터보다 빠른 날짜여야 한다|timestamp 이용|
|laterThan|주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터보다 늦은 날짜여야 한다|timestamp 이용|

### set custom tester
```javascript
// isMailHostsIn 이라는 이름의 테스터를 등록하는 예제. 
// 등록한 테스터는 룰과 메세지에서 해당 이름으로 사용할 수 있으며, 성공/실패여부를 bool 값으로 반환해야한다.
// 콜백 함수의 arguments는 다음과 같다.
//     __param : 해당 테스터를 호출한 데이터 키값
//     __extraValue : 테스터에게 주어진 검사용 엑스트라 벨류 (검사 룰이 isMailHostsIn:gmail.com,naver.com 으로 지정되었다면 gmail.com, naver.com)
//     __data : 유효성 검사가 실행되는 스코프의 데이터 객체
kalidator.registTester('isMailHostsIn', function (__param, __extraValue, __data) {
    return __data[__param] && __extraValue.indexOf(__data[__param]) !== -1;
});
```

### customize messages
```javascript
// 메세지는 '키값.테스터이름' : '메세지' 형태의 배열로 등록한다.
// 메세지 출력의 편의를 위해 몇 가지 치환용 변수가 제공된다.
// 1. :param 문자는 룰 지정에 사용된 라벨 또는 키값으로 치환된다.
// 2. :$n 문자는 룰 지정에 사용된 엑스트라 벨류로 치환된다. 해당 엑스트라 벨류가 다른 데이터의 키값인 경우 해당 참조데이터의 라벨 또는 키값으로 우선 치환된다.
// 3. (한국어 전용) '(은/는)', '(이/가)' 처럼 조사 분기는 다른 치환이 실행된 후 앞 문자열의 받침유무에 따라 적절하게 치환된다.
// 4. :$concat 문자는 룰 지정에 사용된 엑스트라 벨류가 concat된 문자열로 치환된다.
kalidator.setMessages({
    'str_id.required': ':param(은/는) 필수입니다.',
    'str_id.minLength': ':param(이/가) 최소 :$0자 이상은 되어야합니다.',
    'str_email.isMailHostsIn': ':param(은/는) 지정된 호스트(:$concat)만 사용할 수 있습니다.',
    'str_code.isValueAbc': ':param(이/가) 일치하지 않습니다.',
    'file_addimages.file': ':param(은/는) 이미지 파일만 등록할 수 있습니다.',
});
```

## License

[MIT](http://vjpr.mit-license.org)

[npm-image]: https://img.shields.io/npm/v/live-xxx.svg
[npm-url]: https://www.npmjs.com/package/@owneul/kalidator