---
layout: post
title: Python中的itertools模块
date: 2016-06-03
tags: [Python, 迭代器]
---

python提供了itertools模块方便进行迭代器操作，该模块包含了很多迭代器函数，可用各种方式对数据进行循环操作，现在记录下比较常用的功能。

###  排列组合
```python

a = [ 'a', 'b', 'c', 'd']

#排列
from itertools import permutations
for i in permutations(a, 2): # 取两个元素为一组进行排列
  print(i, end=' ')
"""
输出：
('a', 'b') ('a', 'c') ('a', 'd') ('b', 'a') ('b', 'c') ('b', 'd') ('c', 'a') ('c', 'b') ('c', 'd') ('d', 'a') ('d', 'b') ('d', 'c')
"""
#组合
from itertools import combinations
for i in combinations(a, 2): # 两两组合
  print(i, end=' ')
"""
输出:
('a', 'b') ('a', 'c') ('a', 'd') ('b', 'c') ('b', 'd') ('c', 'd') 
"""
```

### 迭代器切片
```python
# 迭代器不能像列表一样进行切片操作，但可以通过itertools.islice实现相同功能
def count(n):
  while True:
      yield n
      n += 1
a = count(0)
from itertools import islice
for i in islice(a, 1, 10):  # 去除下标为1~10-1的元素
  print(i ,end=' ')
"""
output: 1 2 3 4 5 6 7 8 9
```

### 跳过迭代器的指定内容

```python
# 使用itertools的dropwhile()函数可以实现跳过指定内容
# 下面的程序是跳过/etc/passwd 文件中的注释行
from itertools import dropwhile
with open('/etc/passwd') as f:
    for i in dropwhile(lambda line : line.startswith('#'), f):
        print(i)
```
### 同时迭代多个序列
同时进行多个序列的迭代一般会使用python内置的zip，zip一直迭代直到最短的序列迭代结束，使用itetools中的zip_longest()则可以一直迭代到最长的序列结束，并实现自动填充。

```python
a = [1,2,3]
b = ['x', 'y', 'z', 'k']
for i, j in zip(a,b):
  print(i, j)  
"""
output: 1 x
2 y
3 z
"""

from itertools import zip_longest
for i, j in zip_longest(a, b, fillvalue='no data'):  # 用'no data‘ 填充数据
  print(i, j )

"""
output:
1 x
2 y
3 z
no data k
"""
```

### 连接两个列表
通常我们会用```+```连接两个列表，但使用itertools.chain(*iterables)类会更有效率

```python
from itertools import chain
a = list(range(10)))
b = ['x', 'y']
for i in chain(a, b):
  pass
```

除了使用itertools模块，python自带的enumerate class可以很方便实现迭代器添加索引值

```python
  # 打印文件行数和内容
  with open('/etc/passwd') as f:
     for lineno, line in enumerate(f, 1):# 索引值从1开始
        print(lineno, line)  # 输出行号和行的内容
```

