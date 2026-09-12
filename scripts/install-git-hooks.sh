#!/bin/bash
# Install git hooks for AngKorGit development

set -e

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 Installing git hooks..."

# Pre-commit hook: auto-format
cat > "$ROOT_DIR/$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Pre-commit hook: auto-format staged files

echo "🔍 Running pre-commit checks..."

# Run format on all files
echo "📝 Formatting code..."
bun x @biomejs/biome format --write .

# Re-add formatted files
git add -A

echo "✅ Pre-commit checks passed"
exit 0
EOF

chmod +x "$ROOT_DIR/$HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  - pre-commit: Auto-format with Biome"
