---
layout: post
title: javascript——对象
date: 2016-06-03
tags: [Javascript]
---

javascript中对象是一种基本的数据类型，也是一种复合值，将很多对象结合在一起，通过名称进行访问，对象中的属性还有一些相关的值，称为属性特性。其包含：

1.  可写（writable)：表示该属性值是否可以改变
2.  可枚举（enumerable) : 表明是否可以通过for/in 进行访问
3.  可配置(configurable) : 表明是否可以删除或修改该属性

在ECMAScript5之前属性值都是可写、可枚举、可配置的，ECMAScript5之后可以对属性值进行配置。  
javascript中的对象有一个原型(prototye)指向其它对象，本对象的属性可以从原型对象中继承，所有对象都继承自Object.prototype。

### 创建对象
``` javascript
var a = {x:1} // 通过花括号直接创建对象
var b = new Array()  // 创建一个空数组对象 
```

### 对象属性的访问


```javascript
a['x']  // 通过方括号进行访问
a.x  // 通过```"."``` 进行访问， 如果属性值与关键字相同，则必须通过方括号进行访问
```
### 删除属性


```javascript
//通过delete可以进行属性的删除，但delete只能删除对象的自有属性，不能删除从原型继承过来的属性，而且也不能删除函数
a = { x:2};
delete a.x // true
delete a.x // true, 什么都不做，此时a对象中已经没有x属性
delete o.toString // false, 不能删除从原型继承过来的属性http://www.592zn.com/
function test() {}
delete this.tesst // false , 不能删除函数
```

###  检测属性
判断某个属性是否在某个对象中，可以使用 ```in```、```hasOwnProperty```、```propertyIsEnumerable```进行检测，```in```单纯判断对象是否存在某个属性，而```hasOwnProperty```判断某个属性是否存在并且是自有属性，```perpertyIsEnumerable```判断某个属性是否是可迭代的。


```javascript
 var a = {x:2};
'x' in a; //true
a.hasOwnProperty('x'); //true
a.hasOwnProperty('toString'); //false , toString不是自有属性
a.prppertyIsEnumerable('x') //true
//当访问一个对象不存在的属性时会返回undefined，因此也可以通过判断属性值是否为undefined来判断属性是否存在
a.x !== undedined;  //true
```

### for/in 对属性进行枚举
利用for/in 可以方便对对象的属性进行枚举迭代，如：

```javascript
a = {x:1}
for(p in a){
  console.log(a[p])
}
//output: 1
//值得注意的是for只迭代可以枚举的属性
```

### setter和getter
setter和getter在javascript中被称为存取器属性

```javascript
var a = {x:2, y:3, 
        $n:0, // 使用$符号暗示该属性为私有属性
         get r(){
            return this.x + this.y
         },
         set setValue(vars){
           this.x = vars[0];
           this.y = vars[1];
         }
        };
a.setValue = [1,2]  //setter
a.r  // setter
```

### 属性的特性
数据的属性：值、可枚举性、可写性、可配置性，存储器不具有值属性、可读性、可写性。  
可以使用```Object.getOwnPropertyDescriptor(obj, property)``` 获取某个对象的属性的特性描述，对于继承或不存在的属性返回```undefined ``` ，如果想获取继承的属性可以使用```Object.getPrototypeOf()```, 使用```Object.defineProperty()```设置属性及其特性。

```javascript
var obj = {}  // 创建一个空对象
Object.defineProperty(obj, 'x', {value:1, writable:false, enumerable:false, configurable:true});  // 如果可配置性设置为false，则可写性不能从false转为    true，但可从true转为false
Object.keys(obj); // keys()只能读取可迭代的属性
Object.defineProperty(obj, 'x', {get: function(){return 0;}});   // 设置存储器属性
obj.x // 0 
```

### 对象的三个属性
对象具有三个属性：原型（prototype）、类（class）、可扩展性（extensible)


*  prototype：原型在对象构造之初就已经设置好了，在通过new创建对象时使用构造函数的prototype作为原型进行对象的创建。使用Object.create()进行对象创建时，参数可以为要创建的对象的原型或者是null，在新标准之前使用Object.constructor.prototype作为直接的原型。  
可以通过```o.isPrototypeOf(obj)```判断o是否是obj的原型。  
*  类属性: 是一个表示对象类型信息的字符串


```javascript
//判断类型
function classof(obj){
  if(obj === null) return "Null";
  if(obj === undefined) return "undefined";
  return Object.prototype.toString.call(obj).slice(8,-1); // 为了正确调用toString方法，使用call()函数进行该方法调用
```

*  可扩展性： 决定对象是否可以添加新属性，所有内置对象和自定义对象都是显式可扩展的。可以使用```Object.isExtensiable()```判断一个对象是否可扩展，使用```Object.preventExtensions()```将对象变为不可扩展的对象，但不能再次变回可扩展的对象，但对对象的原型没有影响，如果 给不可扩展的对象的原型添加属性，该对象也会继承原型新加入的属性。使用```Object.seal()```也将对象进行锁定，锁定后将不能更改对象的属性(可写属性除外)，不能添加新属性，使用```Object.isSealed()```判断对象是否锁定；使用Object.freeze()则会使对象完全锁定，将所有属性变为只读，使用```Object.isFrozen()```判断对象是否冻结。

### 对象的序列化

```javascript
var a = { x:2};
var s = JSON.stringify(a);  // 序列化
JSON.parse(s)  // 反序列化
```

javascript提供了JSON方便进行对象的序列化和还原，但是Date()对象在序列化时是一个日期字符串（序列化时调用了Date.toJSON())。
