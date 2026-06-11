# Redis 指令实战手册

> 面向 Spring Boot 开发者，从 5 分钟上手到进阶实战，每条指令都关联**真实业务场景**。

---

```
学习路线 ──────────────────────────────────────────────────►

  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐
  │ 入门篇    │ → │ 核心数据类型  │ → │ 进阶能力     │ → │ 实战方案   │
  │ 连接/Key  │   │ String→Hash  │   │ Lua/Pipeline │   │ 锁/限流/队列│
  │ 基础操作  │   │ →List→Set    │   │ 事务/Stream  │   │ 排行榜/签到│
  └──────────┘   │ →ZSet        │   │ Pub/Sub      │   └───────────┘
                 └──────────────┘   └──────────────┘
```

---

# 第一篇：入门 — 5 分钟上手

## 1.1 连接 Redis

```bash
# 最简连接（本地默认 6379）
redis-cli

# 指定地址和端口
redis-cli -h 127.0.0.1 -p 6379

# 带密码连接
redis-cli -h 127.0.0.1 -p 6379 -a your_password

# 连进去之后再认证
AUTH your_password

# 测试连通性
PING                          # → PONG
```

> 生产环境直连时，**先确认连的是主库还是从库**，避免误操作主库数据。

## 1.2 数据库切换

```bash
SELECT 2                      # 切换到 2 号库（默认 16 个库：0-15）
DBSIZE                        # 当前库 key 数量
```

## 1.3 Key 的增删查

这是所有数据类型通用的操作，**必须先记住**：

| 指令 | 用途 | 示例 |
|------|------|------|
| `EXISTS` | 判断 key 是否存在 | `EXISTS user:1001` |
| `DEL` | 删除 key | `DEL user:1001` |
| `UNLINK` | 异步删除大 key（不阻塞） | `UNLINK big_list` |
| `TYPE` | 查看 key 的数据类型 | `TYPE user:1001` |
| `EXPIRE` | 设置过期时间（秒） | `EXPIRE token:xxx 7200` |
| `TTL` | 查看剩余过期时间（秒） | `TTL token:xxx` |
| `PERSIST` | 移除过期时间（改为永不过期） | `PERSIST user:1001` |
| `RENAME` | 重命名 key | `RENAME old_key new_key` |

**TTL 返回值速记**：

```
-2  →  key 不存在（已过期或从未创建）
-1  →  key 存在但永不过期
>0  →  剩余秒数
```

### 查找 Key 的正确姿势

```bash
# ❌ 生产禁用！数据量大时会阻塞 Redis
KEYS *

# ✅ 用 SCAN 增量遍历，不阻塞
SCAN 0 MATCH user:* COUNT 100
```

> `KEYS *` 是生产环境的**禁令级操作**，务必用 `SCAN` 代替。

### 清空数据库

```bash
FLUSHDB                       # 清空当前库
FLUSHALL                      # 清空所有库（极其危险！）
```

---

# 第二篇：核心 — 五大数据类型

> 日常开发 80% 只用 **String、Hash、ZSet** 三种类型，先把这三个吃透。

---

## 2.1 String — 万能基础型

> **场景**：缓存、计数器、分布式锁、Session 存储

### 基本读写

```bash
SET user:1001 '{"name":"张三","age":25}'
GET user:1001                 # → {"name":"张三","age":25}

# 批量读写（减少网络往返）
MSET k1 "v1" k2 "v2" k3 "v3"
MGET k1 k2 k3                 # → 1) "v1" 2) "v2" 3) "v3"
```

### 防覆盖写入（SETNX）

```bash
# 仅当 key 不存在时才设置
SETNX lock:order:1001 1       # → 1（成功）或 0（已存在）

# ❌ SETNX + EXPIRE 不是原子操作！中间崩溃会导致死锁
SETNX lock:order:1001 1
EXPIRE lock:order:1001 30

# ✅ 原子操作：设置 + 过期 + 不存在才设置（分布式锁标准写法）
SET lock:order:1001 1 EX 30 NX
```

