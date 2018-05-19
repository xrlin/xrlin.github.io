---
title: Golang的defer和recover
date: 2018-05-19
layout: post
tags: [go]
---

Python中提供了with表达式可以很直观、方便地进行应用上下文资源的管理，在代码块执行结束、抛出异常时会自动处理资源的释放、清理操作。

```python
with open('/etc/passwd', 'r') as f:
    for line in f:
        print line
```

上述代码在with代码块内执行完毕、触发异常后会自动调用`f`的`__exit__`方法，进行文件的关闭操作。

Python的with实现很直观、方便，Golang中提供了defer、recover用来实现类似的功能。

* defer

defer语句会在方法执行完毕前、return之前、或者对应的goroutine时panic时调用defer后面的方法。

约束:

1. defer只能用在方法、函数内。
错误示例:

```go
package main

import (
	"fmt"
)

defer func test() {}() // prog.go:6:1: syntax error: non-declaration statement outside function body

func main() {
	fmt.Println(t())
}

func t() int{
i:=0
	defer func (){}()
	return i
}
```

2. defer后的表达式必须是function获取method的调用。

错误示例:

```go
func t() int{
i:=0
	defer i++ // prog.go:14:10: expression in defer must be function call
	return i
}
```

3. defer会忽略方法调用的返回值, defer调用内置方法时需要遵守expression statement规范，defer后不能调用`append cap complex imag len make new real
unsafe.Alignof unsafe.Offsetof unsafe.Sizeof`方法。

4. defer按照逆序执行，及后定义的defer方法先于前面定义的defer方法执行。

5. defer只会在当前的goroutine中调用。

* recover

go中定义了两个方法

```go
func panic(interface{}) // 触发异常
func recover() interface{} // 捕获异常并处理
```

使用`recover()`方法可以捕获显式嗲用`panic`方法引发的异常或系统的运行时异常（如数组下标越界、nil方法调用），调用panic方法时可以提供参数以传递给`recover()`。

`recover()`方法在下列情况下会返回nil：

1. 调用panic时没有参数

2. 没有通过defer的function调用（注意是function，直接defer recover()是不起作用的），所以recover只有用在defer的function时才会起作用。

3. 当前goroutine没有panic，即是说不是当前goroutine引发的panic不会被defer和defer中的recover捕获和处理。

```go

```

注意:

1. 在panic火runtime error触发后，如果当前的异常没有被处理，或者是在`recover()`后继续抛出异常，异常会一直在当前的goroutine中向上
传递，直到被处理或直接因为异常终止。

2. 即使使用`recover`捕获异常并正常处理，原有的代码执行已经终止，在panic或异常触发后的代码都不会被执行，但后续的defer方法还会被调用。

如下所示:

```go
package main

import (
	"fmt"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Catch panic from f1: %v\n", r)
		}
	}()
	f1()
}

func f1() {
	defer func() {
		fmt.Println("last defer")
	}()
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("Catch panic in f1: %v\n", r)
			fmt.Println("Will repanic")
			panic(r)
		}
	}()
  defer recover() // 不能捕捉到异常
	panic("oops")
}

/** output
Catch panic in f1: oops
Will repanic
last defer
Catch panic from f1: oops
**>
```

