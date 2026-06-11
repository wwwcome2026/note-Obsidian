# Java Stream 实战手册

> 面向 Spring Boot 开发者，从"能看懂"到"写得出"到"用得好"。

---

```
学习路线 ──────────────────────────────────────────────────►

  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐
  │ 入门篇    │ → │ 中间操作篇    │ → │ 终结操作篇    │ → │ 进阶实战篇 │
  │ 概念/创建 │   │ 过滤/映射/排序│   │ 收集/归约/匹配│   │ 分组/并行/陷阱│
  └──────────┘   └──────────────┘   └──────────────┘   └───────────┘
```

---

# 第一篇：入门 — 理解 Stream

## 1.1 Stream 是什么？

Stream 是 Java 8 引入的**函数式数据处理管道**，用于对集合进行高效的三段式操作：

```
集合/数组  ──►  中间操作（可以多个，懒执行）  ──►  终结操作（触发执行，出结果）
  创建              filter / map / sorted            collect / reduce / count
```

**三句话记住核心**：
1. **Stream 不修改原集合**，而是产生新结果
2. **中间操作是懒的**，只有终结操作触发时才执行
3. **Stream 只能消费一次**，用完就关，不能复用

## 1.2 vs for 循环：什么时候用 Stream？

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 查询/过滤/转换/统计 | **Stream** | 声明式，一行顶十行 |
| 修改集合元素本身 | **for 循环** | 有副作用更直观 |
| 需要索引/提前 break | **for 循环** | Stream 没有索引，不能 break |
| 性能极致要求 | **for 循环** | Stream 有创建开销 |
| 复杂多条件逻辑 | **for 循环** | 可读性更好 |

> **原则**：能用 Stream 一行表达清楚的就用 Stream，绕来绕去的不如写 for 循环。

## 1.3 创建 Stream

```java
// ---- 从集合 ----
List<String> list = List.of("a", "b", "c");
list.stream()                           // 顺序流
list.parallelStream()                   // 并行流

// ---- 从数组 ----
String[] arr = {"a", "b", "c"};
Arrays.stream(arr)

// ---- 从值 ----
Stream.of("a", "b", "c")

// ---- 无限流（配合 limit 使用）----
Stream.iterate(0, n -> n + 2)           // 0, 2, 4, 6, ...
      .limit(5);                        // 只取前 5 个
Stream.generate(Math::random)           // 无限随机数
      .limit(3);

// ---- 基本类型流（避免装箱开销）----
IntStream.range(1, 6)                   // 1, 2, 3, 4, 5
IntStream.rangeClosed(1, 5)             // 1, 2, 3, 4, 5（包含终点）
IntStream.of(1, 3, 5, 7)
```

---

# 第二篇：中间操作 — 挑选和变换

> 中间操作**返回新 Stream**，可以链式调用，不会立即执行。

---

## 2.1 filter — 过滤

```java
// 筛选年龄大于 20 的用户
List<User> adults = users.stream()
    .filter(u -> u.getAge() > 20)
    .toList();

// 多条件过滤
List<User> result = users.stream()
    .filter(u -> u.getAge() > 20)
    .filter(u -> u.getDept().equals("研发部"))
    .toList();

// 过滤掉 null
List<String> nonNull = list.stream()
    .filter(Objects::nonNull)
    .toList();
```

## 2.2 map — 映射（一一转换）

```java
// 提取所有用户名
List<String> names = users.stream()
    .map(User::getName)
    .toList();

// 类型转换
List<String> ids = users.stream()
    .map(u -> String.valueOf(u.getId()))
    .toList();

// 对元素做计算
List<Double> pricesWithTax = prices.stream()
    .map(p -> p * 1.13)
    .toList();
```

## 2.3 flatMap — 一对多展开

> **map vs flatMap**：`map` 是 1→1，`flatMap` 是 1→N 且**自动拍平**。

