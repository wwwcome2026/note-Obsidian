# Mermaid 语法速查

## 流程图 (Flowchart)

```mermaid
flowchart TD
    A[方框] --> B{菱形判断}
    B -->|是| C((圆形))
    B -->|否| D[/平行四边形/]
    C --> E[[子程序]]
    D --> F[(数据库)]
```

### 方向

| 关键字 | 方向 |
|--------|------|
| `TB` / `TD` | 从上到下 |
| `BT` | 从下到上 |
| `LR` | 从左到右 |
| `RL` | 从右到左 |

### 节点形状

| 语法 | 形状 |
|------|------|
| `A[文本]` | 方框 |
| `A(文本)` | 圆角矩形 |
| `A((文本))` | 圆形 |
| `A{文本}` | 菱形 |
| `A[/文本/]` | 平行四边形 |
| `A[\文本\]` | 反向平行四边形 |
| `A[[文本]]` | 子程序 |
| `A[(文本)]` | 数据库圆柱 |
| `A>文本]` | 旗帜 |
| `A{{文本}}` | 六边形 |

### 连线样式

| 语法 | 样式 |
|------|------|
| `A --> B` | 实线箭头 |
| `A --- B` | 实线无箭头 |
| `A -.- B` | 虚线无箭头 |
| `A -.-> B` | 虚线箭头 |
| `A ==> B` | 粗线箭头 |
| `A --文本--> B` | 带标签实线 |
| `A -.文本.-> B` | 带标签虚线 |
| `A ==文本==> B` | 带标签粗线 |

### 子图

```mermaid
flowchart LR
    subgraph 子图名称
        A --> B
    end
    B --> C
```

---

## 序列图 (Sequence Diagram)

```mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: 同步消息
    B-->>A: 返回消息
    A-)B: 异步消息
    B--)A: 异步返回
```

### 消息类型

| 语法 | 样式 |
|------|------|
| `->` | 实线无箭头 |
| `->>` | 实线箭头 |
| `-->>` | 虚线箭头 |
| `--)` | 开放箭头(异步) |
| `--)` | 虚线开放箭头 |
| `-x` | 叉号(阻止) |

### 高级用法

```mermaid
sequenceDiagram
    loop 每分钟
        A->>B: 心跳
    end

    alt 条件1
        A->>B: 操作1
    else 条件2
        A->>B: 操作2
    end

    opt 可选
        A->>B: 额外操作
    end

    Note over A,B: 跨参与者的注释
    Note right of A: 右侧注释

    activate A
    A->>B: 请求
    deactivate A
```

---

## 类图 (Class Diagram)

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
        -internalMethod() void
        #protectedMethod() void
    }

    class Dog {
        +fetch() void
    }

    Animal <|-- Dog : 继承
    Animal o-- Color : 聚合
    Animal *-- Leg : 组合
    Animal ..> Vet : 依赖
    Animal ..|> IAnimal : 实现
```

### 关系

| 语法 | 关系 |
|------|------|
| `<\|--` | 继承 |
| `*\--` | 组合 |
| `o--` | 聚合 |
| `-->` | 关联 |
| `-->` | 依赖 |
| `..\|>` | 实现 |
| `--` | 链接(实线) |
| `..` | 链接(虚线) |

### 可见性

| 符号 | 含义 |
|------|------|
| `+` | public |
| `-` | private |
| `#` | protected |
| `~` | package/internal |

---

## 状态图 (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中 : 开始处理
    处理中 --> 已完成 : 成功
    处理中 --> 已失败 : 失败
    已失败 --> 待处理 : 重试
    已完成 --> [*]

    state 处理中 {
        [*] --> 验证
        验证 --> 执行
        执行 --> [*]
    }
```

---

## ER 图 (Entity Relationship)

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : "下单"
    ORDER ||--|{ LINE_ITEM : "包含"
    CUSTOMER {
        string name
        string email PK
    }
    ORDER {
        int id PK
        date created
        string status
    }
    LINE_ITEM {
        int quantity
        float price
    }
```

### 关系基数

| 语法 | 含义 |
|------|------|
| `\|\|--\|{` | 一对一 |
| `\|\|--o{` | 一对零或多 |
| `\|\|--\|{` | 一对一或多 |
| `o{--o{` | 零或多对零或多 |

---

## 甘特图 (Gantt)

```mermaid
gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section 阶段1
    需求分析     :a1, 2024-01-01, 10d
    系统设计     :after a1, 5d

    section 阶段2
    开发         :2024-01-16, 15d
    测试         :2024-02-01, 10d

    section 里程碑
    发布         :milestone, 2024-02-10, 0d
```

### 任务状态

| 语法 | 状态 |
|------|------|
| `:active,` | 活跃 |
| `:done,` | 完成 |
| `:crit,` | 关键 |

---

## 饼图 (Pie)

```mermaid
pie title 技术栈分布
    "Java" : 40
    "Python" : 25
    "Go" : 20
    "Rust" : 15
```

---

## 思维导图 (Mindmap)

```mermaid
mindmap
  root((中心主题))
    分支1
      子分支1-1
      子分支1-2
    分支2
      子分支2-1
      子分支2-2
    分支3
```

---

## Git 图 (Gitgraph)

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

---

## 用户旅程图 (Journey)

```mermaid
journey
    title 用户购物体验
    section 浏览
      打开首页: 5: 用户
      搜索商品: 4: 用户
    section 下单
      加入购物车: 4: 用户
      提交订单: 3: 用户, 系统
    section 收货
      等待配送: 2: 用户
      确认收货: 5: 用户
```

> 分数 1-5 表示满意度，1 最低，5 最高

---

## 通用技巧

- **特殊字符**: 用引号包裹含特殊字符的文本 `"A --> B"`
- **HTML 实体**: 支持 `&nbsp;`, `&amp;`, `&lt;` 等
- **样式**: 使用 `style A fill:#f9f,stroke:#333` 自定义节点样式
- **classDef**: `classDef className fill:#f9f,stroke:#333` 定义可复用样式类
- **注释**: `%% 这是注释`
