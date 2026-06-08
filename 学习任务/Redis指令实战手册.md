# Redis 常用指令实战手册

> 面向 Java 后端开发，聚焦**工作中真正高频使用的指令**，跳过冷门命令。

---

## 一、连接与认证

```bash
# 连接 Redis（默认 6379）
redis-cli

# 指定主机和端口
redis-cli -h 127.0.0.1 -p 6379

# 带密码连接
redis-cli -h 127.0.0.1 -p 6379 -a your_password

# 连接后认证
AUTH your_password

# 测试连通性
PING                    # 返回 PONG

# 查看服务器信息
INFO server
INFO memory             # 重点看 used_memory_human
INFO replication        # 主从复制状态

# 查看当前数据库
CLIENT LIST             # 当前所有连接
```

> **职场经验**：生产环境用 `redis-cli` 直连时，务必确认连的是从库还是主库，避免误操作主库。

---

## 二、数据库操作

```bash
# Redis 默认 16 个库（0-15），默认使用 0 号库
SELECT 2                # 切换到 2 号库

# 查看当前库 key 的数量
DBSIZE

# 查看当前库所有 key（生产慎用！）
KEYS *

# 扫描 key（生产安全替代方案）
SCAN 0 MATCH user:* COUNT 100

# 清空当前库
FLUSHDB

# 清空所有库（极其危险！）
FLUSHALL

# 查看 key 的类型
TYPE user:1001
```

> **职场经验**：`KEYS *` 在生产是**禁令级别**的操作，数据量大时会阻塞 Redis。用 `SCAN` 代替。

---

## 三、全局 Key 操作

| 指令 | 说明 | 示例 |
|------|------|------|
| `EXISTS` | 判断 key 是否存在 | `EXISTS user:1001` |
| `DEL` | 删除 key | `DEL user:1001` |
| `UNLINK` | 异步删除（不阻塞） | `UNLINK big_key` |
| `EXPIRE` | 设置过期秒数 | `EXPIRE user:1001 3600` |
| `PEXPIRE` | 设置过期毫秒数 | `PEXPIRE lock:order 3000` |
| `TTL` | 查看剩余生存时间(秒) | `TTL user:1001` |
| `PTTL` | 查看剩余生存时间(毫秒) | `PTTL lock:order` |
| `RENAME` | 重命名 key | `RENAME old_key new_key` |
| `PERSIST` | 移除过期时间 | `PERSIST user:1001` |

```bash
# TTL 返回值含义：
#  -1  → key 存在但没有设置过期时间（永不过期）
#  -2  → key 不存在
#  >0  → 剩余秒数
```

> **职场经验**：删除大 key 用 `UNLINK` 而非 `DEL`，`DEL` 会阻塞主线程导致卡顿。

---

## 四、String 字符串

> **最常用数据类型**，缓存、计数器、分布式锁都靠它。

### 4.1 基本操作

```bash
SET user:1001 '{"name":"张三","age":25}'
GET user:1001

# 仅当 key 不存在时设置（防覆盖）
SETNX lock:order:1001 1

# 设置 + 过期时间（原子操作，推荐！）
SETEX token:user1001 7200 "jwt_token_string"

# 设置 + 过期时间 + 不存在才设置（分布式锁标准写法）
SET lock:order:1001 1 EX 30 NX
```

### 4.2 批量操作

```bash
MSET k1 "v1" k2 "v2" k3 "v3"
MGET k1 k2 k3
```

### 4.3 计数器

```bash
SET article:1001:views 0
INCR article:1001:views          # +1，返回 1
INCRBY article:1001:views 10    # +10，返回 11
DECR article:1001:views          # -1，返回 10
INCRBYFLOAT price:1001 2.5      # +2.5
```

### 4.4 追加与子串

```bash
APPEND log:today "new log entry"  # 追加内容
STRLEN log:today                   # 获取长度
GETRANGE log:today 0 10           # 截取子串
```

