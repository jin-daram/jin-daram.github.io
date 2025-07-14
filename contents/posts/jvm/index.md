---
title: "JVM의 JIT Compiler의 기본"
description: ""
date: 2025-07-13
update: 2025-07-13
tags:
  - Java
  - JVM
  - JIT Compiler
---

> 
`JVM 밑바닥까지 파헤치기 - 저우즈밍` 및 `알리바바 Cloud Tech Blog` 에서 관련 글을 읽은 후 공부한 내용을 정리한 내용입니다. 부정확하거나 사실과 다른 내용이 있을 수 있습니다.


## Just In Time
Java는 일반적으로 바이트코드(.class)를 생성하고, 이 바이트코드를 JVM 위에서 해석한 후 기계여러 변환하여 실행한다. 그런데 바이트코드를 매번 해석하게 되면 느릴 수 밖에 없다.

이 때 등장하는 게 바로 `JIT Compiler` 이다.

1. JVM은 처음에 `Interpreter` 방식으로 코드를 해석한다. 이는 실행 시간을 빠르지만 코드 자채의 실행 속도는 느리다.
2. 그래서 특정 메소드나 Loop가 자주 실행되면 중요한 코드라고 판단한다.
3. 해당 부분은 적절한 최적화 기법을 거쳐 `Native Machine Code` 로 변환한다.
4. 변환된 코드는 `Code Cache`에 저장되어 빠르게 재사용 된다.

<br>

`JIT Compiler` 에는 2 종류의 컴파일러가 존재한다.
- **C1 (Client Compiler)** : 빠르게 컴파일 되지만 최적화는 약하다. 빠른 반응이 필요한 앱에 적합
- **C2 (Server Compiler)** : 컴파일은 느리지만, 고성능 최적화를 적용하기 때문에 성능은 굉장히 빠르다. 이는 서버와 같이 장기적으로 실행되는 Application에 적용되는 것이 적합하다.

### Tiered Compilation
---
계층형 컴파일 전략은 JVM의 JIT 컴파일 전략 중 하나이다. 쉽게 설명하자면 Interpreter -> C1 -> C2 순서로 점차 성능을 끌어올리는 계층형 컴파일 방식이다.
- `Interpreter` : 빠르게 실행되지만 실행은 느림
- `C1 Compiler` : 빠르게 컴파일 하지만 최적화는 약함
- `C2 Compiler` : 고성능 촤적화를 하지만 컴파일 느림

이것들은 전부 적절히 섞어서 빠른 시간 + 높은 성능을 내도록 하는 것이 바로 `Tiered Compilation` 이다. 
기본적으로 순차적으로 실행되지만 점진적으로 실행 통계를 수집하여 충분한 실행 통계가 수집되면 순서대로 컴파일 하게 되는 구조이다.

### Interpreter (인터프리터)

인터프리터는 흔히 우리가 알고 있는 `바이트 코드를 한 줄 한 줄 읽으면서 해석하여 실행하는 엔진`이다. 초기 실행 속도는 빠르지만 성능은 낮다.


### Client Compiler (C1 Compiler)
---
Client Compiler (이하 C1) 는 JVM 내부에서 동작하는 `C1 Compiler` 를 가리키는 정확한 명칭입니다. `C1` 은 빠른 컴파일을 목적으로 사용합니다만, Server Client에 비해 좋지 않은 성능을 가지고 있습니다.

`C2` 의 최적화 된 성능은 클라이언트 컴파일러보다 성능이 30% 향상됩니다. 하지만 `C2` 로 바로 컴파일 해버리면 너무 고성능 최적화를 하기 위해 초기 컴파일 시간이 오래 걸리게 됩니다. 그렇기 때문에 `Interpreter` 와 `C2 Compiler` 의 중간 단계의 성격을 띄는 C1 가 등장하게 되었습니다.

C1은 `Inlining`, `Costant Folding`, `Dead Code Elimination`, `Loop Unrolling` 등과 같은 기본적인 최적화만 적용하고, `Native Machine Code` 로 변환되어 `Code Cache` 에 저장됩니다. 

### Server Compiler (C2 Compiler)
---
`Server Compiler`는 `C2 Compiler (이하 C2)` 를 의미합니다. `C2` 는 HotSpot JVM의 고성능 Just-In-Time 컴파일러로 자주 실행되는 메소드를 최적화 된 Native Machine Code로 컴파일 하여 실행 성능을 극대화 하는 컴파일러 입니다.
충분한 Profiling 정보를 기반으로 최적화가 진행되며 Method inlining, Loop Peeling, Escape Analysis 등 좀 더 상세하고 성능이 더 발휘할 수 있는 최적화 기법이 사용됩니다. C1 에서도 사용하는 Inlining, Loop Unrolling 등 도 해당 단계에서는 좀 더 심층적으로 적용하여 최적화 합니다.