### 计数器

```bash
SET article:1001:views 0
INCR article:1001:views       # → 1（+1）
INCRBY article:1001:views 10  # → 11（+10）
DECR article:1001:views       # → 10（-1）
INCRBYFLOAT price:1001 2.5    # → +2.5（浮点计数）
```

### Spring Boot 代码

```java
@Autowired
private StringRedisTemplate redis;

// --- 基本读写 ---
redis.opsForValue().set("token:user1001", "jwt_xxx", 2, TimeUnit.HOURS);
String token = redis.opsForValue().get("token:user1001");

// --- SETNX（分布式锁） ---
Boolean locked = redis.opsForValue()
    .setIfAbsent("lock:order:1001", "1", 30, TimeUnit.SECONDS);
if (locked) {
    try {
        // 执行业务逻辑
    } finally {
        redis.delete("lock:order:1001");
    }
}

// --- 计数器 ---
Long views = redis.opsForValue().increment("article:1001:views");

// --- 批量读取 ---
List<String> values = redis.opsForValue().multiGet(List.of("k1", "k2", "k3"));
```

---

## 2.2 Hash — 对象存储首选

> **场景**：用户信息、商品详情、配置项——任何需要**单独修改某个字段**的对象

### 为什么用 Hash 而不用 String+JSON？

```
String+JSON 方案：改一个字段 = 读整个JSON → 改字段 → 写回整个JSON（3次操作，非原子）
Hash 方案：      改一个字段 = HSET 一次搞定（1次操作，原子）
```

### 基本操作

```bash
# 存储对象
HSET user:1001 name "张三" age "25" dept "研发部"

# 读取
HGET user:1001 name             # → "张三"
HMGET user:1001 name age        # → 1) "张三" 2) "25"
HGETALL user:1001               # → 所有字段和值
HKEYS user:1001                 # → 仅字段名
HVALS user:1001                 # → 仅值

# 修改与删除
HSET user:1001 age "26"         # 修改字段
HDEL user:1001 dept             # 删除字段

# 判断与计数
HEXISTS user:1001 name          # → 1（存在）
HLEN user:1001                  # → 2（2个字段）
HINCRBY user:1001 age 1         # age + 1
```

### Spring Boot 代码

```java
@Autowired
private StringRedisTemplate redis;

// --- 存储对象 ---
Map<String, String> userMap = Map.of("name", "张三", "age", "25", "dept", "研发部");
redis.opsForHash().putAll("user:1001", userMap);

// --- 读取单个字段 ---
String name = (String) redis.opsForHash().get("user:1001", "name");

// --- 读取整个对象 ---
Map<Object, Object> user = redis.opsForHash().entries("user:1001");

// --- 修改单个字段（不用读出再写回） ---
redis.opsForHash().put("user:1001", "age", "26");

// --- 删除字段 ---
redis.opsForHash().delete("user:1001", "dept");

// --- 计数器 ---
redis.opsForHash().increment("user:1001", "age", 1);
```

---

## 2.3 List — 有序列表

> **场景**：最新动态、消息队列、待办列表

### 核心模型

```
LPUSH + LPOP  →  栈（后进先出）
RPUSH + LPOP  →  队列（先进先出）
LPUSH + LTRIM →  固定长度的最新列表
```

### 基本操作

```bash
# 推入
LPUSH feed:user1001 "动态3" "动态2" "动态1"     # 左侧推入
RPUSH task:queue "task1" "task2" "task3"         # 右侧推入

# 弹出
LPOP feed:user1001             # 左侧弹出
RPOP task:queue                # 右侧弹出

# 阻塞弹出（消息队列常用，等 30 秒）
BLPOP task:queue 30

# 读取（不弹出）
LRANGE feed:user1001 0 4       # 前 5 条
LRANGE feed:user1001 0 -1      # 全部

# 裁剪（只保留最新 100 条）
LTRIM feed:user1001 0 99

# 长度
LLEN feed:user1001
```

