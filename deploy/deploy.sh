#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  BRIGHTAL — frissítés élesben
# ══════════════════════════════════════════════════════════════════
#  Használat a szerveren (root-ként):
#      /opt/brightal/deploy/deploy.sh
#
#  Mit csinál:
#    1. biztonsági mentést készít (adat + feltöltések + .env)
#    2. lehúzza a legfrissebb kódot a git repóból
#    3. telepíti a függőségeket és legyártja a frontendet
#    4. újraindítja a szolgáltatást
#    5. ellenőrzi, hogy tényleg fut-e — ha nem, VISSZAÁLL az előző
#       verzióra és újraindítja
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/brightal}"
APP_USER="${APP_USER:-brightal}"
SERVICE="${SERVICE:-brightal}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backup}"

log()  { printf '\n\033[1;33m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m  ✔ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m  ✗ %s\033[0m\n' "$*" >&2; }

if [[ $EUID -ne 0 ]]; then
  fail "Root jogosultság kell. Futtasd: sudo $0"
  exit 1
fi

cd "$APP_DIR"
umask 077
if [[ -n "$(sudo -u "$APP_USER" git status --porcelain)" ]]; then
  fail "Nem tiszta a munkafa; mentsd a helyi kódváltozásokat frissítés előtt."
  exit 1
fi
BRANCH=$(sudo -u "$APP_USER" git symbolic-ref --short HEAD)
sudo -u "$APP_USER" git fetch origin "$BRANCH" --quiet
sudo -u "$APP_USER" git merge-base --is-ancestor HEAD "origin/$BRANCH" || {
  fail "A helyi ág eltér a GitHub ágtól; automatikus felülírás nem történik."
  exit 1
}

# ---------- 1. mentés ----------
log "Biztonsági mentés"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%F-%H%M%S)
systemctl stop "$SERVICE"
trap 'systemctl start "$SERVICE"' EXIT
tar czf "$BACKUP_DIR/pre-deploy-$STAMP.tar.gz" -C "$APP_DIR" data public/uploads .env
tar tzf "$BACKUP_DIR/pre-deploy-$STAMP.tar.gz" >/dev/null
ok "Mentés: $BACKUP_DIR/pre-deploy-$STAMP.tar.gz"

PREV_COMMIT=$(sudo -u "$APP_USER" git rev-parse HEAD)
ok "Jelenlegi verzió: ${PREV_COMMIT:0:8}"

# ---------- 2. kód ----------
log "Kód frissítése"
rollback() {
  trap - ERR
  fail "Frissítés sikertelen; korábbi kód visszaállítása: $PREV_COMMIT"
  sudo -u "$APP_USER" git checkout -B "$BRANCH" "$PREV_COMMIT"
  sudo -u "$APP_USER" npm ci --include=dev --no-audit --no-fund
  sudo -u "$APP_USER" npm run build
  sudo -u "$APP_USER" npm run build:ring-previews
  systemctl restart "$SERVICE"
  exit 1
}
trap rollback ERR
sudo -u "$APP_USER" git merge --ff-only "origin/$BRANCH" --quiet
NEW_COMMIT=$(sudo -u "$APP_USER" git rev-parse HEAD)

if [[ "$PREV_COMMIT" == "$NEW_COMMIT" ]]; then
  ok "Nincs új változás — de a build és az újraindítás lefut."
else
  ok "Új verzió: ${NEW_COMMIT:0:8}"
fi

# ---------- 3. függőségek + build ----------
log "Függőségek telepítése"
sudo -u "$APP_USER" npm ci --include=dev --no-audit --no-fund

log "Frontend fordítása"
sudo -u "$APP_USER" npm run build
ok "public/app.js legyártva"
sudo -u "$APP_USER" npm run build:ring-previews

# a mappák biztosan létezzenek és a megfelelő usert illessék
mkdir -p "$APP_DIR/data" "$APP_DIR/public/uploads"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/data" "$APP_DIR/public/uploads"
chmod 600 "$APP_DIR/.env" 2>/dev/null || true

# ---------- 4. újraindítás ----------
log "Szolgáltatás újraindítása"
systemctl restart "$SERVICE"

# ---------- 5. ellenőrzés ----------
log "Ellenőrzés"
HEALTHY=0
for i in $(seq 1 15); do
  if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then HEALTHY=1; break; fi
  sleep 1
done

if [[ "$HEALTHY" -eq 1 ]]; then
  ok "A webshop fut és válaszol."
  curl -fsS "$HEALTH_URL" | sed 's/^/    /'
  printf '\n'
  exit 0
fi

# ---------- visszaállás ----------
fail "Az alkalmazás nem válaszol — visszaállás a(z) ${PREV_COMMIT:0:8} verzióra."
trap - ERR
sudo -u "$APP_USER" git checkout -B "$BRANCH" "$PREV_COMMIT"
sudo -u "$APP_USER" npm ci --include=dev --no-audit --no-fund
sudo -u "$APP_USER" npm run build
sudo -u "$APP_USER" npm run build:ring-previews
systemctl restart "$SERVICE"
sleep 3

if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
  fail "Visszaállás sikerült, a régi verzió fut. Nézd meg a hibát: journalctl -u $SERVICE -n 60"
else
  fail "A visszaállás sem hozta vissza! Azonnal: journalctl -u $SERVICE -n 80"
fi
exit 1