```java
// map：每个用户取标签列表 → Stream<List<String>>
// flatMap：拍平成 Stream<String>

// 获取所有用户的所有标签（去重）
List<String> allTags = users.stream()
    .map(User::getTags)                    // [["Java","Redis"], ["Go","Docker"]]
    .flatMap(List::stream)                 // ["Java","Redis","Go","Docker"]
    .distinct()
    .toList();

// 拆分句子为单词
List<String> words = sentences.stream()
    .flatMap(s -> Arrays.stream(s.split(" ")))
    .toList();

// 经典场景：订单 → 订单项展开
List<OrderItem> allItems = orders.stream()
    .flatMap(o -> o.getItems().stream())
    .toList();
```

## 2.4 sorted — 排序

```java
// 按年龄升序
List<User> sorted = users.stream()
    .sorted(Comparator.comparing(User::getAge))
    .toList();

// 按年龄降序
List<User> desc = users.stream()
    .sorted(Comparator.comparing(User::getAge).reversed())
    .toList();

// 多字段排序：先按部门，再按年龄降序
List<User> multi = users.stream()
    .sorted(Comparator.comparing(User::getDept)
                      .thenComparing(User::getAge, Comparator.reverseOrder()))
    .toList();

// 自然排序
List<String> alpha = names.stream()
    .sorted()
    .toList();
```

## 2.5 distinct — 去重

```java
// 基本去重（依赖 equals）
List<Integer> unique = List.of(1, 2, 2, 3, 3, 3).stream()
    .distinct()
    .toList();                            // [1, 2, 3]

// 按属性去重（需要自定义——Stream 没有内置按属性去重）
// 方案1：用 TreeSet
List<User> uniqueByName = users.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toCollection(() -> new TreeSet<>(Comparator.comparing(User::getName))),
        ArrayList::new
    ));

// 方案2：用 Map 的 key 去重（更常用）
List<User> uniqueByName2 = new ArrayList<>(
    users.stream()
        .collect(Collectors.toMap(User::getName, u -> u, (a, b) -> a))
        .values()
);
```

## 2.6 limit / skip — 截取

```java
// 取前 5 条（分页场景）
List<User> top5 = users.stream()
    .limit(5)
    .toList();

// 跳过前 10 条，取接下来的 5 条（第 3 页，每页 5 条）
List<User> page3 = users.stream()
    .skip(10)
    .limit(5)
    .toList();

// 取 Top N（先排序再截取）
List<User> top3Salary = users.stream()
    .sorted(Comparator.comparing(User::getSalary).reversed())
    .limit(3)
    .toList();
```

## 2.7 peek — 调试窥视

```java
// 不影响数据，只用于打印/调试（不要用于修改数据！）
List<User> result = users.stream()
    .filter(u -> u.getAge() > 20)
    .peek(u -> System.out.println("过滤后: " + u.getName()))
    .map(User::getName)
    .peek(name -> System.out.println("映射后: " + name))
    .toList();
```

> `peek` 仅用于**调试**，不要依赖它修改数据，规范上它只应该观察不该有副作用。

## 中间操作速查

| 操作 | 作用 | 记忆口诀 |
|------|------|---------|
| `filter` | 过滤 | **留**满足条件的 |
| `map` | 一一转换 | **变**每个元素 |
| `flatMap` | 一对多展开 | **拆**再**平** |
| `sorted` | 排序 | **排**顺序 |
| `distinct` | 去重 | **去**重复 |
| `limit` | 取前 N 个 | **截**头部 |
| `skip` | 跳过前 N 个 | **跳**头部 |
| `peek` | 窥视（调试） | **看**不碰 |

---

# 第三篇：终结操作 — 出结果

> 终结操作**触发整个流水线执行**，之后 Stream 就不能再用了。

---

## 3.1 collect — 收集（最常用）

### 收集为集合

```java
// → List
List<String> names = users.stream().map(User::getName).toList();               // Java 16+
List<String> names2 = users.stream().map(User::getName).collect(Collectors.toList()); // 通用写法

// → Set
Set<String> depts = users.stream().map(User::getDept).collect(Collectors.toSet());

// → 指定集合类型
LinkedList<User> linked = users.stream()
    .collect(Collectors.toCollection(LinkedList::new));
```

### 收集为 Map

