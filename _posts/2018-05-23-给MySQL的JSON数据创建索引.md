---
layout: post
title: 给MySQL的JSON数据创建索引
date: 2018-05-23
tags: [MySql 数据库]
---

MySQL从5.7.8版本开始支持JSON数据，给处理一些动态变化的数据存储带来方便，但是MySQL中的JSON数据要通过索引进行查询，需要用到[虚拟字段](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html)，通过对虚拟字段创建索引从而利用该索引对JSON数据进行查询。

创建一张包含JSON数据和虚拟索引的表

```sql
 CREATE TABLE log(
    uid BIGINT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    meta JSON NOT NULL,
    username VARCHAR(32) GENERATED ALWAYS AS (`meta` ->> '$.username') VIRTUAL,
    INDEX username_idx (username)
    )ENGINE=INNODB CHARSET=utf8mb4;
```

如果是给已经建好的表添加索引，通过ALTER TABLE命令先添加一列虚拟列再创建索引

```sql
ALTER TABLE log 
  ADD COLUMN username VARCHAR(32) GENERATED ALWAYS AS (`meta` ->> '$.username') VIRTUAL
  ADD INDEX username_idx username;
```

后续查询时便可利用上`username_idx`这个索引，如

```sql
 SELECT meta->>"$.username" AS name FROM log WHERE username = "admin";
```

如果是PostgreSQL，可以不必通过虚拟列便可对`jsonb`数据使用索引。

```sql
CREATE INDEX idxgin ON log USING gin (meta);
```

在JSON数据的支持方面MySql和PostgreSQL还是有些差距，PostgreSQL可以直接对JSON数据创建索引。
