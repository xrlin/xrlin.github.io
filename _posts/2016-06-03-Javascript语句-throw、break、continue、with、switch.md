---
layout: post
title: Javascript语句-throw、break、continue、with、switch
date: 2016-06-03
tags: [Javascript]
---

## throw语句及异常捕捉机制
throw语句用于进行抛出异常，可以抛出异常状态、表达式、Error对象等。
如：

```javascript
throw 1;
throw 1+1;
throw new Error('1');
```
javascript中的异常捕捉处理机制与java、python相似，层层回溯，直到异常被捕捉处理或者抛出。
如try语句块中含有return、break、continue语句，在执行这些语句前会先执行finally语句块内容（如果存在finally语句块)，然后继续执行return等语句，如果finally语句块中含有throw，则try语句块中抛出的异常会被finally块中抛出的异常所覆盖，如果finally中有return语句，即使try语句块中产生未被捕捉的异常，函数也会正常返回，并不抛出异常。如：

```javascript
function t(){
  try{
    return 1;
  }finally{
   return 2;
  }
}
t() //return 2; finally语句块中内容先于try语句块中的return语句运行。
```

```javascript
function t(){
  try{
    throw new Error('error in try');
  }finally{
  throw new Error('error in finally');
  }
}
t() //Error: error in finally; try语句块中的异常被finally语句块中的异常覆盖。
```

## break、continue
break可用于退出循环和switch代码块。

```javascript
break ; 退出当前所在循环
break label ; 退出标签所在的循环。
```

continue用于结束该次循环，进入下一次循环， 如：

```javascript
label: for(var i=0;i<3;i++){
              console.log(i);
              for(var j=1; j<3;j++) 
              {
              if(j==2){
                 continue label;  //结束该次循环，接着从label标签标识的循环开始
                }
             else{
                     console.log('ssss'+j);
              }
            }
}
/*输出结果：
 0
ssss1
ssss2
1
ssss1
ssss2
2
ssss1
ssss2
*/
```
<strong>注意:</strong>break和continue语句在需要进行标签跳转时必须要写在同一行，不能分行写，因为javascript解释器会自动给语句加入分号。

# with语句
格式：

```javascript
with(obj){
  statement
}
```
with语句主要是为了方便对对象的操作，避免重复操作，但with语句在javascript中并不推荐使用，因为使用with语句会导致代码难于进行优化。
with语句的使用：

```javascript
//倘若要获取docment.forms[0].addr的值，一般我们会这样操作
//document.forms[0].addr.value
//使用with语句可以简化代码,使用with语句的代码如下
with(document.forms[0]){
  console.log(addr.value);   //在with语句块内可以直接方位对象的属性
  console.log(name.value);
 // ...
}

```
但在with语句中不可给对象创建新的属性，如果在with代码块内试图给对象创建新属性，该属性并不会创建，而是将该属性创建在with语句块外的作用域。如

```javascript
 a = {x:1};
 with(a){
    y = 1;
  }
console.log(a) // object({x=1})
y  // 值为1;
```   
## switch语句
javascript中的switch语句与java类似，可以使用整型和字符串，需要注意的是swicht中case表达式默认是用```===```进行比较，不会自动进行类型转换。