### 4.5 Java 代码示例（Spring Data Redis）

```java
@Autowired
private StringRedisTemplate redis;

// SET + 过期
redis.opsForValue().set("token:user1001", "jwt_xxx", 2, TimeUnit.HOURS);

// SETNX
Boolean locked = redis.opsForValue().setIfAbsent("lock:order:1001", "1", 30, TimeUnit.SECONDS);

// INCR
Long views = redis.opsForValue().increment("article:1001:views");

// MGET
List<String> values = redis.opsForValue().multiGet(List.of("k1", "k2", "k3"));
```

---

## 五、Hash 哈希

> **对象存储首选**，类似 Java 的 `HashMap<String, Map<String, String>>`。

### 5.1 基本操作

```bash
# 设置单个字段
HSET user:1001 name "张三"
HSET user:1001 age "25"
HSET user:1001 dept "研发部"

# 一次设置多个字段
HMSET user:1001 name "张三" age "25" dept "研发部"

# 获取单个字段
HGET user:1001 name                  # → "张三"

# 获取多个字段
HMGET user:1001 name age             # → 1) "张三" 2) "25"

# 获取所有字段和值
HGETALL user:1001
# → 1) "name"  2) "张三"  3) "age"  4) "25"  5) "dept"  6) "研发部"

# 仅获取所有字段名
HKEYS user:1001                      # → name age dept

# 仅获取所有值
HVALS user:1001                      # → 张三 25 研发部

# 删除字段
HDEL user:1001 dept

# 字段是否存在
HEXISTS user:1001 name               # → 1

# 字段数量
HLEN user:1001                       # → 2
```

### 5.2 计数

```bash
HINCRBY user:1001 age 1              # age + 1
HINCRBYFLOAT product:1001 price 0.5  # price + 0.5
```

### 5.3 Java 代码示例

```java
// 存储对象
Map<String, String> userMap = Map.of("name", "张三", "age", "25", "dept", "研发部");
redis.opsForHash().putAll("user:1001", userMap);

// 获取单个字段
String name = (String) redis.opsForHash().get("user:1001", "name");

// 获取整个对象
Map<Object, Object> user = redis.opsForHash().entries("user:1001");

// 删除字段
redis.opsForHash().delete("user:1001", "dept");

// 计数
redis.opsForHash().increment("user:1001", "age", 1);
```

> **职场经验**：存对象用 Hash 而非 String+JSON，好处是可以**单独修改某个字段**，不用读取-修改-写回整个 JSON。

---

## 六、List 列表

> 有序可重复，适合**消息队列、最新列表、栈/队列**。

### 6.1 基本操作

```bash
# 从左边推入（栈顶）
LPUSH notifications:user1001 "消息3" "消息2" "消息1"

# 从右边推入（队列尾部）
RPUSH task:queue "task1" "task2" "task3"

# 从左边弹出（栈：后进先出）
LPOP notifications:user1001        # → "消息1"

# 从右边弹出（队列：先进先出）
RPOP task:queue                     # → "task3"

# 阻塞弹出（消息队列常用，超时 30 秒）
BLPOP task:queue 30

# 获取列表长度
LLEN notifications:user1001

# 按索引范围获取（不会弹出）
LRANGE notifications:user1001 0 4   # 获取前 5 条
LRANGE notifications:user1001 0 -1  # 获取全部

# 按索引获取单个元素
LINDEX notifications:user1001 0

# 按索引设置值
LSET notifications:user1001 0 "新消息"

# 移除指定值
LREM notifications:user1001 1 "消息3"   # 从头部删1个"消息3"

# 裁剪列表（只保留指定范围）
LTRIM notifications:user1001 0 99      # 只保留最新100条
```

### 6.2 常见模式

```
最新N条动态：LPUSH + LTRIM（推入后立即裁剪）
简单队列：   RPUSH + BLPOP
栈：        LPUSH + LPOP
```

### 6.3 Java 代码示例

