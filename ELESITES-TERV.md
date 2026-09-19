# BRIGHTAL — élesítési terv A-tól Z-ig

> Készült: 2026-08-24 · a `she-said-yes` projekt tényleges kódja alapján.
> Az árak **tájékoztató jellegűek** (2026. augusztusi nagyságrendek) — rendelés előtt
> mindig nézd meg a szolgáltató saját, aktuális díjszabását.

---

## 0. Amit a kód megszab (ezért ilyen a terv)

| Tény a kódban | Következmény |
|---|---|
| `server/db.js` — JSON fájlokba ír (`data/*.json`) | **Kell állandó lemez.** Vercel / Netlify / Cloudflare Pages **NEM jó** (ott a fájlrendszer eldobódik) |
| `public/uploads/` — a feltöltött képek lemezre mennek | Ugyanez, plusz **mentés kötelező** — ezek pótolhatatlan ügyféladatok |
| Egyetlen Node folyamat, memóriában is tart állapotot | **1 db VPS**, nem több példány load balancer mögött |
| `server/config.js` → `callbackUrl = PUBLIC_URL + /api/payment/callback` | A Barion **kívülről hívja meg** → publikus **HTTPS** domain kötelező |
| `server/auth.js:62` — `secure: cfg.isProd` süti | HTTPS nélkül élesben nem működik a bejelentkezés |
| A Barion POSKey csak szerveroldalon él | Nem lehet statikus tárhely, kell futó backend |

**Tehát: egy kicsi VPS + saját domain + Caddy (automatikus HTTPS).**
Ez a legolcsóbb megoldás, ami ezzel a kóddal ténylegesen működik.

---

## 1. Költségvetés (nagyságrend)

| Tétel | Szolgáltató | Ár (kb.) |
|---|---|---|
| `.hu` domain | Rackhost / Nethely | **4 000 – 7 000 Ft / év** |
| `.com` domain (alternatíva) | Cloudflare Registrar | ~4 500 Ft / év |
| VPS (2 vCPU / 4 GB / 40 GB) | **Hetzner CX22** | **~4,5–6 € / hó ≈ 2 000–2 500 Ft** |
| VPS magyar szolgáltatónál (alternatíva) | Rackhost / Nethely VPS | 5 000 – 12 000 Ft / hó |
| Automata mentés | Hetzner Backups (+20 %) | ~400 Ft / hó |
| SSL tanúsítvány | Let's Encrypt (Caddy intézi) | **0 Ft** |
| Tranzakciós e-mail | Brevo free (300/nap) vagy Resend free | **0 Ft** |
| Barion belépési díj + havidíj | Barion | **0 Ft** |
| Barion tranzakciós díj | Barion | kb. **0,99 % – 2,9 %** (csomagtól és kártyatípustól függ) |
| Számlázó (NAV online számla) | Számlázz.hu / Billingo | 0 – 3 000 Ft / hó |
| Uptime figyelés | UptimeRobot free | 0 Ft |

**Összesen induláskor: kb. 3 000 – 6 000 Ft / hó + évi ~5 000 Ft domain.**

---

## 2. ELŐFELTÉTEL — ezt nem lehet kihagyni

A Barion **éles** fiókhoz **működő vállalkozás kell** (egyéni vállalkozó vagy cég):

- adószám, cégjegyzék- vagy nyilvántartási szám
- céges (vagy EV-s) bankszámlaszám
- azonosító okmány a képviselőről (KYC / AML ellenőrzés)
- a webshopon a kötelező jogi tartalom (lásd 11. fejezet) — **a Barion emberi kézzel átnézi a boltot jóváhagyás előtt**

Ha ez még nincs meg: a webshop felépíthető és **sandboxban teljesen tesztelhető**,
csak valódi pénzt nem tud fogadni. Ezt indítsd el párhuzamosan, mert a Barion
jóváhagyás **1–5 munkanap**.

---

## 3. LÉPÉS — Domain vásárlás (Rackhost, `.hu`)

**Weboldal:** https://rackhost.hu

1. Jobb felül **Regisztráció** → e-mail, jelszó, számlázási adatok (a vállalkozás adatai).
2. Főoldal → **Domain** menü → írd be: `brightal` → keresés.
3. Válaszd ki a szabad `.hu` verziót → **Kosárba**.
4. Időtartam: **2 év** (olcsóbb, és nem felejted el megújítani).
5. A `.hu` domainhez ki kell tölteni egy **igénylőlapot** (a rendszer felkínálja):
   - igénylő: a vállalkozás neve + adószám
   - a `.hu` szabályok szerint a név 8 napig „várólistán" van, utána élesedik
