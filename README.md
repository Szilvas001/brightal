# BRIGHTAL — costum ring webshop

> **Egyedi gyűrűk pont, ahogy elképzelted.**
> *Your vision. Our craftsmanship. A ring as unique as your story.*

Egyedi gyűrűkészítés webalkalmazás. A vásárló feltölti a képet az álomgyűrűről
(vagy körbeírja), az ötvös árat ad rá, a vásárló pedig Barionnal fizet.

**Kétnyelvű (magyar / angol), mobilbarát, Barion-integrált.**

### Arculat

A dizájn a Facebook-oldal arculatát követi:

| Elem | Érték |
|---|---|
| Alap / „blush" | `#F7DACE` — a logó púder-rózsaszín háttere |
| Tinta | `#3B2119` — a logó eszpresszó-barna vonalgrafikája |
| Akcent | `#B87A5C` / `#9C5F44` — rozéarany-réz (a borítókép felirata) |
| Krém / pezsgő | `#FDFAF8`, `#EFE6DC` — a csillámos borítókép hangulata |
| Betű | Cormorant Garamond (szeriffes, ritkított) + Inter |

A márkaelemek a `public/assets/` mappában:
`brightal-logo.jpg` (profilkép), `brightal-cover.jpg` (borító),
`brightal-mark.svg` + `brightal-favicon.svg` (a gyémánt motívum vektorosan).
A gyémánt a navigációban és a láblécben SVG-ként rajzolódik (`Ico.gem`),
így minden méretben éles marad.

---

## 1. A folyamat

```
  ┌─────────────┐    ┌──────────────┐    ┌──────────┐    ┌─────────────┐
  │ 1. FELTÖLTI │──▶│ 2. ELFOGADÁS │──▶│ 3. FIZET │──▶│ 4. ELKÉSZÜL │
  │   a képet   │    │   ~1 óra     │    │  Barion  │    │ 10–14 nap   │
  └─────────────┘    └──────────────┘    └──────────┘    └─────────────┘
        user              ADMIN               user            ADMIN
```

**Részletesen:**

1. A vőlegény belép (e-maillel vagy Google-fiókkal), és feltölti a gyűrű képét
   (JPG / PNG / WebP, akár 4 darabot). Megadhat fémet, méretet, keretet, gravírozást.
