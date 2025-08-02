# GitHub 仓库监控工具 🚀

一个**极简配置**的GitHub仓库监控工具，当您关注的项目有新的commits或releases时，会通过**桌面通知**即时提醒您，无需任何复杂的邮件配置！支持**个人仓库**和**组织级监控**，让您第一时间发现新项目！

## ✨ 核心特性

- 🔍 **智能监控** - 实时监控GitHub仓库的commits和releases
- 🏢 **组织监控** - 监控整个组织，发现新仓库时立即通知
- 🔔 **桌面通知** - 即时弹窗提醒，支持点击跳转到GitHub
- ⚡ **零配置** - 仅需GitHub Token即可使用，告别复杂邮件设置
- 🎯 **精准控制** - 可分别选择监控commits、releases或新仓库
- 💾 **状态管理** - 智能记录检查状态，避免重复通知
- 📊 **监控统计** - 实时显示API使用情况和监控数据
- 🔧 **高度可配置** - 支持自定义检查间隔、通知样式等

## 🚀 快速开始（3分钟上手）

### 第一步：安装依赖
```bash
npm install
```

### 第二步：配置GitHub Token
```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件（只需要设置一个必需项！）
nano .env
```

**最简配置** - 只需要一行配置：
```bash
GITHUB_TOKEN=your_github_token_here
```

> 💡 **获取GitHub Token**: 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)，创建一个新的token（不需要任何特殊权限）

**高级配置** - 可选的个性化设置：
```bash
CHECK_INTERVAL=30              # 检查间隔（分钟，默认30）
NOTIFICATION_ENABLED=true      # 启用桌面通知（默认true）
NOTIFICATION_SOUND=true        # 通知声音（默认true）
NOTIFICATION_TIMEOUT=10        # 通知显示时间（秒，默认10）
```

### 第三步：添加监控配置
编辑 `config/repos.json` 文件，添加您想要监控的仓库或组织：

```json
[
  {
    "owner": "microsoft",
    "repo": "vscode",
    "watchCommits": true,
    "watchReleases": true,
    "branch": "main",
    "description": "Microsoft Visual Studio Code"
  },
  {
    "owner": "QwenLM",
    "repo": "Qwen3",
    "watchCommits": false,
    "watchReleases": true,
    "branch": "main",
    "description": "只监控Qwen3的新版本发布"
  },
  {
    "type": "organization",
    "org": "deepseek-ai",
    "watchNewRepos": true,
    "watchCommits": false,
    "watchReleases": true,
    "excludeForks": true,
    "branch": "main",
    "description": "监控DeepSeek AI组织的新仓库和发布"
  }
]
```

### 第四步：启动监控 🎉

```bash
# 测试通知（推荐先测试一下）
npm start test-notification

# 手动检查一次
npm start check-now

# 启动定时监控 - 就这么简单！
npm start
```

🎊 **恭喜！** 现在您的GitHub监控已经启动，每当有新的commits、releases或新仓库时，您都会收到桌面通知！

## 📖 详细使用说明

### 🎛️ 仓库配置详解
`config/repos.json` 支持两种监控类型：

#### 📁 个人仓库监控
| 配置项 | 类型 | 必需 | 说明 | 示例 |
|--------|------|------|------|------|
| `owner` | String | ✅ | 仓库所有者（用户名或组织名） | `"microsoft"` |
| `repo` | String | ✅ | 仓库名称 | `"vscode"` |
| `watchCommits` | Boolean | ⭕ | 是否监控新commits | `true`（默认） |
| `watchReleases` | Boolean | ⭕ | 是否监控新releases | `true`（默认） |
| `branch` | String | ⭕ | 监控的分支名 | `"main"`（默认为仓库默认分支） |
| `description` | String | ⭕ | 仓库描述（用于日志显示） | `"My favorite project"` |

