#!/usr/bin/env bash
# ============================================================
#  Adventshaus · verschollene Arbeit aus dem Postfach bergen
# ============================================================
set -uo pipefail

PROJ="${ADVENTS_PROJ:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
GIST="https://gist.githubusercontent.com/Chihuaua/f28cc85bf67f8a7f2fa6251a2092a33c/raw"
ARBEIT="/tmp/advents-bergung"
ZWEIG="ki/bergung-$(date '+%Y%m%d-%H%M')"

REIHENFOLGE=(
  "gruselhaus-welten.patch"
  "raumstation.patch"
  "orchester.patch"
  "raum02-korrektur.patch"
  "klavier-links.patch"
  "sax-sichtbar.patch"
  "namensregeln.patch"
)

farbig() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }
ok()     { printf '  \033[32mOK\033[0m    %s\n' "$*"; }
warn()   { printf '  \033[33m!\033[0m     %s\n' "$*"; }
ab()     { printf '\n\033[31mABBRUCH: %s\033[0m\n\n' "$*"; read -r -p "Enter …" _ || true; exit 1; }

cd "$PROJ" 2>/dev/null || ab "Projekt nicht gefunden: $PROJ"

echo "============================================"
echo "  ADVENTSHAUS · BERGUNG"
echo "  $(date '+%d.%m.%Y %H:%M')"
echo "============================================"

farbig "1/5  Ausgangszustand"
[ -z "$(git status --porcelain)" ] || ab "Arbeitsverzeichnis nicht sauber. Erst committen."
git fetch origin --quiet 2>/dev/null || warn "kein Netz – arbeite mit lokalem Stand"
git switch main --quiet 2>/dev/null || git switch -c main --quiet
git pull --ff-only --quiet 2>/dev/null || true
ok "auf main: $(git log --oneline -1 | cut -c1-50)"

farbig "2/5  Zweig anlegen"
git switch -c "$ZWEIG" --quiet || ab "Zweig $ZWEIG konnte nicht angelegt werden"
ok "$ZWEIG"

farbig "3/5  Patches holen"
rm -rf "$ARBEIT"; mkdir -p "$ARBEIT"
for p in "${REIHENFOLGE[@]}"; do
  if curl -fsSL "$GIST/$p" -o "$ARBEIT/$p" 2>/dev/null && [ -s "$ARBEIT/$p" ]; then
    ok "$(printf '%-26s %5s Zeilen' "$p" "$(wc -l < "$ARBEIT/$p")")"
  else
    warn "$p nicht gefunden – übersprungen"
  fi
done

farbig "4/5  Einspielen"
gelungen=0
uebersprungen=0
for p in "${REIHENFOLGE[@]}"; do
  [ -s "$ARBEIT/$p" ] || continue
  if git am --keep-non-patch "$ARBEIT/$p" >/dev/null 2>&1; then
    ok "$p"
    gelungen=$((gelungen + 1))
  elif git am --3way --keep-non-patch "$ARBEIT/$p" >/dev/null 2>&1; then
    ok "$p (mit 3way)"
    gelungen=$((gelungen + 1))
  else
    git am --abort 2>/dev/null
    warn "$p – Konflikt, übersprungen"
    uebersprungen=$((uebersprungen + 1))
  fi
done

echo
echo "  eingespielt : $gelungen"
echo "  übersprungen: $uebersprungen"

[ "$gelungen" -gt 0 ] || ab "Kein Patch passte. Stopp."

farbig "5/5  Prüfen"
if [ -d node_modules ]; then
  ./node_modules/.bin/tsc --noEmit 2>&1 | head -5
else
  warn "kein node_modules – bitte npm ci"
fi
bash "$PROJ/tools/check.sh" | tail -4

echo
echo "============================================"
echo "  BERGUNG ABGESCHLOSSEN"
echo "  Zweig : $ZWEIG"
echo "============================================"
echo
echo "Weitermachen:  npm run dev  -> im Browser prüfen"
echo "Aufgeben:      git switch main && git branch -D $ZWEIG"
echo
read -r -p "Enter zum Schließen …" _ || true
