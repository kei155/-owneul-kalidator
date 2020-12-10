# Kalidator

> (for View) Validation. you can validate Object data, html Element, javascript FormData

[![NPM Version][npm-image]][npm-url]

## Install

```bash
npm i @owneul/kalidator
```

## Updates

[v1 document](readme.v1.md)

#### 검사실행을 프로미스 기반 로직으로 변경하였습니다.
#### 배열 형태의 데이터를 수용하도록 변경하였습니다.
#### 날짜관련 핸들링에 moment.js 의존성을 추가하였습니다.

## Usage


```javascript
// Kalidator 객체를 생성할 때 데이터화 대상, 검사규칙, 검사미통과시 메세지를 지정한다.
// 이는 생성자로 지정할 수도 있고, 세터를 통해 각각 지정할 수도 있다.
// 각각의 세터는 메소드 체이닝을 위해 자기자신을 반환한다.
// new Kalidator(data?, rules?, messages?);
// data 파라미터는 javascript Object, HTML 엘리먼트, javascript FormData 객체가 지정 가능하다.
// * HTML 엘리먼트의 경우 엘리먼트 하위의 name attribute를 가진 엘리먼트를 이름 그대로 추출하므로 유의(구조화 하지 않음)
// * FormData의 경우 formData.get() / formData.getAll() 메소드를 통해 단순추출을 진행하므로 유의
//
// 지정이 완료된 후 run 메소드 실행을 통해 유효성 검사를 시작하며, run 함수는 프로미스를 반환한다.
const validator = new Kalidator();
const data = {
    goodsList: [
        {
            id: 1004,
            name: '민무늬 원피스',
            price: 89000,
            checks: ['black', 'red', 'yellow'],
        },
        {
            id: 2007,
            name: '닌텐도 스위치',
            price: '공짜',
            checks: ['free'],
        },
        {
            name: '비닐하우스 미니어쳐 키트',
            price: 199000,
        },
    ],
    buyer: {
        memberId: 'owneul',
        tel: '010-1234-5678',
        address: '경상북도 울릉군 울릉읍 독도이사부길 63 (독도등대)',
        deliveryMessage: '안전배송바랍니다12345678901234567890...........*(very long text)*',
    },
};
const rules = {
    'goodsList.*.id(상품코드)': ['required', 'minValue:1'],
    'goodsList.*.name(상품명)': ['required'],
    'goodsList.*.price(판매가)': ['required', 'number'],
    'goodsList.*.checks.*(상품 선택사항)': ['in:black,red,yellow'],
    'buyer.memberId(회원 아이디)': ['required', 'existMember'],
    'buyer.tel(구매자 연락처)': ['required', 'phoneNumber'],
    'buyer.address(구매자 주소)': ['required'],
    'buyer.deliveryMessage(배송메세지)': ['required', 'maxLength:30'],
};
const messages = {
    'goodsList.*.id.required': ':param(은/는) 필수입니다. (:*0번째 상품)',
    'goodsList.*.id.minValue': ':param(은/는) 최소 :$1원 이상이어야합니다. (:*0번째 상품)',
    'goodsList.*.name.required': ':param(은/는) 필수입니다. (:*0번째 상품)',
    'goodsList.*.price.required': ':param(은/는) 필수입니다. (:*0번째 상품)',
    'goodsList.*.price.number': ':param(은/는) 유효한 정수여야합니다. (:*0번째 상품)',
    'goodsList.*.checks.*.in': ':param(은/는) :$concat 중의 하나여야합니다. (:*0번째 상품의 :*1번째 선택사항)',
    'buyer.memberId.required': ':param(은/는) 필수입니다.',
    'buyer.memberId.existMember': ':param [:value](은/는) 존재하지 않는 :param입니다.',
    'buyer.memberId.phoneNumber': ':param(은/는) 올바른 휴대전화번호가 아닙니다.',
    'buyer.deliveryMessage.maxLength': ':param(은/는) :$0자 이하여야합니다.',
};

validator
    .setData(data)
    .setRules(rules)
    .setMessages(messages)
    .registTester('phoneNumber', function (paramName, extraValues, data) {
        const tel = Kalidator.getTargetValue(data, paramName)
        return tel !== null && tel.match(/[0-9]{3}-[0-9]{4}-[0-9]{4}/) !== null;
    })
    .registTester('existMember', function (paramName, extraValues, data) {
        const memberId = Kalidator.getTargetValue(data, paramName);
        return fetch(`https://jsonplaceholder.typicode.com/users/${memberId}`)
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                return Object.keys(json).length > 0;
            })
            .catch(function (err) {
                return false;
            })
    })
    .run()
    .then(function () {
        alert('all validate passed!');
    })
    .catch(function (err) {
        console.error('모든 실패한 테스트에 대한 메세지 : ', err.errors);
        console.error('첫 번째 실패 테스트 메세지 : ', err.firstErrorMessage);
    })
