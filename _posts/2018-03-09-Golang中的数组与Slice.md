---
title: Golang中的数组与slice
date: 2017-12-24
layout: post
tags: [linux shell awk grep]
---

*   数组
    1.  定义
        数组是很常用的一种数据结构，go中的数组定义与c类似, 如c中用int[10]表示一个长度为10的数组，而go用[10]int来表示，只是将类型声明放在后面，go还提供很多方便的数组定义方法。
        
        ```go
        // 数组定义

        // 定义一个长度为0的数组，数组的内容初始话为0(int类型的零值)
        var a [10]int
        // 定义并初始化数组的前2个值，数组初始化为[1 3 0 0 0 0 0 0 0 0]
        a := [10]int{1,2}
        // 下面两条语句都定义一个长度为0的数组，并依次初始化
        a := [10]int{1,2,3,4,5,,6,7,8,9,10}
        a := [...]int{1,2,3,4,5,,6,7,8,9,10}

        // 数组长度 10
        fmt.Prinln(len(a))
        // 数组容量 10
        fmt.Pringln(cap(a))
        ```
  
    2. 数组的修改
        
        ```go
        var a [10]int
        // 赋值
        a[0] = 1
        // 编译不通过, 超出数组的长度
        a[10] = 11
        // 编译不通过，数组不能进行扩展
        a = append(a, 1)
        ```
  
    3.  数组作为函数参数
        ```go
        // 数组作为函数参数时属于值传递，函数内的数组是参数的一个值复制，不同于java、c++等面向对象语言中数组参数的处理
        var a [10]int
        func test(arr [10]int) {
            fmt.Printf("%p\n", &arr)
            arr[0] = 1
        }

        fmt.Println(a) // [0 0 0 0 0 0 0 0 0 0]
        fmt.Printf("%p\n", &a) // 0x10450030 
        test(a)               // 0x10450060， 可以看出a与方法中arr所指向的地址是不一样的，arr是a的一个完整拷贝
        fmt.Pringln(a) // [0 0 0 0 0 0 0 0 0 0]

        // 使用指针作为参数，c、c++中的指针概念依旧可以用在go中，当需要在其它命名空间(如方法)中修改参数对应的外部变量值时，影使用指针作为参数
        func test2(arr *[10]int) {
            (*arr)[0] = 1
        }
        fmt.Println(a) // [0 0 0 0 0 0 0 0 0 0]
        test2(&a)
        fmt.Println(a)  // [1 0 0 0 0 0 0 0 0 0]
        ```

