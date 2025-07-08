---
title: '문자열이 자소분리가 되어 DB 저장되는 이슈 해결'
description: Mac OS + Chrome을 통해 요청을 날렸을 때, 문자열이 NFD 형태 DB에 저장되는 이슈를 해결하는 과정을 이야기 합니다.
date: 2025-07-08
update: 2025-07-08
series: 이슈 해결 사례
tags:
  - 이슈
  - NFD/NFC
  - 인코딩
---

기존 운영 서비스에서 업로드 된 파일명을 WHERE 조건을 걸어 조회 해야하는 일이 생겼다.<br>
테스트 목적으로 로컬에서 파일을 업로드 하고 조건절에 파일 명을 걸어, SQL을 날렸는데 분명 동일한 파일 제목인데도 불구하고 조회 결과에 포함되지 않는 문제가 생겼다.<br>

그러던 중 DB 컬럼 값을 자세히 살펴보니 다음과 같은 기이한 현상이 발생하였다.<br><br>

![비정상적인 상황](./1.gif)

![정상적인 상황](./2.gif)
<br>
정리하자면, 파일명이 자소분리가 된 형태로 DB에 저장되는 아주 당황스러운 상황이 발생했다.

## 원인 분석
---
Naver OCR의 추정값이 원인인지, DB 인코딩이 원인인지, 처음엔 원인을 몰라서 헤매다가, 여러 가지 상황에서 테스트를 해봤다. 

**기존에 발생한 버그인가?**

기존에는 발생했어도 방법을 찾을 수가 없었다. 저 컬럼의 이름은 originalName 이라는 컬럼인데, 해당 값은 그냥 저장 할 뿐 비즈니스 로직에서 사용하지는 않았다. 그래서 기존에 어떤 형식으로 저장되는지 확인할 수 없었다.

현상이 최초 발생한 경로는 로컬에서 띄운 Spring Boot의 Swagger API Docs에 접근해서 API를 날린 상태이다. 그 후 개발 서버에 접근해서 클라이언트를 통해 API를 요청했다. 

로컬 서버 버전에서 문제가 생기거나, 로컬 환경과 밀접하여 문제가 생긴 것으로 판단했지만, 개발 서버 클라이언트를 통해 API를 날렸을 때, 동일한 문제가 발생하여 서버의 문제는 아닌 것으로 판단되었다. 

그런 후 브라우저에 관한 문제인가 싶어서, **Safari를 통해 업로드 해봤다.** 그러자 정상적으로 DB에 데이터가 올라간 것을 확인할 수 있었다.

## Safari에선 정상적으로 업로드가 이루어지는 기이한 현상
---

여러 원인을 찾아보던 도중, NFC와 NFD 에 대해 알게 되었고, 이것과 밀접한 관련이 있음을 깨닫게 되었다.

### NFC와 NFD
---

Mac 사용자들이라면 가끔 파일 이름이 다음과 같이 저장된 것을 본 경험이 있을 것이다.

```text
ㅇㅣㄱㅓㅅㅇㅡㄴ ㅇㅣㄹㅂㅏㄴ ㅁㅜㄴㅅㅓㅇㅣㅁ.txt
```

원래라면 다음과 같은 제목인데 말이다.

```text
이것은 일반 문서임.txt
```

이러한 차이를 알기 위해서 **NFD (Normalize From Decomposed**) 과 **NFC(Normalize From Composed)** 에 대해서 알아두어야 한다.

### NFC (Normalize From Composed)
---
사람이 보는 글자와 같다. 즉 하나의 문자로 합쳐진 형태이다.
`가` 라는 문자가 있을 때, 이를 `U+AC00` 으로 표현한다.

### NFD (Normalization Form Decomposed)
---
하나의 글자를 초성/중성/종성 등으로 분리한 형태이다.
`가` 라는 문자가 있을 때, 이를 `ㄱ` + `ㅏ` 로 분리하여 정규화한다.

Mac OS 에서 한글로 이루어진 파일명을 저장했을 때, 자소 분리가 되어 저장된 것은 Mac OS 에서 기본적으로 NFD 유니코드 정규화 방식을 사용하기 때문이다.

> [!NOTE]
> Windows 운영체제는 기본적으로 NFD 유니코드 정규화 방식을 사용한다고 한다.
> [참조 문서](https://learn.microsoft.com/en-us/windows/win32/intl/using-unicode-normalization-to-represent-strings)

### MacOS + Safari / MacOS + Chrome
---
본론으로 돌아와서, MacOS 에서 기본적으로 NFD 정규화 방식을 사용하는 것을 알게 되었다. 다만 Safari로 업로드를 진행 했을 땐, 왜 정상적으로 DB에 값이 저장되는 것일까?

그 이유는 Safari 에서는 모든 POST 요청을 NFC 방식으로 인코딩하여 보내기 때문이다. 

[https://bugs.webkit.org/show_bug.cgi?id=30387](https://bugs.webkit.org/show_bug.cgi?id=30387&utm_source=chatgpt.com)

해당 글에서 명시적으로 Safari가 `NFC normalization` 으로 요청을 보낸다고 한다. 그렇기 때문에 NFD 기반의 Mac OS에서도 우리가 원하는 형태인 `ㄱㅏ` 가 아닌 `가` 의 형태로 데이터를 받을 수 있는 것이다.

반면 Chrome은 OS의 유니코드 정규화 방식을 따르기 떄문에 Chrome으로 파일을 업로드 할 경우 DB에 Mac OS의 유니코드 정규화 방식은 NFD 문자열로 데이터가 저장되는 것이다.

## 해결 방법
---
문제의 원인을 찾았으니, 해결 방법을 알아봤다. 광징히 간단하게 해결할 수 있었다.
java.text 에 존재하는  Normalization을 지원하는 라이브러리가 존재하여 해당 Normalizer에 normalize 함수를 통해 NFC 형태로 유니코드 정규화를 처리할 수 있었다.

```java
String input = "..."; // NFD 기반 문자열
String nfc = Normalizer.normalize(input, Normalizer.Form.NFC);
```

적용한 후 Chrome을 통해 데이터를 업로드하니 NFC 정규화 상태로 저장된 것을 확인할 수 있다.