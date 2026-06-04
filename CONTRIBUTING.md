# 🤝 Contributing to MCP Server Hub

We love contributions! Here's how to get started.

## 🚀 Quick Start

```bash
git clone https://github.com/cosmicdk/mcp-server-hub.git
cd mcp-server-hub
pnpm install
pnpm build
```

## 📦 Adding a New Server

1. Copy the template:
```bash
cp -r packages/server-template packages/server-YOURNAME
```

2. Edit `package.json` with your server info
3. Implement tools in `src/index.ts`
4. Add to root README
5. Submit PR!

## 🧪 Testing

```bash
cd packages/server-YOURNAME
npx @modelcontextprotocol/inspector node dist/index.js
```

## 📐 Guidelines

- Use `@mcp-hub/shared` for response helpers
- Each tool should have clear `inputSchema`
- Handle errors with `error()` helper
- Prefer free APIs (no API keys required)
- Write in TypeScript

## 📄 License

By contributing, you agree that your contributions will be licensed under MIT.