*   Slice（切片)
    1.  定义及初始化
        slice在go中是常用的数据结构，在go中它经常用来代替数组进行使用，对于写过python的人来说，slice这词应该不陌生，python中的slice经常用于截取一部分数组、字符串生成新的一个对象，但在go中它实际上是数组一部分范围的表示。因为slice可以使用append函数进行扩充，slice的初始化与数组类似。
        ```go
        // 初始化长度为0的空slice
        var a []int
        a[0] = 1 // panic: runtime error: index out of range, 下标超出数组长度
        // 初始化一个数组并赋值
        a := []int{1,2}
        // 初始化一个长度为10, 容量为10的数组
        a := make([]int, 10)
        // 初始化一个长度为10， 容量为20的数组
        a := make([]int, 10, 20)
        a[11] = 10 // panic: runtime error: index out of range, slice不能自动扩展长度
        // 使用append扩展slice
        a = append(a, 1)
        fmt.Println(a, len(a), cap(a)) // [0 0 0 0 0 0 0 0 0 0 1] 11 20
        a = append(a, []int{2,3,4,5,6,7,8,9,10}...)
        fmt.Println(a, len(a), cap(a)) // [0 0 0 0 0 0 0 0 0 0 1] 11 20
        a = append(a, 21)
        // 在数组超出cap容量后，会自动分配新的数组，并设置新的cap，cap的分配规则由golang runtime决定，
        // 注意该分配规则没有在golang spec中声明，使用时不应对append后的cap进行假设
        fmt.Println(a, len(a), cap(a)) // [0 0 0 0 0 0 0 0 0 0 1 2 3 4 5 6 7 8 9 10 21] 21 40
        ```
  
    2.  slice的底层数据结构 
        slice故名思意就是对数组的切片，在go的实现中，slice的数据由header和底层数组array组成。
        ```go
        // Header
        type sliceHeader struct {
            Length        int
            Capacity      int
            ZerothElement *byte // 该指针类型由slice的元素类型决定
        }
        ```
        这只是为了方便理解对底层实现的一个抽象， Length、Capacity分别表示slice的长度、容量，ZerothElement对应底层数组中slice起始元素的指针，正因为slice的结构组成，所以你可能会遇到下面的一些情况。
        ```go
        a := [10]int{1,2,3,4,5,6,7,8,9,10}
        s := a[2:5]
        // a成为s的底层数组，ZerothElement指向a[2]，a[2]之后长度为8，即s的容量为8
        fmt.Println(s， len(s), cap(s)) // [3 4 5] 3 8
        a[2] = 21
        fmt.Println(s) // [21, 4, 5]
        s := append(s, 22)
        fmt.Println(s) // [21, 45, 22]
        fmt.Println(a) // [1 2 21 4 5 22 7 8 9 10]
        a[4] = 23
        fmt.Println(s) // [21 4 23 22]
        // 因为a此时是s的底层数组，对s或底层数组a的更改都会影响到s、a两个值

        // 现在看下另一种情况
        s = append(s, []int{1,2,3,4}...)
        // 此时s的已满，达到最大容量
        fmt.Println(s, len(s), cap(s)) // [21 4 23 22 1 2 3 4] 8 8
        fmt.Println(a)
        // 继续加入元素
        s = append(s, 33)
        // slice已满，再次添加元素会自动扩容
        fmt.Println(s, len(s), cap(s))  // [21 4 23 22 1 2 3 4 33] 9 16
        fmt.Println(a)  // [1 2 21 4 23 22 1 2 3 4], 数组a没有改变，说明此时s的底层数组已经不是a了

        // 对数组a的操作不会影响到s
        a[2] = 3333
        fmt.Println(a)  // [1 2 3333 4 23 22 1 2 3 4]
        fmt.Println(s) // [21 4 23 22 1 2 3 4 33]

        // 对s的操作不会影响到a
        s[2] = 22222
        fmt.Println(a) // [1 2 3333 4 23 22 1 2 3 4]
        fmt.Println(s) // [21 4 22222 22 1 2 3 4 33]
        ```
        对于新手来说，slice和数组的区别很容易造成程序的bug，但只要明白slice的内部数据结构便可以轻松应对，对于需要append操作的slice，不能依赖于原有数组的值，同时避免修改其初始化时的数组，避免相互影响。

    3.  slice作为函数参数
        和数组一样，slice也可以用作函数的参数，同样slice作为函数的参数也是属于值传递（实际上golang的所有参数传递都是值传递），但传递的不是slice的深拷贝，而是slice的header，首先会将slice的header复制一份，然后传入函数中，但由于header中存在ZerothElemen这个指针，在函数内对于slice中元素值的变动会影响到原有slice的值，但如果对slice有append操作时则情况会不一样，如果append后slice的底层数组不改变，则还会影响到原有slice的值，但如果append导致底层数组改变了，之后（包括此次append)对函数内slice的变动不会影响到原有slice，因为底层数组不一样了，下面就是一个例子。
        ```go
        slice1 := make([]int, 1, 1)

        func changeValue(a []int) {
            a[0] = 1
        }

        func appendValue(a []int) {
            a = append(a, 2)
        }

        fmt.Println(a)  // [0]
        changeValue(slice1)
        fmt.Println(slice1) // [1], 底层数组的指针没有改变，改变了原来slice1的值
        appendValue(slice1)
        fmt.Println(slice1) // [1]， appendValue方法中a底层数组指针相对于slice1改变了，对a的更改不会影响到slice1
        ```
        如果确定要在函数中同步更新原slice的值，并且可能会涉及到append操作，这时可以传递一个slice的指针（其实是slice header的指针），通过对指针更新会更新原slice的header及底层数组，因而实现同步更新。
        ```go
        func changeSlice(p *[]int) {
            a := *p
            a = append(a, 2)
            *p = a[:]
        }

        slice1 := make([]int, 1, 1)
        changeSlice(&slice1)
        fmt.Println(slice1) // [1 2]
        ```
