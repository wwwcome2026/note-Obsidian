# CodeBuddy Code Skills（技能系统）

Skills 是 CodeBuddy Code 的扩展能力系统，允许你创建专业的领域知识和工作流模板，让 AI 助手能够更专业地处理特定类型的任务。

## 什么是 Skills

Skills 类似于为 AI 助手提供的"专业培训"。通过 Skill，你可以：

- **封装专业知识**：将特定领域的最佳实践和操作流程封装成可复用的技能
- **提供工作流模板**：定义标准化的任务处理流程，提高工作效率
- **扩展 AI 能力**：让 AI 助手能够处理更专业、更复杂的任务
- **团队协作共享**：项目级 Skills 可以在团队成员间共享专业知识

## Skills vs Slash Commands

| 特性 | Skills | Slash Commands |
|-----|--------|----------------|
| **触发方式** | AI 模型自动识别并调用 | 用户手动输入命令 |
| **使用场景** | 专业领域任务处理 | 快捷操作和工作流 |
| **权限控制** | 支持工具白名单限制 | 无特殊权限控制 |
| **工作目录** | 支持自定义基础目录 | 使用当前工作目录 |
| **可见性** | 对用户透明，AI 自动决策 | 用户主动发起 |

简单来说：
- **Slash Commands** 是用户主动调用的快捷方式
- **Skills** 是 AI 根据任务需求自动选择的专业能力

## 创建 Skills

### 目录结构

Skills 通过在特定目录中创建 `SKILL.md` 文件来定义：

1. **项目级 Skills**：`.codebuddy/skills/`（项目根目录下）
2. **用户级 Skills**：`~/.codebuddy/skills/`（用户主目录下）

每个 Skill 一个独立的目录，包含 `SKILL.md` 文件：

```
.codebuddy/skills/
├── pdf/
│   └── SKILL.md
├── data-analysis/
│   └── SKILL.md
└── code-review/
    └── SKILL.md
```

### SKILL.md 格式

Skill 文件使用 Markdown 格式，支持 YAML Frontmatter 定义元数据：

```markdown
---
name: pdf
description: PDF 文档处理和转换专家
allowed-tools: Read, Write, Bash, WebFetch
---

你是一个 PDF 文档处理专家，擅长：
- 解析和提取 PDF 内容
- 转换 PDF 为其他格式
- 生成 PDF 报告

当用户需要处理 PDF 相关任务时，请使用以下工作流：
1. 首先检查 PDF 文件是否存在
2. 使用适当的工具提取内容
3. 根据需求进行处理
4. 生成结果报告

可用工具：
- pdftotext：提取文本内容
- pdfinfo：获取 PDF 信息
```

### Frontmatter 字段

| 字段 | 必填 | 说明 | 示例 |
|-----|------|------|------|
| `name` | 否 | Skill 名称，未指定时使用目录名 | `pdf` |
| `description` | 否 | Skill 描述，帮助 AI 理解何时使用 | `PDF 文档处理专家 (project)` |
| `allowed-tools` | 否 | 允许使用的工具白名单，逗号分隔 | `Read, Write, Bash` |
| `disable-model-invocation` | 否 | 设为 `true` 时，Skill 不会出现在 Skill 工具中，只能通过 `/skill-name` 手动触发 | `true` |
| `user-invocable` | 否 | 设为 `false` 时，Skill 从 `/` 菜单中隐藏，仅供 AI 内部调用，默认 `true` | `false` |
| `context` | 否 | 设为 `fork` 时，Skill 在独立的 subagent 上下文中执行 | `fork` |
| `agent` | 否 | 指定 subagent 类型，仅在 `context: fork` 时有效 | `Explore` |
| `model` | 否 | 指定 Skill 执行时使用的模型（仅 `context: fork` 时生效） | `claude-sonnet-4` |
| `hooks` | 否 | 在 SKILL.md 中声明 Skill 专属的 Hooks，仅 `context: fork` 时生效 | 见下文 |

## 变量占位符

SKILL.md 内容支持以下占位符，加载或执行时自动替换：

