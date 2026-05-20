# Redis 缓存相关：

1. 什么是redis 的缓存雪崩，击穿，穿透？怎么解决？
缓存雪崩：大量的高并发请求在同一时刻访问redis 里大量的缓存key,但是这些key              在同一时刻过期或失效，导致访问mysql ,引起服务宕机

解决：**使用锁进行控制，对同一类型信息的key设置不同的过期时间，、缓存定时预热**

击穿：在高并发环境下，大量请求同时访问某一个key,该key缓存失效或者过期，导致这些请求访问到数据库。这会对数据库造成严重的压力

解决：使用锁，热点数据不过期，缓存预热，热点数据查询降级处理

穿透：请求查询一个不存在的数据，由于缓存层不存在这个数据，所以请求会穿过缓存层 直接查询数据库，导致数据库压力增加（这种属于非法访问）（布隆过滤器---bit array—二进制）

解决：缓存空值或特殊值，布隆过滤器

2.redis 持久化方式有几种？区别是什么？
  RDB:将内存数据全量打包成rdb文件
  Aof:将输入的数据指令存入到aof文件中

## 2.5 redis 过期策略和内存淘汰策略

内存过期策略: 惰性删除（key 到过期时间一个个删），定期删除（批量删）

内存淘汰策略（当内存使用达到阈值时就会主动挑选部分KEY删除以释放更多内存

）：Redis支持8种不同的内存淘汰策略：

1）noeviction： 不删除，直接返回报错信息。

2）volatile-lfu：在设置了过期时间的key中，移除最近最少（最少频率使用）使用的key。

4）volatile-lru：在设置了过期时间的key中，移除最近最久未使用的key。

3）volatile-ttl： 在设置了过期时间的key中，移除准备过期的key。

5）volatile-random：在设置了过期时间的key中，随机移除某个key。

6）allkeys-random：随机移除某个key。

7）allkeys-lru：移除最久未使用的key。

8）allkeys-lfu：移除最近最少使用的key。

3.主从搭建的步骤？
起动两台redis 服务器。让其中一台redis
服务作为slave 从机 slaveof 指令去连主机即可

4.哨兵的作用？
监控，故障转移，通知。
哨兵的搭建步骤？
  1. 先准备一个一主加两次的主从结构redis
  2. 准备三台sentinel 哨兵redis
  3. sentinel.conf文件，添加下面的内容：
  port   27001
  sentinel announce-ip 192.168.109.131
  sentinel monitor mymaster 192.168.109.131 7001 2
  sentinel down-after-milliseconds mymaster 5000
  sentinel failover-timeout mymaster 60000
  dir "/tmp/s1"
  4. 启动
  \# 第1个redis-sentinel s1/sentinel.conf
  \# 第2个redis-sentinel s2/sentinel.conf
  \# 第3个redis-sentinel s3/sentinel.conf

5.为什么要搭建分片集群？
主从和哨兵可以解决高可用、高并发读的问题。但是依然有两个问题没有解决：
- 海量数据存储问题
- 高并发写的问题
搭建分片集群的步骤?
搭建一个最小的分片集群，包含3个master节点，每个master包含一个slave节点，

![](每天习题背诵_assets/image_35.jpg)

准备一个新的redis.conf文件
port 6379
\# 开启集群功能
cluster-enabled yes
\# 集群的配置文件名称，不需要我们创建，由redis自己维护
cluster-config-file /tmp/6379/nodes.conf
\# 节点心跳失败的超时时间
cluster-node-timeout 5000
\# 持久化文件存放目录
dir /tmp/6379
\# 绑定地址
bind 0.0.0.0
\# 让redis后台运行
daemonize yes
\# 注册的实例ip
replica-announce-ip 192.168.109.131
\# 保护模式
protected-mode no
\# 数据库数量
databases 1
\# 日志
logfile /tmp/6379/run.log

\# 创建集群指令
./redis-trib.rb create --replicas 1
192.168.150.101:7001 192.168.150.101:7002 192.168.150.101:7003
192.168.150.101:8001 192.168.150.101:8002 192.168.150.101:8003
6.分片集群的分槽了不了解？
槽一共有16384个区间。会根据key 进行hashcode 进行计算，然后对槽数量进行取摩操作这样会将数据放到哪个区间