2. **Automatikus e-mail** megy neki („megkaptuk"), és egy másik neked, az adminnak.
3. Belépsz az admin fiókkal, megnézed a képet, és **beírsz egy árat** (pl. 250 000 Ft),
   opcionálisan megjegyzéssel.
4. Az ár **azonnal megjelenik** a vőlegény fiókjában a „Rendeléseim" alatt,
   `Elfogadva · fizethető` státusszal — és kap róla e-mailt is.
5. Fizet Barionnal. A státusz `Kifizetve` lesz, te pedig `Gyártás alatt` majd
   `Elkészült` állapotba léptetheted.

---

## 2. Telepítés Fedorán

### 2.1 Node.js

```bash
node --version
```

Ha 18-asnál régebbi vagy nincs telepítve:

```bash
sudo dnf install -y nodejs npm
```

Ha a Fedora tárolójában régi verzió van, használd a NodeSource csomagot:

```bash
sudo dnf module reset nodejs
sudo dnf module install nodejs:20/common
```

### 2.2 Kicsomagolás és indítás

```bash
cd ~/Letoltesek            # vagy ~/Downloads
unzip she_said_yes.zip
cd she-said-yes

npm install                # függőségek (~30 mp)
cp .env.example .env       # konfiguráció
npm run build              # a JSX lefordítása app.js-re
npm start
```

Ha az `unzip` nincs fent: `sudo dnf install -y unzip`

Ezután nyisd meg: **http://localhost:3000**

> A `public/app.js` a csomagban már **le van fordítva**, tehát a `npm run build`
> csak akkor kell, ha módosítod a `public/app.jsx` forrást.

### 2.3 Tűzfal (csak ha hálózatról is elérnéd)

Alapból csak a saját géped éri el. Ha a helyi hálózatról is kell:

```bash
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### 2.4 SELinux

A Fedora SELinux-a alapból nem akadályozza, mert a Node saját felhasználóként
fut a home könyvtárból. Ha később systemd alá teszed és „permission denied"
hibát kapsz a `data/` vagy `public/uploads/` mappán:

```bash
sudo restorecon -Rv ~/she-said-yes
# vagy ha /opt alá teszed:
sudo semanage fcontext -a -t httpd_sys_rw_content_t "/opt/she-said-yes/data(/.*)?"
sudo restorecon -Rv /opt/she-said-yes
```

### 2.5 Folyamatos futtatás (systemd)

Hogy újraindítás után is menjen:

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/shesaidyes.service <<'EOF'
[Unit]
Description=BRIGHTAL webshop
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/she-said-yes
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable --now shesaidyes
loginctl enable-linger $USER      # kijelentkezés után is fusson
```

Hasznos parancsok:

```bash
systemctl --user status shesaidyes     # állapot
journalctl --user -u shesaidyes -f     # élő napló
systemctl --user restart shesaidyes    # újraindítás
```

---

## 3. Admin belépés

Ugyanaz a bejelentkezési űrlap, mint az ügyfeleknél — a felhasználónév mezőbe:

| Mező | Érték |
|---|---|
| Felhasználónév | `20000902` |
| Jelszó | `12345` |

Belépés után automatikusan az **/admin** oldalra kerülsz.

> ⚠ **Ez a jelszó gyenge, és a forráskódban dokumentálva van.** Amint a rendszer
> valódi ügyféladatokat kezel, feltétlenül cseréld le a `.env` fájlban:
> ```ini
> ADMIN_USERNAME=valami-hosszabb-egyedi-azonosito
> ADMIN_PASSWORD=egy-hosszu-veletlen-jelszo
> ```
> A szerver indításkor figyelmeztet, amíg az alapértelmezett jelszó van érvényben.

### Mit tudsz az admin felületen

- **Táblázatos nézet** (alapértelmezett): *ki · mit · mikor · státusz · ár · fizetve*
  egy képernyőn, minden sor az azonosítóval (`BRG-ÉÉÉÉHHNN-XXXXXX`).
  Bármelyik fejlécre kattintva rendez, egy sorra kattintva megnyílik a részletes kártya.
- **Exportálás** a fejlécgombokkal — a letöltés mindig azt a listát tartalmazza,
  amit épp látsz (a szűrő és a keresés is érvényes rá):
  - **CSV (Excel)** — UTF-8 BOM + pontosvessző, a magyar Excel azonnal oszlopokra bontja
  - **Excel (.xls)** — kész munkafüzet, formázott fejléccel
  23 oszlop: azonosító, beérkezés, státusz, név, e-mail, telefon, felhasználó-ID,
  bruttó/nettó/ÁFA, fém, méret, gravírozás, keret, határidő, megjegyzések,
  képek száma, jóváhagyás/fizetés ideje, Barion PaymentId és státusz, nyelv.
- **Kártyás nézet** — a részletek, képek és a műveletek
- **Statisztikacsík**: összes kérés · elbírálásra vár · kifizetett · átlagos érték
- **Keresés** azonosítóra, névre, e-mailre
- **Kifizetett bevétel** összesítve
- A fejlécben látszik, **melyik Barion-környezet aktív** (sandbox vagy éles)
- Egy sorra kattintva: a feltöltött **képek nagyban**, az ügyfél adatai, a megjegyzése
- **Ár beírása + jóváhagyás** → azonnal fizethető lesz az ügyfélnek, és megy az e-mail
- **Elutasítás** indoklással
- **Gyártásba** / **Elkészült** státuszléptetés
- Teljes **eseménynapló** kérésenként
- 30 másodpercenként automatikusan frissül

---

## 4. Projektfelépítés

```
she-said-yes/
├── package.json
├── .env.example          ← ebből készül a .env
├── README.md             ← ez a fájl
│
├── .env.production.example  ← ÉLES sablon (a szerverre ebből készül a .env)
├── ELESITES-TERV.md      ← domain + szerver + Barion, lépésről lépésre
│
├── deploy/               ← élesítéshez, a szerverre másolandó
│   ├── setup-server.sh   friss Ubuntu beállítása egy paranccsal
│   ├── deploy.sh         frissítés + automatikus visszaállás hiba esetén
│   ├── backup.sh         napi mentés (data/ + uploads/ + .env)
│   ├── brightal.service  systemd egység
│   └── Caddyfile         reverse proxy + automatikus HTTPS
│
├── scripts/
│   └── hash-password.js  admin jelszó hash (npm run hash-password)
│
├── server/
│   ├── index.js          Express app, fejlécek, SPA-fallback, robots, sitemap
│   ├── config.js         minden beállítás egy helyen (.env-ből)
│   ├── db.js             JSON-fájl adattár (atomi írás)
│   ├── requests.js       kérések életciklusa, státuszok, árazás
│   ├── barion.js         Barion Smart Gateway v2 + szimulátor
│   ├── invoice.js        számlázás (Számlázz.hu / Billingo), alapból naplózó
│   ├── auth.js           jelszó-hash, munkamenet, Google, admin
│   ├── mailer.js         e-mail értesítések (SMTP vagy naplófájl)
│   └── routes/
│       ├── auth.js       regisztráció, belépés (ügyfél + admin), Google
│       ├── requests.js   képfeltöltés, saját kérések
│       ├── admin.js      jóváhagyás, árazás, státusz
│       └── payment.js    fizetés indítása, IPN, státusz
│
├── public/
│   ├── index.html        SEO meta ({{PUBLIC_URL}} a szerver tölti ki)
│   ├── styles.css        dizájnrendszer
│   ├── app.jsx           FORRÁS (ezt szerkeszd)
│   ├── app.js            LEFORDÍTOTT (ezt tölti be a böngésző)
│   ├── legal.js          ÁSZF / adatkezelés / impresszum / elállás / cookie
│   │                     szövege HU+EN — NEM kell hozzá npm run build
│   └── uploads/          a feltöltött képek
│
└── data/                 users.json, requests.json, sessions.json,
                          mail-outbox.log, invoice-outbox.log
```

---

## 5. Nyelvváltás

A fejlécben a földgömb ikon mellett: **HU / EN**. A választás a böngészőben
tárolódik, tehát a következő látogatásnál is megmarad.

Minden szöveg a `public/app.jsx` elején lévő `I18N` objektumban van. Új szöveg
hozzáadásához mindkét nyelvhez vedd fel a kulcsot, majd `npm run build`.

Az alapértelmezett nyelvet a `.env`-ben állítod: `DEFAULT_LANG=hu` vagy `en`.

A vevőnek küldött **e-mailek is azon a nyelven** mennek, amelyiket a feltöltéskor
használta.

---

## 6. Pinterest inspiráció

Az „Inspiráció" menüpont 9 kategóriát kínál (klasszikus szoliter, ovális, vintage,
rozéarany, smaragdcsiszolás, haló, minimalista, csepp, háromköves), mindegyik
a megfelelő Pinterest-keresésre visz — **magyarul és angolul külön keresőszavakkal**.