### Spring Boot 代码

```java
// --- 最新动态（只保留最新 100 条） ---
redis.opsForList().leftPush("feed:user1001", "新动态内容");
redis.opsForList().trim("feed:user1001", 0, 99);

// --- 获取最新 10 条 ---
List<String> feeds = redis.opsForList().range("feed:user1001", 0, 9);

// --- 简单队列 ---
redis.opsForList().rightPush("task:queue", "task1");
String task = redis.opsForList().leftPop("task:queue");
```

---

## 2.4 Set — 去重与集合运算

> **场景**：点赞/收藏去重、标签、共同好友、抽奖

### 基本操作

```bash
# 添加与查看
SADD like:article:1001 "user1" "user2" "user3"
SMEMBERS like:article:1001     # → 所有元素

# 判断存在（去重场景核心）
SISMEMBER like:article:1001 "user1"   # → 1（已点赞）

# 移除与计数
SREM like:article:1001 "user3"
SCARD like:article:1001       # → 2（2个元素）

# 随机弹出（抽奖）
SPOP lottery:pool 3           # 抽 3 个奖
```

### 集合运算

```bash
# 交集 — 共同关注
SINTER user:1001:follows user:1002:follows

# 差集 — 1001 关注了但 1002 没关注的
SDIFF user:1001:follows user:1002:follows

# 并集
SUNION user:1001:follows user:1002:follows

# 结果存入新集合
SINTERSTORE common:follows user:1001:follows user:1002:follows
```

### Spring Boot 代码

```java
// --- 点赞（去重） ---
redis.opsForSet().add("like:article:1001", "user1001");
Boolean liked = redis.opsForSet().isMember("like:article:1001", "user1001");
redis.opsForSet().remove("like:article:1001", "user1001");  // 取消点赞

// --- 共同好友 ---
Set<String> common = redis.opsForSet()
    .intersect("user:1001:follows", "user:1002:follows");

// --- 抽奖 ---
String winner = redis.opsForSet().pop("lottery:pool");
```

---

## 2.5 ZSet — 排行榜利器

> **场景**：积分排行、热搜榜、延时队列——面试和工作都高频

### 基本操作

```bash
# 添加成员（score 为分数）
ZADD rank:score 95 "张三" 88 "李四" 92 "王五"

# 查分数与排名
ZSCORE rank:score "张三"           # → 95
ZRANK rank:score "张三"            # → 2（低→高排名，从0开始）
ZREVRANK rank:score "张三"         # → 0（高→低排名，第一名！）

# 加分
ZINCRBY rank:score 3 "李四"        # 88 → 91

# 排行榜 Top N（从高到低——业务常用）
ZREVRANGE rank:score 0 9 WITHSCORES   # Top 10

# 按分数范围查
ZRANGEBYSCORE rank:score 80 95 WITHSCORES

# 删除
ZREM rank:score "李四"
ZREMRANGEBYSCORE rank:score 0 59       # 删除 60 分以下的
```

> 排行榜用 `ZREVRANGE`（分数从高到低），不是 `ZRANGE`。

### Spring Boot 代码

```java
// --- 排行榜 ---
redis.opsForZSet().add("rank:score", "张三", 95);
redis.opsForZSet().add("rank:score", "李四", 88);

// Top 10（分数从高到低，带分数）
Set<ZSetOperations.TypedTuple<String>> top10 =
    redis.opsForZSet().reverseRangeWithScores("rank:score", 0, 9);

// 查排名（从高到低）
Long rank = redis.opsForZSet().reverseRank("rank:score", "张三");

// 加分
redis.opsForZSet().incrementScore("rank:score", "李四", 5);
```

---

## 五大数据类型速查