```java
// → Map（key = ID，value = 用户）
Map<Long, User> userMap = users.stream()
    .collect(Collectors.toMap(User::getId, u -> u));

// → Map，key 重复时保留第一个
Map<String, User> nameMap = users.stream()
    .collect(Collectors.toMap(User::getName, u -> u, (a, b) -> a));

// → Map，指定 Map 类型
LinkedHashMap<Long, User> ordered = users.stream()
    .collect(Collectors.toMap(
        User::getId, u -> u, (a, b) -> a, LinkedHashMap::new));
```

### 拼接字符串

```java
// 逗号拼接
String joined = names.stream().collect(Collectors.joining(","));        // "a,b,c"

// 带前后缀
String joined2 = names.stream().collect(Collectors.joining(",", "[", "]")); // "[a,b,c]"
```

## 3.2 groupingBy — 分组（业务高频）

### 基本分组

```java
// 按部门分组 → Map<String, List<User>>
Map<String, List<User>> byDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept));
// {"研发部": [user1, user2], "市场部": [user3]}
```

### 二级分组

```java
// 先按部门，再按职级
Map<String, Map<String, List<User>>> byDeptAndLevel = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.groupingBy(User::getLevel)));
// {"研发部": {"高级": [...], "初级": [...]}, "市场部": {...}}
```

### 分组 + 聚合

```java
// 每个部门有多少人
Map<String, Long> countByDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept, Collectors.counting()));

// 每个部门的平均年龄
Map<String, Double> avgAgeByDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.averagingInt(User::getAge)));

// 每个部门薪资最高的人
Map<String, Optional<User>> maxSalaryByDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.maxBy(Comparator.comparing(User::getSalary))));

// 每个部门的用户名列表（而不是 User 对象）
Map<String, List<String>> namesByDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.mapping(User::getName, Collectors.toList())));
```

### partitioningBy — 分区（特殊的二分组）

```java
// 按是否成年分为两组 → Map<Boolean, List<User>>
Map<Boolean, List<User>> byAdult = users.stream()
    .collect(Collectors.partitioningBy(u -> u.getAge() >= 18));
// {true: [成年人列表], false: [未成年人列表]}
```

## 3.3 reduce — 归约

```java
// 求和
int totalAge = users.stream()
    .map(User::getAge)
    .reduce(0, Integer::sum);

// 求最大值
int maxAge = users.stream()
    .map(User::getAge)
    .reduce(Integer::max)
    .orElse(0);

// 拼接字符串
String combined = Stream.of("Hello", " ", "World")
    .reduce("", String::concat);
```

> **reduce vs collect**：简单聚合用 `reduce`，复杂收集用 `collect`。实际开发中 `collect` 用得多得多。

## 3.4 统计类

```java
// 计数
long count = users.stream().count();

// 最值
Optional<User> youngest = users.stream()
    .min(Comparator.comparing(User::getAge));
Optional<User> oldest = users.stream()
    .max(Comparator.comparing(User::getAge));

// 数值统计（一次性拿全）
IntSummaryStatistics stats = users.stream()
    .mapToInt(User::getAge)
    .summaryStatistics();
stats.getCount();     // 总数
stats.getMin();       // 最小
stats.getMax();       // 最大
stats.getAverage();   // 平均
stats.getSum();       // 求和
```

## 3.5 匹配与查找

```java
// 是否存在
boolean hasAdmin = users.stream().anyMatch(u -> "admin".equals(u.getRole()));

// 是否全部满足
boolean allAdult = users.stream().allMatch(u -> u.getAge() >= 18);

// 是否全都不满足
boolean noneVip = users.stream().noneMatch(u -> u.isVip());

// 找第一个
Optional<User> first = users.stream()
    .filter(u -> u.getAge() > 30)
    .findFirst();

// 找任意一个（并行流下比 findFirst 快）
Optional<User> any = users.stream()
    .filter(u -> u.getAge() > 30)
    .findAny();
```

## 3.6 forEach — 遍历

```java
// 打印
users.stream().forEach(u -> System.out.println(u.getName()));

// 简写
users.forEach(u -> System.out.println(u.getName()));
users.stream().map(User::getName).forEach(System.out::println);
```

> `forEach` 是终结操作，**不要在 forEach 里修改外部集合**，用 collect 产生新集合才是正道。

## 3.7 toArray — 转数组