`C2`는 고급 최적화 기법을 적용하기 때문에, `C1` 보다 장기적인 실행 성능이 우수합니다. 특히 반복 루프나 힙 최적화가 중요한 상황에서 체감 성능 차이가 수십 % 이상 벌어지기도 합니다.
`C2`에 의해 컴파일 된 Native Machine Code도 Code Cache 공간에 저장됩니다. 하지만 컴파일 시간이 길고, 다른 Compiler 및 Interpreter 보다 더 많은 자원 사용량을 가지며 디버깅 시에 실제 흐름이 왜곡될 수 있다는 단점을 가집니다.

> **Graal Compiler**
>
> JDK 9 부터 도입된 최신 JIT(Just-In-Time) 컴파일러로, 기존 C2 컴파일러보다 더 유연하고 확장성이 높다. 기존 C1/C2 Compiler는 C++로 작성되었지만, Graal은 Java로 작성되었습니다. 

### Code Cache
---
`Code Cache` 는 JVM에서 JIT 컴파일 된 기계어를 저장하는 메모리 공간입니다.

바이트 코드를 매번 다시 컴파일 하지 않고, 한번 컴파일 된 코드를 재사용 위한 목적으로 정의된 공간입니다. 
위에서 설명하였듯이 JVM은 처음 코드를 Interpreter를 통해 실행하다가, 점차 실행 통계가 많이 쌓이면 그 통계를 기준으로 C1 -> C2 컴파일을 통해 코드를 최적화 합니다.

그리고 그 최적화 된 코드를 매번 컴파일 하기보다 
어떤 코드가 들어왔을 때, 해당 코드에 대해 최적화 된 코드를 이미 컴파일 했었다면 이는 Code Cache로 부터 가져와, 빠르게 Native Code를 실행 시킵니다.

- `Non-method Segment` : -XX:NonNMethodCodeHeapSize 으로 조정된 내부 JVM 작업 관련 코드를 저장합니다.
- `Profiled-Code Segment` : 짧은 라이프 사이클을 가지는 (언제든지 C2로 업그레이드 할 수 있는) C1 컴파일러에 의해 컴파일 된 코드를 포함합니다.
- `Non-Profiled Segment` : 긴 라이프 사이클을 가지는 C2 컴파일러로 컴파일 된 코드를 저장합니다.

Code Cache의 내부는 대체적으로 위와 같은 영역으로 구분됩니다. Code Cache는 초기 할당 크기를 가지고 시작하지만, 영역이 더 필요한 경우 확장하기도 합니다. 기본적으로 초기 할당 사이즈는 `2,496KB` 이고 최대 사이즈는 `240MB` 입니다.
각각 `-XX:InitialCodeCacheSize=N`, `-XX:ReservedCodeCacheSize=M` 으로 직접 설정할 수 있습니다. 또한 현재 사용하고 있는 크기를 `-XX:PrintCodeCache` 옵션을 통해 확인할 수 있습니다.

### JIT 성능 최적화 기법

#### Method Inlining
---
```java
public class Human {

    private String name;
    private int age;

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAge(int age) {
        this.age = age;
    }

}
```

개발을 하다보면, 위와 같은 유사한 구조를 지닌 클래스를 많이 작성합니다. 이는 일부 캡슐화를 지킨 기본 구조 입니다. 

```java
Human human = new Human(...);
human.setName("...");
System.out.println(human.getAge());
```

하지만 이러한 코드를 호출하는 비용은 상대적으로 높습니다. 그 이유는 여러 Stack Frame을 스위칭하기 때문입니다. 

> **Stack Frame 이란?**
>
> Stack은 각각의 Thread가 별도로 가지는 지역변수, 매개변수 등등의 값을 저장하는 공간입니다. Stack Frame은 메소드가 호출될 때마다 생기는 메모리 블록으로 그 메서드의 지역 변수, 매개 변수, 반환 주소, 호출자 정보 등을 담고 있는 스택의 한 칸 이라고 생각하면 좋습니다.

위 `setName()`, `getAge()` 메소드를 호출하게 되면 총 2개의 `Stack Frame` 이 생겨납니다.

이렇게 되면 Stack Frame Switching 이 발생하여 연산 자원을 더 사용하게 됩니다.
Stack Frame을 생성하지 않고 두 메서드에 접근하는 방법은 다음과 같습니다.

```java
...
human.name = "...";
System.out.println(human.age);
```

컴파일러는 `getAge()`, `setName()` 메소드르 통해 Human 필드에 접근하는 것을 위와 같이 필드에 직접 접근 하는 것으로 최적화 합니다. 

#### Loop Unrolling
---
```java
for (int i=0; i<MAX; i++) {
	...
}

for (long i=0L; i<MAX; i++) {
	...
}
```

