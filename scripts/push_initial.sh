#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/push_initial.sh <git-remote-url>
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <git-remote-url>"
  exit 1
fi

REMOTE_URL="$1"

git init
git add .
git commit -m "chore: initial commit — MVP baseline"
git branch -M main
git remote add origin "$REMOTE_URL"
git push -u origin main

echo "Pushed to $REMOTE_URL (branch: main)"
