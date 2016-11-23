---
layout: post
title: python中的weakref(弱引用)
date: 2016-06-03
tags: [Python]
---

python使用```weakref```模块可以实现对象的弱引用，python中的垃圾回收机制是通过对象的引用计数来触发的，当对象间有相互引用时，垃圾回收会失败，这时可以使用```weakref```模块实现对象的弱引用，给对象设置弱引用并不会增加对象的引用计数，所以不会影响内存的回收，同时也正是因为弱引用不会增加对象的 引用计数，弱引用并不能保证原对象存在，弱引用的初衷是为了在进行大对象处理时实现缓存机制，比如从而节省资源占用，比如当你需要处理大量的二进制图片文件对象时，为了方便读写，我们需要进行一个图片名称到图片对象的映射，如果使用字典进行存储对象和名称的映射的存储，那么在程序运行期间，所有的图片对象都不会被销毁，因为此时对象已经作为```dic```t对象中的```key```或者```value```，这就造成了过多的资源消耗，若此时使用```weakref```模块的```WeakKeyDictionary```和```WeakValueDictionary```类对对象进行弱引用，则可以减少资源占用，方便进行内存回收，下面介绍```weakref```模块中的基本使用。

### class weakref.ref(object[, callback])

```python
# weakref.ref返回一个对象（object）的弱引用，可选参数callback是一个在原对象将要被删除时调用的函数
#demo1
import weakref
class A(object):
    pass
a  = A()
print(a)  # <__main__.A object at 0x0126FEB0>
ref = weakref.ref(a)
 # 注意需要通过ref()获得原对象
print(ref()) #  <__main__.A object at 0x0126FEB0>
```

### class weakref.proxy(object[, callback])

```python
# 该方法与weakref.ref差不多，只是直接返回一个原对象的弱引用的一个代理对象，可以
#demo1
import weakref
class A(object):
    pass
a  = A()
print(a)  # <__main__.A object at 0x0126FFE0>
ref = weakref.proxy(a)
 # ref是原对象的代理，不需加上 ()
print(ref) #  <__main__.A object at 0x0126FFE0>
```
### class weakref.WeakValueDictionary([dict])

```python
# 返回一个value中使用弱引用保存对象的字典，下面是一个实现对象缓存的例子
import weakref
class CacheManager(object):
    def __init__(self):
        self._cache = weakref.WeakValueDictionary()

    def get_object(self, name):
        if name not in self._cache:
            o = TestObject._new(name)  # 建立一个TestObject对象
            self._cache[name] = o  # 将对象添加进cache
            return o
        else:
            return self._cache[name]
class TestObject(object):
    def __init__(self):
        raise RuntimeError('cannot instance TestObject directly')  # 防止直接创建对象
     
    @classmethod     
    def _new(cls, name):
        self = cls.__new__(cls)  # 调用__new__创建对象
        self.name = name
        return self
        
cache_manager = CacheManager()
cache1 = cache_manager.get_object('test') 
print(cache1)  # <__main__.TestObject object at 0x0287E230>
cache2 = cache_manager.get_object('test')            
print(cache2)  # <__main__.TestObject object at 0x0287E230>

```