Ha van saját Pinterest-táblád, beágyazhatod a `.env`-ben:

```ini
PINTEREST_BOARD_HU=https://www.pinterest.com/felhasznalod/jegygyuru-otletek/
PINTEREST_BOARD_EN=https://www.pinterest.com/felhasznalod/engagement-ring-ideas/
```

**Őszintén:** ez keresési linkek és a hivatalos Pinterest beágyazó widget, nem
API-integráció. A Pinterest API-hoz fejlesztői fiók és jóváhagyott alkalmazás kell,
a képeik átmásolása a saját oldalra pedig szerzői jogi kérdéseket vet fel. Ez a
megoldás jogtiszta, gyors, és pont azt éri el, amit szeretnél: a vőlegény ötletet
merít, aztán visszajön feltölteni.

---

## 7. E-mail értesítések

Négy automatikus levél megy ki:

| Mikor | Kinek | Tárgy |
|---|---|---|
| Kép feltöltése | vőlegény | Megkaptuk a képet |
| Kép feltöltése | **admin** | [ADMIN] Új kérés |
| Jóváhagyás | vőlegény | Elkészült az árajánlat + ár |
| Sikeres fizetés | vőlegény | Fizetés megérkezett |

**Alapból SMTP nélkül fut**: a levelek a konzolra és a `data/mail-outbox.log`
fájlba kerülnek. A folyamat így teljesen működik — csak a levél nem megy ki
valódi postafiókba.

