---
layout: post
title: ActiveRecord嵌套事务的实现
date: 2019-02-20
tags: [ruby, rails, MySQL, database]
---

### 嵌套事务

嵌套事务是在一个Transaction内包含其它Transaction，相信很多开发者或多或少都会遇到过事务嵌套的情况，MySQL允许在事务里调用命令启用另一事务，但是本身却并不真的支持事务的嵌套，猜猜下面的语句执行后会是什么结果？

```sql
SET autocommit = 0;
SELECT * FORM users;
-- Empty set (0.00 sec)

BEGIN;
INSERT INTO users(`name`, `age`) VALUES("Jeff", 18);
-- new transaction
BEGIN;
INSERT INTO users(`name`, `age`) VALUES("Kivy", 18);
ROLLBACK;
-- rollback first transaction
ROLLBACK;
```

```sql
SELECT * FROM users;

+----+------+-----+
| id | name | age |
+----+------+-----+
|  1 | Jeff |  18 |
+----+------+-----+

```

可以看出外层事务的`ROLLBACK`语句不起作用，事务中的`INSERT`操作并没有回滚，但是内部事务的`ROLLBACK`生效了，其实MySQL并不支持嵌套的事务，在第二个事务开启时会自动触发`COMMIT`将第一个事务提交，既然已经COMMIT了，也不存在所谓的回滚了。

事实上嵌套事务很少会有数据库真正实现，包括MySQL, PostgresSQL在内的大部分数据库都不支持真正的嵌套事务，嵌套事务是一个本应避免出现的情况，事务是对于整个数据库应用的，不需要重复开启事务，如果需要回滚到某一个操作通过`SAVEPOINT`和`ROLLBACK`就可以，事务的嵌套一般业务代码处理不当造成的，对于一个应用系统来说会存在多个业务相关的操作，并将各业务进行封装组合，比如`ServiceA`、`ServiceB`两个服务各自负责相关的特定业务，并且都需要开启事务，如果在`ServiceA`中恰好又需要在事务中调用`ServiceB`，这时候就会出现事务嵌套的情况，这种情况可以全局锁/标记来避免多次调用`BEGIN`/`START TRANSACTION`创建事务，还可以通过自动识别创建`SAVEPOINT`来模拟实现嵌套事务，Rails框架的ActiveRecord就使用类似的方式来支持模拟实现嵌套事务。

### ActiveRecord嵌套事务的实现

先来看下Transaction相关类的实现

在`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb`文件中定义了相关的类

```ruby

    class Transaction #:nodoc:
      attr_reader :connection, :state, :records, :savepoint_name, :isolation_level

      def initialize(connection, options, run_commit_callbacks: false)
       ...
        @joinable = options.fetch(:joinable, true)
       ...
      end

      def add_record(record)
        records << record
      end

    end

    class SavepointTransaction < Transaction
      def initialize(connection, savepoint_name, parent_transaction, *args)
        super(connection, *args)
        ...
        @savepoint_name = savepoint_name
      end

      def rollback
        # 回滚至标记点
        connection.rollback_to_savepoint(savepoint_name) if materialized?
        @state.rollback!
      end

      def commit
        # 释放还原点并提交
        connection.release_savepoint(savepoint_name) if materialized?
        @state.commit!
      end

    end

    class RealTransaction < Transaction
      def materialize!
        super
      end

      def rollback
        connection.rollback_db_transaction if materialized?
        @state.full_rollback!
      end

      def commit
        connection.commit_db_transaction if materialized?
        @state.full_commit!
      end
    end
    
    class TransactionManager #:nodoc:
      def initialize(connection)
        @stack = []
        @connection = connection
       ...
      end

      def begin_transaction(options = {})
        @connection.lock.synchronize do
          ...
          # 判断事务列表是否为空，如果不为空则表示存在嵌套事务，则使用SavepointTransactioin创建标记点
          transaction =
            if @stack.empty?
              RealTransaction.new(@connection, options, run_commit_callbacks: run_commit_callbacks)
            else
              SavepointTransaction.new(@connection, "active_record_#{@stack.size}", @stack.last, options,
                                       run_commit_callbacks: run_commit_callbacks)
            end

         ...
          @stack.push(transaction)
          transaction
        end
      end

      def commit_transaction
        @connection.lock.synchronize do
          transaction = @stack.last

          begin
            transaction.before_commit_records
          ensure
            @stack.pop
          end

          transaction.commit
          transaction.commit_records
        end
      end

      def rollback_transaction(transaction = nil)
        @connection.lock.synchronize do
          transaction ||= @stack.pop
          transaction.rollback
          transaction.rollback_records
        end
      end

      def within_new_transaction(options = {})
        @connection.lock.synchronize do
          transaction = begin_transaction options
          yield
        rescue Exception => error
          ...
        ensure
          ...
        end
      end
```