```java
// 最新动态列表
redis.opsForList().leftPush("feed:user1001", "动态内容");
redis.opsForList().trim("feed:user1001", 0, 99);  // 只保留最新100条

// 获取最新N条
List<String> feeds = redis.opsForList().range("feed:user1001", 0, 9);
```

---

## 七、Set 集合

> 无序不重复，适合**去重、标签、共同好友、抽奖**。

### 7.1 基本操作

```bash
# 添加元素
SADD tags:article:1001 "Java" "Redis" "后端"

# 查看所有元素
SMEMBERS tags:article:1001

# 判断元素是否存在
SISMEMBER tags:article:1001 "Java"      # → 1

# 移除元素
SREM tags:article:1001 "后端"

# 元素数量
SCARD tags:article:1001

# 随机获取一个元素（不删除）
SRANDMEMBER tags:article:1001

# 随机弹出一个元素（删除）
SPOP lottery:pool 3                     # 抽3个奖
```

### 7.2 集合运算

```bash
# 交集：共同关注
SINTER user:1001:follows user:1002:follows

# 并集
SUNION user:1001:follows user:1002:follows

# 差集：1001 关注了但 1002 没关注的
SDIFF user:1001:follows user:1002:follows

# 将交集结果存入新集合
SINTERSTORE common:follows user:1001:follows user:1002:follows
```

### 7.3 Java 代码示例

```java
// 添加标签
redis.opsForSet().add("tags:article:1001", "Java", "Redis", "后端");

// 判断是否已点赞（去重场景）
Boolean liked = redis.opsForSet().isMember("like:article:1001", "user1001");

// 共同好友
Set<String> common = redis.opsForSet().intersect("user:1001:follows", "user:1002:follows");

// 抽奖
String winner = redis.opsForSet().pop("lottery:pool");
```

---

## 八、Sorted Set（ZSet）有序集合

> **排行榜、延时队列、带权重的集合**——面试和工作中都高频。

### 8.1 基本操作

```bash
# 添加成员（score 为分数）
ZADD rank:score 95 "张三" 88 "李四" 92 "王五"

# 获取成员分数
ZSCORE rank:score "张三"               # → 95

# 分数增减
ZINCRBY rank:score 3 "李四"            # 李四 88→91

# 移除成员
ZREM rank:score "李四"

# 成员数量
ZCARD rank:score

# 统计分数范围内成员数
ZCOUNT rank:score 80 95

# 按排名获取成员（分数从低到高）
ZRANGE rank:score 0 2                  # 前3名（低→高）
ZRANGE rank:score 0 -1 WITHSCORES      # 全部带分数

# 按排名获取成员（分数从高到低）—— 排行榜常用！
ZREVRANGE rank:score 0 9 WITHSCORES    # Top10

# 查看成员排名（从0开始）
ZRANK rank:score "张三"                # 低→高排名
ZREVRANK rank:score "张三"             # 高→低排名

# 按分数范围获取
ZRANGEBYSCORE rank:score 80 95 WITHSCORES

# 按分数范围删除
ZREMRANGEBYSCORE rank:score 0 59       # 删除60分以下的
```

### 8.2 Java 代码示例

```java
// 添加排行榜数据
redis.opsForZSet().add("rank:score", "张三", 95);
redis.opsForZSet().add("rank:score", "李四", 88);

// 获取 Top10（分数从高到低）
Set<ZSetOperations.TypedTuple<String>> top10 =
    redis.opsForZSet().reverseRangeWithScores("rank:score", 0, 9);

// 查看某人排名（从高到低）
Long rank = redis.opsForZSet().reverseRank("rank:score", "张三");

// 加分
redis.opsForZSet().incrementScore("rank:score", "李四", 5);
```

> **职场经验**：排行榜用 `ZREVRANGE` 而不是 `ZRANGE`，因为业务上分数越高排名越靠前。

---

## 九、Bitmap 位图

> 适合**签到、在线状态、布隆过滤器**等二值场景，极其节省内存。

