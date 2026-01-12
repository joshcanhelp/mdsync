#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

print_info "Starting release process for v${VERSION}"

# Check if we're on main/master branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    print_error "Must be on main or master branch to release. Current branch: $BRANCH"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Check if already tagged
if git rev-parse "v${VERSION}" >/dev/null 2>&1; then
    print_error "Version v${VERSION} is already tagged. Please bump the version in package.json first."
    exit 1
fi

# Pull latest changes
print_info "Pulling latest changes..."
git pull origin "$BRANCH"

# Run tests
print_info "Running pre-commit..."
npm run pre-commit

# Build
print_info "Building project..."
npm run build

# Check if logged in to npm
print_info "Checking npm authentication..."
if ! npm whoami >/dev/null 2>&1; then
    print_error "Not logged in to npm. Run 'npm login' first."
    exit 1
fi

# Confirm release
echo ""
print_warning "About to release v${VERSION}"
echo "  - Branch: $BRANCH"
echo "  - Version: $VERSION"
echo "  - npm user: $(npm whoami)"
echo ""
read -p "Continue with release? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Release cancelled"
    exit 0
fi

# Create git tag
print_info "Creating git tag v${VERSION}..."
git tag -a "v${VERSION}" -m "Release v${VERSION}"

# Push tag to GitHub
print_info "Pushing tag to GitHub..."
git push origin "v${VERSION}"

# Publish to npm
print_info "Publishing to npm..."
npm publish --access=public

# Create GitHub release
print_info "Creating GitHub release..."
if command -v gh &> /dev/null; then
    # Generate release notes
    RELEASE_NOTES=$(cat <<EOF
Release v${VERSION}

## Installation

\`\`\`bash
npm install -g markdown-sync
\`\`\`

## What's Changed

See [CHANGELOG.md](https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/blob/main/CHANGELOG.md) for full details.
EOF
)

    gh release create "v${VERSION}" \
        --title "v${VERSION}" \
        --notes "$RELEASE_NOTES" \
        --verify-tag

    print_info "GitHub release created successfully"
else
    print_warning "GitHub CLI (gh) not found. Skipping GitHub release creation."
    print_warning "You can create the release manually at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases/new?tag=v${VERSION}"
fi

echo ""
print_info "🎉 Release v${VERSION} completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify npm package: https://www.npmjs.com/package/markdown-sync"
echo "  2. Verify GitHub release: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/releases"
echo "  3. Update CHANGELOG.md for next version"
echo ""