6. Fizetés (bankkártya / utalás) → e-mailben jön a visszaigazolás.
7. **A DNS kezelő maradjon a Rackhostnál** — az 5. lépésben itt állítasz A rekordot.

> **Alternatíva `.com`-ra:** https://dash.cloudflare.com → *Domain Registration* →
> *Register Domain*. Olcsóbb és jobb a DNS-kezelője, de `.hu`-t nem árulnak.

---

## 4. LÉPÉS — Szerver (VPS) rendelés (Hetzner)

**Weboldal:** https://www.hetzner.com/cloud

### 4.1 SSH kulcs a saját gépeden (Windows PowerShell) — ELŐSZÖR ezt

```powershell
ssh-keygen -t ed25519 -C "brightal-deploy"
```

- Enter (alapértelmezett hely: `C:\Users\Lenovo\.ssh\id_ed25519`)
- Jelmondat: adj meg egyet, és jegyezd meg
- A **publikus** kulcs kiírása (ezt kell bemásolni a Hetznerbe):

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

> ⚠ A `.pub` **nélküli** fájl a PRIVÁT kulcs. Azt soha, senkinek — nekem sem.

### 4.2 Szerver létrehozása

1. https://accounts.hetzner.com/signUp → regisztráció (adatok, kártya).
   Első rendeléskor lehet **azonosítás** (okmány feltöltése) — pár óra.
2. Belépés: https://console.hetzner.cloud → **+ New Project** → név: `brightal`.
3. **Add Server**, és így állítsd be:

| Mező | Érték |
|---|---|
| **Location** | Nuremberg vagy Falkenstein (EU, GDPR szempontból rendben) |
| **Image** | **Ubuntu 24.04** |
| **Type** | Shared vCPU → x86 → **CX22** (2 vCPU / 4 GB / 40 GB) |
| **Networking** | IPv4 + IPv6 (mindkettő maradjon) |
| **Volumes / Firewall** | egyelőre üres |
| **SSH keys** | *Add SSH key* → illeszd be a 4.1-ben kiírt `.pub` tartalmat |
| **Backups** | ✅ **pipáld be** (+20 %, napi automata mentés) |
| **Name** | `brightal-prod` |

4. **Create & Buy now**.
5. Írd fel a szerver **IPv4 címét** (pl. `95.217.x.x`).

### 4.3 Első belépés

```powershell
ssh root@A_SZERVER_IP
```

---

## 5. LÉPÉS — DNS beállítás (a domainnél)

Rackhost: **Belépés → Szolgáltatásaim → a domain → DNS kezelő**

| Típus | Név | Érték | TTL |
|---|---|---|---|
| A | `@` | a szerver IPv4 címe | 3600 |
| A | `www` | a szerver IPv4 címe | 3600 |
| AAAA | `@` | a szerver IPv6 címe (opcionális) | 3600 |

Mentés. **Terjedés: 10 perc – 4 óra.** Ellenőrzés a saját gépeden:

```powershell
nslookup brightal.hu
```

Csak akkor menj tovább a Caddy-re (10. lépés), ha ez már a te IP-det adja vissza —
enélkül a Let's Encrypt tanúsítvány kiadása **el fog bukni**.

---

## 6. LÉPÉS — A szerver alapbeállítása

> **GYORSÍTÓ:** a 6–10. lépést (alaprendszer, tűzfal, Node, systemd, Caddy, mentés)
> egyetlen szkript is elvégzi. Ha ezt választod, ugorj a 7. lépés git-részéhez,
> majd futtasd:
>
> ```bash
> DOMAIN=brightal.hu /opt/brightal/deploy/setup-server.sh
> ```
>
> A szkript a titkokat szándékosan **nem** tölti ki — a `.env`-be a Barion
> kulcsokat és az admin jelszót utána te írod be. Az alábbi kézi lépések
> ugyanezt csinálják, csak láthatóan, egyesével.

`root`-ként belépve, sorban:

```bash
apt update && apt full-upgrade -y
```

```bash
timedatectl set-timezone Europe/Budapest
```

Külön felhasználó az alkalmazásnak (ne fusson root-ként):

```bash
adduser --disabled-password --gecos "" brightal
```

Tűzfal és brute-force védelem:

```bash
apt install -y ufw fail2ban && ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable && systemctl enable --now fail2ban
```

