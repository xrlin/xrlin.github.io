---
layout: post
title: javascript数组
date: 2016-06-03
tags: [Javascript]
---

javascript中数组是继承自Array.prototype的一个特殊的对象，数组内的元素是无类型的，可以容纳各种类型的值、对象。

* 数组的创建: 

```javascript
var a = []  // 创建一个空数组
 var  a = [2, , 4] // 创建一个包含3个元素的数组， 为给定值的元素值为undefinded
var a  = new Array(10) // 创建一个长度为10的数组， 此时数组的索引、值都是undefined状态
var a = new Array(5,4,3,3, 'testing') // 创建一个包含初始元素的数组
```

* 数组的赋值

```javascript
var a = []
a[0] = 2  // 给第一个元素赋值， 若之前的元素还未赋值，则一律为undefined
```

* 数组长度

```javascript
// 数组长度可以通过数组的length属性获取
a = []  //此时length为0
a.length = 10 // 设定length为10，索引在10级之后的元素将被舍弃，若数组原本长度小于10， 则自动以undefined进行填充
a.length = 0 // 删除数组所有元素
```

* 数组元素的添加和删除

```javascript
/* 数组元素的添加 */ 
var a = [1,3, 5];
//方法一：直接赋值
a[3] = 3;
//方法二：使用push从数组末尾插入
a.push('3'); 
a.unshift('4') // 从数组头部插入元素’4‘

//注意：如果直接赋值时序号不可以转换为int类型，则数组长度不会改变，也不会增加元素，只是相当于往数组这个对象（Object）添加一个属性
a = [1,2,3]
a['x'] = 1
a // [1,2,3]
a.x // 1

/* 数组元素的删除 */
delete a[1] // 删除序号为1的元素，与a[1] = undefined 类似，不修改length属性的值
a.pop()  // 从数组末尾删除一个元素并返回该元素，length值减一
a.shift() // 从数组头部删除一个元素
```

* 数组方法

```javascript
//Array.join(split='指定分割符')方法将数中的元素拼接成字符串
a = [1,2,3]
a.join() // 1,2,3
a.join(" ") //1 2 3

// 排序
a.reverse() // 数组逆序，a变成[3,2,1]

a.sort()   // 进行数组排序，可以传递一个function作为参数指定排序方法
a.sort(function(a,b){return a-b}); // 正序
a.sort(function(a,b){return b-a}) // 逆序

//拼接
a.concat(1,3) // 加入1，3两个元素
a.concat(1, [3,4,5]) 

// 数组切片
a = [1,2,3]
a.slice(0,3) // 返回[1,2,3]
a.slice(1) // 返回[2,3]
a.slice(1,-1) // 返回[2]

//利用Array.splice(start, stop) 进行插入删除并返回删除的元素， 若省略第二个参数，直接删除从start到数组末尾的元素  
a = [1, 2, 3, 4, 5, 6]
a.splice(4) // 返回[5,6], a此时为[1,2,3,4]
a.splice(1,2) // 返回[2,3],a此时为[1,4]

/* --------------------------------------------------------*/
//ECMAScript5中的数组方法


/* forEach() 方法让数组的每一项都执行一次给定的函数。
array.forEach(callback[, thisArg])
参数
   callback
    在数组每一项上执行的函数，接收三个参数：

       currentValue
        当前项（指遍历时正在被处理那个数组项）的值。
       index
        当前项的索引（或下标）。
       array
        数组本身。
   thisArg
      可选参数。用来当作callback 函数内this的值的对象。
*/
//给数组元素值全部乘以2
a = [1,2,3]
a.forEach(function(value, index, a){a[index] *= 2})
a  // [2,4,6]

//map(callback) 调用数组的每个元素传递给callback函数，并返回一个数组
a = [ 1, 2, 3]
b = a.map(function(x){return x*x;}) // 返回[1,4,9]

//filter()方法用来进行逻辑判定，与python中的filter方法功能类似
a = [1,2,3,4]
b = a.filter(function(x){return x>2}); // b=[3,4]

//every/some
a.every(function(x){return x>2}); // 判断数组的所有元素是否大于2
a.some(function(x){return x>2}); //判断数组是否至少有一个元素大于2

//reduce和reduceRight
a = [1,2,3,4]
 //实现数组求和，第二个参数表示初始值为0
//reduceRight从右边开始进行计算
a.reduce(function(x,y){return x+y;}, 0);

// 判断是否为数组
// 在ECMScript5中可以用Array.isArray()函数很方便判断是否为数组，但在之前的标准中判断数组比较麻烦
Array.isArray([]) // true
Array.isArray({}) // false
```