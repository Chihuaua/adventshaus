#!/usr/bin/env bash
# ============================================================
#  Adventshaus · Regressionsprüfung
#  Liest docs/FEATURES.md und meldet alles, was fehlt.
#
#  Aufruf:  bash tools/check.sh
#  Exit 0 = alles da,  Exit 1 = etwas fehlt
# ============================================================
set -uo pipefail

PROJ="${ADVENTS_PROJ:-$HOME/projekte/adventshaus}"
FEATURES="docs/FEATURES.md"

cd "$PROJ" 2>/dev/null || { echo "FEHLER: $PROJ nicht gefunden"; exit 1; }
[ -f "$FEATURES" ] || { echo "FEHLER: $FEATURES nicht gefunden"; exit 1; }

fehlt=0
anzahl=0
offen=0

echo "============================================"
echo "  Adventshaus · Funktionsprüfung"
echo "  $(date '+%d.%m.%Y %H:%M')"
echo "============================================"
echo

while IFS= read -r zeile; do
  # Nur Zeilen mit genau zwei Pipe-Zeichen sind Einträge.
  # Alles andere (Prosa, Überschriften, Trennlinien) wird übersprungen.
  pipes=$(printf '%s' "$zeile" | tr -cd '|' | wc -c)
  [ "$pipes" -eq 2 ] || continue

  IFS='|' read -r name datei marker <<< "$zeile"
  name="${name// /}"
  [ -z "$name" ] && continue
  # Der Name muss ein einfacher Bezeichner sein (kein Markdown, kein Text).
  printf '%s' "$name" | grep -qE '^[a-z0-9_-]+$' || continue
  datei="${datei// /}"
  marker="${marker# }"

  anzahl=$((anzahl + 1))

  if [ ! -f "$datei" ]; then
    printf '  FEHLT  %-28s Datei nicht da: %s\n' "$name" "$datei"
    fehlt=$((fehlt + 1))
  elif grep -q "$marker" "$datei" 2>/dev/null; then
    printf '  OK     %s\n' "$name"
  else
    printf '  OFFEN  %-28s Marker: %s\n' "$name" "$marker"
    offen=$((offen + 1))
  fi
done < "$FEATURES"

echo
echo "--------------------------------------------"
printf 'Geprüft: %s   Fehlt: %s   Offen: %s\n' "$anzahl" "$fehlt" "$offen"
echo "--------------------------------------------"

if [ "$fehlt" -eq 0 ]; then
  echo "ALLES VORHANDEN ($offen Aufgabe(n) offen)"
  exit 0
else
  echo "REGRESSION – $fehlt Funktion(en) fehlen."
  echo "Nicht committen, nicht mergen. Erst klären."
  exit 1
fi
