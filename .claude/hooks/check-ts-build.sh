
#!/usr/bin/env bash
# .claude/hooks/check-ts-build.sh
# Runs on SubagentStop for frontend-ts-converter / backend-ts-converter.
# Blocks completion if tsc --noEmit fails, feeding the error back as the reason.
 
set -euo pipefail
 
# The hook receives JSON on stdin, including which subagent just stopped
# and the transcript. We only care about the two converter agents.
INPUT=$(cat)
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_type // empty')
 
case "$AGENT_NAME" in
  frontend-ts-converter) TARGET_DIR="frontend" ;;
  backend-ts-converter)  TARGET_DIR="backend" ;;
  *) exit 0 ;; # not a converter agent, don't interfere
esac
 
if [ ! -d "$TARGET_DIR" ]; then
  exit 0
fi
 
cd "$TARGET_DIR"
 
if ! OUTPUT=$(npx tsc --noEmit 2>&1); then
  # Block: Claude Code will feed this reason back to the agent to keep working
  echo "{\"decision\": \"block\", \"reason\": \"tsc --noEmit failed in $TARGET_DIR. Fix these errors before finishing:\n\n$OUTPUT\"}"
  exit 0
fi
 
exit 0
 
