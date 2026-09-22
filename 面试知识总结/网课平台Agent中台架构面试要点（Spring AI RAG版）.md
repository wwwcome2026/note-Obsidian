---
tags: [面试, Agent中台, SpringAI, RAG, 鉴权, 限流]
更新日期: 2026-09-14
---

# 网课平台 Agent 中台架构面试要点（Spring AI RAG 版）

## 面试前 2 分钟速记

1. **业务场景**：传统网课售卖与讨论平台，增加购课、咨询、答疑、推荐和讨论助手。
2. **双网关**：业务网关处理业务接口；中台入口网关处理应用认证、AI 接口路由与限流。
3. **意图路由**：Python／LangGraph 根据问题和上下文选择 Agent，并保存任务状态。
4. **调用边界**：KnowledgeAgent 通过受控 HTTP 工具调用独立 Java／Spring Boot 教育 RAG 服务。
5. **文档入库**：DocumentReader → TokenTextSplitter → VectorStore.add → PgVectorStore。
6. **模型分工**：EmbeddingModel 生成向量，ChatModel 生成回答，ChatClient 组织调用。
7. **在线问答**：核验购课权限 → 带授权过滤检索 → QuestionAnswerAdvisor 补充上下文 → 生成答案。
8. **鉴权底线**：应用身份、用户身份、资源权限分别校验，付费资料在进入模型前过滤。
9. **限流范围**：控制请求频率、任务并发、模型用量与执行轮数，Embedding 和重试也计入预算。
10. **回答边界**：RAG 返回 answer／sources／usage；无依据就说明，Agent 不再凭空扩写。

## 30 秒项目口述

> 这个方案是在网课微服务项目上接入 Agent 中台。业务侧保留课程、交易、用户和讨论服务，中台用 Python 和 LangGraph 做意图路由与任务编排。学习答疑由 KnowledgeAgent 调用独立的 Spring AI RAG 服务，检索用户有权访问的讲义，再生成带来源的回答。入口做认证和限流，业务服务校验资源权限，同时控制模型费用和执行次数。

## 高频面试问答

### 1. 为什么 RAG 用 Spring AI，中台还保留 Python？

我把任务编排和知识问答拆成两个服务：Python 负责识别意图、选择 Agent 和管理任务；Java 负责课程资料入库、权限过滤和检索生成。这样课程权限可以对接现有 Spring 业务体系，RAG 也能独立调优和扩容。

KnowledgeAgent 把问题、可信身份上下文和任务标识交给 RAG 服务；后者返回答案、来源和用量。这个方案只替换 RAG 的技术实现，多智能体编排方式延续原设计。代价是增加一次跨服务调用，需要统一超时、错误码和链路标识。

### 2. 两层网关和意图路由怎么区分？

业务网关按路径把请求分发到课程、交易、讨论或 AIGC 接入服务；AIGC 再访问中台入口网关。中台网关验证调用应用、用户委托身份与可访问的 Agent，并执行限流和并发准入。

意图路由属于编排逻辑，例如订单问题交给购课助手，讲义问题交给学习答疑助手，帖子总结交给讨论助手。它只能从已授权的能力中选择，不能自行授予权限。Nacos 负责服务发现和配置，普通接口转发也不需要调用大模型。

### 3. Spring AI 如何把课程资料入库？

