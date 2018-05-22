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

### defer

defer语句会在方法执行完毕前、return之前、或者对应的goroutine时panic时调用defer后面的方法。

注意:

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

6. defer后的函数调用参数是在defer语句定义时确定的，defer后的方法调用可能会修改方法返回值，谨记: *return语句不是原子指令*。

在不执行代码的情况下，猜想下列方法的返回值:

```go
package main

import "fmt"

func main() {
	fmt.Printf("test1 result %d\n", test1())
	fmt.Printf("test1 result %d\n", test2())
	fmt.Printf("test1 result %d\n", test3())
	fmt.Printf("test1 result %d\n", test4())
}

func test1() int {
	r := 0
	defer func() {
		r = r + 1
	}()
	return r
}

func test2() (r int) {
	r = 0
	defer func() {
		r = r + 1
	}()
	return
}

func test3() (r int) {
	r = 5
	defer func(r int) {
		r = r + 5
	}(r)
	return
}

func test4() (r int) {
	r = 5
	defer func(r int) {
		r = r + 5
	}(r)
	return 1
}

```

执行后输出:

```go
test1 result 0
test1 result 1
test1 result 5
test1 result 1
```

`test1`很容易理解，与下面代码等价

```go
func test1() (result int) {
    r := 0
    result = r
    func() {
        r = r + 1
    }
    return
}
```

`test2`可以写成

```go
func test2() (r int) {
	r = 0
	func() {
		r = r + 1
	}()
	return
}
```

`test3`因为defer后的方法调用参数值在defer定义时已确定，形参`r`的值为`r`的一个值拷贝， 因而可以替换为

```go
func test3() (r int) {
	r = 5
	func(r int) {
		r = r + 5
	}(r)
	return
}
```

`test4`中的`return 1`先给返回值`r`赋值为`1`，然后执行defered函数，可以等价为

```go
func test4() (r int) {
	r = 5
    r = 1
	func(r int) {
		r = r + 5
	}(5)  // r在defer定义时的值为5，在return之前才被赋值为1
	return
}
```

### recover

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
package main

import (
	"fmt"
)

var sem chan int = make(chan int)

func main() {
	defer func() {
		if e := recover(); e != nil {
			fmt.Printf("Catch panic: %v\n", e)
		}
	}()
	go t()
	<-sem
	fmt.Println("done")
}

// t is just a test method
// No recover used in this function, so a panic will throw and cause the top function panic and stop
func t() {
	defer func() {
		sem <- 1
	}()
	panic("I'm panic")
}
/** output
 panic不能被main中的defer捕获并处理，导致main也因为panic退出，所以最后的done没有打印出来
panic: I'm panic

goroutine 5 [running]:
main.t()
	/tmp/sandbox093977267/main.go:26 +0x60
created by main.main
	/tmp/sandbox093977267/main.go:15 +0x60
 **/
```

注意:

1. 在panic火runtime error触发后，如果当前的异常没有被处理，或者是在`recover()`后继续抛出异常，异常会一直在当前的goroutine中向上
传递，直到被defer方法调用处理或因为在当前goroutine中没法被处理，导致顶层的goroutine因为panic退出（注意顶层的goutine并不能通过recover捕获处理该panic，但panic会导致顶层调用退出)。

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
        // 不能捕捉到异常
        defer recover()
        panic("oops")
    }

    /** output
    Catch panic in f1: oops
    Will repanic
    last defer
    Catch panic from f1: oops
    **/
    ```

### 源码分析

先来看看`recover`的源码，`recover`的具体实现在`runtime`包中:

```go
// runtine/panic.go

// The implementation of the predeclared function recover.
// Cannot split the stack because it needs to reliably
// find the stack segment of its caller.
//
// TODO(rsc): Once we commit to CopyStackAlways,
// this doesn't need to be nosplit.
//go:nosplit
func gorecover(argp uintptr) interface{} {
	// Must be in a function running as part of a deferred call during the panic.
	// Must be called from the topmost function of the call
	// (the function used in the defer statement).
	// p.argp is the argument pointer of that topmost deferred function call.
	// Compare against argp reported by caller.
	// If they match, the caller is the one who can recover.
	gp := getg()
	p := gp._panic
	if p != nil && !p.recovered && argp == uintptr(p.argp) {
		p.recovered = true
		return p.arg
	}
	return nil
}
```

