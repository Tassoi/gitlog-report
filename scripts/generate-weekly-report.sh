#!/usr/bin/env bash
set -euo pipefail

WORKDIR="$(cd "$(dirname "$0")/.." && pwd)"
REPORT_FILE="${REPORT_FILE:-tmp/report-weekly.md}"
CONFIG_FILE="${CONFIG_FILE:-config.cli.json}"
FROM_DATE="${RANGE_FROM:-$(date -v-7d +%Y-%m-%d)}"
TO_DATE="${RANGE_TO:-$(date +%Y-%m-%d)}"

mkdir -p "$(dirname "$REPORT_FILE")"

REPO_PATHS="${REPO_PATHS:-${TARGET_REPO_PATH:-$WORKDIR}}"

args=()
for repo in $REPO_PATHS; do
  args+=(--repo "$repo")
done

cargo run --quiet --manifest-path "$WORKDIR/src-tauri/Cargo.toml" --bin report-cli -- \
  "${args[@]}" \
  --from "$FROM_DATE" \
  --to "$TO_DATE" \
  --type weekly \
  --output "$REPORT_FILE" \
  --config "$CONFIG_FILE"