#### 🏢 组织监控
| 配置项 | 类型 | 必需 | 说明 | 示例 |
|--------|------|------|------|------|
| `type` | String | ✅ | 必须设置为 `"organization"` | `"organization"` |
| `org` | String | ✅ | 组织名称 | `"deepseek-ai"` |
| `watchNewRepos` | Boolean | ⭕ | 是否监控新仓库 | `true`（默认） |
| `watchCommits` | Boolean | ⭕ | 是否监控组织内仓库的commits | `false`（推荐，避免过多通知） |
| `watchReleases` | Boolean | ⭕ | 是否监控组织内仓库的releases | `true`（默认） |
| `excludeForks` | Boolean | ⭕ | 是否排除fork仓库 | `true`（默认） |
| `branch` | String | ⭕ | 监控组织内仓库的分支名 | `"main"`（默认为仓库默认分支） |
| `description` | String | ⭕ | 组织描述（用于日志显示） | `"Monitor DeepSeek for new repos"` |

### 💻 命令行工具

```bash
node index.js [command]
```

| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `start` | 启动定时监控（默认） | 日常使用，后台运行 |
| `test-notification` | 发送测试通知 | 验证通知功能是否正常 |
| `check-now` | 立即执行一次检查 | 手动触发检查 |

### ⚙️ 高级配置项

所有环境变量及其默认值：

```bash
# === 必需配置 ===
GITHUB_TOKEN=your_token_here

# === 监控配置 ===
CHECK_INTERVAL=30                    # 检查间隔（分钟）
LOG_LEVEL=info                       # 日志级别

# === 通知配置 ===
NOTIFICATION_ENABLED=true            # 启用桌面通知
NOTIFICATION_SOUND=true              # 通知声音
NOTIFICATION_TIMEOUT=10              # 通知显示时间（秒）
```

> 💡 **性能提示**: 建议将 `CHECK_INTERVAL` 设置为15-60分钟，避免频繁请求GitHub API

## 📁 项目结构

```
github-monitor/
├── 📂 src/                           # 核心源码
│   ├── 🔗 github-client.js          # GitHub API客户端
│   ├── 📢 notification-service.js   # 通知服务基类
│   ├── 🖥️  desktop-notifier.js       # 桌面通知实现
│   ├── 📧 email-service.js          # 邮件服务（已弃用）
│   ├── 👁️ monitor.js                # 核心监控逻辑
│   └── 🛠️ utils.js                  # 工具函数
├── 📂 config/
│   └── ⚙️ repos.json               # 监控仓库配置文件
├── 📄 .env.example                  # 环境变量配置模板
├── 💾 monitor-state.json            # 监控状态（自动生成）
├── 📦 package.json                  # 项目依赖配置
└── 🚀 index.js                     # 主程序入口
```

## 🛠️ 故障排除

### ❓ 常见问题

<details>
<summary><strong>🔔 桌面通知不显示</strong></summary>

**可能原因及解决方案：**
- ✅ 确保系统允许Node.js应用发送通知
- ✅ 检查 `NOTIFICATION_ENABLED=true` 
- ✅ Linux系统可能需要安装通知守护进程：`sudo apt install libnotify-bin`
- ✅ macOS用户需要在系统偏好设置中允许终端发送通知
- ✅ Windows用户确保开启了应用通知权限

**测试方法：** 运行 `npm start test-notification`
</details>

<details>
<summary><strong>🚫 GitHub API限制问题</strong></summary>

**症状：** 出现 "API rate limit exceeded" 错误

