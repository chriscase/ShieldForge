#!/usr/bin/env bash
set -euo pipefail

# Publish @appforgeapps/shieldforge-realm INDEPENDENTLY of the six lockstep
# packages (see scripts/publish.sh). The realm package versions on its own line
# (0.x) so it never force-bumps consumers pinned to older shieldforge-* versions.
#
# Usage:
#   ./scripts/publish-realm.sh <version> [--tag <dist-tag>]   # e.g. 0.1.0
#   ./scripts/publish-realm.sh --dry-run <version>
#
# Requires NPM_TOKEN in .env or environment.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PKG="@appforgeapps/shieldforge-realm"

DRY_RUN=false
VERSION=""
TAG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --tag) TAG="$2"; shift 2 ;;
    *) VERSION="$1"; shift ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 [--dry-run] <version> [--tag <dist-tag>]"
  exit 1
fi
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo "Error: invalid semver '$VERSION'"
  exit 1
fi

cd "$ROOT_DIR"

if [[ "$DRY_RUN" == true ]]; then
  echo "[DRY RUN] Would bump $PKG to $VERSION, build + test it, then publish${TAG:+ --tag $TAG}."
  exit 0
fi

# Load NPM token
if [[ -z "${NPM_TOKEN:-}" && -f .env ]]; then
  NPM_TOKEN=$(grep '^NPM_TOKEN=' .env | cut -d= -f2-)
  export NPM_TOKEN
fi
[[ -n "${NPM_TOKEN:-}" ]] || { echo "Error: NPM_TOKEN not found. Set it in .env or environment."; exit 1; }
npm config set //registry.npmjs.org/:_authToken="$NPM_TOKEN"
npm whoami >/dev/null 2>&1 || { echo "Error: NPM authentication failed. Check your token."; exit 1; }

# Bump ONLY the realm package — never --workspaces (that would touch the six).
echo "Bumping $PKG to $VERSION..."
npm version "$VERSION" --no-git-tag-version --workspace="$PKG"

# Build + test before publishing (auth/crypto: a green test suite is the gate).
npm run build -w "$PKG"
npm run test -w "$PKG"

# Dist-tag: explicit --tag wins; else infer a prerelease label; else default latest.
if [[ -z "$TAG" && "$VERSION" == *-* ]]; then
  TAG="${VERSION#*-}"
  TAG="${TAG%%.*}"
fi
PUBLISH_TAG=""
[[ -n "$TAG" ]] && PUBLISH_TAG="--tag $TAG"

echo "Publishing $PKG@$VERSION${TAG:+ (tag: $TAG)}..."
npm publish --workspace="$PKG" --access public $PUBLISH_TAG

echo "Done. Published $PKG@$VERSION${TAG:+ (tag: $TAG)}."
echo "Remember to commit the realm package.json version bump."