```java
User[] array = users.stream().toArray(User[]::new);
String[] nameArr = users.stream().map(User::getName).toArray(String[]::new);
```

## 终结操作速查

| 操作 | 返回类型 | 作用 |
|------|---------|------|
| `collect` | 集合/Map/字符串 | 收集结果（最灵活） |
| `toList` | List | 收集为 List（Java 16+） |
| `reduce` | Optional / 指定值 | 归约聚合 |
| `count` | long | 计数 |
| `min` / `max` | Optional | 最值 |
| `anyMatch` / `allMatch` / `noneMatch` | boolean | 匹配判断 |
| `findFirst` / `findAny` | Optional | 查找 |
| `forEach` | void | 遍历 |
| `toArray` | 数组 | 转数组 |

---

# 第四篇：进阶 — 实战技巧与避坑

---

## 4.1 基本类型流 — 避免装箱开销

```java
// ❌ 装箱流：Integer → int → Integer，有额外开销
int sum1 = users.stream().map(User::getAge).reduce(0, Integer::sum);

// ✅ 基本类型流：全程 int，无装箱
int sum2 = users.stream().mapToInt(User::getAge).sum();

// 三种基本类型流
IntStream    → mapToInt    → sum / average / max / min
LongStream   → mapToLong
DoubleStream → mapToDouble

// 基本类型流转回对象流
Stream<User> objStream = intStream.mapToObj(age -> new User(age));
```

## 4.2 Collector 组合技巧

### collectingAndThen — 收集后再加工

```java
// 取平均年龄并四舍五入
Long roundedAvg = users.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.averagingInt(User::getAge),
        avg -> Math.round(avg)
    ));

// 收集为不可变列表
List<User> unmodifiable = users.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        Collections::unmodifiableList
    ));
```

### mapping + reducing

```java
// 每个部门的总薪资
Map<String, Integer> totalSalaryByDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.reducing(0, User::getSalary, Integer::sum)));

// 等价写法（更推荐）
Map<String, Integer> totalSalaryByDept2 = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.summingInt(User::getSalary)));
```

### toUnmodifiableList / toUnmodifiableMap（Java 10+）

```java
List<String> names = users.stream()
    .map(User::getName)
    .collect(Collectors.toUnmodifiableList());
```

## 4.3 并行流 — 什么时候用？

```java
// 创建并行流
list.parallelStream()
list.stream().parallel()

// 判断是否并行流
stream.isParallel()

// 并行流转回顺序流
stream.sequential()
```

### 并行流适用条件

| 条件 | 要求 |
|------|------|
| 数据量 | > 1 万条，否则创建线程池的开销比收益还大 |
| 操作 | CPU 密集型（计算、排序），不是 IO 密集型 |
| 线程安全 | 操作不能有共享可变状态 |
| 顺序 | 不依赖元素顺序 |

```java
// ✅ 适合并行：大数据量求和
long sum = IntStream.rangeClosed(1, 10_000_000).parallel().sum();

// ❌ 不适合并行：ArrayList 的 forEach 修改
users.parallelStream().forEach(u -> sharedList.add(u.getName())); // 线程不安全！
```

> **原则**：拿不准就不用并行流，顺序流在绝大多数场景已经够快。

## 4.4 实战场景汇总

### 场景 1：列表转树形结构

```java
// 部门列表 → 树形结构（parentId 构建父子关系）
public List<Dept> buildTree(List<Dept> allDepts) {
    Map<Long, List<Dept>> childrenMap = allDepts.stream()
        .collect(Collectors.groupingBy(Dept::getParentId));

    // 设置子节点
    allDepts.forEach(d -> d.setChildren(childrenMap.get(d.getId())));

    // 返回顶级节点（parentId = 0）
    return allDepts.stream()
        .filter(d -> d.getParentId() == 0L)
        .toList();
}
```

### 场景 2：两个集合的交并差

```java
Set<Long> setA = new HashSet<>(listA.stream().map(User::getId).toList());
Set<Long> setB = new HashSet<>(listB.stream().map(User::getId).toList());

// 交集
Set<Long> intersect = setA.stream().filter(setB::contains).collect(Collectors.toSet());

// 并集
Set<Long> union = Stream.concat(setA.stream(), setB.stream()).collect(Collectors.toSet());

// 差集（A 有 B 没有）
Set<Long> diff = setA.stream().filter(id -> !setB.contains(id)).collect(Collectors.toSet());
```