| 类型 | 一句话定位 | 典型场景 | 核心指令 |
|------|-----------|---------|---------|
| **String** | 万能键值对 | 缓存、锁、计数器 | `SET` `GET` `INCR` `SETNX` |
| **Hash** | 对象字段存储 | 用户信息、商品详情 | `HSET` `HGET` `HGETALL` `HDEL` |
| **List** | 有序可重复列表 | 最新动态、简单队列 | `LPUSH` `LRANGE` `LTRIM` |
| **Set** | 无序去重集合 | 点赞去重、共同好友、抽奖 | `SADD` `SISMEMBER` `SINTER` |
| **ZSet** | 有序去重+分数 | 排行榜、延时队列 | `ZADD` `ZREVRANGE` `ZINCRBY` |

---

# 第三篇：进阶 — 原子性与高性能

---

## 3.1 Lua 脚本 — 原子操作利器

> **为什么需要 Lua？** Redis 单条指令是原子的，但**多条指令组合不是**。Lua 脚本在 Redis 中**整体原子执行**，中间不会被其他命令插队。

### 典型场景：库存扣减

```bash
# Lua 脚本：有库存才扣，没库存返回 0
EVAL "
  local stock = tonumber(redis.call('GET', KEYS[1]))
  if stock and stock >= tonumber(ARGV[1]) then
    redis.call('DECRBY', KEYS[1], ARGV[1])
    return 1
  else
    return 0
  end
" 1 stock:1001 1
```

### 脚本缓存（节省带宽）

```bash
# 加载脚本，返回 SHA1 校验和
SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# → "a5d0b1e..."

# 通过 SHA1 执行（不用再传整个脚本）
EVALSHA a5d0b1e... 1 mykey
```

### Spring Boot 执行 Lua

```java
// 库存扣减脚本
DefaultRedisScript<Long> script = new DefaultRedisScript<>();
script.setScriptText(
    "local stock = tonumber(redis.call('GET', KEYS[1])) " +
    "if stock and stock >= tonumber(ARGV[1]) then " +
    "  redis.call('DECRBY', KEYS[1], ARGV[1]) " +
    "  return 1 " +
    "else " +
    "  return 0 " +
    "end"
);
script.setResultType(Long.class);

// 执行：扣减 stock:1001 的 1 件库存
Long success = redis.execute(script, List.of("stock:1001"), "1");
```

> **最佳实践**：将 Lua 脚本写在 `.lua` 文件中，启动时加载并通过 `EVALSHA` 执行。

---

## 3.2 Pipeline — 批量执行减少网络开销

> 每条 Redis 命令都有一次网络往返（RTT），Pipeline 将多条命令**打包一次发送**，大幅降低延迟。

```java
// 批量写入 1000 个 key
List<Object> results = redis.executePipelined((RedisCallback<Object>) connection -> {
    StringRedisConnection conn = (StringRedisConnection) connection;
    for (int i = 0; i < 1000; i++) {
        conn.set("key:" + i, "value:" + i);
    }
    return null;  // 必须返回 null
});
```

### Pipeline vs 普通操作对比

```
普通模式：  命令1 → 等 → 命令2 → 等 → 命令3 → 等     （3 次 RTT）
Pipeline：  命令1 + 命令2 + 命令3 → 一次性发 → 一次性收  （1 次 RTT）
```

---

## 3.3 事务（MULTI/EXEC）

> 注意：Redis 事务**不支持回滚**！某条命令失败，其余仍然执行。需要回滚语义请用 Lua 脚本。

```bash
MULTI
SET account:A 1000
SET account:B 500
INCRBY account:A -200
INCRBY account:B 200
EXEC                          # 提交（原子执行）
# DISCARD                     # 放弃
```

```java
// Spring Boot 事务
redis.execute(new SessionCallback<Object>() {
    @Override
    public Object execute(RedisOperations operations) {
        operations.multi();
        operations.opsForValue().set("account:A", "1000");
        operations.opsForValue().set("account:B", "500");
        return operations.exec();
    }
});
```