Valódi küldéshez a `.env`-ben (példa Gmail alkalmazásjelszóval):

```ini
MAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sajat@gmail.com
SMTP_PASS=alkalmazas-jelszo
MAIL_FROM=BRIGHTAL <sajat@gmail.com>
ADMIN_EMAIL=sajat@gmail.com
```

---

## 8. Google bejelentkezés

1. https://console.cloud.google.com → *APIs & Services* → *Credentials*
2. *Create OAuth client ID* → *Web application*
3. *Authorized JavaScript origins*: `http://localhost:3000` (+ az éles domain)
4. A `.env`-be: `GOOGLE_CLIENT_ID=...`

Ha nincs beállítva, a Google gomb egyszerűen nem jelenik meg — minden más működik.

---

## 9. Barion fizetés

### 9.0 A jelenlegi állapot — VALÓDI SANDBOX, beállítva

A `.env` már tartalmazza a *diamond ring shop* sandbox-boltod kulcsait, tehát
az alkalmazás a **valódi Barion Smart Gateway v2 API-t** hívja a
`https://api.test.barion.com` címen — csak teszt pénzzel.

```ini
BARION_ENV=test
BARION_POS_KEY=<Secret key (POSKey)>     # csak a szerveren, sosem a böngészőben
BARION_PAYEE=<a Barion-fiókod e-mail címe>
BARION_SHOP_ID=<Public key>
BARION_PIXEL_ID=<Barion Pixel Id>
```

#### Váltás ÉLESRE — csak a .env-et kell átírni, a kód nem változik

```ini
BARION_ENV=prod
BARION_POS_KEY=<ÉLES Secret key (POSKey)>
BARION_SHOP_ID=<ÉLES Public key>
BARION_PIXEL_ID=<ÉLES Barion Pixel Id>
PUBLIC_URL=https://sajatdomain.hu        # HTTPS kötelező
```

Indítás után a szerverkonzol és az admin fejléc is kiírja, melyik környezet aktív —
így nem lehet véletlenül élesben tesztelni (vagy fordítva).

### 9.1 Harmadik üzemmód: szimuláció

Ha a `BARION_POS_KEY` **üres**, a szerver saját teszt-átjárót szolgál ki a
`/sandbox-gateway` címen, és a teljes folyamat végigpróbálható Barion-fiók
nélkül is. Amint van POSKey, a szimulátor automatikusan kikapcsol.

### 9.2 Sandbox beállítás

1. Regisztrálj: **https://secure.test.barion.com/** (külön rendszer az élestől!)
2. *Shopok* → shop kiválasztása → *Szerkesztés* → **Secret key (POSKey)** kimásolása
3. A `.env`-be:

```ini
BARION_ENV=test
BARION_POS_KEY=a-poskey-guid
BARION_PAYEE=a-teszt-barion-fiokod@email.hu
BARION_PAYMENT_WINDOW=1.00:00:00
```

> **Fontos:** a `PaymentWindow` .NET TimeSpan formátumú (`d.hh:mm:ss`), **nem**
> ISO 8601. A `P1D` érték `ModelValidationError` hibát okoz.

### 9.3 Teszt bankkártyaadatok