从源码我们可以知道ActiveRecord将Transaction分为了`SavepointTransaction`和`RealTransaction`，`SavepointTransaction`用于需要模拟实现嵌套，在rollback时回滚至对应的标记点，在commit时释放标记点，`RealTransaction`则按照一般事务进行处理，`TransactionManager`类根据需要创建对应的`Transaction`类实例，并维护一个事务列表，处理一整个嵌套事务列表的commit、rollback等调用。

ActiveRecord通过`ConnectionAdapter`类抽象数据库连接，更深入一些看下调用`transactioin`方法时究竟发生了什么

在`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb`文件中找到了`transaction`方法的实现

```ruby
 def transaction(requires_new: nil, isolation: nil, joinable: true)
    # requires_new参数决定是否要创建嵌套事务，默认不创建嵌套事务，尝试将所有后续sql操作放到同一个事务中（即忽略多余的事务创建语句）
    if !requires_new && current_transaction.joinable?
      if isolation
        raise ActiveRecord::TransactionIsolationError, "cannot set isolation when joining a transaction"
      end
      yield
    else
      # 通过transaction_manager管理添加事务
      transaction_manager.within_new_transaction(isolation: isolation, joinable: joinable) { yield }
    end
  rescue ActiveRecord::Rollback
    # 捕获ActiveRecord::Rollback异常，使之不影响外层代码
    # rollbacks are silently swallowed
  end
end
```

到了这里也可以知道ActiveRecord中的一些事务操作的“诡异”规则，如

```ruby
User.transaction do
  User.create(:username => 'Kotori')
  # 不会创建新事务也不会创建savepoint
  User.transaction do
    # 这条操作会放到同一个事务中执行
    User.create(:username => 'Nemu')
    # ActiveRecord::Rollback被捕获，不会被外层代码块觉察，所以不会导致事务回滚，但是其它异常发生时仍会向上抛出，导致事务回滚
    raise ActiveRecord::Rollback
  end
end
```

```ruby
User.transaction do
  User.create(:username => 'Kotori')
  # 创建savepoint模拟嵌套事务，不会创建真实的新事务(调用sql事务创建语句)
  User.transaction(:requires_new => true) do
    User.create(:username => 'Nemu')
    # ActiveRecord::Rollback在TransactionManager#within_new_transaction中被捕获并调用对应的rollback进行处理，回滚到标记点
    raise ActiveRecord::Rollback
  end
end
```

到这里好像对ActvieRecord嵌套事务的实现都了解了，但是想想还有个问题没解决，`TransactionManager`实例是在`ConnectionAdapter`实例中wwei维护和调用的，万一两次调用使用的`ConnectionAdapter`不是同一个，所有的流程不就不能保证了？这就需要通过ActiveRecord的数据库连接池实现来保证。

在`active_record/connection_adapters/abstract/connection_pool.rb`文件中实现了数据库连接池连接的维护和分配

```ruby
# Retrieve the connection associated with the current thread, or call
# #checkout to obtain one if necessary.
#
# #connection can be called any number of times; the connection is
# held in a cache keyed by a thread.
def connection
  @thread_cached_conns[connection_cache_key(@lock_thread || Thread.current)] ||= checkout
end
```

ActiveRecord使用线程作为key来记录当前线程使用的数据库连接对象，业务代码只要在同一个线程中执行就可以保证所用的数据库连接是同一个，这也是为什么在启用事务后不需要获取事务对象来执行SQL操作的原因，使用golang实现的gorm在开启事务后需要保留事务对象并使用该事务对象来操作数据库，ActiveRecord的模式相比gorm在使用方面还是更友好些。
