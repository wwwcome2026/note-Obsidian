---
tags: [面试, Java, SpringBoot, SpringCloud, HTTP, OpenFeign, A2A, WebSocket]
更新日期: 2026-09-14
---

# HTTP、OpenFeign、A2A、WebSocket 面试要点

## 面试前 2 分钟速记

> [!summary] 先背这 12 句
> 1. HTTP 无状态，不等于短连接。
> 2. HTTP Keep-Alive 是连接复用，TCP Keepalive 是空闲探测。
> 3. HTTP/2 多路复用仍受 TCP 队头阻塞影响，HTTP/3 使用 QUIC 改善跨流阻塞。
> 4. 幂等看服务端效果，不看响应是否相同；超时不代表没执行。
> 5. `no-cache` 要验证，`no-store` 不存储；HTTPS 不代替业务授权。
> 6. Feign 是声明式 HTTP 客户端，动态代理把方法调用转换为 HTTP 请求。
> 7. 服务发现、负载均衡、熔断要有对应集成；Spring Cloud Feign 层默认不重试。
> 8. 熔断控制是否调用，降级决定失败后怎么办；写操作不能降级为假成功。
> 9. A2A 做智能体协作，MCP 做能力与上下文接入；HTTP / RPC 可承载 A2A。
> 10. A2A 的消息、任务、产物不同；网络连接结束不等于任务结束。
> 11. WebSocket 全双工，但心跳、重连、补发、幂等需要应用设计。
> 12. 粘性会话不等于集群广播；活动连接在本机，跨节点消息需要分发。

**回答套路：先定义 → 说流程 → 点关键机制 → 给一个边界或坑 → 补充 Java 项目落地。**

> [!tip] 阅读方式
> 第一遍先背开头的速记，再看各节「30 秒背诵」；第二遍用高频问答自测。配置示例说明思路，依赖版本需与项目 Spring Boot / Spring Cloud BOM 对齐，超时数值不是生产推荐值。

## 0. 先分清它们属于什么

| 技术 | 一句话定位 | Java 后端中的典型用途 |
| --- | --- | --- |
| HTTP | 请求—响应式应用层协议 | REST API、浏览器访问、服务调用 |
| OpenFeign | 声明式 HTTP 客户端 | 用 Java 接口调用其他服务的 HTTP API |
| A2A | 面向智能体之间协作的应用层协议 | 委派任务、跟踪执行、接收产物 |
| WebSocket | 长连接上的双向消息通信协议 | 聊天、实时通知、协同操作 |

**它们不在同一个分类维度：HTTP / WebSocket 是通信协议，OpenFeign 是客户端工具，A2A 定义智能体协作语义。可以组合使用。**

## 1. HTTP

**定义：HTTP 是以请求和响应交换资源表示及操作结果的、无状态的应用层协议。**

### 1.1 30 秒背诵

> [!important] 必背
> HTTP 无状态，但可以通过 Cookie、Session 或 Token 维持业务身份；无状态不等于短连接。HTTP/1.1 默认持久连接，HTTP/2 用二进制帧和流实现多路复用，但仍受 TCP 丢包阻塞影响；HTTP/3 基于 QUIC，减轻跨流的传输层队头阻塞。接口设计重点是方法语义、幂等、状态码和缓存；HTTPS 通过 TLS 提供机密性、完整性和身份认证。

### 1.2 原理与请求流程

```text
解析 URL → 查找可复用连接；需要时进行 DNS 解析和建连
→ HTTPS 执行 TLS 握手（HTTP/3 的 TLS 握手集成于 QUIC）
→ 发送方法、路径、请求头、请求体
→ 网关 / 过滤器 → Spring MVC Controller → Service
→ 返回状态码、响应头、响应体 → 处理缓存 / 复用连接
```