### 场景 3：扁平化嵌套集合

```java
// 班级 → 学生列表 → 所有学生
List<Student> allStudents = classes.stream()
    .flatMap(c -> c.getStudents().stream())
    .toList();

// 多层嵌套：学校 → 班级 → 学生
List<Student> all = schools.stream()
    .flatMap(s -> s.getClasses().stream())
    .flatMap(c -> c.getStudents().stream())
    .toList();
```

### 场景 4：Map 的流操作

```java
Map<String, Integer> scores = Map.of("张三", 95, "李四", 88, "王五", 72);

// 按 value 过滤
Map<String, Integer> passed = scores.entrySet().stream()
    .filter(e -> e.getValue() >= 80)
    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

// 按 value 排序
Map<String, Integer> sorted = scores.entrySet().stream()
    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
    .collect(Collectors.toMap(
        Map.Entry::getKey, Map.Entry::getValue,
        (a, b) -> a, LinkedHashMap::new));

// 只取 key 或 value
List<String> names = scores.keySet().stream().toList();
List<Integer> vals = scores.values().stream().toList();
```

### 场景 5：去重 + 按属性分组取最新

```java
// 同一用户多条操作记录，只保留最新一条
Map<String, UserLog> latestByUser = logs.stream()
    .collect(Collectors.toMap(
        UserLog::getUsername,
        log -> log,
        (a, b) -> a.getTimestamp() > b.getTimestamp() ? a : b
    ));
```

### 场景 6：批量 ID 查询（MyBatis-Plus 常用）

```java
// 从列表提取 ID，批量查询
List<Long> ids = users.stream().map(User::getId).toList();
List<Order> orders = orderMapper.selectBatchIds(ids);

// 外键转名称
Map<Long, String> deptMap = depts.stream()
    .collect(Collectors.toMap(Dept::getId, Dept::getName));
List<UserVO> vos = users.stream()
    .map(u -> new UserVO(u, deptMap.get(u.getDeptId())))
    .toList();
```

## 4.5 常见陷阱

### 陷阱 1：Stream 不能复用

```java
Stream<String> stream = list.stream();
stream.count();          // ✅ 第一次用
stream.toList();         // ❌ IllegalStateException: stream has already been operated upon or closed

// 正确做法：每次创建新的 Stream
list.stream().count();
list.stream().toList();
```

### 陷阱 2：短路操作不等于全部不执行

```java
// findFirst 是短路操作，但 filter 仍然可能执行多次
Optional<Integer> first = Stream.of(1, 2, 3, 4, 5)
    .peek(n -> System.out.println("过滤: " + n))
    .filter(n -> n > 3)
    .findFirst();
// 输出：过滤: 1  过滤: 2  过滤: 3  过滤: 4   → 找到 4 后停止
```

### 陷阱 3：修改源集合导致 ConcurrentModificationException

```java
// ❌ 遍历时修改源集合
list.stream().forEach(item -> {
    if (item.isValid()) list.remove(item);  // 报错！
});

// ✅ 先过滤再收集
List<String> valid = list.stream()
    .filter(Item::isValid)
    .toList();

// ✅ 用 removeIf（List 方法，不是 Stream）
list.removeIf(item -> !item.isValid());
```

### 陷阱 4：sorted 是有状态的

```java
// sorted 会把前面所有元素缓存到内存再排序
// 大数据量时慎用，尤其是并行流 + sorted
// 如果只需 Top N，用 limit 截取比 sorted 全排高效得多
List<User> top3 = users.stream()
    .sorted(Comparator.comparing(User::getSalary).reversed())
    .limit(3)
    .toList();
```

### 陷阱 5：分组后的 Map 类型不保证顺序

```java
// groupingBy 默认返回 HashMap，无序
// 需要有序时指定 LinkedHashMap
Map<String, List<User>> ordered = users.stream()
    .collect(Collectors.groupingBy(User::getDept, LinkedHashMap::new, Collectors.toList()));
```

### 陷阱 6：parallelStream + 不安全操作

