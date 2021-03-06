---
layout: post
title: Javascript声明提前
date: 2016-06-03
tags: [Javascript]
---

### 变量声明提前  
Javascript在运行代码前会进行预解析，将变量声明和函数声明提前， 如：

```javascript
var name = 'name';
function test(){ 
 console.log(name); //undefined
 var name = 'name'; // 此时才进行赋值
 cosnole.log(name) // 'name' 
}
```

test(); //运行后依次输出undefined， name

造成这种现象正式由于javascript解析时将变量声明提前所造成的，javascript预解析时将``` var name = 'name';``` 这条语句分解成为
```var name; name = 'name';```， 并且将``` var name;```变量声明这部分放到函数内的第一行，于是test函数就变成了：

```Javascript
var name = 'name';
function test(){ 
 var name; //覆盖了函数外的作用域中的name变量
 console.log(name); //undefined, name还没有进行赋值
 name = 'name'; // 此时才进行赋值
 cosnole.log(name) // 'name' ，此时name变量已经进行赋值
}
```

因此javascript中最好将变量声明在作用域中的顶部，暂时不需用到，需要以后赋值的变量也将其放在顶部，留待以后赋值，从而避免因声明提前所造成的困扰。

### 函数声明提前
同样，javascript预解析时会将函数声明进行提前，如：

```javascript
function test(){
 alert(1);
}
test();
function test(){
 alert(2);
}
test();

```
运行以上代码，会发现与预想中分别弹出内容为1、2的提示框的情况不一样，运行的结果是两个弹出框的内容都为2，这是因为javascript将函数声明提前到代码的顶部，而两个函数同名，后面的函数定义覆盖之前的定义，就造成了弹出2次内容为2的提示框。