```

### Rules
```javascript
// 데이터에 키값당 실행되어야하는 테스터의 이름을 배열로 지정한다.
// 키값(라벨)로 룰을 지정할 경우, 메세지에서 :param 문자열을 통해 라벨값을 사용할 수 있다.
// 애스터리스크(*) 문자는 배열로 해석된다.
var kalidator = new Kalidator();
kalidator.setRules({
    'goodsList.*.id(상품코드)': ['required', 'minValue:1'],
    'goodsList.*.name(상품명)': ['required'],
    'goodsList.*.price(판매가)': ['required', 'number'],
    'goodsList.*.checks.*(상품 선택사항)': ['in:black,red,yellow'],
    'buyer.memberId(회원 아이디)': ['required', 'existMember'],
    'buyer.tel(구매자 연락처)': ['required', 'phoneNumber'],
    'buyer.address(구매자 주소)': ['required'],
    'buyer.deliveryMessage(배송메세지)': ['required', 'maxLength:30'],
});
```

| name | description | memo | 
|--------|-------|------|
|required|데이터 내에 __key 값이 반드시 존재해야 한다||
|requiredIf:targetKey[,whitelist1,whitelist2...]|데이터 내에 targetKey의 값이 존재하는 경우(화이트리스트를 입력하면 화이트리스트 내에 해당값이 존재하는 경우)__key 값 또한 반드시 존재해야 한다||
|requiredNotIf:targetKey[,blacklist1,blacklist2...]|데이터 내에 targetKey의 값이 존재하지 않는 경우, 또는 존재하지만 블랙리스트 내에 해당값이 존재하는 경우 __key 값은 반드시 존재해야 한다||
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
|date|주어진 값이 날짜로 추출 가능한 값이어야 한다|moment 객체|
|file[:mimetype,extension1,extension2...]|주어진 값이 파일 객체여야 한다(추가조건 입력으로 mimetype 및 확장자 제어)|javascript File 객체 사용|
|earlierThan|주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터보다 빠른 날짜여야 한다|timestamp 비교|
|earlierOrEqualThan|주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터와 같거나 빠른 날짜여야 한다|timestamp 비교|
|laterThan|주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터보다 늦은 날짜여야 한다|timestamp 비교|
|laterOrEqualThan|주어진 값이 날짜로 추출 가능한 값이며 주어진 비교 데이터와 같거나 늦은 날짜여야 한다|timestamp 비교|

### Regist Custom Tester
```javascript
// 커스텀 테스터를 등록하는 예제. 
// 등록한 테스터는 룰과 메세지에서 해당 이름으로 사용할 수 있으며, 성공/실패여부를 bool 값 또는 bool을 전달하는 프로미스로 반환해야한다.
// 콜백 함수의 arguments는 다음과 같다.
//     paramName : 해당 테스터를 호출한 데이터 키값
//     extraValues : 테스터에게 주어진 검사용 엑스트라 벨류 배열 (검사 룰이 isMailHostsIn:gmail.com,naver.com 으로 지정되었다면 ['gmail.com', 'naver.com'])
//     data : 유효성 검사가 실행되는 스코프의 데이터 객체
const validator = new Kalidator();
validator
    .registTester('phoneNumber', function (paramName, extraValues, data) {
        // 닷(.)으로 concat 된 파라미터 이름을 통해 객체, 배열 형태의 대상값을 조회하기 위해 Kalidator.getTargetValue() 메소드를 활용
        // 단순형태의 데이터라면 data[paramName] 식으로 접근해도 무방함
        const tel = Kalidator.getTargetValue(data, paramName)

        // bool 값을 반환하는 커스텀 테스터
        return tel !== null && tel.match(/[0-9]{3}-[0-9]{4}-[0-9]{4}/) !== null;
    })
    .registTester('existMember', function (paramName, extraValues, data) {
        const memberId = Kalidator.getTargetValue(data, paramName);

        // 프로미스를 반환하는 커스텀 테스터(리소스 존재검사, 고유키 중복검사 등에 활용)
        return fetch(`https://jsonplaceholder.typicode.com/users/${memberId}`)
            .then(function (response) {
                return response.json();
            })
            .then(function (json) {
                return Object.keys(json).length > 0;
            })
            .catch(function (err) {
                return false;
            })
    });