```java
// ❌ 并行流下 ArrayList 非线程安全
List<User> result = new ArrayList<>();
users.parallelStream().filter(...).forEach(result::add);  // 可能丢数据！

// ✅ 用 collect
List<User> result = users.parallelStream()
    .filter(...)
    .toList();
```

---

# 附录

## A. Stream 操作全景图

```
创建 ───────────────────────────────────────────────────────────
  Collection.stream()   Arrays.stream()   Stream.of()
  Stream.iterate()      Stream.generate() IntStream.range()

中间操作（懒执行，返回新 Stream）───────────────────────────────────
  过滤：filter   distinct
  映射：map      flatMap       mapToInt/Long/Double
  截取：limit    skip
  排序：sorted
  窥视：peek

终结操作（触发执行）────────────────────────────────────────────────
  遍历：forEach
  收集：collect   toList   toArray
  归约：reduce    count    min    max
  匹配：anyMatch  allMatch  noneMatch
  查找：findFirst  findAny
```

## B. Collectors 速查

| Collectors 方法 | 作用 | 示例场景 |
|----------------|------|---------|
| `toList()` | 收集为 List | 基本收集 |
| `toSet()` | 收集为 Set | 去重收集 |
| `toMap()` | 收集为 Map | ID→对象映射 |
| `toUnmodifiableList()` | 不可变 List | Java 10+ |
| `joining()` | 拼接字符串 | 逗号分隔 |
| `groupingBy()` | 分组 | 按部门分组 |
| `partitioningBy()` | 二分区 | 及格/不及格 |
| `counting()` | 计数 | 每组数量 |
| `summingInt/Long/Double()` | 求和 | 每组总薪资 |
| `averagingInt/Long/Double()` | 平均值 | 每组平均年龄 |
| `maxBy()` / `minBy()` | 最值 | 每组最高分 |
| `summarizingInt/Long/Double()` | 统计摘要 | 一次拿全部统计 |
| `mapping()` | 先映射再收集 | 分组后只取名称 |
| `reducing()` | 自定义归约 | 复杂聚合 |
| `collectingAndThen()` | 收集后加工 | 不可变/四舍五入 |

## C. 方法引用速查

| 类型 | 写法 | 等价 Lambda |
|------|------|------------|
| 静态方法 | `Math::abs` | `x -> Math.abs(x)` |
| 实例方法（对象调用） | `System.out::println` | `x -> System.out.println(x)` |
| 实例方法（类调用） | `String::length` | `s -> s.length()` |
| 构造方法 | `User::new` | `() -> new User()` |
| 数组构造 | `int[]::new` | `n -> new int[n]` |

## D. 常见业务转换模板

```java
// 1. List<Entity> → List<VO>
List<UserVO> vos = users.stream()
    .map(u -> new UserVO(u.getId(), u.getName()))
    .toList();

// 2. List<Entity> → Map<ID, Entity>
Map<Long, User> map = users.stream()
    .collect(Collectors.toMap(User::getId, u -> u));

// 3. List<Entity> → Map<ID, 某属性>
Map<Long, String> idToName = users.stream()
    .collect(Collectors.toMap(User::getId, User::getName));

// 4. 按某属性分组
Map<String, List<User>> byDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept));

// 5. 分组 + 取每组的某属性列表
Map<String, List<String>> deptToNames = users.stream()
    .collect(Collectors.groupingBy(User::getDept,
             Collectors.mapping(User::getName, Collectors.toList())));

// 6. 分组 + 统计
Map<String, Long> deptToCount = users.stream()
    .collect(Collectors.groupingBy(User::getDept, Collectors.counting()));

// 7. 过滤 + 排序 + 分页
List<User> page = users.stream()
    .filter(u -> u.getAge() > 20)
    .sorted(Comparator.comparing(User::getAge).reversed())
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .toList();

// 8. 扁平化 + 去重
List<String> allTags = users.stream()
    .flatMap(u -> u.getTags().stream())
    .distinct()
    .toList();
```

---

> **学习建议**：先记住 `filter` → `map` → `collect` 这条主线，覆盖 80% 场景。`groupingBy` 是第二个必须掌握的。其余 API 用到时查表即可，不用死记。