| Cél | Kártyaszám | Lejárat | CVC |
|---|---|---|---|
| Sikeres fizetés | `4444 8888 8888 5559` | bármely jövőbeli (pl. 05/29) | bármely 3 jegy |
| Elutasított | `4444 8888 8888 4444` | bármely jövőbeli | bármely 3 jegy |

A naprakész listát itt ellenőrizd: **https://docs.barion.com/Test_cards**
Ha nem működnének, a Barion teszt-tárcáddal is fizethetsz (előbb tölts fel
virtuális egyenleget a sandbox felületen).

### 9.4 Hol ellenőrizd a tranzakciókat

- **Barion Payment Monitor**: `https://secure.test.barion.com/PaymentMonitor/`
- **Admin felület**: státusz és bevétel
- **`data/requests.json`**: teljes eseménynapló kérésenként
- **Szerverkonzol**: `[payment] ✔ Kifizetve: BRG-...`

### 9.5 A localhost és a callback

A Barion szervere **nem éri el a `localhost`-ot**, így helyben az IPN callback
nem érkezik meg. A folyamat ettől működik, mert a visszatérési oldal maga is
lekérdezi az állapotot. Ha az IPN-t is tesztelnéd:

```bash
npx localtunnel --port 3000
# majd a .env-ben: PUBLIC_URL=https://kapott-cim.loca.lt
```

---

## 9.6 Jogi oldalak, cookie, számlázás — az élesítéshez hozzáadott funkciók

### Jogi oldalak

Öt jogi oldal került be, magyarul és angolul is:

| Oldal | Magyar cím | Angol cím |
|---|---|---|
| ÁSZF | `/aszf` | `/terms` |
| Adatkezelési tájékoztató | `/adatkezeles` | `/privacy` |
| Impresszum | `/impresszum` | `/impressum` |
| Elállási tájékoztató | `/elallas` | `/refund` |
| Cookie tájékoztató | `/cookie` | `/cookies` |

A szövegek a **`public/legal.js`** fájlban vannak. Ez nem React-forrás, tehát
módosítás után **nem kell `npm run build`** — elég frissíteni az oldalt.

A `{{company.name}}` típusú jelölőket a szerver tölti ki a `.env` cégadataiból.
Amit üresen hagysz, az az oldalon piros **[KITÖLTENDŐ]** jelölésként látszik —
így egy pillantással látod, mi hiányzik még az élesítéshez.

> ⚠ A szövegek **minták**, magyar webshopra szabva. Élesítés előtt nézesd át
> jogásszal — a felelősség a boltüzemeltetőé.

**Miért fontos?** A Barion a bolt jóváhagyása előtt **emberi kézzel átnézi az
oldalt**. Hiányos impresszummal vagy ÁSZF nélkül elutasítja.

Az elállási jog kizárására (45/2014. Korm. r. 29. § (1) c) — egyedi termék) a
feltöltési űrlapon, közvetlenül a küldés gomb fölött külön figyelmeztetés hívja
fel a figyelmet, ahogy a jogszabály előírja.

### Cookie-sáv

Az oldal alján megjelenő sáv három lehetőséget ad: *Részletek*, *Csak a
szükségeseket*, *Elfogadom*. A **Barion Pixel csak az „Elfogadom" után töltődik
be** (`PIXEL_REQUIRES_CONSENT=true`). A választás 12 hónapig érvényes, utána a
rendszer újra rákérdez. A láblécben a *Cookie beállítások* gombbal bármikor
visszavonható.

### Admin jelszó hash-elve

```bash
npm run hash-password
```

A kiírt `ADMIN_PASSWORD_HASH=scrypt$...` sort másold a `.env`-be, és töröld a
nyílt szöveges `ADMIN_PASSWORD` értékét. Ha a hash ki van töltve, a rendszer a
nyílt jelszót figyelmen kívül hagyja. Indításkor a konzol kiírja, melyik mód aktív.

Session titok generálása: `npm run gen-secret`

### Számlázás

A `server/invoice.js` sikeres fizetés után automatikusan számlát állít ki.
Két szolgáltató támogatott: **Számlázz.hu** (Agent XML API) és **Billingo** (v3 REST).

