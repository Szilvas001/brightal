#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
#  BRIGHTAL — friss Ubuntu 24.04 szerver beállítása egy lépésben
# ══════════════════════════════════════════════════════════════════
#  Ez az ELESITES-TERV.md 6. és 9–10. lépését automatizálja.
#
#  Használat (root-ként, friss szerveren):
#      apt update && apt install -y git
#      git clone <A_REPO_URL> /opt/brightal
#      DOMAIN=brightal.hu /opt/brightal/deploy/setup-server.sh
#
#  Amit NEM csinál meg (szándékosan, mert titkokat érint):
#    · a .env kitöltése   → utána kézzel: nano /opt/brightal/.env
#    · a Barion kulcsok   → a Barion admin felületéről másolod be
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="${DOMAIN:-}"
APP_DIR="${APP_DIR:-/opt/brightal}"
APP_USER="${APP_USER:-brightal}"

log()  { printf '\n\033[1;33m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m  ✔ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;35m  ! %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m  ✗ %s\033[0m\n' "$*" >&2; }

[[ $EUID -eq 0 ]] || { fail "Root jogosultság kell."; exit 1; }
[[ -n "$DOMAIN" ]] || { fail "Add meg a domaint: DOMAIN=brightal.hu $0"; exit 1; }
[[ -d "$APP_DIR" ]] || { fail "Nincs ilyen mappa: $APP_DIR (előbb git clone)"; exit 1; }

# ---------- 1. alaprendszer ----------
log "Rendszerfrissítés"
export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt full-upgrade -y -qq
timedatectl set-timezone Europe/Budapest
ok "Frissítve, időzóna: Europe/Budapest"

# ---------- 2. tűzfal ----------
log "Tűzfal és brute-force védelem"
apt install -y -qq ufw fail2ban curl
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
systemctl enable --now fail2ban >/dev/null 2>&1
ok "ufw aktív (22, 80, 443), fail2ban fut"

# ---------- 3. automata biztonsági frissítés ----------
log "Automatikus biztonsági frissítések"
apt install -y -qq unattended-upgrades
echo 'APT::Periodic::Unattended-Upgrade "1";' > /etc/apt/apt.conf.d/20auto-upgrades
echo 'APT::Periodic::Update-Package-Lists "1";' >> /etc/apt/apt.conf.d/20auto-upgrades
ok "Bekapcsolva"

# ---------- 4. Node.js ----------
log "Node.js 22 LTS"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt install -y -qq nodejs
fi
ok "Node $(node -v)"

# ---------- 5. alkalmazás-felhasználó ----------
log "Alkalmazás-felhasználó és mappák"
id -u "$APP_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$APP_USER" >/dev/null
mkdir -p "$APP_DIR/data" "$APP_DIR/public/uploads"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
ok "Felhasználó: $APP_USER, mappa: $APP_DIR"

# ---------- 6. függőségek + build ----------
log "Telepítés és frontend fordítás"
cd "$APP_DIR"
sudo -u "$APP_USER" npm install --no-audit --no-fund
sudo -u "$APP_USER" npm run build
ok "public/app.js kész"

# ---------- 7. .env ----------
log ".env előkészítése"
if [[ ! -f "$APP_DIR/.env" ]]; then
  if [[ -f "$APP_DIR/.env.production.example" ]]; then
    sudo -u "$APP_USER" cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
  else
    sudo -u "$APP_USER" cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  fi
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sudo -u "$APP_USER" sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" "$APP_DIR/.env"
  sudo -u "$APP_USER" sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=https://$DOMAIN|" "$APP_DIR/.env"
  sudo -u "$APP_USER" sed -i "s|^NODE_ENV=.*|NODE_ENV=production|" "$APP_DIR/.env"
  ok ".env létrehozva, SESSION_SECRET generálva, PUBLIC_URL=https://$DOMAIN"
  warn "A TITKOKAT (Barion kulcs, admin jelszó, SMTP) még be kell írnod:  nano $APP_DIR/.env"
else
  ok ".env már létezik — nem nyúlok hozzá"
fi
chmod 600 "$APP_DIR/.env"

# ---------- 8. systemd ----------
log "systemd szolgáltatás"
cp "$APP_DIR/deploy/brightal.service" /etc/systemd/system/brightal.service
systemctl daemon-reload
systemctl enable --now brightal
sleep 2
systemctl is-active --quiet brightal && ok "A brightal szolgáltatás fut" || fail "Nem indult el — journalctl -u brightal -n 40"

# ---------- 9. Caddy ----------
log "Caddy telepítése (automatikus HTTPS)"
if ! command -v caddy >/dev/null 2>&1; then
  apt install -y -qq debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt update -qq && apt install -y -qq caddy
fi
mkdir -p /var/log/caddy && chown caddy:caddy /var/log/caddy
sed "s|brightal\.hu|$DOMAIN|g" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy
ok "Caddy beállítva a(z) $DOMAIN domainre"

# ---------- 10. mentés ----------
log "Napi mentés beállítása"
cp "$APP_DIR/deploy/backup.sh" /usr/local/bin/brightal-backup
chmod +x /usr/local/bin/brightal-backup
( crontab -l 2>/dev/null | grep -v brightal-backup; \
  echo "30 3 * * * /usr/local/bin/brightal-backup >> /var/log/brightal-backup.log 2>&1" ) | crontab -
ok "Minden hajnali 3:30-kor fut"

# ---------- összegzés ----------
LINE=$(printf '─%.0s' {1..66})
printf '\n%s\n  KÉSZ\n%s\n' "$LINE" "$LINE"
echo "  Webshop     : https://$DOMAIN"
echo "  Állapot     : https://$DOMAIN/api/health"
echo "  Napló       : journalctl -u brightal -f"
echo "  Újraindítás : systemctl restart brightal"
echo "  Frissítés   : $APP_DIR/deploy/deploy.sh"
printf '%s\n' "$LINE"
echo "  HÁTRA VAN MÉG:"
echo "   1. nano $APP_DIR/.env       → Barion kulcsok, admin jelszó, cégadatok"
echo "   2. cd $APP_DIR && npm run hash-password   → erős admin jelszó"
echo "   3. systemctl restart brightal"
printf '%s\n\n' "$LINE"