**解决方案：**
- ✅ 确保 `GITHUB_TOKEN` 有效且未过期
- ✅ 检查Token权限：访问 [GitHub Settings](https://github.com/settings/tokens)
- ✅ GitHub API限制：未认证用户每小时60次，认证用户5000次
- ✅ 调整 `CHECK_INTERVAL` 增加检查间隔
- ✅ 减少监控的仓库数量

**监控API使用：** 工具会自动显示剩余API次数
</details>

<details>
<summary><strong>🔍 找不到仓库或组织无权访问</strong></summary>

**检查清单：**
- ✅ 确认 `owner` 和 `repo` 名称正确（区分大小写）
- ✅ 确认组织名称 `org` 正确（区分大小写）
- ✅ 私有仓库需要Token有相应访问权限
- ✅ 组织可能限制了公开访问权限
- ✅ 仓库是否已被删除或改名
- ✅ 网络连接是否正常

**调试方法：** 运行 `npm start check-now` 查看详细错误信息
</details>

<details>
<summary><strong>🏢 组织监控相关问题</strong></summary>

**常见问题：**
- ✅ 组织名称必须使用正确的GitHub用户名格式（如 `deepseek-ai` 而不是 `DeepSeek AI`）
- ✅ 某些组织可能不公开其仓库列表
- ✅ 设置 `excludeForks: true` 可以减少通知噪音
- ✅ 建议将 `watchCommits: false` 避免过多的提交通知
- ✅ 首次运行会发现所有现有仓库，但不会发送通知

**性能优化：**
- ✅ 组织监控会消耗更多API配额
- ✅ 建议适当增加 `CHECK_INTERVAL` 间隔
- ✅ 可以通过 `excludeForks` 和 `watchCommits: false` 减少API调用
</details>

### 📊 监控日志

工具提供丰富的监控信息：

```
🚀 Starting GitHub Monitor...
📝 Configuration loaded:
  - GitHub token: ✓ Configured
  - Desktop notifications: ✓ Enabled
  - Check interval: 30 minutes

📚 Loaded 5 repositories and 1 organizations to monitor:
  1. microsoft/vscode - Microsoft Visual Studio Code
     Commits: ✓ | Releases: ✓
  O1. Organization: deepseek-ai - Monitor DeepSeek AI organization
     New Repos: ✓ | Commits: ❌ | Releases: ✓ | Exclude Forks: ✓

🔍 Starting monitor check at 2024-01-01 12:00:00
Checking 5 individual repositories and 1 organizations...

Checking repository: microsoft/vscode
✓ No new updates for microsoft/vscode

Checking organization: deepseek-ai
🆕 New repository found in deepseek-ai: deepseek-ai/DeepSeek-R1-Lite-Preview
✅ New repository notification sent for deepseek-ai/DeepSeek-R1-Lite-Preview

📊 Monitor check completed:
  - Individual repositories checked: 5
  - Organizations checked: 1
  - Repository updates found: 0
  - New repositories found: 1 (from 1 organizations)
  - Errors: 0
  - API rate limit: 4900/5000 remaining
```

---

## 🎯 为什么选择这个工具？

### 🆚 对比其他方案

| 特性 | 本工具 | GitHub邮件通知 | 第三方服务 |
|------|--------|----------------|------------|
| **配置难度** | ⭐ 极简（1个Token） | ⭐⭐⭐ 复杂邮件设置 | ⭐⭐⭐⭐ 需要注册账号 |
| **响应速度** | ⚡ 即时桌面通知 | 📧 邮件延迟 | 🐌 依赖外部服务 |
| **隐私安全** | 🔒 本地运行 | ❓ 邮件可能被拦截 | ❌ 数据上传到第三方 |
| **自定义程度** | 🎛️ 高度可配置 | ❌ 功能固定 | ⭕ 取决于服务商 |
| **费用** | 💰 完全免费 | 💰 免费但有限制 | 💸 可能收费 |

### 🌟 核心优势

- ✅ **零学习成本** - 3分钟即可上手使用
- ✅ **组织级监控** - 独有的组织新仓库发现功能
- ✅ **真正免费** - 无任何隐藏费用或限制  
- ✅ **隐私友好** - 所有数据都在您的本地设备
- ✅ **高度可靠** - 不依赖外部服务，避免服务中断
- ✅ **持续更新** - 开源项目，社区驱动的持续改进

### 🎯 典型使用场景

- 🔬 **技术研究者** - 监控AI公司（如DeepSeek、OpenAI）的新开源项目
- 👥 **开发团队** - 跟踪竞争对手或合作伙伴的技术动态
- 📚 **学习者** - 第一时间发现感兴趣领域的新项目和工具
- 🚀 **创业者** - 关注行业内的技术趋势和创新方向

---

## 📄 开源协议

本项目采用 **MIT License** 开源协议

- ✅ 商业使用
- ✅ 修改和分发  
- ✅ 私人使用
- ✅ 专利使用

**贡献欢迎！** 如果您有任何建议或发现了bug，欢迎提交Issue或Pull Request。

---

<div align="center">

**⭐ 如果这个工具对您有帮助，请给个Star支持一下！ ⭐**

Made with ❤️ for GitHub developers

</div>