```ini
INVOICE_ENABLED=true
INVOICE_PROVIDER=szamlazz
SZAMLAZZ_AGENT_KEY=<agent kulcs>
```

`INVOICE_ENABLED=false` esetén a modul csak naplóz a `data/invoice-outbox.log`
fájlba — a fizetés ettől hibátlanul működik.

A számlázás **soha nem blokkolja a fizetést**: ha a szolgáltató nem elérhető, a
fizetés rendben lezárul, a hiba a naplóba kerül, és a számla kézzel pótolható.

> Élesítés előtt állíts ki egy próbaszámlát, és ellenőrizd a NAV-adattartalmat is.

### Kereső és megosztás

- `/robots.txt` és `/sitemap.xml` a `PUBLIC_URL` alapján, automatikusan
- A védett oldalak (admin, fiók, rendeléseim, uploads) ki vannak zárva az indexelésből
- Canonical, Open Graph, Twitter Card és JSON-LD (`JewelryStore`) az `index.html`-ben
- Ismeretlen útvonalon márkázott **404 oldal**, helyes HTTP státuszkóddal

---

## 10. Biztonság

| Elvárás | Megvalósítás |
|---|---|
| Bankkártyaadat ne tárolódjon | A rendszer soha nem lát kártyaadatot — az a Barion PCI-DSS oldalán marad |
| POSKey ne szivárogjon | Csak a `.env`-ben és a szerver memóriájában; a `/api/config` nem adja vissza |
| Árhamisítás | Az árat **kizárólag az admin** állítja be szerveroldalon; a kliens nem küldhet árat |
| Fizetés csak jóváhagyás után | A szerver ellenőrzi: `NOT_PAYABLE`, ha nincs `approved` státusz és ár |
| Idegen ne fizethessen más rendelését | Tulajdonos-ellenőrzés — tesztelve: HTTP 403 |
| Feltöltött képek védelme | Csak a tulajdonos és az admin érheti el; kijelentkezve 401, idegennek 403 |
| Fájltípus | Csak JPEG / PNG / WebP; a fájlnevet a szerver generálja |
| Jelszavak | scrypt (N=16384), egyedi só, `timingSafeEqual` |
| Admin belépés | Időzítéstámadás-biztos összehasonlítás; rossz jelszónál nem árulja el a fiók létét |
| Munkamenet | HMAC-aláírt, HttpOnly, SameSite=Lax süti |
| Brute force | Sebességkorlátozás a belépési végpontokon |
| Státusz hamisítás | A fizetés státusza **csak** a Barion `GetPaymentState` válaszából jön |

---

## 11. Élesítés előtti teendők

A `.env` fájlban:

| Beállítás | Most | Élesben |
|---|---|---|
| `ADMIN_USERNAME` | `20000902` | **egyedi felhasználónév** |
| `ADMIN_PASSWORD_HASH` | üres | **`npm run hash-password` kimenete** (az `ADMIN_PASSWORD` maradjon üresen) |
| `BARION_ENV` | `test` (sandbox) | `prod` |
| `BARION_POS_KEY` | sandbox POSKey | **éles POSKey** |
| `BARION_PAYEE` | sandbox fiók e-mail | **éles Barion e-mail** |
| `BARION_SHOP_ID` | sandbox Public key | **éles Public key** |
| `BARION_PIXEL_ID` | sandbox Pixel Id | **éles Pixel Id** |
| `PUBLIC_URL` | `http://localhost:3000` | `https://sajatdomain.hu` |
| `NODE_ENV` | `development` | `production` |
| `SESSION_SECRET` | üres | hosszú véletlen érték |
| `MAIL_ENABLED` | `false` | `true` + SMTP adatok |
| `GOOGLE_CLIENT_ID` | üres | valós Client ID |
| `SHOP_*` | minta | valós cégadatok |
| `COMPANY_*` | üres | **valós cégadatok** — enélkül [KITÖLTENDŐ] látszik a jogi oldalakon |
| `LEGAL_EFFECTIVE_FROM` | üres | a jogi szövegek hatálybalépése |
| `INVOICE_ENABLED` | `false` | `true` + számlázó API kulcs |
| `PIXEL_REQUIRES_CONSENT` | `true` | maradjon `true` (GDPR) |