이 두 코드의 속도는 다를까요 같을까요? 정답은 **Loop Counter가 Integer인 경우가 더 빠릅니다.**

CPU가 계산하기 가장 최적화인 파이프라인은 바로 명령어를 순차적으로 처리하는 것 입니다. 

하지만 반복문의 경우 하나의 반복이 끝난다면 다음 반복을 시작해야 할지 말지에 대해 성능적 부담을 느끼게 됩니다. 

현재의 파이프라인 상태를 보존하고, 역전된 위치를 보존하고, 반복문의 내용을 메인 메모리로부터 다시 읽어야 하고, 실행을 위해 다시 파이프라인에 올리는 등의 작업이 이루어져야 합니다. (Interpreter를 통해 코드를 해석하는 경우)

`Loop Unrolling` 은 JVM이 성능 최적화를 위해 자주 쓰는 최적화 기법입니다. 하지만 Loop Counter를 long 타입으로 사용하는 코드에서는 거의 적용이 되지 않습니다. 그 이유는 long 타입에 대한 최적화가 부족하기 때문입니다.
대부분의 `Loop Unrolling` 은 int 타입에 최적화 되어 있습니다.

JVM은 int 타입의 변수가 `Overflow` 할 수 있음을 알고 있습니다. 그래서 최적화 과정에서 int Loop는 내부적으로 long 타입으로 캐스팅하여 안전하게 처리합니다. 하지만 `long 타입 Loop` 는 Overflow를 감지하고 보호하려면 128bit 정수 타입이 있어야 하는데, Java엔 기본적으로 그런 타입이 존재하지 않아, `long 타입 Loop`는 안전하게 최적화하기 어렵습니다.

long 타입 Loop를 사용하게 되면 JVM은 내부적으로 SafePoint Check 를 더 자주하게 됩니다.

또한 배열에 접근할 때, 전체 범위 검사도 추가되어 결과적으로 Loop가 더 느려지는 결과를 초래하게 됩니다.

`JIT Compiler` 가 Loop 구문을 최적화 할 때, 루프 반복 횟수가 예측 가능하여야 하고 이에 대해 Overflow 및 다른 부작용 위험이 없을 때 Unrolling을 할 수 있습니다. 하지만 long 타입 Loop의 경우에는 Overflow 시 대처 할 수 있는 방법이 없습니다. 그래서 안전하게 최적화하지 못하기 때문에 성능 저하가 발생하는 것 입니다.

> **SafePoint 란?**
>
> JVM이 `GC`, `Deoptimization`, `Class Redefinition` 같은 작업을 하기 위해, 모든 `Thread` 를 멈출 수 있도록 준비된 정지 가능한 지점입니다.
> 
> 예를 들어 Heap에 생성된 객체가 너무 많아서 `GC` 를 처리해야 한다고 가정했을 때, 어느 한 쓰레드에서 영영 끝나지 않은 Loop 문을 돌고 있습니다. 이 상태에서 `GC` 를 해버리면 프로그램이 매우 불안정해질 수 있습니다. 
>
> 그렇기 때문에 쓰레드를 잠시 멈춰도 되는 지점이 있어야 하는데 이를 `SafePoint` 라고 합니다. `int` 타입의 경우, 수가 상대적으로 좁은 범위이기 때문에 빠른 시간 안에 `SafePoint` 에 도달할 수 있고, JVM 기준으로 잘 최적화 되어 있습니다. (e.g. 메서드 호출 지점, 반복문 종료 시점, 예외 처리 진입)
>
> 하지만 long 타입 루프에는 루프가 끝나기 까지 많은 수의 반복을 돌려야 할 수 있습니다. 따라서 SafePoint에 도달하는 시간이 오래 걸릴 수 있습니다. 

> **STW (Stop The World)**
>
> JVM이 내부 작업을 수행하기 위해 모든 Application Thread의 실행을 일시적으로 멈추는 것을 의미합니다. JVM의 내부 작업, 특히 GC는 애플리케이션 메모리를 직접 다루는 작업입니다. 이때 다른 Thread가 객체를 생성하거나 참조를 변경하면 
> JVM은 정확하게 어떤 객체가 살아있는지 알 수 없고 잘못된 메모리를 해제하여 프로그램이 불안정 해질 수 있습니다. 그렇기 때문에 JVM에서는 GC를 수행하기 전에 모든 Thread를 일시 중지하고 GC 작업을 안전하게 처리 합니다.
> JVM은 아무 타미밍에서 Thread를 멈출 수 없고 멈춰도 안전한 지점인 Safe Point 에서만 STW 를 걸 수 있습니다. 모든 Thread 들이 SafePoint에 도달하기까지 기다리며 도달한 Thread는 대기 상태로 들어가고 마지막 Thread가 도달하면 STW가 시작됩니다.