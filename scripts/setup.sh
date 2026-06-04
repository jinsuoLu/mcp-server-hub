#!/usr/bin/env bash
# MCP Server Hub - Setup Script
# Usage: bash scripts/setup.sh

set -e

echo "🎯 MCP Server Hub Setup"
echo "======================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js >= 18 required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Build
echo ""
echo "🔨 Building all packages..."
pnpm build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "  - Configure Claude Desktop: edit ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "  - Or run a server directly: cd packages/server-weather && pnpm start"
