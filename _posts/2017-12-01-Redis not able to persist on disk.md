---
layout: post
title: Redis not able to persist on disk
date: 2017-12-01
tags: [Redis]
---

今天协助同事进行Rails应用迁移，由于我之前写好了文档，自己也实验过，迁移过程没有太大问题，但今天同事说部署成功后访问总是抛出

```bash
MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk. Commands that may modify the data set are disabled. Please check Redis logs for details about the error.
```

我百思不得其解，同样的系统，同样的部署方式应该不会有如此大的偏差，对比现在正常运行的服务器的配置并无差错，google了很久，尝试了多种方式依旧还是有同样错误出现，并且还有个奇怪现象：我协助他部署后，第一次访问是正常的，后续的请求都会抛出异常。

耗费两个多小时查错，经检验/etc/redis/redis.conf文件与线上一致、/var/lib/redis目录及子目录权限/用户组与线上一致、磁盘空间使用率正常、Rails/Sidekiq与线上一致, 尝试google上的多种解决方案皆无果，后来我便想到再排查一次进程状态，果不其然，使用`sudo ps -ef | grep redis`命令查看到redis存在两个不同用户启用的进程，而且都是监听6379端口:

```bash
redis      170     1  0 Nov23 ?        00:01:23 /usr/bin/redis-server 0.0.0.0:6379
dev      334   179  0 19:46 tty2     00:00:00 redis-server            *:6379
dev      491   337  0 19:47 tty3     00:00:00 grep --color=auto redis
```

这下终于找出罪魁祸首了，也解释了为何第一次访问没有异常（纯粹是随机现象，刚好连接上了以redis用户身份启用的redis-server），是同事对系统不熟悉，以当前用户(dev)的身份启动了同一个redis，将dev用户启用的redis-server进程杀掉，异常就消失了。

### 总结

Redis抛出`Redis not able to persist on disk`异常的原因不外乎:

1. 磁盘空间/内存不足， 这种情况下直接扩容便可解决。

2. 用户权限不足，无法写入, 这种情况一般是对redis的文件做了错误的配置，或者当前redis-server进程没有写入权限(正是我遇到的情况), 遇到这种情况，首先应    该通过`sudo ps -ef | grep redis`查看是否有多个用户启用的不同redis进程，将不需要的进程kill掉即可，如果坚持要使用非redis用户来执行redis，可以通    过配置用户权限、更改目录写入权限、更改RDB文件的存储路径解决。
如:
```bash
# 更改redis snapshot文件的写入权限，将用户加入redis用户组
chmod g+w -R /var/lib/redis
adduser dev redis
```
   
或者在redis-cli或者redis配置文件中配置一个用户有权写入的路径和文件来存储redis快照

```bash
CONFIG SET dir /tmp/some/directory/other/than/var
CONFIG SET dbfilename temp.rdb
```

值得一提的是， 在搜索解决方案的时候遇到一种解决办法

```bash
CONFIG SET stop-writes-on-bgsave-error no
```
 
这种解决办法只是单纯地让redis忽略错误，不是一个根本解决办法，只是自我欺骗而已，在线上环境如果没有自己的一套监控系统，贸然忽视redis的错误很可能会造成数据丢失。
 