Automatikus biztonsági frissítés:

```bash
apt install -y unattended-upgrades && dpkg-reconfigure -plow unattended-upgrades
```

Node.js 22 LTS + git:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs git && node -v
```

---

## 7. LÉPÉS — Az alkalmazás felmásolása

**Ajánlott: privát GitHub repó** — így később egy `git pull` a frissítés.

A saját gépeden:

```powershell
cd "C:\Users\Lenovo\Downloads\she_said_yes (1)\she-said-yes"; git init; git add .; git commit -m "BRIGHTAL webshop"
```

> A `.gitignore` már kizárja a `.env`-et, a `data/`-t és az `uploads/`-ot — így
> **titok soha nem kerül a repóba.** Ez fontos, ne írd át.

GitHub → **New repository** → *Private* → a kiírt parancsokkal `git push`.

A szerveren:

```bash
mkdir -p /opt/brightal && chown brightal:brightal /opt/brightal
```

```bash
sudo -u brightal git clone https://github.com/FELHASZNALO/REPO.git /opt/brightal
```

```bash
cd /opt/brightal && sudo -u brightal npm install && sudo -u brightal npm run build
```

> A `npm run build` gyártja le a `public/app.js`-t. Enélkül **üres oldalt** kapsz.

```bash
mkdir -p /opt/brightal/data /opt/brightal/public/uploads && chown -R brightal:brightal /opt/brightal
```

---

## 8. LÉPÉS — `.env` élesre állítása

```bash
sudo -u brightal cp /opt/brightal/.env.example /opt/brightal/.env
```

Session titok generálása (az eredményt másold be):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Szerkesztés:

```bash
sudo -u brightal nano /opt/brightal/.env
```

Amit **kötelező** átírni:

```ini
NODE_ENV=production
PUBLIC_URL=https://brightal.hu
PORT=3000

ADMIN_USERNAME=<sajat_egyedi_nev>
ADMIN_PASSWORD=<hosszu_eros_jelszo>
ADMIN_EMAIL=<ide_jonnek_az_ertesitesek>

SESSION_SECRET=<a_fent_generalt_64_karakteres_ertek>

SHOP_NAME=BRIGHTAL
SHOP_EMAIL=<valodi cim>
SHOP_PHONE=<valodi szam>
SHOP_ADDRESS=<valodi szekhely>

# Barion: ELŐSZÖR sandbox, csak a teljes teszt után prod!
BARION_ENV=test
BARION_POS_KEY=<sandbox POSKey>
BARION_PAYEE=<sandbox fiok email>
```

Jogosultság (más ne olvashassa):

```bash
chmod 600 /opt/brightal/.env
```

---

## 9. LÉPÉS — Folyamatos futtatás (systemd)

Illeszd be egyben (root-ként):

```bash
printf '%s\n' '[Unit]' 'Description=BRIGHTAL webshop' 'After=network.target' '' '[Service]' 'Type=simple' 'User=brightal' 'WorkingDirectory=/opt/brightal' 'ExecStart=/usr/bin/node server/index.js' 'Restart=always' 'RestartSec=5' 'Environment=NODE_ENV=production' 'NoNewPrivileges=true' 'PrivateTmp=true' 'ProtectSystem=full' 'ReadWritePaths=/opt/brightal/data /opt/brightal/public/uploads' '' '[Install]' 'WantedBy=multi-user.target' > /etc/systemd/system/brightal.service
```

```bash
systemctl daemon-reload && systemctl enable --now brightal && systemctl status brightal --no-pager
```

Élő napló:

```bash
journalctl -u brightal -f
```

---

## 10. LÉPÉS — HTTPS (Caddy)

Telepítés:

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
```

```bash
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
```

```bash
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
```

```bash
apt update && apt install -y caddy
```

Konfiguráció (**cseréld ki a domaint!**):

```bash
printf '%s\n' 'brightal.hu, www.brightal.hu {' '    encode gzip zstd' '    request_body {' '        max_size 40MB' '    }' '    reverse_proxy 127.0.0.1:3000' '}' > /etc/caddy/Caddyfile
```

```bash
systemctl reload caddy
```

A Caddy **magától kér Let's Encrypt tanúsítványt** — SSL-t nem kell vásárolni.

**Ellenőrzés:**

- https://brightal.hu → betölt a webshop, a lakat ikon rendben
- https://brightal.hu/api/health → `{"ok":true,...}`

---

## 11. LÉPÉS — Jogi tartalom (a Barion jóváhagyás feltétele)

