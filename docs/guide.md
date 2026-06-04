# 📘 MCP Server Hub 文档

## 🎯 快速开始

### 安装所有服务器

```bash
npx mcp-server-hub install
```

### 单独使用

```bash
# 天气
npx @mcp-hub/server-weather

# 翻译
npx @mcp-hub/server-translator

# 文件管理
npx @mcp-hub/server-filesystem

# 数据库
npx @mcp-hub/server-database

# 网页搜索
npx @mcp-hub/server-web-search

# 时间日期
npx @mcp-hub/server-datetime

# 计算器
npx @mcp-hub/server-calculator

# 二维码
npx @mcp-hub/server-qrcode
```

## 🎮 Claude Desktop 配置

编辑 `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "@mcp-hub/server-weather"]
    },
    "translator": {
      "command": "npx",
      "args": ["-y", "@mcp-hub/server-translator"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@mcp-hub/server-filesystem"],
      "env": {
        "MCP_ALLOWED_DIRS": "/home/user:/tmp"
      }
    },
    "web-search": {
      "command": "npx",
      "args": ["-y", "@mcp-hub/server-web-search"]
    },
    "datetime": {
      "command": "npx",
      "args": ["-y", "@mcp-hub/server-datetime"]
    }
  }
}
```

## 🐳 Docker 部署

```bash
docker-compose up -d
```

## 🔐 安全

- `server-filesystem`: 默认仅允许 `$HOME` 和 `/tmp`，通过 `MCP_ALLOWED_DIRS` 扩展
- `server-database`: 默认只读模式，设置 `MCP_DB_READONLY=false` 启用写入
- 所有服务器通过 MCP stdio 通信，不暴露 HTTP 端口
