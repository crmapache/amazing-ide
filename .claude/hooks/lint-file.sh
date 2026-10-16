#!/usr/bin/env bash
#
# PostToolUse после Edit/Write/MultiEdit: форматирует изменённый файл и прогоняет по
# нему линтер. Нарушения уходят агенту сразу (exit 2), а не всплывают потом на
# `pnpm check`. Правила, которые здесь срабатывают, - границы частей приложения,
# размер файла, токены дизайн-системы, i18n (см. eslint.config.mjs, stylelint.config.mjs).

set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
FILE=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)

[ -n "$FILE" ] || exit 0
[ -f "$FILE" ] || exit 0

case "$FILE" in
  "$ROOT"/*) ;;
  *) exit 0 ;;
esac

case "$FILE" in
  */node_modules/* | */out/* | */dist/* | */.claude/*) exit 0 ;;
esac

BIN="$ROOT/node_modules/.bin"

# Зависимости не стоят - проверять нечем, молча пропускаем.
[ -x "$BIN/eslint" ] || exit 0

cd "$ROOT" || exit 0

case "$FILE" in
  *.ts | *.tsx | *.mjs | *.cjs | *.js | *.scss | *.css | *.json | *.md)
    "$BIN/prettier" --write --log-level silent "$FILE" >/dev/null 2>&1
    ;;
esac

case "$FILE" in
  *.ts | *.tsx | *.mjs | *.cjs | *.js)
    OUTPUT=$("$BIN/eslint" --no-warn-ignored "$FILE" 2>&1)
    STATUS=$?
    ;;
  *.scss | *.css)
    OUTPUT=$("$BIN/stylelint" "$FILE" 2>&1)
    STATUS=$?
    ;;
  *)
    exit 0
    ;;
esac

if [ "$STATUS" -ne 0 ]; then
  {
    echo "Линтер нашёл нарушения в ${FILE#"$ROOT"/}. Исправь до следующего шага -"
    echo "не отключай правило, а приведи код к нему (как - .claude/rules/)."
    echo "$OUTPUT"
  } >&2
  exit 2
fi

exit 0
