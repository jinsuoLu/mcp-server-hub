<h1 align="center">🎯 MCP Server Hub</h1>
<p align="center">
  <b>AI Agent 原生工具链 — 13 个服务器 · 50+ 工具</b><br>
  记忆 · 知识 · 搜索 · 代码 · 网络 · 存储 · 实用
</p>
<p align="center">
  <img src="https://img.shields.io/badge/version-4.0-purple" alt="v4">
  <img src="https://img.shields.io/badge/servers-13-orange" alt="13">
  <img src="https://img.shields.io/badge/tools-50+-blue" alt="50+">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT">
</p>

---

## 🧠 v4 核心能力升级

| 能力 | v3 | v4 | 增量 |
|------|:--:|:--:|------|
| 🧠 **Memory** | 基本 KV | **语义搜索** + 上下文检索 + 导出/导入 | 3 个新工具 |
| 🔍 **Search** | 网页搜索 | +**新闻搜索** + 站点内搜索 | 2 个新工具 |
| 📚 **Knowledge** | ❌ | **文档摄入 + 分块检索** (RAG-lite) | 🆕 7 个工具 |

## 📊 全部 13 个服务器

| # | 服务器 | 工具数 | AI 场景 |
|:--:|--------|:-----:|--------|
| 🧠 | **Memory v2** | 10 | "记住用户偏好" "搜索相关记忆" "导出备份" |
| 📚 | **Knowledge** | 7 | "上传 PDF 让我查" "这篇文档讲了什么" |
| 🔍 | **Web Search v2** | 4 | "搜新闻" "在 GitHub 搜项目" |
| 🌐 | **Fetch** | 3 | "调 API" "检查网站是否在线" |
| 🐍 | **Code Runner** | 3 | "跑段 Python 验证" |
| 🌤️ | **Weather** | 3 | "今天天气" |
| 🌍 | **Translator** | 3 | "翻译这段" |
| 📁 | **Filesystem** | 5 | "读文件" |
| 🗄️ | **Database** | 4 | "查 SQL" |
| 📅 | **DateTime** | 5 | "下周五几号" |
| 🔢 | **Calculator** | 3 | "算复利" |
| 📱 | **QR Code** | 3 | "生成二维码" |
| 📡 | **RSS** | 2 | "读 Hacker News" |

## ⚡ 使用

```bash
npx mcp-server-hub list     # 分类查看 13 个服务器
npx mcp-server-hub config   # 生成 Claude Desktop 配置
npx mcp-server-hub info memory  # 查看详情
```

## 🎮 Claude Desktop 推荐配置

```json
{
  "mcpServers": {
    "memory": { "command": "npx", "args": ["-y", "@mcp-hub/server-memory"] },
    "knowledge": { "command": "npx", "args": ["-y", "@mcp-hub/server-knowledge"] },
    "web-search": { "command": "npx", "args": ["-y", "@mcp-hub/server-web-search"] },
    "fetch": { "command": "npx", "args": ["-y", "@mcp-hub/server-fetch"] },
    "code-runner": { "command": "npx", "args": ["-y", "@mcp-hub/server-code-runner"] }
  }
}
```

## 🔥 AI 工作流示例

```
AI: memory_search(query="用户偏好")
→ 找到 [theme:dark, lang:zh, notifications:on]

AI: web_search.search_news(query="React 19")
→ 最新 React 19 新闻 5 条

AI: knowledge.ingest_text(title="React 19 Docs", content=...)
→ 文档已分块，可检索

AI: knowledge.retrieve(query="React 19 server components")
→ 相关分块 3 段，score 0.85
```

## 🤝 贡献

```bash
cp -r packages/server-template packages/server-YOURNAME
```

MIT © [cosmicdk](https://github.com/cosmicdk)

⭐ Star 支持我们持续给 AI 造工具！