| 占位符 | 替换为 | 适用来源 |
|------|------|------|
| `${CODEBUDDY_PLUGIN_ROOT}` | 插件安装根目录 | 仅插件来源的 skill |
| `${CODEBUDDY_SKILL_DIR}` | 当前 SKILL.md 所在目录的绝对路径 | 所有来源 |
| `${CODEBUDDY_SESSION_ID}` | 当前会话 ID（运行时注入） | 所有来源 |
| `${MY_ENV_VAR}` 等大写环境变量 | `process.env.MY_ENV_VAR` 的值 | 所有来源 |
| `${MY_ENV_VAR:-默认值}` | 环境变量，缺失时使用默认值 | 所有来源 |

为与 Claude Code 保持兼容，`${CLAUDE_PLUGIN_ROOT}`、`${CLAUDE_SKILL_DIR}`、`${CLAUDE_SESSION_ID}` 也被识别为等价的别名。

示例：

```markdown
---
description: 带占位符的 skill 示例
---

读取脚本 @${CODEBUDDY_SKILL_DIR}/scripts/analyze.py 并使用密钥 ${MY_API_TOKEN:-dev-fallback} 执行。
当前会话标识：${CODEBUDDY_SESSION_ID}
```

## 执行 Shell 命令

Skills 支持在 SKILL.md 中使用 `` !`command` `` 语法内联执行 Shell 命令。当 Skill 被触发时，这些命令会被执行，输出结果会替换到 Skill 内容中供 AI 分析。

示例：

```markdown
---
description: 项目状态分析
---

### 当前工作目录

!`echo "CWD=$(pwd)"`

### Git 状态

!`git status --short`

### 最近提交

!`git log --oneline -5`

请基于以上信息分析项目当前状态。
```

支持的特性：

- **`$ARGUMENTS` 参数替换**：在 Shell 命令执行前，`$ARGUMENTS` 会被替换为用户传入的参数
- **`@file` 文件引用**：Shell 命令执行后，`@file` 引用会被处理并注入文件内容
- **错误隔离**：单个命令执行失败不会影响其他命令，失败的命令会被替换为空字符串

处理管道：`$ARGUMENTS` 替换 -> `` !`command` `` 执行 -> `@file` 引用处理

## Context Fork

`context: fork` 使 Skill 在隔离的子代理上下文中运行，不访问对话历史。

```yaml
---
name: deep-research
description: 深入研究某个主题
context: fork
agent: Explore
---

研究 $ARGUMENTS：
1. 使用 Glob 和 Grep 查找相关文件
2. 读取并分析代码
3. 总结发现并附加具体文件引用
```

### 可用 Agent 类型

| 类型 | 说明 |
|-----|------|
| `general-purpose` | 通用（默认） |
| `Explore` | 只读工具，优化代码库探索 |
| `Plan` | 规划和分析 |
| 自定义 | `.codebuddy/agents/` 中定义的 agent |

### 隐藏 Skill

`user-invocable: false` 使 Skill 从 `/` 菜单中隐藏，适用于：

- 背景知识类 Skill（如项目规范、编码标准）
- 仅供其他 Skill 或 AI 内部引用的辅助 Skill

```yaml
---
name: project-guidelines
description: 项目编码规范和最佳实践
user-invocable: false
---

# 项目编码规范

本项目遵循以下编码标准：
- 使用 TypeScript 严格模式
- 函数命名使用 camelCase
- 组件命名使用 PascalCase
```

这类 Skill 会被加载到 AI 的上下文中，但用户无法通过 `/` 菜单直接调用。

## 使用示例

### 示例 1：PDF 处理 Skill

```markdown
---
name: pdf
description: PDF 文档处理和转换专家
allowed-tools: Read, Write, Bash, WebFetch
---

# PDF 处理专家

你是一个专业的 PDF 文档处理专家。

## 核心能力
- 提取 PDF 文本内容
- 转换 PDF 为 Markdown、HTML 等格式
- 合并和拆分 PDF 文件
- 提取 PDF 元数据和书签

## 工作流程
1. 检查 PDF 文件是否存在并可访问
2. 使用 pdftotext 或 pdfinfo 获取基本信息
3. 根据任务类型选择合适的处理工具
4. 验证输出结果的完整性
```