> **Pipeline vs 事务**：Pipeline 追求速度（不保证原子），事务追求原子（串行执行较慢）。两者可以组合使用。

---

## 3.4 Stream — 轻量级消息队列

> Redis 5.0+ 引入，比 List 队列多了**消费者组、消息确认、持久化**能力。

```bash
# 发送消息（* 表示自动生成 ID）
XADD order:stream * orderId 1001 amount 99.9

# 创建消费者组（从最早开始消费）
XGROUP CREATE order:stream order-group 0

# 消费者读取消息（阻塞 5 秒，每次 1 条）
XREADGROUP GROUP order-group consumer1 COUNT 1 BLOCK 5000 STREAMS order:stream >

# 确认消息已处理
XACK order:stream order-group 1717800000000-0

# 查看待处理消息
XPENDING order:stream order-group
```

---

## 3.5 Pub/Sub — 发布订阅

> 适合**实时通知**，但消息不持久化，离线客户端收不到。

```bash
# 订阅
SUBSCRIBE order:notify

# 按模式订阅
PSUBSCRIBE order:*

# 发布
PUBLISH order:notify "订单1001已支付"

# 退订
UNSUBSCRIBE order:notify
```

```java
// 发布
redis.convertAndSend("order:notify", "订单1001已支付");

// 订阅（需配置 RedisMessageListenerContainer）
@Component
public class OrderSubscriber implements MessageListener {
    @Override
    public void onMessage(Message message, byte[] pattern) {
        System.out.println("收到: " + new String(message.getBody()));
    }
}
```

---

## 3.6 Bitmap — 极省内存的二值场景

> **场景**：签到打卡、在线状态、布隆过滤器

```bash
# 签到（第 10 天已签到）
SETBIT sign:user1001:202606 9 1       # 下标从 0 开始

# 检查是否签到
GETBIT sign:user1001:202606 9         # → 1

# 本月签到天数
BITCOUNT sign:user1001:202606

# 前 15 天签到天数
BITCOUNT sign:user1001:202606 0 14

# 位运算：连续 3 天都签到的用户
BITOP AND result sign:20260606 sign:20260607 sign:20260608
```

```java
// Spring Boot 签到
redis.opsForValue().setBit("sign:user1001:202606", dayOfMonth - 1, true);
Boolean signed = redis.opsForValue().getBit("sign:user1001:202606", dayOfMonth - 1);
```

---

## 3.7 HyperLogLog — UV 统计神器

> 固定 12KB 内存，误差 0.81%，适合海量去重计数。

```bash
PFADD uv:page:home "user1" "user2" "user3"
PFADD uv:page:home "user2" "user4"       # user2 重复不计数
PFCOUNT uv:page:home                      # → 4

# 合并多个页面的 UV
PFMERGE uv:page:total uv:page:home uv:page:product
```

```java
redis.opsForHyperLogLog().add("uv:page:home", "user1", "user2");
Long uv = redis.opsForHyperLogLog().size("uv:page:home");
```

---

# 第四篇：实战 — 常见业务方案

> 把前面的指令组合起来，解决真实业务问题。

---

## 4.1 分布式锁

```
问题：多实例部署下，本地锁失效
方案：SET key value EX seconds NX（原子加锁 + 自动过期）
```

```java
@Autowired
private StringRedisTemplate redis;

public boolean tryLock(String lockKey, String requestId, int expireSeconds) {
    return Boolean.TRUE.equals(
        redis.opsForValue().setIfAbsent(lockKey, requestId, expireSeconds, TimeUnit.SECONDS)
    );
}

public boolean unlock(String lockKey, String requestId) {
    // 用 Lua 保证"判断 + 删除"是原子的，防止误删别人的锁
    String script =
        "if redis.call('GET', KEYS[1]) == ARGV[1] then " +
        "  return redis.call('DEL', KEYS[1]) " +
        "else " +
        "  return 0 " +
        "end";
    DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(script, Long.class);
    Long result = redis.execute(redisScript, List.of(lockKey), requestId);
    return Long.valueOf(1L).equals(result);
}

// 使用
String requestId = UUID.randomUUID().toString();
if (tryLock("lock:order:1001", requestId, 30)) {
    try {
        // 执行业务
    } finally {
        unlock("lock:order:1001", requestId);
    }
}
```

