#!/usr/bin/env bash
set -euo pipefail

# Publish all ShieldForge packages to NPM in dependency order.
#
# Usage:
#   ./scripts/publish.sh <version>        # e.g. ./scripts/publish.sh 1.2.0
#   ./scripts/publish.sh --dry-run 1.2.0  # preview what would be published
#
# Requires NPM_TOKEN in .env or environment.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DRY_RUN=false
VERSION=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      VERSION="$1"
      shift
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 [--dry-run] <version>"
  echo "  e.g. $0 1.2.0"
  echo "  e.g. $0 --dry-run 1.2.0"
  exit 1
fi

# Validate version format
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: Invalid version format '$VERSION'. Expected semver (e.g. 1.2.0 or 1.2.0-beta.1)"
  exit 1
fi

cd "$ROOT_DIR"

# Load NPM token from .env if not already in environment
if [[ -z "${NPM_TOKEN:-}" ]]; then
  if [[ -f .env ]]; then
    export NPM_TOKEN
    NPM_TOKEN=$(grep '^NPM_TOKEN=' .env | cut -d= -f2-)
  fi
fi

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "Error: NPM_TOKEN not found. Set it in .env or environment."
  exit 1
fi

# Configure npm auth
npm config set //registry.npmjs.org/:_authToken="$NPM_TOKEN"

# Verify authentication
echo "Verifying NPM authentication..."
NPM_USER=$(npm whoami 2>&1) || { echo "Error: NPM authentication failed. Check your token."; exit 1; }
echo "Authenticated as: $NPM_USER"

# Check for uncommitted changes
if [[ -n "$(git status --porcelain -- packages/ package.json package-lock.json)" ]]; then
  echo "Error: Uncommitted changes in packages/ or root config. Commit or stash first."
  git status --short -- packages/ package.json package-lock.json
  exit 1
fi

CURRENT_VERSION=$(node -p "require('./packages/types/package.json').version")
echo ""
echo "Current version: $CURRENT_VERSION"
echo "New version:     $VERSION"
echo ""

if [[ "$DRY_RUN" == true ]]; then
  echo "[DRY RUN] Would perform the following:"
  echo "  1. Bump all packages to $VERSION"
  echo "  2. Clean and rebuild all packages"
  if [[ "$VERSION" == *-* ]]; then
    DRY_LABEL="${VERSION#*-}"
    DRY_LABEL="${DRY_LABEL%%.*}"
    echo "  3. Publish in order: types → browser → core → graphql → passkey → react (tag: $DRY_LABEL)"
  else
    echo "  3. Publish in order: types → browser → core → graphql → passkey → react"
  fi
  echo "  4. Commit version bump and push"
  echo ""
  echo "Packages:"
  for pkg in types browser core graphql passkey react; do
    echo "  - @appforgeapps/shieldforge-$pkg"
  done
  exit 0
fi

# Bump versions
echo "Bumping all packages to $VERSION..."
npm version "$VERSION" --no-git-tag-version --workspaces

# Clean and rebuild
echo "Cleaning and rebuilding..."
npm run clean --workspaces --if-present
npm run build

# Publish in dependency order
PACKAGES=(types browser core graphql passkey react)

# Determine if this is a prerelease (contains a hyphen, e.g. 2.0.0-rc.1)
PUBLISH_TAG=""
if [[ "$VERSION" == *-* ]]; then
  # Extract the prerelease label (e.g. "rc" from "2.0.0-rc.1", "beta" from "1.0.0-beta.3")
  PRE_LABEL="${VERSION#*-}"     # rc.1
  PRE_LABEL="${PRE_LABEL%%.*}"  # rc
  PUBLISH_TAG="--tag $PRE_LABEL"
  echo "Pre-release detected: publishing with --tag $PRE_LABEL"
fi

echo ""
echo "Publishing packages..."
for pkg in "${PACKAGES[@]}"; do
  echo ""
  echo "--- Publishing @appforgeapps/shieldforge-$pkg@$VERSION ---"
  npm publish --workspace="@appforgeapps/shieldforge-$pkg" --access public $PUBLISH_TAG
done

echo ""
echo "All packages published successfully!"
echo ""

# Commit version bump
echo "Committing version bump..."
git add packages/*/package.json package-lock.json
git commit -m "chore: bump all packages to v$VERSION for NPM publish"
git push

echo ""
echo "Done! Published v$VERSION to NPM and pushed version bump to GitHub."