HTTP 的业务语义与底层版本分开理解：换成 HTTP/2 或 HTTP/3，GET、POST、状态码和缓存语义仍然存在。参考：[HTTP 语义标准](https://httpwg.org/specs/rfc9110.html)。

### 1.3 版本与长连接

| 版本 | 关键变化 | 面试易错点 |
| --- | --- | --- |
| HTTP/1.0 | 通常一次请求响应后关闭连接，也有持久连接扩展 | 不要说绝对不能复用连接 |
| HTTP/1.1 | 默认持久连接；文本报文；支持流水线 | 流水线响应需按序返回，实践中常用多条连接并行 |
| HTTP/2 | 二进制分帧、Stream、HPACK 头部压缩、多路复用 | 同一 TCP 连接上的丢包仍可能阻塞多个流 |
| HTTP/3 | HTTP 映射到 QUIC；QPACK 头部压缩 | QUIC 基于 UDP，但自身提供可靠传输、流控和拥塞控制 |

- **HTTP Keep-Alive**：复用连接，减少重复建连成本；HTTP/1.1 不必每次写 `Connection: keep-alive`，可用 `Connection: close` 表示关闭。
- **TCP Keepalive**：传输层空闲探测机制，和 HTTP 连接复用不是一回事。
- **HTTP/2 多路复用**：不同流的帧交错发送，解决 HTTP/1.x 响应按序带来的应用层阻塞；TCP 仍按字节有序交付。
- **HTTP/3 边界**：一条流丢包通常不会直接阻塞其他流的交付；本流、共享拥塞控制、资源竞争仍可能影响性能。不是“完全没有阻塞”。
- HTTP/2、HTTP/3 不使用 HTTP/1.1 的 `Connection` / `Keep-Alive` 等连接专用头。

参考：[HTTP/1.1](https://httpwg.org/specs/rfc9112.html)、[HTTP/2](https://httpwg.org/specs/rfc9113.html)、[HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html)。

### 1.4 方法、幂等、状态码

| 方法 | 语义 | 按标准语义是否幂等 |
| --- | --- | --- |
| GET / HEAD | 获取表示 / 只获取响应头 | 是；也属于安全方法 |
| PUT | 创建或整体替换目标资源状态 | 是 |
| DELETE | 删除目标资源 | 是；多次响应可以不同 |
| POST | 提交处理，常用于创建 | 不保证，可由业务实现幂等 |
| PATCH | 部分修改 | 不保证，取决于修改操作 |

**幂等 = 相同请求执行一次或多次，预期的服务端效果一致；不是响应一定一致。** 订单创建常用业务幂等键 + 唯一约束 + 原子状态更新；不能只靠“先查再插”，否则并发下仍可能重复。

| 状态码 | 应答要点 |
| --- | --- |
| 200 / 201 / 202 / 204 | 成功 / 已创建 / 已受理但未必完成 / 成功且无响应内容 |
| 301 / 302 / 307 / 308 | 永久 / 临时重定向；307、308 明确保留方法，301、302 有历史上的 POST 转 GET 行为 |
| 304 | 条件请求命中已有缓存，无需重传表示内容 |
| 400 / 401 / 403 / 404 | 请求错误 / 缺少有效认证 / 拒绝访问 / 未找到 |
| 405 / 409 / 415 / 429 | 方法不支持 / 状态冲突 / 媒体类型不支持 / 请求过多 |
| 500 / 502 / 503 / 504 | 服务内部异常 / 网关收到无效上游响应 / 暂不可用 / 网关等待上游超时 |

Spring 中用 `ResponseEntity` 控制状态和响应头，用 `@RestControllerAdvice` 统一异常映射；不要所有错误都返回 HTTP 200。参考：[HTTP 方法与状态码](https://httpwg.org/specs/rfc9110.html)。

### 1.5 缓存与 HTTPS

**缓存决策：** 有可用且新鲜的缓存 → 直接使用；需要验证 → 发条件请求 → 未修改返回 304，否则返回新的表示。

| 机制 | 要背的区别 |
| --- | --- |
| `Cache-Control: max-age=60` | 新鲜度有效期；共享缓存另有 `s-maxage` |
| `no-cache` | 可以存储，但复用前必须验证 |
| `no-store` | 不存储该请求 / 响应，不等于自动清除历史缓存 |
| `private` | 仅允许私有缓存，不允许共享缓存存储 |
| `ETag` + `If-None-Match` | 按实体标签验证；GET/HEAD 未变化可返回 304 |
| `Last-Modified` + `If-Modified-Since` | 按修改时间验证，精度与适用性不如实体标签灵活 |
| `Vary` | 声明哪些请求头影响缓存变体，例如 `Accept-Encoding` |

参考：[HTTP 缓存标准](https://httpwg.org/specs/rfc9111.html)。

**TLS 1.3 简化流程：** ClientHello 携带协商信息和密钥份额 → 服务端协商参数、提供证书及证明 → 客户端验证证书链与主机名 → 双方派生密钥并验证握手 → 使用对称加密保护应用数据。通常完整握手约 1 RTT；恢复连接可能使用 0-RTT，但早期数据有重放风险。不能把 TLS 1.3 背成“用 RSA 加密会话密钥”，也不能把握手 RTT 当作整个请求耗时。参考：[TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html)。

### 1.6 高频面试题

**Q1：HTTP 无状态，为什么还能登录？**  
A：协议不自动保存前后请求的业务上下文。应用可用 Cookie 携带 Session ID，服务端查会话；也可校验 Token。持久连接只解决连接复用。

**Q2：GET 比 POST 安全吗？**  
A：“安全方法”指语义上不请求修改状态，不指保密。GET 参数常出现在 URL 和日志里，POST 请求体也不是加密；传输保密靠 HTTPS，访问控制靠认证授权。

**Q3：DELETE 第一次 204、第二次 404，还是幂等吗？**  
A：是，目标资源最终都不存在。幂等看预期效果，不看每次状态码。

**Q4：HTTP/2 为什么还有队头阻塞？**  
A：流可以并行，但共享 TCP 有序字节流；丢失字节补齐前，后续收到的数据可能无法交付给上层。HTTP/3 将可靠交付隔离到各 QUIC 流。

**Q5：强缓存和协商缓存的区别？**  
A：前者在缓存可直接复用时不访问源站验证；后者携带验证条件访问服务端，没变则使用本地内容。`no-cache` 是要求验证，不是禁止缓存。

**Q6：HTTPS 能解决所有安全问题吗？**  
A：不能。它保护传输并认证通信端，不能代替权限校验、输入校验、防重放设计，也不能防止业务日志泄露。

### 1.7 场景与常见坑

- 普通查询、CRUD、开放接口优先考虑 HTTP API；持续双向交互可考虑 WebSocket。
- Java 客户端连接池等待、DNS、建连、读取、总调用时间是不同阶段，不能用一个超时解释全部耗时。
- 网关终止 TLS 时要确认内网链路是否也加密；浏览器显示 HTTPS 不代表端到端每一跳都加密。
- 重试写操作前先设计幂等；客户端超时不能证明服务端没有完成写入。

## 2. OpenFeign

**定义：OpenFeign 是将 Java 接口方法映射为 HTTP 请求的声明式客户端；Spring Cloud OpenFeign 提供 Spring 注解和服务治理集成。**

### 2.1 30 秒背诵

> [!important] 必背
> Feign 的本质是 HTTP 客户端封装：解析接口注解，创建动态代理，调用时组装请求、编码参数、执行 HTTP、解码响应。服务发现、负载均衡和熔断由相应组件配合实现。Spring Cloud OpenFeign 默认关闭 Feign 层重试，不能假定自带生效的熔断降级。远程调用超时后结果可能未知，重试必须考虑幂等。

### 2.2 核心流程与最小示例

```text
启动：@EnableFeignClients 扫描接口 → 注册客户端 Bean
      → Contract 解析注解 → 创建接口动态代理

调用：Java 方法 → InvocationHandler → 参数绑定 / Encoder
      → RequestInterceptor 补充请求头
      → 按服务名解析实例并负载均衡（使用服务名调用时）
      → 底层 HTTP Client → 远端 Controller
      → Decoder / ErrorDecoder → 返回结果或抛异常
```

```java
// 启动类配置 @EnableFeignClients；省略 import 和 DTO 定义
@FeignClient(name = "stock-service")
public interface StockClient {
    @GetMapping("/stocks/{skuId}")
    StockDTO getStock(@PathVariable("skuId") Long skuId);
}
// 业务类注入 StockClient 后调用 getStock(1001L)
```

代理通常基于 JDK 接口动态代理；`Contract` 解释注解，`Encoder/Decoder` 处理数据，`Client` 负责真正的网络通信。不是直接调用远端 JVM 对象，也不意味着所有请求必须用 JSON。参考：[OpenFeign 官方仓库](https://github.com/OpenFeign/feign)。

### 2.3 服务治理要点

| 机制 | 参考回答 |
| --- | --- |
| 服务发现 | 发现组件提供服务实例，常与 Eureka、Nacos 等集成；Nacos 需匹配的 Spring Cloud Alibaba 依赖 |
| 负载均衡 | Spring Cloud LoadBalancer 在候选实例中选择目标；相关依赖必须存在 |
| 固定 URL | 配置 `url` 时通常直接请求该地址，不走基于服务名的客户端实例选择；前方仍可有网关负载均衡 |
| 超时 | 区分连接与读取超时；连接池等待、TLS、总截止时间还需看底层客户端及外层配置 |
| 重试 | Spring Cloud 默认 `Retryer.NEVER_RETRY`；底层客户端、LoadBalancer、网关可能另有重试，需逐层检查 |
| 熔断 / 降级 | 熔断器决定是否放行调用；降级提供失败后的替代路径，两者不同 |

```yaml
# 按当前 Spring Cloud OpenFeign 配置形式；时间单位为毫秒
spring:
  cloud:
    openfeign:
      client:
        config:
          stock-service:
            connectTimeout: 1000
            readTimeout: 2000
      circuitbreaker:
        enabled: true
```

熔断还需要 Spring Cloud CircuitBreaker 及相应实现依赖，例如 Resilience4j。`fallback` 类要实现客户端接口并注册为 Spring Bean；`fallbackFactory` 可取得异常原因。上面的开关本身没有定义降级行为。参考：[Spring Cloud OpenFeign 官方说明](https://docs.spring.io/spring-cloud-openfeign/reference/spring-cloud-openfeign.html)。

### 2.4 高频面试题

**Q1：Feign 算 RPC 吗？**  
A：广义上，它让远程调用呈现为本地方法，可视为 RPC 风格；准确产品定位是声明式 HTTP 客户端，不是独立的网络协议。

**Q2：Feign 为什么不用写实现类？**  
A：框架解析接口和注解并创建动态代理，代理把方法名、参数与注解映射为 HTTP 请求。网络调用由底层客户端执行。

**Q3：Feign 默认使用 Ribbon、Hystrix 吗？**  
A：这是旧版本常见组合。现代 Spring Cloud 应围绕 LoadBalancer、CircuitBreaker 及 Resilience4j 等实际依赖回答，不能照搬旧教程。

**Q4：超时后自动重试是不是更可靠？**  
A：不一定。扣库存可能已成功，只是响应丢失；再次执行会重复扣减。要有幂等键、唯一约束、结果查询，并限制次数、退避和总时间预算。

**Q5：熔断和降级有什么区别？**  
A：熔断器通常有关闭、打开、半开状态，失败率等达到条件后拒绝调用，再有限探测恢复；降级是返回缓存、替代结果或明确失败。不能把扣款失败降级成“支付成功”。

**Q6：Controller 加了 `@Transactional`，Feign 调用就一起回滚吗？**  
A：不会。本地事务无法自动覆盖另一个服务的数据库事务。跨服务一致性要设计补偿、Saga、事务消息等方案，避免持有本地数据库锁等待慢调用。

### 2.5 与相似技术的区别

| 维度 | OpenFeign | Dubbo | gRPC |
| --- | --- | --- | --- |
| 定位 | 声明式 HTTP 客户端 | RPC 框架与服务治理体系 | 跨语言 RPC 框架 |
| 契约 | Java 接口和 HTTP 注解 | Java 接口或 IDL 等 | 通常用 `.proto` 定义服务与消息 |
| 通信 | 取决于底层 HTTP 客户端；不应说只支持 HTTP/1.1 | 支持 Dubbo、Triple 等协议 | 标准 gRPC 基于 HTTP/2，默认采用 Protobuf |
| 场景 | 已有 HTTP API、Spring Cloud 服务调用 | 需要 RPC 与配套治理的服务体系 | 跨语言、强契约、流式 RPC |

Dubbo 不应背成“只能 Java、只能私有 TCP 协议”；gRPC 也不等于“没有 HTTP”。性能取决于编码、连接、负载等，不能只按框架名排名。参考：[Dubbo 官方介绍](https://dubbo.apache.org/en/overview/what/)、[gRPC 官方介绍](https://grpc.io/docs/what-is-grpc/introduction/)。

**常见坑：** 多层重试放大流量；同步阻塞调用耗尽线程；拦截器无差别转发敏感请求头；完整日志泄露 Token；接口参数注解与服务端契约不一致。异步线程中的身份和链路信息要明确传播，不能假定 ThreadLocal 自动继承。

## 3. A2A（Agent-to-Agent）

**定义：A2A 是让不同实现的智能体发现彼此能力、交换消息、委派任务并获取执行结果的开放协议。**

### 3.1 30 秒背诵

> [!important] 必背
> A2A 解决智能体之间如何协作，核心对象是 Agent Card、Message、Task 和 Artifact。HTTP API 提供通用接口，RPC 提供远程调用方式，A2A 在其上统一任务和协作语义。MCP 主要标准化 AI 应用访问工具与上下文，A2A 主要标准化智能体之间委派工作；两者可组合，不是简单替代关系。

### 3.2 对象、流程、关键机制

| 对象 | 含义 | 好记的例子 |
| --- | --- | --- |
| Agent Card | 能力、接口与安全要求等描述 | “我会做库存分析，入口在这里” |
| Message / Part | 交互消息及文本、文件、结构化数据等内容 | “分析近 7 天缺货原因” |
| Task | 可跟踪、有状态的工作单元 | 某次分析任务及其状态 |
| Artifact | 任务生成的结果产物 | 分析报告、结果数据 |
| Context | 关联多轮交互的上下文 | 补充仓库范围后继续分析 |

```text
发现 / 获取 Agent Card → 确认可用能力、协议版本、绑定和认证要求
→ 发送消息 → 获得直接回复，或获得可跟踪的 Task
→ 查询状态 / 接收流式事件 / 使用支持的推送通知
→ 如需补充输入则继续交互 → 完成并获取 Artifact
```

状态可概括为：已提交、执行中、等待输入、完成、失败、取消等；不是固定的单向直线。**一次 HTTP 响应结束不代表任务结束；任务也可能需要多轮消息。** 参考：[A2A 核心概念](https://a2a-protocol.org/latest/topics/key-concepts/)。

规范提供 JSON-RPC over HTTP、gRPC、HTTP/REST 等绑定；HTTP 绑定可通过 SSE 传输流式事件。支持哪些能力要看 Agent Card，不能断言 A2A 只能使用 JSON-RPC 或必须用 WebSocket。常见能力发现路径是 `/.well-known/agent-card.json`。

> [!note] 版本提醒
> A2A 仍在演进。此处背诵对象与机制，不混用不同版本的接口名、字段或状态枚举；实现时以双方明确支持的规范版本和 SDK 为准。参考：[A2A 官方规范](https://a2a-protocol.org/latest/specification/)。

### 3.3 与 MCP、HTTP API、RPC 的关系

| 技术 | 核心问题 | 与 A2A 的关系 |
| --- | --- | --- |
| MCP | AI 应用怎样统一访问工具、资源、提示等能力 | 智能体内部可用 MCP 连接工具，再用 A2A 委派其他智能体 |
| HTTP API | 怎样通过方法、路径、状态码交换业务数据 | 可以承载 A2A；普通 API 不天然具备统一 Agent Card 和任务模型 |
| RPC | 怎样按远程方法调用组织通信 | A2A 可采用 RPC 绑定，并补充智能体任务语义 |
| A2A | 如何跨智能体发现能力、交互、跟踪工作和产物 | 关注协作契约，不暴露对方内部推理或实现细节 |

MCP 是 Host / Client / Server 架构，能力不只包括“函数工具”，还包括资源等上下文机制；不能用“支持流式 / 异步”作为 MCP 和 A2A 的绝对分界。参考：[MCP 架构](https://modelcontextprotocol.io/docs/learn/architecture)。

### 3.4 高频面试题

**Q1：已有 HTTP API，为什么还要 A2A？**  
A：API 能传数据，但不同团队可能各自定义能力描述、状态和结果格式。A2A 统一这些协作约定，减少跨智能体适配。简单固定查询用普通 API 就够了。

**Q2：A2A 和 MCP 怎么一起用？**  
A：订单智能体通过 A2A 委派库存分析智能体；后者通过 MCP 获取数据库或检索工具能力，完成后返回产物。一个偏协作，一个偏能力接入。

**Q3：A2A 就是两个大模型聊天吗？**  
A：不是。它定义软件智能体之间的消息、任务、产物与交互契约，不要求必须暴露大模型或内部推理，也不仅限于自然语言文本。

**Q4：请求超时，重新提交任务可以吗？**  
A：先确认任务是否已经创建或执行。工程上应保存任务标识与业务请求关联，查询状态、去重，再决定重试；不能假定协议保证所有操作恰好一次。

**Q5：流式连接断开，任务会取消吗？**  
A：不能这么推断。订阅连接和任务生命周期要分别管理；按任务标识查询或恢复订阅，需要取消时显式请求，且取消不一定成功。

**Q6：Spring Boot 怎样落地？**  
A：把业务执行逻辑包在兼容 A2A 的服务端适配层里：暴露能力描述、验证身份、持久化任务状态，再通过选定 SDK / 绑定收发消息。普通 `@RestController` 返回 JSON 不会自动变成 A2A。

### 3.5 适用场景与工程坑

- 适合跨团队、跨语言、跨厂商智能体的任务委派，特别是耗时、需跟踪或需补充输入的工作。
- 工程设计：长任务交给工作线程或队列，状态持久化；别让一个 Servlet 请求一直持有数据库事务等待模型。
- Agent Card 描述能力，不等于已获授权；检查租户、任务归属和回调权限。远端产物是外部数据，不能直接当成高权限指令执行。
- SSE / webhook 不等于可靠消息队列；根据业务补充恢复查询、去重和审计。远端文件 / 回调 URL 需要访问范围校验，避免 SSRF。

## 4. WebSocket

**定义：WebSocket 是在一条持续连接上，让客户端和服务端都能主动发送消息的全双工应用层协议。**

### 4.1 30 秒背诵

> [!important] 必背
> WebSocket 通常先通过 HTTP/1.1 Upgrade 握手，返回 101 后开始收发 WebSocket 帧。全双工表示双方都能独立主动发送。长连接仍可能断开，所以要设计心跳、超时检测、退避重连和消息补偿。集群里连接属于某个节点，粘性会话只帮助路由，跨节点推送还需要共享消息通道或用户路由。

### 4.2 握手与通信流程

```http
GET /ws HTTP/1.1
Host: example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

```text
建连（wss 先做 TLS）→ HTTP 握手并鉴权 → 校验握手响应
→ 双方收发文本 / 二进制 / 控制帧 → 心跳与业务处理
→ Close 关闭握手，或检测异常后清理连接
```

- `Sec-WebSocket-Accept` 由请求 Key 与协议常量计算，用于验证握手；**不是登录认证或消息加密**。
- 客户端发给服务端的帧必须掩码，服务端发出的帧不掩码；掩码不是加密，安全传输使用 `wss`。
- 101 Upgrade 是 HTTP/1.1 常见流程；HTTP/2、HTTP/3 有扩展 CONNECT 机制，不要说所有 WebSocket 都返回 101。

参考：[WebSocket 协议 RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html)。

### 4.3 心跳、重连与可靠性

| 机制 | 面试回答 |
| --- | --- |
| 心跳 | 定期探测对端，超时清理，并避免连接被中间层当成空闲连接回收；间隔结合代理超时和网络环境设置 |
| Ping / Pong | 协议级控制帧；浏览器 JavaScript API 不能直接发送协议 Ping，应用可另设计心跳消息 |
| 断线重连 | 指数退避 + 随机抖动 + 最大间隔 / 重试预算；恢复网络后再尝试，避免重连风暴 |
| 身份与订阅恢复 | 重连时重新认证并恢复订阅，不沿用已失效连接的状态 |
| 消息补偿 | 设计 messageId、序号、ACK、持久化及断点补拉；连接恢复不等于消息恢复 |
| 背压 | 限制发送队列；慢客户端可合并状态更新、丢弃可丢数据或断开，避免内存持续增长 |

以上恢复与可靠投递策略是应用设计，不能说 WebSocket 自动提供。业务成功最好由业务 ACK 确认，TCP 成功交付不代表业务已落库。

### 4.4 Spring Boot 与集群广播

Spring 支持原生 `WebSocketHandler`；需要目的地、订阅和消息映射时，可使用 STOMP over WebSocket，配合 `@MessageMapping`、`SimpMessagingTemplate`。**STOMP 是消息子协议，不等于 WebSocket。** 参考：[Spring WebSocket 支持](https://docs.spring.io/spring-framework/reference/web/websocket.html)。

```text
客户端甲 ──WebSocket── 节点 A（保存本地连接）
客户端乙 ──WebSocket── 节点 B（保存本地连接）
                         ↑
业务消息 → 共享 Broker / 发布订阅通道 → 目标节点 → 本地连接推送
```

- **连接归属**：已建立的连接固定在接入节点；不能把活动 socket 放进 Redis 后交给另一节点继续使用。
- **粘性会话**：影响初次建连、重连或某些 HTTP 回退请求的路由；它既不复制连接，也不实现全局广播。
- **广播方案**：各节点订阅共享通道，再转发给本地目标连接；也可维护“用户 → 节点”映射做定向路由。
- **消息通道语义**：Redis Pub/Sub 不保存离线消息；单一消费组通常是分摊消费，不天然广播给每个节点。需按场景选择订阅模型与持久化机制。
- **Spring STOMP**：内存 simple broker 适合简单场景；跨节点可使用支持 STOMP 的外部 broker relay，用户目的地路由还需相应配置。参考：[Spring 外部 Broker](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-broker-relay.html)。

### 4.5 高频面试题

**Q1：WebSocket 和 HTTP 长连接区别？**  
A：HTTP 持久连接主要复用底层连接，请求与响应仍有对应关系；WebSocket 建连后双方可以独立发送消息，不需要每条服务端消息都先有一次业务请求。

**Q2：为什么用了 TCP 还要心跳？**  
A：拔网线、NAT 超时等故障未必立即产生关闭通知，TCP 默认探测也未必满足业务时限。应用需要在可控时间内识别失活；应用心跳还能反映业务处理是否可达。

**Q3：如何保证消息不丢不重？**  
A：协议本身不保证业务层恰好一次。通常通过持久化 + ACK + 超时重发提高送达率，通过消息 ID、唯一约束和幂等消费控制重复效果，并提供断线补拉。

**Q4：负载均衡用了粘性会话，广播就正常了吗？**  
A：不会。用户可能连接在不同节点，本地内存只知道本机连接；还要通过共享消息通道或路由把消息交到目标节点。

**Q5：一个用户多设备在线怎么处理？**  
A：用户映射到连接集合，明确推送给全部设备还是特定会话；断开时按连接 ID 清理，不能误删其他设备或重连后的新连接。

**Q6：如何鉴权，有哪些安全坑？**  
A：握手识别身份，订阅和业务消息继续做授权。浏览器原生 WebSocket 构造器不能任意设置 Authorization 头，可按设计使用安全 Cookie 或短期票据；检查 Origin，避免把长期 Token 放 URL 泄露到日志。

### 4.6 与轮询、SSE、MQ 的区别

| 方案 | 通信形态 | 适用场景 / 边界 |
| --- | --- | --- |
| 普通轮询 | 周期发请求 | 实现简单，低频刷新；有空请求和延迟 |
| 长轮询 | 请求等待消息后返回，再发下一次 | 兼容 HTTP 设施；不断重建请求 |
| SSE | 一次 HTTP 响应持续推送事件 | 服务端单向进度 / 文本流；客户端上行另发请求 |
| WebSocket | 双方主动收发 | 聊天、协作、双向低延迟交互；连接治理成本较高 |
| MQ | 生产者 / 消费者经 Broker 传递消息 | 后端异步解耦；可与 WebSocket 组合，不是浏览器连接的直接替代 |

**常见坑：** 代理未转发升级头；网关空闲超时小于心跳间隔；高峰集中重连；无界发送队列；仅凭在线状态认定消息送达；以为扩容后旧连接会自动均衡迁移。