`SESSION_SECRET` generálása:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**További teendők:**

1. **HTTPS** — a Barion callback és a Google belépés is megköveteli.
   Fedorán a legegyszerűbb a Caddy: automatikus Let's Encrypt tanúsítvány.
2. **Jogi szövegek** — az öt oldal (ÁSZF, adatkezelés, impresszum, elállás,
   cookie) elkészült, lásd a 9.6 pontot. Amit tenned kell: töltsd ki a
   `COMPANY_*` értékeket a `.env`-ben, és **nézesd át a szövegeket jogásszal**.
   A jogi oldalakon piros [KITÖLTENDŐ] jelöli, mi hiányzik még.
3. **Mentés** — a `data/` és a `public/uploads/` mappát rendszeresen menteni kell.
4. **Számlázás** — kész, `server/invoice.js`. Csak be kell kapcsolni:
   `INVOICE_ENABLED=true` + a szolgáltató API kulcsa. Lásd a 9.6 pontot.
5. **Adattárolás** — a JSON-fájlos tárolás kis forgalomra készült. Nagyobb
   terhelésnél a `server/db.js` cserélhető PostgreSQL-re, a többi modul
   változatlanul hagyható.

---

## 12. Hibaelhárítás

| Tünet | Megoldás |
|---|---|
| Üres oldal, `app.js 404` | `npm run build` |
| `EADDRINUSE` | `PORT=3001 npm start` |
| Nem tudok belépni adminként | Ellenőrizd a `.env`-ben az `ADMIN_USERNAME` / `ADMIN_PASSWORD` sort; szóköz ne legyen a végén |
| A kép nem jelenik meg | A képek csak bejelentkezve érhetők el — ez szándékos |
| Nem jön e-mail | `MAIL_ENABLED=false` esetén a `data/mail-outbox.log` fájlban nézd meg |
| „SZIMULÁCIÓ" felirat | Nincs `BARION_POS_KEY` — szándékos |
| `ModelValidationError (PaymentWindow)` | `BARION_PAYMENT_WINDOW=1.00:00:00` legyen, ne `P1D` |
| Permission denied a `data/` mappán | `sudo restorecon -Rv ~/she-said-yes` |

---

## 13. API végpontok

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/api/config` | Publikus beállítások |
| POST | `/api/auth/register` · `/login` · `/logout` · `/google` | Felhasználókezelés (a `/login` kezeli az admint is) |
| GET | `/api/auth/me` | Aktuális felhasználó |
| PUT | `/api/auth/me` | Profil mentése |
| POST | `/api/requests` | **Képfeltöltés** (multipart) |
| GET | `/api/requests` | Saját kérések |
| GET | `/api/requests/:n` | Egy kérés |
| GET | `/api/admin/requests` | *(admin)* Összes kérés + statisztika |
| POST | `/api/admin/requests/:n/approve` | *(admin)* **Jóváhagyás + ár** |
| POST | `/api/admin/requests/:n/reject` | *(admin)* Elutasítás |
| POST | `/api/admin/requests/:n/status` | *(admin)* Státuszléptetés |
| GET | `/api/admin/export.csv` | *(admin)* **Táblázat letöltése CSV-ben** (`?status=&q=`) |
| GET | `/api/admin/export.xls` | *(admin)* **Táblázat letöltése Excelben** (`?status=&q=`) |
| GET | `/api/admin/users` | *(admin)* Ügyféllista |
| POST | `/api/payment/start` | Barion fizetés indítása |
| GET/POST | `/api/payment/callback` | Barion IPN |
| GET | `/api/payment/status/:n` | Fizetés állapota |
| GET | `/api/health` | Állapotellenőrzés |
