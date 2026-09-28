# BRIGHTAL webszerver – indítás és üzemeltetés

A legfrissebb, CAD-ot és privát árazási adatokat is lefedő élesítési sorrend: [docs/DEPLOYMENT-HANDOFF.md](docs/DEPLOYMENT-HANDOFF.md). Éles indítás előtt kötelező: `npm run check:production`.

Ez az útmutató a jelenlegi Node.js alkalmazáshoz készült. A GitHub a kódot tárolja; a folyamatosan futó szerver szolgálja ki a vásárlókat. Az éles gép külön számítógép: a saját Windows gépedet kikapcsolhatod.

## 1. Helyi indítás ezen a Windows gépen

PowerShellben:

```powershell
cd C:\Users\Lenovo\Documents\brightal
npm ci
npx playwright install chromium
npm run local
```

Nyisd meg: http://localhost:3000. A terminál maradjon nyitva; leállítás: Ctrl+C. Újraindításkor elég az `npm run local`. Ez fordítja a felületet, előállítja a hiányzó előnézeteket, és szimulált fizetéssel indít. E-mailt és valódi számlát nem küld. A meglévő helyi adatfájlokat használja, ezért tesztelés előtt készíts róluk másolatot.

Foglalt 3000-es port esetén:

```powershell
$env:LOCAL_PORT = '3001'
npm run local
```

Részletek és opcionális CAD/STEP export: [LOCAL-FUTTATAS.md](LOCAL-FUTTATAS.md).

## 2. Éles környezet

Szükséges: Linux VPS tartós lemezzel, domain DNS-hozzáféréssel, SSH-hozzáférés és a GitHub repó olvasási jogosultsága. Egyetlen alkalmazáspéldányt futtass: a jelenlegi adattárolás helyi JSON-fájlokra épül. Több szerverre skálázás előtt közös adatbázis és fájltároló kell.

A következő parancsok friss Ubuntu 24.04 gépen, a szokásos `/opt/brightal` útvonallal és `brightal` felhasználóval értendők. Meglévő szerveren előbb ellenőrizd a tűzfalat, SSH-portot és Caddy-konfigurációt; a telepítő rendszerbeállításokat is módosít.

A DNS-ben a domain és a `www` A rekordja a VPS IPv4 címére mutasson. AAAA rekord csak működő IPv6 esetén legyen. A tűzfalon az SSH tényleges portja, valamint 80 és 443 legyen elérhető; a 3000-es alkalmazásportot ne nyisd ki az internetre.

```bash
sudo apt update
sudo apt install -y git
sudo git clone https://github.com/Szilvas001/brightal.git /opt/brightal
sudo env DOMAIN=sajatdomain.hu bash /opt/brightal/deploy/setup-server.sh
```

Privát repónál szerverhez rendelt olvasási deploy kulcsot használj. A telepítő létrehozza a felhasználót, buildel, előkészíti a konfigurációt, a systemd szolgáltatást, a Caddyt és a napi mentést. A webshopot csak a hiányzó beállítások kitöltése után indítsd el.

## 3. Éles konfiguráció és privát adatok

```bash
sudo nano /opt/brightal/.env
sudo chown brightal:brightal /opt/brightal/.env
sudo chmod 600 /opt/brightal/.env
```

A `.env.production.example` mezőit töltsd ki: `NODE_ENV=production`, `PUBLIC_URL=https://sajatdomain.hu`, `PORT=3000`, erős SESSION_SECRET, admin jelszóhash, bolt- és cégadatok, SMTP, éles Barion, számlázó. Jelszóhash készítése:

```bash
cd /opt/brightal
sudo -u brightal npm run hash-password
```

Az éles fizetésnél `BARION_SIMULATE=false`. A szolgáltatói kulcsokat közvetlenül a szerveren állítsd be. A `.env`, `data/` és `public/uploads/` nem része a Git-pushnak. Ide tartozik a privát `data/supplier-model.json` is: ezt külön, SSH/SFTP útján kell átmásolni vagy az adminban feltölteni. Meglévő éles rendelési adatokat ne írj felül a fejlesztői adatokkal.

Az árbecsléshez valódi beszállítói megfigyelések és legfeljebb hét napos USD/HUF árfolyam szükséges. Árfolyamfrissítés nélkül a rendszer nem ad új HUF-ajánlatot; az elfogadott rendelés ára megmarad.

Előnézetek előállítása a szerveren:

```bash
cd /opt/brightal
sudo npx playwright install-deps chromium
sudo -u brightal npx playwright install chromium
sudo -u brightal npm run build:previews
sudo -u brightal npm run build:ring-previews
```

## 4. Folyamatos futás és HTTPS

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now brightal
sudo systemctl status brightal --no-pager
curl --fail http://127.0.0.1:3000/api/health
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo systemctl reload caddy
curl --fail https://sajatdomain.hu/api/health
```

A Caddy fogadja a HTTPS-kéréseket és a Node.js felé továbbítja őket. A systemd újraindítja az alkalmazást összeomlás után, és elindítja a VPS újraindulásakor is. SSH-kijelentkezés nem állítja le. Élesben ne `npm run local`, `npm run dev` vagy nyitva hagyott terminál tartsa életben.

Indulás után böngészőből ellenőrizd a belépést, admin jogosultságokat, laborgyémánt-árakat, gyűrűtervezést, mentést és rendelési folyamatot. Az egészségi végpont csak a szerver válaszkészségét igazolja; a fizetési, levél- és számlázási integrációkat külön kell ellenőrizni. A STEP exporthoz a külön CAD Python-környezet is szükséges.

## 5. Naplók és hibaelhárítás

```bash
sudo journalctl -u brightal -n 100 --no-pager
sudo journalctl -u brightal -f
sudo journalctl -u caddy -n 100 --no-pager
sudo systemctl restart brightal
```

502 válasznál ellenőrizd a Node szolgáltatást és a belső health URL-t. HTTPS hibánál a DNS-t, 80/443 elérhetőségét és Caddy naplóját. Hiányzó felületnél `npm run build`, hiányzó miniatűröknél az előnézet-generálás szükséges. Az adminban hiányzó árhoz ellenőrizd a privát modellfájlt és az árfolyam dátumát. Nyilvános hibajegybe ne másolj kulcsot vagy személyes rendelési adatot.

## 6. Frissítés, mentés és visszaállítás

Ellenőrzött GitHub-push után, a szerveren:

```bash
sudo bash /opt/brightal/deploy/deploy.sh
```

A frissítés tiszta Git-munkafát követel, ment, telepít, buildel és health ellenőrzést végez. Hiba esetén visszaállítja a korábbi kódot. Az adatokat automatikusan nem állítja vissza, mert az időközben érkezett rendeléseket meg kell őrizni.

Kézi mentés:

```bash
sudo /usr/local/bin/brightal-backup
sudo ls -lh /opt/backup
```

A mentés tartalma: data, uploads és .env. Ezeket külön gépre is másold: ugyanazon a VPS-en tárolt mentés lemezhiba ellen nem véd. Visszaállítási próbát külön tesztmappába végezz, ne az éles fájlokra. Valódi visszaállítás előtt állítsd le az alkalmazást, készíts mentést az aktuális állapotról, majd ellenőrzött archívumból állítsd vissza a kiválasztott fájlokat és tulajdonosukat.

Üzemeltetéskor figyeld a szabad lemezterületet, a mentések sikerét, a HTTPS elérhetőségét és a beszállítói árfolyam frissességét. A domain, szerver és szolgáltatói fiókok megújítása a tulajdonos feladata.