```

### Set Custom Messages
```javascript
// 메세지는 '키값.테스터이름' : '메세지' 형태의 배열로 등록한다.
// 메세지 출력의 편의를 위해 몇 가지 치환용 변수가 제공된다.
// 1. :param 문자는 룰 지정에 사용된 라벨 또는 키값으로 치환된다.
// 2. :$n 문자는 룰 지정에 사용된 엑스트라 벨류로 치환된다. 해당 엑스트라 벨류가 다른 데이터의 키값인 경우 해당 참조데이터의 라벨 또는 키값으로 우선 치환된다.(n은 0부터 시작)
// 3. (한국어 전용) '(은/는)', '(이/가)' 처럼 조사 분기는 다른 치환이 실행된 후 앞 문자열의 받침유무에 따라 적절하게 치환된다.
// 4. :$concat 문자는 룰 지정에 사용된 엑스트라 벨류가 concat된 문자열로 치환된다.
// 5. :value 문자는 대상 키 데이터 값 자체로 치환된다.
// 6. :*n 문자는 룰 지정에 사용된 애스터리스크(*) 반복회차로 치환된다. (n은 0부터 시작)
const validator = new Kalidator();
validator.setMessages({
    'goodsList.*.id.required': ':param(은/는) 필수입니다. (:*0번째 상품)',
    'goodsList.*.id.minValue': ':param(은/는) 최소 :$1원 이상이어야합니다. (:*0번째 상품)',
    'goodsList.*.name.required': ':param(은/는) 필수입니다. (:*0번째 상품)',
    'goodsList.*.price.required': ':param(은/는) 필수입니다. (:*0번째 상품)',
    'goodsList.*.price.number': ':param(은/는) 유효한 정수여야합니다. (:*0번째 상품)',
    'goodsList.*.checks.*.in': ':param(은/는) :$concat 중의 하나여야합니다. (:*0번째 상품의 :*1번째 선택사항)',
    'buyer.memberId.required': ':param(은/는) 필수입니다.',
    'buyer.memberId.existMember': ':param [:value](은/는) 존재하지 않는 :param입니다.',
    'buyer.memberId.phoneNumber': ':param(은/는) 올바른 휴대전화번호가 아닙니다.',
    'buyer.deliveryMessage.maxLength': ':param(은/는) :$0자 이하여야합니다.',
});
```

### Regist Global Custom Tester
```javascript
// 전역에서 사용할 커스텀 테스터를 등록할 수 있다.
Kalidator.registGlobalTester('divideBy', function (paramName, extraValues, data) {
    const targetValue = Kalidator.getTargetValue(data, paramName);
    if (targetValue === null) {
        return false;
    }
    
    const divide = extraValues[0];
    if (isNaN(divide) || divide.match(/[^0-9]/) !== null) {
        return false;
    }

    return Number.parseFloat(targetValue) % Number.parseInt(divide) === 0; 
});
```

### Set Global Custom Message
```javascript
// 전역에서 공통적으로 사용할 메세지를 설정할 수 있다
// 룰(테스터) 이름과 메세지를 설정
Kalidator.setGlobalMessage('divideBy', ':param(은/는) :$0으로 딱 나누어떨어지지 않아요... (사용된 식 : :value/:$0)');
```

## License

[MIT](http://vjpr.mit-license.org)

[npm-image]: https://img.shields.io/npm/v/@owneul/kalidator.svg
[npm-url]: https://www.npmjs.com/package/@owneul/kalidator