✅ **ELKÉSZÜLT** — mind az öt oldal be van építve, magyarul és angolul:
`/aszf`, `/adatkezeles`, `/impresszum`, `/elallas`, `/cookie`
(angolul: `/terms`, `/privacy`, `/impressum`, `/refund`, `/cookies`).

**Neked ennyi maradt:**

1. Töltsd ki a `COMPANY_*` értékeket a `.env`-ben (lásd a `.env.production.example`
   5. blokkját). Amit üresen hagysz, az az oldalon piros **[KITÖLTENDŐ]**
   jelölésként látszik — így pontosan látod, mi hiányzik.
2. **Nézesd át a szövegeket jogásszal.** Minták, magyar webshopra szabva, de a
   felelősség a boltüzemeltetőé.
3. Ha módosítanál rajtuk: `public/legal.js` — ehhez nem kell `npm run build`,
   elég frissíteni az oldalt.

A tartalom, ami bekerült:

1. **Impresszum** — cégnév, székhely, adószám, cégjegyzékszám, e-mail, telefon, tárhelyszolgáltató adatai
2. **ÁSZF** — a megrendelés menete, árak, fizetés, szállítás, jótállás/szavatosság, panaszkezelés, békéltető testület
3. **Adatkezelési tájékoztató (GDPR)** — külön ki kell térni a **feltöltött fényképekre**,
   az adatfeldolgozókra (Hetzner, Barion, e-mail szolgáltató) és a megőrzési időre
4. **Elállási tájékoztató** — a 45/2014. (II. 26.) Korm. rendelet 29. § (1) c) pontja alapján
   **egyedi, a fogyasztó utasítása szerint készített termékre az elállási jog kizárható**,
   de ezt **előre, egyértelműen** közölni kell, különben nem érvényes
5. **Cookie tájékoztató**

Ezt az 5 oldalt **meg tudom írni sablonként és be tudom építeni az oldalba** — a
végleges szöveget viszont nézesd át jogásszal, ez már nem informatikai kérdés.

---

## 12. LÉPÉS — Barion sandbox teszt már az ÉLES domainen

Ez azért fontos, mert `localhost`-on az **IPN callback nem tesztelhető** (a Barion
szervere nem éri el a gépedet). Most már igen.

1. `.env`: `BARION_ENV=test`, sandbox POSKey, `PUBLIC_URL=https://brightal.hu`
2. `systemctl restart brightal`
3. Vidd végig a teljes folyamatot a valódi oldalon:
   - kép feltöltés + kérés leadása
   - admin belépés → árazás → jóváhagyás
   - fizetés teszt kártyával: `4444 8888 8888 5559`, lejárat pl. `05/29`, CVC bármi
   - elutasítás tesztje: `4444 8888 8888 4444`
4. Ellenőrzés: https://secure.test.barion.com/PaymentMonitor/
5. `journalctl -u brightal -f` → meg kell jelennie: `[payment] ✔ Kifizetve: BRG-...`

**Ha ez hibátlan, csak akkor jöhet az éles.**

---

## 13. LÉPÉS — Barion ÉLES fiók

**Weboldal:** https://www.barion.com

1. **Regisztráció** → *Üzleti fiók*. A sandbox fiókod itt **nem érvényes**, külön rendszer.
2. **Azonosítás (KYC)**: cégadatok, adószám, a képviselő okmánya, bankszámlaszám.
   → Barion oldali jóváhagyás **1–5 munkanap**.
3. Belépés → **Shopok** → **Új bolt**:
   - Bolt neve: `BRIGHTAL`
   - Bolt URL: `https://brightal.hu`
   - Tevékenység: egyedi készítésű ékszer / jegygyűrű, fénykép alapján
4. **Bolt jóváhagyás kérése.** A Barion munkatársa **megnyitja az oldalt**, és nézi:
   impresszum, ÁSZF, adatkezelés, elállás, kapcsolat, árfeltüntetés, Barion logó.
   → ezért kell a 11. lépés **előbb**.
5. Jóváhagyás után **Shopok → a bolt → Szerkesztés**, itt találod:
   - **Secret key (POSKey)** ← ez a titkos, ez megy a `.env`-be
   - **Public key** ← `BARION_SHOP_ID`
   - **Barion Pixel Id** ← `BARION_PIXEL_ID`
6. `.env` átírása:

```ini
BARION_ENV=prod
BARION_POS_KEY=<ÉLES Secret key>
BARION_PAYEE=<éles Barion fiók e-mail címe>
BARION_SHOP_ID=<éles Public key>
BARION_PIXEL_ID=<éles Pixel Id>
```

