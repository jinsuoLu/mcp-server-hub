# 🚀 部署到 Render

本项目支持通过 Render 一键部署所有 13 个 MCP 服务器。

## 📋 前置条件

1. 拥有 [Render](https://render.com/) 账号
2. 项目已推送到 GitHub/GitLab 仓库

## 🔧 一键部署

### 方法 1：使用 render.yaml (推荐)

Render 支持通过 `render.yaml` 配置文件自动部署多个服务。

1. **确保 `render.yaml` 在项目根目录**
2. 将代码推送到 GitHub/GitLab 仓库
3. 在 Render 控制台:
   - 点击 **New +** → **From Git Repository**
   - 选择你的仓库
   - Render 会自动检测 `render.yaml` 并部署所有服务

### 方法 2：手动部署单个服务

如需单独部署某个服务器：

1. 在 Render 控制台点击 **New +** → **Web Service**
2. 选择仓库
3. 设置：
   - **Environment**: Docker
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Command**: `node packages/server-<NAME>/dist/index.js`
   - **Plan**: Starter (免费版)

## ⚙️ 环境变量

各服务器支持的环境变量：

| 服务器 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| memory | `MCP_MEMORY_PATH` | `~/.mcp-memory.json` | 内存数据库路径 |
| database | `MCP_DB_PATH` | `:memory:` | SQLite 数据库路径 |
| filesystem | `MCP_ALLOWED_DIRS` | `/home:/tmp` | 允许访问的目录 |

## 🌐 访问服务

部署成功后，每个服务会获得一个 Render 域名：
- `https://mcp-server-weather.onrender.com`
- `https://mcp-server-memory.onrender.com`
- ...

## 📝 Claude Desktop 配置

部署完成后，更新你的 Claude Desktop 配置：

```json
{
  "mcpServers": {
    "memory": { 
      "command": "npx", 
      "args": ["-y", "@mcp-hub/server-memory"] 
    },
    "weather": { 
      "command": "npx", 
      "args": ["-y", "@mcp-hub/server-weather"] 
    }
  }
}
```

## ⚠️ 注意事项

1. **免费版限制**: Render Starter 计划每 15 分钟无请求会自动休眠
2. **数据持久化**: 免费版 `/tmp` 目录数据在容器重启后会丢失
3. **内存服务**: 建议使用外部 Redis 或升级到付费计划以保证数据持久化

## 📦 可用服务器

| 服务器 | 包名 | 工具数 |
|--------|------|:-----:|
| weather | @mcp-hub/server-weather | 3 |
| translator | @mcp-hub/server-translator | 3 |
| filesystem | @mcp-hub/server-filesystem | 5 |
| database | @mcp-hub/server-database | 4 |
| web-search | @mcp-hub/server-web-search | 4 |
| datetime | @mcp-hub/server-datetime | 5 |
| calculator | @mcp-hub/server-calculator | 3 |
| qrcode | @mcp-hub/server-qrcode | 3 |
| rss | @mcp-hub/server-rss | 2 |
| memory | @mcp-hub/server-memory | 10 |
| fetch | @mcp-hub/server-fetch | 3 |
| code-runner | @mcp-hub/server-code-runner | 3 |
| knowledge | @mcp-hub/server-knowledge | 7 |