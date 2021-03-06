---
layout: post
title: python——对class中属性的操作进行限制
date: 2016-06-03
tags: [Python]
---

python不想java等语言一样，对类型有强制要求，这是因为会自动处理变量的类型，所以在python中可以给一个原本为int类型的变量赋予一个字符串类型的值（其实此时实际上是新建了一个字符串的变量），但有时候我们想明确指定变量的类型，只允许给变量赋予特定类型的值，这就需要我们在给变量赋值值进行类型检查，常见的方法是使用@property装饰器或者是重写__get__、 __set__等方法。  
### 使用@property装饰器

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

### 重写__get__、__set__方法  
python中使用setattr、getattr时分别会调用对应对象的__get__、__set__方法，当访问对象或者给对象赋值时也会调用对应对象的__get__、__set__方法，因此可以通过重写class的__get__、__set__方法对对象的访问等操作进行自定义。

```python
#:demo2
class Name(object):
    def __init__(self, name='', expected_type=str):  # 默认name的属性为str类型
        self.name = name
        self.expected_type = expected_type
        
    def __set__(self, instance, value):   
        if not isinstance(value, self.expected_type):  
            raise TypeError('{} must be a {}'.format(self.name, self.expected_type))  # 当类型不符合时抛出异常
        self.name = value    
        
    def __get__(self, instance, cls):
        if not instance:
            return self
        return self.name
        
class Human(object):
    name  = Name()  
    def __init__(self, name):
        self.name = name

h = Human('xrlin')
print(h.name)  # 输出xrlin
h.name = 3   # 抛出TypeError


# 还可以将自定义一个强制类型检查的装饰器，方便重复使用
#:demo3
class Typed(object):
    def __init__(self, name, expected_type):
        self.name = name
        self.expected_type = expected_type
        
    def __set__(self, instance, value):  
        if not isinstance(value, self.expected_type):
            raise TypeError('{} must be a {}'.format(self.name, self.expected_type))
        # setattr(instance, self.name, value)    # 不能使用setattr方法，该方法就是调用__set__方法，会导致循环递归调用
        instance.__dict__[self.name] = value   # instance即被装饰的class的实例对象
        
    def __get__(self, instance, cls):  
        if not instance:     # 不是通过实例对象而是通过class直接调用时instance为None
            return self
        return instance.__dict__[self.name]
        
def forcedtyped(**kwargs):
    """
    :@kwargs dict， 包含接受的要进行类型检查的属性名和类型
    """
    def decorate(cls):
        for name, expected_type in kwargs.items():
            setattr(cls, name, Typed(name, expected_type))  # 设置类属性
        return cls
    return decorate
    
@forcedtyped(name=str)  # 设定name属性为str类型
class Test(object):
    def __init__(self, name):
        self.name = name
        
test = Test('xr')
print(test.name) # 输出 xr
test.name = 2333  # 抛出TypeError异常
```
使用@property装饰器可以比较方便地自定义属性，能够满足一般需求，如果在多个class中都需要进行不同的属性类型检查，可以像demo3一样创建一个装饰器，方便进行代码重用。


