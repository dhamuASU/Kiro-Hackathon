#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | grep -oP '"path"\s*:\s*"([^"]+)"' | head -1 | sed 's/"path"\s*:\s*"//;s/"//')
case "$FILE" in *.ts|*.tsx) ;; *) exit 0 ;; esac
[ ! -f "$FILE" ] && exit 0
ISSUES=""
grep -n "console\.log" "$FILE" > /dev/null 2>&1 && ISSUES="${ISSUES}\n⚠️  console.log: $(grep -c "console\.log" "$FILE") occurrences"
grep -n ": any" "$FILE" > /dev/null 2>&1 && ISSUES="${ISSUES}\n⚠️  'any' type: $(grep -c ": any" "$FILE") occurrences"
grep -nP "(query|run|prepare)\s*\(\s*\`" "$FILE" > /dev/null 2>&1 && ISSUES="${ISSUES}\n🔴 Template literal in query — injection risk"
grep -n "dangerouslySetInnerHTML" "$FILE" > /dev/null 2>&1 && ISSUES="${ISSUES}\n🔴 dangerouslySetInnerHTML — XSS risk"
if [ -n "$ISSUES" ]; then echo "━━━ $(basename "$FILE") ━━━"; echo -e "$ISSUES"; echo "━━━━━━━━━━━━━━━━━━━━"; else echo "✅ $(basename "$FILE")"; fi