```bash
systemctl restart brightal && journalctl -u brightal -n 30 --no-pager
```

A konzolnak ezt kell kiírnia: `Barion : ÉLES (production) → https://api.barion.com`

7. **Éles próbavásárlás**: adj le magadnak egy rendelést kis összegre (pl. 1 000 Ft),
   fizesd ki valódi kártyával, majd a Barion felületén **térítsd vissza**.

---

## 14. LÉPÉS — E-mail küldés

Jelenleg `MAIL_ENABLED=false`, tehát a levelek csak a `data/mail-outbox.log`-ba kerülnek.

Legegyszerűbb ingyenes út: **Brevo** — https://www.brevo.com — 300 levél/nap ingyen.

1. Regisztráció → **Senders, Domains & Dedicated IPs** → *Add a domain* → `brightal.hu`
2. A kiírt **DKIM + SPF (TXT) rekordokat** vidd fel a Rackhost DNS kezelőjébe
3. **SMTP & API** menü → *SMTP* → login + master password
4. `.env`:

```ini
MAIL_ENABLED=true
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<brevo login>
SMTP_PASS=<brevo smtp kulcs>
MAIL_FROM=BRIGHTAL <hello@brightal.hu>
```

Ajánlott még egy DMARC rekord: `_dmarc` TXT → `v=DMARC1; p=none; rua=mailto:hello@brightal.hu`

---

## 15. LÉPÉS — Mentés (KÖTELEZŐ)

A `data/` és a `public/uploads/` tartalma **pótolhatatlan**. A Hetzner napi snapshotja mellé:

```bash
mkdir -p /opt/backup && printf '%s\n' '#!/bin/bash' 'D=$(date +%F)' 'tar czf /opt/backup/brightal-$D.tar.gz -C /opt/brightal data public/uploads .env' "find /opt/backup -name 'brightal-*.tar.gz' -mtime +14 -delete" > /usr/local/bin/brightal-backup.sh && chmod +x /usr/local/bin/brightal-backup.sh
```

```bash
(crontab -l 2>/dev/null; echo "30 3 * * * /usr/local/bin/brightal-backup.sh") | crontab -
```

Havonta egyszer töltsd le a legfrissebb csomagot a saját gépedre:

```powershell
scp root@SZERVER_IP:/opt/backup/brightal-*.tar.gz .
```

---

## 16. LÉPÉS — Figyelés

https://uptimerobot.com → ingyenes fiók → **Add New Monitor** → HTTP(s) →
URL: `https://brightal.hu/api/health` → 5 perces ellenőrzés, e-mail riasztás.

---

## 17. Élesítési checklist

- [ ] `NODE_ENV=production`
- [ ] `PUBLIC_URL=https://...` (HTTPS!)
- [ ] `ADMIN_PASSWORD` **nem** `12345`
- [ ] `SESSION_SECRET` kitöltve
- [ ] `BARION_ENV=prod` + éles kulcsok
- [ ] éles próbavásárlás megtörtént és vissza lett térítve
- [ ] ÁSZF / Adatkezelés / Impresszum / Elállás / Cookie kint van
- [ ] az értesítő e-mail ténylegesen megérkezik
- [ ] mentés fut (`ls /opt/backup`)
- [ ] `ufw status` → aktív
- [ ] számlázás megoldva (NAV online számla kötelező)

---

## 18. Frissítés menete később

```bash
cd /opt/brightal && sudo -u brightal git pull && sudo -u brightal npm install && sudo -u brightal npm run build && systemctl restart brightal
```

---

## 19. Mit oszthatsz meg velem, és mit SOHA

### ✅ Nyugodtan elküldheted (ezek nem titkok)

| Adat | Mire kell |
|---|---|
| A megvásárolt **domain neve** | `PUBLIC_URL`, Caddyfile, Google origins |
| A szerver **IP címe** és a szolgáltató neve | DNS ellenőrzés, parancsok testreszabása |
| **OS verzió** (`lsb_release -a` kimenete) | a pontos telepítő parancsokhoz |
| **Node verzió** (`node -v`) | kompatibilitás |
| A **cég/EV adatai**: név, székhely, adószám, cégjegyzékszám, e-mail, telefon | impresszum, ÁSZF, adatkezelési tájékoztató |
| Szállítási / gyártási idő, árazás, elállási feltételek | ÁSZF szövege |
| **`BARION_SHOP_ID`** (Public key) és **`BARION_PIXEL_ID`** | ezek eleve publikusak, a böngészőbe kerülnek |
| **Google Client ID** | publikus |
| Hibaüzenetek, `journalctl` kimenet | hibakeresés — de előtte **takard ki a kulcsokat** |
| Képernyőkép a Barion admin felületről | ha elakadsz — a Secret key részt takard le |

