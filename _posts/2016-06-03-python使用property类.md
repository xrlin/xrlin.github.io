---
layout: post
title: python使用property类
date: 2016-06-03
tags: [Python]
---

property类有setter、getter、deleter方法，其实property类中对__get__、__set__、__delete__等特殊方法进行重写，在这些重写的方法中调用property对象初始化时传入的setter、getter、deleter方法，因此可以利用@property装饰器装饰方法，从而将对应的方法替代对应的__get__、__set__、__delete__等特殊方法的默认实现，从而对访问、赋值、删除等操作进行控制。

```python
#:demo1
class Person(object):
    def __init__(self, name):
        self._name = name
    
    @property   # 使用@property装饰器设定一个为name属性名，通过obj.name访问将返回 self._name
    def name(self):   
        return self._name
    
    @name.setter    # setter方法，给name赋值时调用，接受一个参数，通过此方法限定name只能是字符串类型
    def name(self, name):
        if isinstance(name, str):
            self._name = name
        else:
            raise TypeError('name must be string')
    
    @name.deleter  # deleter方法，使用del 关键字删除属性时调用
    def name(self):
        raise AttributeError('name cannot be deleted')

p = Person('小明')
print(p.name)  #  输出’小明‘
p.name = 'xrlin'  # 更改name属性为’xrlin'
print(p.name)
p.name = 2 # 抛出TypeError异常
del p.name # 抛出AttributeError异常
```

其实```Person```类与下面的类实现的效果是一样的，只是使用装饰器显得更简洁

```python
#demo2
class Person(object):
    def __init__(self, name):
        self._name = name
    
    # getter方法
    def getname(self):   
        return self._name
    
    # setter方法，给name赋值时调用，接受一个参数，通过此方法限定name只能是字符串类型
    def setname(self, name):
        if isinstance(name, str):
            self._name = name
        else:
            raise TypeError('name must be string')
    
   # deleter方法，使用del 关键字删除属性时调用
    def deletename(self):
        raise AttributeError('name cannot be deleted')
    name = property(getname, setname, deletename)
```

在子类中重写使用@property装饰器的属性：  
如果需要在子类中完全重写父类中使用@property装饰的属性，则只需要像父类一样，使用@property装饰属性并重写getter、setter等方法即可，如果需要重写部分父类使用property的属性则需要按照@Parent.name.func的方式进行重写，因为其实使用@property装饰器的属性，该属性其实是一个property对象。

```python
#demo3
class Worker(Person):
    @Person.name.getter  # 重写name属性的getter方法
    def name(self):
        print('worker')
        return super().name
p = Worker('xr')
p.name # 输出 worker xr
```