```bash
# 设置位（签到：第100天已签到）
SETBIT sign:user1001:202606 100 1

# 获取位（检查第100天是否签到）
GETBIT sign:user1001:202606 100       # → 1

# 统计1的个数（本月签到天数）
BITCOUNT sign:user1001:202606

# 统计指定范围1的个数（前15天签到天数）
BITCOUNT sign:user1001:202606 0 14

# 多个 Bitmap 做位运算（连续3天都签到的用户）
BITOP AND result sign:20260606 sign:20260607 sign:20260608
```

```java
// Java 签到
redis.opsForValue().setBit("sign:user1001:202606", dayOfMonth - 1, true);

// 检查是否签到
Boolean signed = redis.opsForValue().getBit("sign:user1001:202606", dayOfMonth - 1);
```

---

## 十、HyperLogLog 基数统计

> 适合**UV 统计**，固定 12KB 内存，误差 0.81%。

```bash
# 添加元素
PFADD uv:page:home "user1" "user2" "user3"
PFADD uv:page:home "user2" "user4"       # user2 重复不计数

# 获取基数（去重后的数量）
PFCOUNT uv:page:home                      # → 4

# 合并多个 HyperLogLog
PFMERGE uv:page:total uv:page:home uv:page:product
```

```java
redis.opsForHyperLogLog().add("uv:page:home", "user1", "user2");
Long uv = redis.opsForHyperLogLog().size("uv:page:home");
```

---

## 十一、Stream 消息流

> Redis 5.0+ 引入，适合**轻量级消息队列**。

```bash
# 发送消息
XADD order:stream * orderId 1001 amount 99.9
# 返回消息ID，如 1717800000000-0

# 创建消费者组
XGROUP CREATE order:stream order-group 0

# 消费者组读取消息（阻塞 5 秒，每次读1条）
XREADGROUP GROUP order-group consumer1 COUNT 1 BLOCK 5000 STREAMS order:stream >

# 确认消息已处理
XACK order:stream order-group 1717800000000-0

# 查看待处理消息
XPENDING order:stream order-group

# 查看流信息
XINFO STREAM order:stream
```

---

## 十二、Pipeline 与事务

### 12.1 Pipeline（批量执行，减少网络往返）

```java
// Spring Data Redis Pipeline
List<Object> results = redis.executePipelined((RedisCallback<Object>) connection -> {
    StringRedisConnection conn = (StringRedisConnection) connection;
    for (int i = 0; i < 1000; i++) {
        conn.set("key:" + i, "value:" + i);
    }
    return null;  // 必须返回 null
});
```

### 12.2 事务

```bash
MULTI                   # 开启事务
SET account:A 1000
SET account:B 500
INCRBY account:A -200
INCRBY account:B 200
EXEC                    # 提交事务（原子执行）
# DISCARD               # 放弃事务
```

```java
// Spring 事务
redis.execute(new SessionCallback<Object>() {
    @Override
    public Object execute(RedisOperations operations) throws DataAccessException {
        operations.multi();
        operations.opsForValue().set("account:A", "1000");
        operations.opsForValue().set("account:B", "500");
        return operations.exec();
    }
});
```

> **职场经验**：`MULTI/EXEC` 不支持回滚！某条命令失败，其余仍然执行。需要回滚语义要用 Lua 脚本。

---

## 十三、Lua 脚本

> 保证原子性，适合**分布式锁、限流、库存扣减**等复杂原子操作。

```bash
# 执行脚本
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue

# 加载脚本（返回 SHA1 校验和）
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# → "a5d0b..." 

# 通过 SHA1 执行（节省带宽）
EVALSHA a5d0b... 1 mykey
```

```java
// Spring Data Redis 执行 Lua 脚本
DefaultRedisScript<Long> script = new DefaultRedisScript<>();
script.setScriptText(
    "local current = redis.call('GET', KEYS[1]) " +
    "if current and tonumber(current) >= tonumber(ARGV[1]) then " +
    "  redis.call('DECRBY', KEYS[1], ARGV[1]) " +
    "  return 1 " +
    "else " +
    "  return 0 " +
    "end"
);
script.setResultType(Long.class);

Long success = redis.execute(script, List.of("stock:1001"), "1");
```

