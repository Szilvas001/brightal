#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  BRIGHTAL — napi biztonsági mentés
# ══════════════════════════════════════════════════════════════════
#  A data/ és a public/uploads/ tartalma PÓTOLHATATLAN:
#  ügyfélrendelések és a vásárlók által feltöltött fényképek.
#
#  Telepítés (root-ként):
#      cp /opt/brightal/deploy/backup.sh /usr/local/bin/brightal-backup
#      chmod +x /usr/local/bin/brightal-backup
#      crontab -e
#      # majd új sorként:
#      30 3 * * * /usr/local/bin/brightal-backup >> /var/log/brightal-backup.log 2>&1
#
#  Kézi futtatás / visszaállítás tesztje:
#      /usr/local/bin/brightal-backup
#      tar tzf /opt/backup/brightal-2026-08-24.tar.gz | head
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/brightal}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backup}"
KEEP_DAYS="${KEEP_DAYS:-14}"

# Opcionális távoli másolat (erősen ajánlott — a szerver is meghibásodhat).
# Állítsd be, ha van hova menteni, pl.:
#   REMOTE="user@masik-gep:/mentes/brightal"     (rsync/ssh)
REMOTE="${REMOTE:-}"

STAMP=$(date +%F)
ARCHIVE="$BACKUP_DIR/brightal-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%F %T')] Mentés indul: $ARCHIVE"

tar czf "$ARCHIVE" \
  -C "$APP_DIR" \
  data \
  public/uploads \
  .env

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "[$(date '+%F %T')] Kész: $ARCHIVE ($SIZE)"

# ---- épség-ellenőrzés: a sérült mentés rosszabb, mint a semmi ----
if ! tar tzf "$ARCHIVE" >/dev/null 2>&1; then
  echo "[$(date '+%F %T')] ✗ HIBA: a mentés sérült, törlöm!" >&2
  rm -f "$ARCHIVE"
  exit 1
fi
echo "[$(date '+%F %T')] ✔ A mentés épsége rendben."

# ---- távoli másolat ----
if [[ -n "$REMOTE" ]]; then
  echo "[$(date '+%F %T')] Másolás ide: $REMOTE"
  if rsync -az "$ARCHIVE" "$REMOTE"/; then
    echo "[$(date '+%F %T')] ✔ Távoli másolat kész."
  else
    echo "[$(date '+%F %T')] ✗ A távoli másolás nem sikerült!" >&2
  fi
fi

# ---- régiek törlése ----
DELETED=$(find "$BACKUP_DIR" -name 'brightal-*.tar.gz' -mtime +"$KEEP_DAYS" -print -delete | wc -l)
echo "[$(date '+%F %T')] Törölt régi mentés: $DELETED db (megőrzés: $KEEP_DAYS nap)"
echo