先用 DocumentReader 读取讲义或政策文档，再用 TokenTextSplitter 切成适合检索的片段，最后通过 VectorStore 写入。[Spring AI ETL 官方文档](https://docs.spring.io/spring-ai/reference/api/etl-pipeline.html)

本方案为每段补充课程编号、文档编号、章节、页码和版本等元数据。切分太碎会丢失上下文，太长又容易混入无关内容，面试时说明按章节结构和问答效果调整即可。更新讲义时按文档版本替换旧片段，避免新旧知识同时命中。

调用 VectorStore.add 后，由 PgVectorStore 使用配置的 EmbeddingModel 计算向量并保存，业务无需先手动生成一份相同向量。[PgVectorStore 官方文档](https://docs.spring.io/spring-ai/reference/api/vectordbs/pgvector.html)

### 4. 一次学习答疑的完整流程是什么？

以“这门课里事务传播是怎么讲的”为例：中台完成认证和限流，意图路由选中 KnowledgeAgent；工具执行器调用教育 RAG 服务，服务端查询购课权限并生成受约束的 SearchRequest。

随后 ChatClient 配合 QuestionAnswerAdvisor 检索相关片段，把上下文交给 ChatModel 生成回答。SearchRequest 可设置返回数量、相似度阈值与元数据过滤。[Spring AI RAG 官方文档](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)

本方案由 RAG 服务组装并校验 sources，连同 answer、usage 返回。外层 Agent 展示结果或合并其他已验证的业务结果，不再重新生成一段没有证据的知识回答。若问题缺少课程范围，先追问再检索。

### 5. ChatModel、EmbeddingModel、Pgvector、MySQL 各做什么？

| 组件 | 面试回答 |
|---|---|
| ChatModel | 根据问题和检索上下文生成自然语言答案 |
| ChatClient | 组织提示词、Advisor 和模型调用，支持普通或流式返回 |
| EmbeddingModel | 将文本转换为向量，用于语义相似度检索 |
| PostgreSQL＋pgvector | 保存知识片段、元数据及向量，支持相似度搜索 |
| 业务 MySQL | 保存课程、订单、购课关系、讨论等业务事实 |

ChatClient 是调用层的封装；EmbeddingModel 主要提供向量表示。[ChatClient 官方文档](https://docs.spring.io/spring-ai/reference/api/chatclient.html)、[EmbeddingModel 官方文档](https://docs.spring.io/spring-ai/reference/api/embeddings.html)

我会让文档和问题使用兼容的向量模型与维度，变更模型时评估重建索引。价格、订单状态、退款结果仍查业务接口，不能让知识库中的旧文字替代实时业务事实。

### 6. 怎么避免没买课的人读取付费讲义？

应用认证确认哪个系统在调用；用户认证确认代表哪个用户；资源授权确认这个用户能读哪些课程资料。服务端依据经过验证的用户身份查询可信购课关系，再把允许访问的课程范围写入检索条件。

用户提交的课程编号只能缩小授权范围，不能覆盖授权约束；空权限直接拒绝，不能退化为全库搜索。返回片段、引用链接和后续下载也要校验权限。缓存键包含用户授权范围，权限失效后不能继续复用旧答案。

这些是本方案的业务控制。Advisor 提供检索能力，并不自动完成课程授权；提示词中的“不要泄露”也不能代替服务端校验。

### 7. 为什么网关限流还不够？

一次用户请求可能触发意图识别、多个工具、一次 RAG 检索生成以及重试。只限制入口请求数，无法控制内部实际成本。

我会在入口按应用、用户和接口限速，限制活跃任务与流式连接；在执行层限制工具次数、子 Agent 并发和任务轮数；在模型层控制请求次数、Token 配额和总预算。Redis 共享入口限流状态，避免多个实例各算一份。

额度统计覆盖编排模型、RAG 的 Chat 与 Embedding 调用，以及每次重试。实时查询和离线文档入库分开排队与记账，防止批量入库挤占在线问答资源。超限时拒绝或排队，不能无限重试。

### 8. A2A、工具调用与 RAG 是什么关系？

A2A 用于与独立 Agent 交互，描述能力并交换任务与结果；工具调用用于执行明确能力，例如查订单或访问教育 RAG 接口。模型提出调用请求，执行器校验参数和权限后实际执行。

本版 KnowledgeAgent 通过 HTTP 工具接入 RAG，RAG 服务本身不必实现 A2A。课程、交易和讨论操作也走业务服务，由服务端执行业务授权；创建订单等写操作通过业务幂等键和唯一约束防止重复执行。

### 9. 没有命中、引用错误和幻觉怎么处理？

检索为空或依据不足时，服务明确返回“当前资料不足以回答”，引导补充课程或问题，必要时转人工。本方案需要显式实现该路径，不能假定 QuestionAnswerAdvisor 自动保证无命中拒答。

来源从实际命中的片段元数据组装，并验证文档、页码和访问权限；模型生成的引用编号只能指向这些来源。评测时分别检查检索是否找到正确资料、答案是否有依据、引用是否一致，以及是否出现越权。

重排序属于可选优化；后续需要查询改写或文档后处理时，可评估 RetrievalAugmentationAdvisor，不把它当作本版必经流程。[Spring AI 模块化 RAG 官方文档](https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html)

### 10. 如何排查慢请求，面试时怎么说效果？

用同一个任务标识串起网关、意图路由、Agent、RAG 和模型调用，区分耗时来自权限查询、向量检索还是模型生成。流式返回关注首字延迟与完成耗时，也记录取消、超时和失败原因。

效果用一组固定课程问题评估，关注有依据的回答比例、正确引用、越权用例和单次成本。这是一版学习与讲解方案，面试表述应对应实际完成的部分，不编造上线规模、成功率或性能提升。

## 架构图

> [!info]- 展开查看 Spring AI RAG 版架构图
> ![[网课平台Agent中台架构图（Spring AI RAG版）.png]]

## 关联笔记

- 原版：[[网课平台Agent中台架构面试要点]]
- 本版重点：Java 教育 RAG 独立服务、授权后检索、Spring AI 组件分工与全链路预算。
- 复习顺序：先背速记，再口述请求链，最后练习权限、限流和无依据处理，喵。
