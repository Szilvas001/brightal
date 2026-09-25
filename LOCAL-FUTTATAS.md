# BRIGHTAL helyi futtatás – Windows / PowerShell

Projekt ezen a gépen: `C:\Users\Lenovo\Documents\brightal`

GitHub: https://github.com/Szilvas001/brightal – `main` ág.
Ellenőrzött helyi környezet: Node.js 24.18.0, npm 11.16.0.

## Indítás

PowerShellben:

```powershell
Set-Location C:\Users\Lenovo\Documents\brightal
npm ci
npx playwright install chromium
npm run local
```

Az első két telepítési parancs új klónozáskor, illetve függőségfrissítéskor szükséges.
A `npm run local` minden indítás előtt elkészíti a webshop, a tervező és a geometriai worker buildjét.
Az első indításkor a hiányzó gyűrű-inspirációs képeket is legenerálja; ez több percig tarthat.
Későbbi indításkor a meglévő képeket újra felhasználja.
A terminált hagyd nyitva; leállítás: Ctrl+C.

- Webshop: http://localhost:3000
- Laborgyémánt vásárlás: http://localhost:3000/diamonds
- Gyűrűtervező: http://localhost:3000/ring-builder
- Képfeltöltés: http://localhost:3000/upload
- Admin: http://localhost:3000/admin

A helyi indító kifejezetten szimulált fizetést, e-mailt és számlázást állít be.
Nem szükséges Barion-kulcs, SMTP vagy adatbázis-szerver. A rendeléseket a `data` mappába menti.
A `.env` egyéb beállításait betölti, de a fenti külső szolgáltatásokat helyi futtatásnál kikapcsolja.
A `npm start` ezzel szemben a `.env` szerinti beállításokkal indul, build nélkül.

## Admin és vásárlói fiók

Ha nincs saját `.env`, a fejlesztési admin felhasználó `20000902`, jelszava `12345`.
Ez csak helyi fejlesztési alapérték. Saját beállításhoz másold a `.env.example` fájlt `.env` néven,
és állítsd az `ADMIN_USERNAME`, `ADMIN_PASSWORD` vagy `ADMIN_PASSWORD_HASH` értékét.
Meglévő `.env` fájlt ne írj felül. A vásárlás külön vásárlói regisztrációval tesztelhető; az admin nem rendelhet.

## Valódi DIPEN-árak

A vásárlói kombinációválasztó ugyanazt a beszállítói modellt használja, mint az admin.
Az ár **adminos becsült DIPEN kőár HUF-ban × 2**, egyszer egész forintra kerekítve.
10 forma, D–M szín, FL–SI2 tisztaság és 0,10–30 ct választható.
A modell más kombinációkra is becslést készít; ez nem beszállítói készletigazolás.
A vásárló egyedileg beszerzendő követ rendel, a szerver az elfogadott árat rögzíti.
Egy későbbi árfolyamváltozás a már rögzített rendelési árat nem módosítja.

Az adatok privát fájlja: `data\supplier-model.json` (vagy `SUPPLIER_MODEL_FILE`).
A Git-repó **nem tartalmazza** a beszállítói adatokat. A 2026-09-25-i helyi ellenőrzéskor
ez a fájl hiányzott; valódi árat enélkül nem lehet megjeleníteni.

Az eredeti környezetből biztonságosan másold át a fájlt, vagy az admin
„DIPEN · beszerzési becslés és adatok” paneljén importáld a valódi megfigyeléseket.
A formátumot a `docs/supplier-pricing.md` írja le.
Rögzíts valóban ellenőrzött USD/HUF árfolyamot forrással és időponttal;
7 napnál régebbi árfolyammal új rendelés nem hozható létre.
Az adatok betöltése után a vásárlói oldalon kattints az „Ár frissítése” gombra.

Az igazolt, konkrét készlet külön `data\diamond-catalog.json` fájlban van.
Katalógus nélkül a kártyák fejlesztési minták, nem eladó kövek.
Az egyedi kombináció rendelése ettől független, ha a DIPEN-modell és az árfolyam rendelkezésre áll.
A `.env`, beszállítói adatok, vásárlói adatok és feltöltések nem kerülnek Gitbe;
ezeket külön privát mentésből kell visszaállítani.

## Tervező, képek és export

A 3D tervezőhöz WebGL-képes böngésző és bekapcsolt grafikus gyorsítás kell.
A mentett helyi tervek ugyanazon böngésző és origin tárhelyében maradnak;
tartós másolathoz használd a JSON-exportot. A szerverre beküldött tervek a `data` mappába kerülnek.
A 3D mesh export Node.js-szel működik. A külön adminos STEP CAD-hoz Python és CadQuery szükséges:

```powershell
py -3.11 -m venv .venv-cad
.\.venv-cad\Scripts\python.exe -m pip install -r server\cad\requirements.txt
npm run test:cad
```

Ehhez Python 3.11 telepítése szükséges. Windows alatt a szerver automatikusan a
`.venv-cad\Scripts\python.exe` útvonalat használja. Más telepítésnél a `CAD_PYTHON` változóval állítható.
A CAD környezet külön opcionális függőség; a webshop és a böngészős tervező Python nélkül indul.
A gyártás előtti műhelyi ellenőrzést a geometriai tesztek nem helyettesítik.

A gyémántképek generálásához kell a fenti Playwright Chromium-telepítés.
Előgenerálás egy második terminálból: `npm run build:previews`.
Internet az első függőségletöltéshez és a jelenlegi React/ReactDOM CDN betöltéséhez szükséges.

## Ellenőrzés és hibaelhárítás

```powershell
npm test
npm run check
npm run lint
npm run typecheck
```

A geometriai tesztek ezen a gépen több percig is futhatnak.

- Foglalt 3000-es port: ugyanabban a PowerShellben `$env:LOCAL_PORT='3001'`, majd `npm run local`.
  Ekkor a cím http://localhost:3001. Ne állíts le ismeretlen folyamatot.
- Hiányzó/korábbi tervező: indítsd újra a `npm run local` paranccsal, majd Ctrl+F5.
- Hiányzó termékkép: `npx playwright install chromium`, majd `npm run build:previews`.
- Nincs ár: ellenőrizd a valódi DIPEN-adatokat és az adminban az árfolyam frissességét.
- PowerShell tiltja az npm.ps1 futtatását: használd az `npm.cmd` és `npx.cmd` parancsokat.
- STEP export hibás: ellenőrizd a Python/CadQuery telepítést; a mesh export másik útvonal.

## Frissítés GitHubról

Leállított szervernél, tiszta munkakönyvtárban:

```powershell
git pull --ff-only origin main
npm ci
npm run local
```

A buildelt JS-fájlok és a `node_modules` újra előállíthatók, ezért nem kerülnek Gitbe.
A teljes forrás, a függőségek rögzített verziói és ez az útmutató a repó része.