通过`getg()`获取当前的`goroutine`，并获取当前的`_panic`信息，如果当前goroutine存在panic并且没有被标记为recovered，则将该panic标志为recovered并返回panic的参数。
 
 从代码中看到recover()只将当前goroutine的panic标记为recovered并返回panic的参数，但是并没有看到相关的代码跳转、函数调用。
 
 这时可以看下panic的实现，panic也是在runtime包中实现。
 
 ```go
// runtine/panic.go

// The implementation of the predeclared function panic.
func gopanic(e interface{}) {
	gp := getg()
	// ...

	for {
		d := gp._defer
		if d == nil {
			break
		}

		// ...
        
        gp._defer = d.link
        
        // ...
        
		pc := d.pc
		sp := unsafe.Pointer(d.sp) // must be pointer so it gets adjusted during stack copy
		freedefer(d)
		if p.recovered {
			atomic.Xadd(&runningPanicDefers, -1)

			gp._panic = p.link
            
            // ...
            
			// Pass information about recovering frame to recovery.
			gp.sigcode0 = uintptr(sp)
			gp.sigcode1 = pc
			mcall(recovery)
			throw("recovery failed") // mcall should not return
		}
	}

	// ...
}
 ```
 
 在调用panic时，会遍历当前goroutine中的_defer链表，直到deferred执行完毕，如果当前goroutine的panic被标记为recovered，则将当前goroutine的_panic指向上一个panic（gp._panic = p.link），通过`mcall(recovery)`记录下当前的pc，sp信息、进入defer上下文执行defer，通过recovery使得方法正常返回（移除该panic）。
 
 现在来看下`defer`的实现
 
 ```go
 // runtime/panic.go
 
 

// Create a new deferred function fn with siz bytes of arguments.
// The compiler turns a defer statement into a call to this.
//go:nosplit
func deferproc(siz int32, fn *funcval) { // arguments of fn follow fn
	if getg().m.curg != getg() {
		// go code on the system stack can't defer
		throw("defer on system stack")
	}

	// the arguments of fn are in a perilous state. The stack map
	// for deferproc does not describe them. So we can't let garbage
	// collection or stack copying trigger until we've copied them out
	// to somewhere safe. The memmove below does that.
	// Until the copy completes, we can only call nosplit routines.
	sp := getcallersp()
	argp := uintptr(unsafe.Pointer(&fn)) + unsafe.Sizeof(fn)
	callerpc := getcallerpc()

	d := newdefer(siz)
	if d._panic != nil {
		throw("deferproc: d.panic != nil after newdefer")
	}
	d.fn = fn
	d.pc = callerpc
	d.sp = sp
    
	// ...

	// deferproc returns 0 normally.
	// a deferred func that stops a panic
	// makes the deferproc return 1.
	// the code the compiler generates always
	// checks the return value and jumps to the
	// end of the function if deferproc returns != 0.
	return0()
	// No code can go here - the C return register has
	// been set and must not be clobbered.
}
 ```
 
 `defer`关键字通过调用`deferproc`往goroutine的defer链中添加defer调用，`return0()`会调用`deferreturn`，正常情况下`deferproc`会返回0，如果在`deferproc`中处理panic，会返回1，这也是`gopanic`中调用`recovery`方法的作用，`recovery`方法将结果设置为1，这时会跳转到代码的return之前执行其余的`deferproc`方法。
 
 ```go
// runtine/panic.go
 
// Run a deferred function if there is one.
// The compiler inserts a call to this at the end of any
// function which calls defer.
// If there is a deferred function, this will call runtime·jmpdefer,
// which will jump to the deferred function such that it appears
// to have been called by the caller of deferreturn at the point
// just before deferreturn was called. The effect is that deferreturn
// is called again and again until there are no more deferred functions.
// Cannot split the stack because we reuse the caller's frame to
// call the deferred function.

// The single argument isn't actually used - it just has its address
// taken so it can be matched against pending defers.
//go:nosplit
func deferreturn(arg0 uintptr) {
	gp := getg()
	d := gp._defer
	if d == nil {
		return
	}

	// ...
    
	fn := d.fn
	d.fn = nil
	gp._defer = d.link
	freedefer(d)
	jmpdefer(fn, uintptr(unsafe.Pointer(&arg0)))
}
```

`deferreturn`没执行一次会将执行完的defer从goroutine的_defer调用链中移除，执行到`jmpdefer`会重新进入`deferreturn`方法中执行直到没有`gp._defer`为`nil`， 这时所有defer执行完毕。