> **为什么解锁也要 Lua？** 防止 A 的锁过期后，B 加锁成功，A 误删 B 的锁。

---

## 4.2 滑动窗口限流

```
问题：1 分钟内同一用户最多访问 5 次
方案：ZSet + Lua（每次请求记录时间戳作为 score，删除窗口外的，计数判断）
```

```java
public boolean isAllowed(String userId) {
    String key = "rate:" + userId;
    long now = System.currentTimeMillis();
    long windowStart = now - 60_000;  // 1 分钟窗口

    String script =
        "redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1]) " +   // 清除窗口外记录
        "local count = redis.call('ZCARD', KEYS[1]) " +              // 当前窗口请求数
        "if count < tonumber(ARGV[3]) then " +                       // 未超限
        "  redis.call('ZADD', KEYS[1], ARGV[2], ARGV[2]) " +        // 记录本次请求
        "  redis.call('EXPIRE', KEYS[1], 60) " +                     // 设置过期
        "  return 1 " +
        "else " +
        "  return 0 " +
        "end";

    DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(script, Long.class);
    Long result = redis.execute(redisScript, List.of(key),
        String.valueOf(windowStart), String.valueOf(now), "5");
    return Long.valueOf(1L).equals(result);
}
```

---

## 4.3 排行榜

```
问题：游戏积分排行榜，需要 Top N、个人排名、加分
方案：ZSet（score 为积分，member 为用户 ID）
```

```java
// 加分
redis.opsForZSet().incrementScore("rank:game", "user1001", 10);

// Top 10（分数从高到低，带分数）
Set<ZSetOperations.TypedTuple<String>> top10 =
    redis.opsForZSet().reverseRangeWithScores("rank:game", 0, 9);
top10.forEach(t ->
    System.out.println(t.getValue() + ": " + t.getScore()));

// 我的排名
Long myRank = redis.opsForZSet().reverseRank("rank:game", "user1001");

// 我的分数
Double myScore = redis.opsForZSet().score("rank:game", "user1001");
```

---

## 4.4 签到打卡

```
问题：用户每日签到，需要判断某天是否签到、统计当月签到次数
方案：Bitmap（每天占 1 bit，一个月仅约 4 字节）
```

```java
// 签到（当月第几天，下标从 0 开始）
public void signIn(String userId, int dayOfMonth) {
    String key = "sign:" + userId + ":" + LocalDate.now().getYear()
                 + String.format("%02d", LocalDate.now().getMonthValue());
    redis.opsForValue().setBit(key, dayOfMonth - 1, true);
    redis.expire(key, 35, TimeUnit.DAYS);  // 过期清理
}

// 检查是否签到
public boolean hasSigned(String userId, int dayOfMonth) {
    String key = "sign:" + userId + ":" + LocalDate.now().getYear()
                 + String.format("%02d", LocalDate.now().getMonthValue());
    return Boolean.TRUE.equals(
        redis.opsForValue().getBit(key, dayOfMonth - 1));
}

// 当月签到天数
public long signedCount(String userId) {
    String key = "sign:" + userId + ":" + LocalDate.now().getYear()
                 + String.format("%02d", LocalDate.now().getMonthValue());
    return redis.opsForValue().size(key);  // 注意：实际需用 BITCOUNT
}
```

---

## 4.5 点赞与取消点赞

```
问题：文章点赞，同一用户不能重复点赞，需要点赞数和点赞列表
方案：Set（天然去重）
```