### 示例 2：数据分析 Skill

```markdown
---
name: data-analysis
description: 数据分析和可视化专家
allowed-tools: Read, Write, Bash, WebFetch, NotebookEdit
---

# 数据分析专家

你是一个专业的数据分析师，擅长使用 Python 和相关工具进行数据分析。

## 核心能力
- 数据清洗和预处理
- 统计分析和建模
- 数据可视化
- 生成分析报告

## 工具库
- pandas：数据处理
- numpy：数值计算
- matplotlib/seaborn：可视化
- scikit-learn：机器学习
```

### 示例 3：代码审查 Skill

```markdown
---
name: code-review
description: 代码审查和质量检查专家
allowed-tools: Read, Grep, Bash, Edit
---

# 代码审查专家

你是一个经验丰富的代码审查者，遵循业界最佳实践。

## 审查重点
1. 代码质量（命名规范、复杂度、重复代码）
2. 安全性（SQL 注入、XSS、认证授权）
3. 性能（算法效率、资源使用、缓存策略）
4. 可维护性（注释、模块化、测试覆盖）

## 输出格式
- 优点：列出做得好的地方
- 问题：指出需要改进的地方
- 建议：提供具体的改进方案
```

## AI 如何选择 Skills

AI 根据以下因素决定是否调用 Skill：

1. **任务匹配度**：任务描述与 Skill description 的相关性
2. **工具需求**：任务所需工具是否在 allowed-tools 范围内
3. **上下文相关性**：当前对话上下文是否适合使用该 Skill
4. **Skill 来源**：项目级 Skills 优先于用户级 Skills

## 权限控制

### allowed-tools 白名单

通过 `allowed-tools` 字段限制 Skill 可以使用的工具：

```yaml
allowed-tools: Read, Write, Bash(git:*), Grep
```

支持的工具模式匹配：

- `Bash(git:*)` - 只允许 git 相关命令
- `Edit(src/**/*.ts)` - 只允许编辑特定路径文件

## 最佳实践

1. **清晰的 Skill 描述**

   ```yaml
   # 不好
   description: 处理文件

   # 好
   description: PDF 文档解析和转换专家，支持文本提取和格式转换 (project)
   ```

2. **详细的指令内容** - 提供核心能力说明、标准工作流程、可用工具列表、常见场景处理方法、输出格式要求

3. **合理的工具权限** - 只授予必需的工具权限

   ```yaml
   # 权限过大
   allowed-tools: Bash

   # 精确控制
   allowed-tools: Read, Write, Bash(git:status,git:diff), Grep
   ```

4. **组织 Skill 目录** - 按功能领域组织 Skills

   ```
   .codebuddy/skills/
   ├── document/
   │   ├── pdf/SKILL.md
   │   └── markdown/SKILL.md
   ├── data/
   │   ├── analysis/SKILL.md
   │   └── visualization/SKILL.md
   └── code/
       ├── review/SKILL.md
       └── refactor/SKILL.md
   ```

## 调试 Skills

使用 `/skills` 命令查看当前已加载的所有 Skills，面板会显示：

- **User skills**：用户级 Skills（`~/.codebuddy/skills/`）
- **Project skills**：项目级 Skills（`.codebuddy/skills/`）
- **Plugin skills**：插件提供的 Skills

每个 Skill 会显示名称和预估的 token 数量。

### 常见问题

**Q: Skill 没有被触发？**
- 检查 description 是否清晰描述了 Skill 的功能
- 确认任务描述与 Skill 能力匹配
- 验证 allowed-tools 是否包含所需工具

**Q: Skill 权限不足？**
- 检查 allowed-tools 配置
- 确认工具名称拼写正确
- 使用模式匹配精确控制权限

**Q: 项目级和用户级 Skill 冲突？**
- 项目级 Skills 优先级更高
- 使用不同的 name 避免冲突

---

*Skills - 让 AI 成为领域专家*
