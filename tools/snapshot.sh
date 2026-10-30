#!/usr/bin/env bash
# Adventshaus · Sicherung: prüfen, committen, pushen, taggen, spiegeln
set -uo pipefail
PROJ="${ADVENTS_PROJ:-$HOME/projekte/adventshaus}"
MIRROR="${ADVENTS_MIRROR:-$HOME/sicherung/adventshaus.git}"
farbig() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
ok()     { printf '\033[32m  OK   %s\033[0m\n' "$*"; }
warn()   { printf '\033[33m  !    %s\033[0m\n' "$*"; }
ab()     { printf '\n\033[31mABBRUCH: %s\033[0m\n\n' "$*"; read -r -p "Enter …" _ || true; exit 1; }
cd "$PROJ" 2>/dev/null || ab "Projektordner nicht gefunden: $PROJ"
echo "============================================"
echo "  ADVENTSHAUS · SICHERUNG"
echo "  $(date '+%d.%m.%Y %H:%M')"
echo "============================================"
farbig "1/6  Funktionsprüfung"
bash "$PROJ/tools/check.sh" | tail -5
[ "${PIPESTATUS[0]}" -eq 0 ] || ab "Funktionen fehlen. Erst klären, dann sichern."
ok "Alles vorhanden"
farbig "2/6  Stand mit GitHub"
git fetch origin --quiet 2>/dev/null || warn "kein Netz – lokaler Stand"
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main 2>/dev/null || git rev-parse HEAD)" ]; then
  ok "lokal = GitHub"
else
  git pull --ff-only || ab "Kein Vorwärts-Merge möglich. Bitte erst prüfen."
  ok "nachgezogen"
fi
farbig "3/6  Offene Änderungen"
if [ -z "$(git status --porcelain)" ]; then
  ok "nichts offen"
else
  git status --short
  git add -A
  git commit -m "Sicherung $(date '+%d.%m %H:%M')" >/dev/null || ab "Commit fehlgeschlagen"
  ok "committet: $(git log --oneline -1)"
fi
farbig "4/6  Push"
if git push -u origin HEAD >/dev/null 2>&1; then
  ok "auf GitHub"
elif [ "$(git branch --show-current)" = "main" ]; then
  warn "main ist geschützt – lege Zweig und Pull Request an"
  ZWEIG="ki/sicherung-$(date '+%Y%m%d-%H%M')"
  git switch -c "$ZWEIG" >/dev/null 2>&1
  git push -u origin "$ZWEIG" >/dev/null 2>&1 || ab "Push auf $ZWEIG fehlgeschlagen"
  if command -v gh >/dev/null 2>&1; then
    gh pr create --fill --base main >/dev/null 2>&1 && ok "Pull Request angelegt" || warn "PR nicht angelegt – bitte auf GitHub"
  else
    warn "gh fehlt – PR bitte auf GitHub anlegen"
  fi
  echo "  PR: https://github.com/Chihuaua/adventshaus/pull/new/$ZWEIG"
  git switch main >/dev/null 2>&1
else
  ab "Push fehlgeschlagen – Zweig geschützt?"
fi
farbig "5/6  Tag setzen"
TAG="v$(date '+%Y%m%d-%H%M')"
if git rev-parse "refs/tags/$TAG" >/dev/null 2>&1; then
  warn "Tag $TAG existiert schon"
else
  git tag -a "$TAG" -m "Sicherung $(date '+%d.%m.%Y %H:%M')"
  git push origin "$TAG" >/dev/null 2>&1 || warn "Tag-Push fehlgeschlagen"
  ok "Tag $TAG gesetzt"
fi
farbig "6/6  Lokale Sicherung"
if [ -d "$MIRROR" ]; then
  git -C "$MIRROR" fetch --all --prune --tags --force >/dev/null 2>&1 \
    && ok "Mirror aktualisiert" || warn "Mirror nicht aktualisiert"
else
  warn "Kein Mirror: $MIRROR"
fi
echo
echo "============================================"
echo "  FERTIG"
echo "  Commit : $(git log --oneline -1)"
echo "  Tag    : $TAG"
echo "  Zweig  : $(git branch --show-current)"
echo "============================================"
echo
read -r -p "Enter zum Schließen …" _ || true