---

## 十四、发布/订阅

```bash
# 订阅频道
SUBSCRIBE order:notify

# 订阅模式
PSUBSCRIBE order:*

# 发布消息
PUBLISH order:notify "订单1001已支付"

# 退订
UNSUBSCRIBE order:notify
```

```java
// 发布
redis.convertAndSend("order:notify", "订单1001已支付");

// 订阅
redis.setMessageListener(new MessageListener() {
    @Override
    public void onMessage(Message message, byte[] pattern) {
        System.out.println("收到: " + new String(message.getBody()));
    }
}, new ChannelTopic("order:notify"));
```

---

## 十五、运维排障指令

```bash
# 查看 Redis 配置
CONFIG GET maxmemory
CONFIG GET maxmemory-policy

# 实时监控命令（生产慎用，影响性能）
MONITOR

# 慢查询日志
SLOWLOG GET 10                         # 最近10条慢查询
SLOWLOG LEN                            # 慢查询数量
CONFIG SET slowlog-log-slower-than 10000  # 设置阈值(微秒)

# 客户端管理
CLIENT LIST                            # 所有连接
CLIENT KILL ADDR 127.0.0.1:52341      # 杀掉指定连接

# 内存分析
MEMORY USAGE user:1001                 # 单个key内存占用
MEMORY DOCTOR                          # 内存诊断建议

# 持久化状态
LASTSAVE                               # 上次RDB保存时间
INFO persistence                        # 持久化详情
```

> **职场经验**：`MONITOR` 是排查利器但也可能把 Redis 打挂，线上用完立即退出。

---

## 十六、速查对照表

| 场景 | 数据类型 | 关键指令 |
|------|---------|---------|
| 缓存对象 | String / Hash | `SET`/`GET` / `HSET`/`HGETALL` |
| 分布式锁 | String | `SET key value EX seconds NX` |
| 计数器 | String | `INCR` / `INCRBY` |
| 排行榜 | ZSet | `ZADD` / `ZREVRANGE` / `ZINCRBY` |
| 最新列表 | List | `LPUSH` / `LRANGE` / `LTRIM` |
| 去重 / 标签 | Set | `SADD` / `SISMEMBER` / `SINTER` |
| 签到 | Bitmap | `SETBIT` / `GETBIT` / `BITCOUNT` |
| UV 统计 | HyperLogLog | `PFADD` / `PFCOUNT` |
| 消息队列 | Stream / List | `XADD` / `XREADGROUP` / `BLPOP` |
| 限流 | String + Lua | `INCR` + `EXPIRE` (Lua原子化) |
| 库存扣减 | String + Lua | `DECR` + Lua原子判断 |

---

## 十七、职场避坑清单

| 禁忌 | 正确做法 |
|------|---------|
| `KEYS *` 查找 key | 用 `SCAN` 增量遍历 |
| `DEL` 删除大 key | 用 `UNLINK` 异步删除 |
| `HGETALL` 取大数据量 | 用 `HSCAN` 分批获取 |
| 不设过期时间 | 所有缓存必须设 TTL，防止内存打满 |
| `FLUSHALL` 在生产执行 | 永远不要，用 `SCAN` + `DEL` 精确删除 |
| 大 Value（>10KB） | 拆分为 Hash 多字段或压缩 |
| 热 Key 集中访问 | 本地缓存 + 热Key分散 |
| `MONITOR` 长时间运行 | 用完即退，或用 `SLOWLOG` 替代 |

---

> **最后建议**：Redis 指令不需要死记硬背，记住**数据类型与场景的映射关系**，需要时再查具体语法。日常开发中 80% 的工作只用到 String、Hash、ZSet 三种类型。