### ❌ SOHA ne küldd el (se nekem, se másnak chatben)

- **`BARION_POS_KEY` (Secret key)** — ezzel bárki a nevedben indíthat fizetést
- **SSH privát kulcs** (`id_ed25519`, `.pub` nélkül)
- root vagy VPS **jelszó**
- **`SMTP_PASS`**, `ADMIN_PASSWORD`, `SESSION_SECRET`
- Google **client secret**
- bankszámla-, kártyaadat, okmányfotó

**Hogyan működik akkor a beállítás?** Én adok neked egy `.env` sablont
**helykitöltőkkel**, te a szerveren `nano`-val beírod a valódi értékeket, és utána
csak annyit írsz vissza, hogy *„beállítva"* — vagy elküldöd az ellenőrző parancs
kimenetét, amiben a kulcs nem szerepel:

```bash
journalctl -u brightal -n 20 --no-pager | grep -i barion
```

### Konkrétan ezt a 8 dolgot küldd el, ha megvan a domain + szerver

1. A domain neve (pl. `brightal.hu`), és hogy melyik regisztrátornál van
2. A szerver publikus IP címe és a szolgáltató (pl. Hetzner)
3. `lsb_release -a` és `node -v` kimenete a szerverről
4. Hol lesz az alkalmazás (javaslat: `/opt/brightal`), milyen felhasználóval fut
5. GitHub repót használsz-e a deployhoz (igen/nem)
6. A vállalkozás pontos adatai a jogi oldalakhoz (lásd fenti táblázat)
7. Barion: sandbox vagy már éles jóváhagyott bolt? (kulcs NÉLKÜL, csak az állapot)
8. E-mail küldéshez melyik szolgáltatót választottad (Brevo / Resend / saját SMTP)

---

## 20. Kódoldali munka — ✅ ELKÉSZÜLT

| Feladat | Állapot | Hol |
|---|---|---|
| ÁSZF / Adatkezelés / Impresszum / Elállás / Cookie (HU+EN) | ✅ kész | `public/legal.js` |
| Cookie-sáv, Barion Pixel csak hozzájárulás után | ✅ kész | `public/app.jsx` |
| `ADMIN_PASSWORD` hash-elve (scrypt) | ✅ kész | `npm run hash-password` |
| Élesítési figyelmeztetések indításkor | ✅ kész | `server/index.js` |
| `systemd` unit, `Caddyfile`, `deploy.sh`, `backup.sh`, `setup-server.sh` | ✅ kész | `deploy/` |
| 404 oldal, SEO meta, OG, JSON-LD, `robots.txt`, `sitemap.xml` | ✅ kész | `server/index.js`, `public/index.html` |
| Számlázás (Számlázz.hu / Billingo) a fizetés `paid` ágába | ✅ kész | `server/invoice.js` |
| Éles `.env` sablon helykitöltőkkel | ✅ kész | `.env.production.example` |

**Ami később, forgalomtól függően jöhet:**

| Feladat | Mikor |
|---|---|
| `server/db.js` átírása SQLite/PostgreSQL-re | ha a JSON fájl kevés lesz (kb. napi 50+ rendelés fölött) |
| Képek átméretezése/optimalizálása feltöltéskor | ha sok a nagy fájl |
| Több admin felhasználó | ha nem egyedül kezeled |

---

## 21. Javasolt sorrend (időzítés)

| Hét | Teendő |
|---|---|
| 1. nap | Domain vétel (3.) + VPS rendelés (4.) + DNS (5.) — **kb. 1 óra + várakozás** |
| 1. nap | Vállalkozás / Barion üzleti fiók regisztráció elindítása (2., 13.1–13.2) |
| 2. nap | Szerver beállítás, app feltöltés, HTTPS (6.–10.) — **kb. 2 óra** |
| 2.–4. nap | `COMPANY_*` kitöltése + a jogi szövegek jogászi átnézése (11.) |
| 4. nap | Sandbox teszt az éles domainen (12.) |
| Barion jóváhagyás után | Éles kulcsok, próbavásárlás, checklist (13., 17.) |