```java
// 点赞
redis.opsForSet().add("like:article:1001", "user1001");

// 取消点赞
redis.opsForSet().remove("like:article:1001", "user1001");

// 是否已点赞
Boolean liked = redis.opsForSet().isMember("like:article:1001", "user1001");

// 点赞数
Long count = redis.opsForSet().size("like:article:1001");

// 点赞列表
Set<String> users = redis.opsForSet().members("like:article:1001");
```

---

# 附录

## A. 场景速查表

| 场景 | 数据类型 | 核心指令 | 对应章节 |
|------|---------|---------|---------|
| 缓存对象 | String / Hash | `SET` `GET` / `HSET` `HGETALL` | 2.1 / 2.2 |
| 分布式锁 | String + Lua | `SET NX EX` + Lua 释放 | 4.1 |
| 计数器 | String | `INCR` `INCRBY` | 2.1 |
| 排行榜 | ZSet | `ZADD` `ZREVRANGE` `ZINCRBY` | 2.5 / 4.3 |
| 最新列表 | List | `LPUSH` `LRANGE` `LTRIM` | 2.3 |
| 去重/点赞 | Set | `SADD` `SISMEMBER` | 2.4 / 4.5 |
| 共同好友 | Set | `SINTER` | 2.4 |
| 签到打卡 | Bitmap | `SETBIT` `GETBIT` `BITCOUNT` | 3.6 / 4.4 |
| UV 统计 | HyperLogLog | `PFADD` `PFCOUNT` | 3.7 |
| 滑动窗口限流 | ZSet + Lua | `ZREMRANGEBYSCORE` `ZCARD` | 4.2 |
| 库存扣减 | String + Lua | `DECRBY` + Lua 原子判断 | 3.1 |
| 消息队列 | Stream / List | `XADD` `XREADGROUP` / `BLPOP` | 3.4 / 2.3 |

## B. 生产避坑清单

| 禁忌 | 正确做法 | 原因 |
|------|---------|------|
| `KEYS *` 查找 key | `SCAN` 增量遍历 | 阻塞主线程 |
| `DEL` 删除大 key | `UNLINK` 异步删除 | `DEL` 阻塞主线程 |
| `HGETALL` 取大数据量 | `HSCAN` 分批获取 | 数据量大时阻塞 |
| 不设过期时间 | 所有缓存必须设 TTL | 防止内存打满 |
| `FLUSHALL` 在生产执行 | `SCAN` + `DEL` 精确删除 | 清空所有库不可逆 |
| 大 Value（>10KB） | 拆分为 Hash 多字段或压缩 | 影响性能 |
| 热 Key 集中访问 | 本地缓存 + 热 Key 分散 | 单节点压力过大 |
| `MONITOR` 长时间运行 | 用完即退，或用 `SLOWLOG` | 每条命令都输出，拖垮 Redis |
| `MULTI/EXEC` 当回滚用 | 需要回滚用 Lua 脚本 | Redis 事务不回滚 |

## C. 运维排障常用指令

```bash
# 服务信息
INFO server                   # 版本、运行时间
INFO memory                   # used_memory_human（重点关注）
INFO replication              # 主从状态

# 慢查询
SLOWLOG GET 10                # 最近 10 条慢查询
CONFIG SET slowlog-log-slower-than 10000   # 阈值（微秒）

# 客户端
CLIENT LIST                   # 当前所有连接
CLIENT KILL ADDR 127.0.0.1:52341

# 内存分析
MEMORY USAGE user:1001        # 单个 key 内存占用
MEMORY DOCTOR                 # 内存诊断建议

# 持久化
LASTSAVE                      # 上次 RDB 保存时间
INFO persistence              # 持久化详情

# 实时监控（用完立即退出！）
MONITOR
```

---

> **学习建议**：不用死记指令，记住 **"场景 → 数据类型"的映射关系**，需要时查具体语法。先把 String、Hash、ZSet 三个吃透，它们覆盖了 80% 的日常工作。
