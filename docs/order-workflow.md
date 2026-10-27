# Rendelés, ötvösi jóváhagyás és átutalás

A gyűrűtervező és a képfeltöltés ugyanabba a rendelésnyilvántartásba ment.
A `BRG-…` azonosító a vásárlói fiókban, az adminban, az e-mailekben és az átutalás közleményében azonos.

1. Beküldés: `submitted`, első e-mail a küldési sorba kerül. A fiókban a rendelés azonnal látható.
2. Az admin rendelésénél megadható a teljes bruttó összeg és a munkanaptartomány (`2-5`, `8-11`). Az **Elfogad** gomb `approved` állapotot ment és sorba állítja a második e-mailt.
3. A vásárló ellenőrzi és véglegesíti az összesítőt, majd banki átutalással fizet. Barion-fizetés nem indul.
4. Az admin a tényleges banki jóváírás alapján, banki hivatkozással rögzíti a beérkezést. Ezt a vásárló nem tudja megtenni.
5. A meglévő teljesítés előtti ellenőrzés, gyártási és elkészült státusz továbbra is kezelhető.

Az egyórás visszajelzés üzleti vállalás: nincs automatikus jóváhagyás vagy kitalált határidő. Az adminnak az ötvös válasza alapján kell megadnia az időt. Az elkészítési napok az átutalás beérkezésétől számított munkanapok.

## Valódi e-mail

A szerver privát `.env` fájljában:

```dotenv
MAIL_ENABLED=true
SMTP_HOST=smtp.a-szolgaltatod.hu
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=szolgaltatoi-felhasznalo
SMTP_PASS=szolgaltatoi-jelszo
MAIL_FROM=BRIGHTAL <rendeles@a-sajat-domained.hu>
PUBLIC_URL=https://a-sajat-domained.hu
COMPANY_BANK_NAME=OTP Bank Nyrt.
COMPANY_BANK_ACCOUNT=valodi-bankszamlaszam
```

A kedvezményezett a `COMPANY_NAME`. A feladót a levelezőszolgáltatónál hitelesíteni kell (a szolgáltató szerinti domain/SPF/DKIM-beállításokkal). A titkos adatokat ne commitold. A beállítás után indítsd újra a szervert.

A privát `data/mail-jobs.json` tárolja a két rendelési levél pillanatképét és küldési állapotát. SMTP nélkül a levelek várakoznak, nem jelöljük őket elküldöttnek. Ideiglenes hiba után legfeljebb öt automatikus kísérlet történik; az admin rendelésénél újrapróbálás kérhető. A második levél csak az első sikeres SMTP-átadása után indul. Az „Elküldve” az SMTP-szolgáltató átvételét jelenti, nem garantált postaládai kézbesítést. Folyamatleállás közvetlenül az SMTP-átadás után ritkán ismételt küldést okozhat.

A 3D rendelésekhez a szerver 24 képkockás forgó GIF-et generál, a képes rendelésekhez a feltöltött fotót csatolja beágyazott képként. Egyes e-mail-kliensek csak az első GIF-képkockát mutatják. A rendereléshez szükséges:

```sh
npm ci --include=dev
npx playwright install chromium
```

A gyártási fájlokat nem csatoljuk a vásárlói e-mailhez. A teljes 3D csomag, OBJ/STL és a támogatott családok STEP-exportja az admin rendelésénél érhető el; a végpontok adminhitelesítést igényelnek. Referenciafotóból nem keletkezik automatikusan CAD-modell.

## Google-belépés

A meglévő Google Identity Services belépés első alkalommal automatikusan létrehozza a vásárlói fiókot, külön regisztrációs űrlap nélkül. Meglévő azonos e-mailes fióknál a rendeléseket megtartja.

A Google Cloud OAuth webes kliensében engedélyezd a tényleges origin címét (helyben `http://localhost:8000`, élesen a saját HTTPS-domain), és állítsd be a `GOOGLE_CLIENT_ID` értékét. Ezután indítsd újra a szervert. Kliensazonosító nélkül a Google-gomb nem jelenik meg.

A tájékoztató oldal: `/rendeles-menete` és `/ordering`, az ÁSZF mellett a láblécből elérhető.
