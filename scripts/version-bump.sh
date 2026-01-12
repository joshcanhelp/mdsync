#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Get bump type
BUMP_TYPE=${1:-patch}

if [ "$BUMP_TYPE" != "patch" ] && [ "$BUMP_TYPE" != "minor" ] && [ "$BUMP_TYPE" != "major" ]; then
    echo "Usage: $0 [patch|minor|major]"
    echo ""
    echo "Examples:"
    echo "  $0 patch  # 0.1.0 -> 0.1.1"
    echo "  $0 minor  # 0.1.0 -> 0.2.0"
    echo "  $0 major  # 0.1.0 -> 1.0.0"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")

print_info "Current version: $CURRENT_VERSION"
print_info "Bump type: $BUMP_TYPE"

# Bump version
npm version "$BUMP_TYPE" --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

print_info "New version: $NEW_VERSION"
print_warning "Remember to commit the version bump before releasing:"
echo ""
echo "  git add package.json"
echo "  git commit -m \"Bump version to v${NEW_VERSION}\""
echo "  npm run release"
echo ""
