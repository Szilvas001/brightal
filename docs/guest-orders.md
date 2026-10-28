# BRIGHTAL – rendelés vásárlói fiók nélkül

A két beküldési út külön űrlapot használ. A gyűrűtervező utolsó lépése a `/gyuruterv-ajanlat` oldalra vezet, automatikusan csatolt tervvel, képfeltöltő nélkül. A `/feltoltes` önálló, üres képfeltöltő űrlap; nem veszi át a gyűrűtervező mentett tervét. Az e-mail-cím és telefonszám kötelező; a név kezdetben opcionális. A beküldés nem végleges megrendelés. Az automatikus első levél azonosítót és privát megtekintési linket tartalmaz. gyűrűtervező esetén 48 órán belüli jóváhagyást, képfeltöltés esetén 48 órán belüli látványtervet ígér. Képfeltöltéses rendelésnél az admin a rendelés kártyáján tölti fel a látványtervet (GIF, PNG, JPG vagy WebP, legfeljebb 10 MB); jóváhagyáskor ez kerül a második e-mailbe és a vásárló privát rendelési oldalára.

Az admin kizárólag a `/admin` oldalon lép be. Az admin belépési gomb ezen az oldalon van; a vásárlói fejlécben nincs belépés vagy regisztráció. A védelmet a szerveroldali adminhitelesítés biztosítja. A meglévő CAD- és ZIP-export megmarad.

Az admin megadja az árat, a gyártási munkanaptartományt (pl. 8–11), a specifikációt, a látványterv URL-jét, szállítási díjat, átadási időt és az ajánlat érvényességét. Jóváhagyás után kerül sorba a második e-mail. A levelek sorrendje biztosított: a második nem előzheti meg az elsőt. Visszavont / lecserélt ajánlat levele nem kerül kiküldésre.

A vásárló a privát linken saját beküldött konfigurációját látja forgatható 3D-ben, letöltheti a JSON-tervet és az ajánlathoz mentett ÁSZF-szöveget. Képfeltöltés esetén az admin által megadott végleges látványterv látszik. A referenciafotóból a rendszer nem generál automatikusan gyártási CAD-ot.

A véglegesítéshez név, e-mail és részletes szállítási cím, valamint az ajánlat nyilatkozatainak elfogadása kell. Az aktuális ajánlat azonosítóját, tartalmi lenyomatát és lejáratát a szerver ellenőrzi. A jóváhagyás ismétlése nem hoz létre új rendelést. A fizetési határidő két hétköznap; munkaszüneti napok külön naptára nincs beépítve. A jóváhagyott ajánlat és a nyilatkozatok változatlan másolata megmarad.

## Éles levelezés – egyetlen `.env` fájl

Javasolt, a szolgáltatónál létrehozandó címek:

| Cím | Szerep |
|---|---|
| `rendeles@brightal.hu` | Automatikus levelek feladója; valódi SMTP-postafiók |
| `hello@brightal.hu` | Ügyfélszolgálat és Reply-To, vásárlói válaszok |
| `admin@brightal.hu` | Új igények és módosítások belső értesítései; alias is lehet |

A címek javaslatok, létezésüket a kód nem feltételezi. A teljes `.env.example` másolata alapján állítsd be:

```dotenv
PUBLIC_URL=https://brightal.hu
SHOP_EMAIL=hello@brightal.hu
COMPANY_EMAIL=hello@brightal.hu
ADMIN_EMAIL=admin@brightal.hu
MAIL_FROM=BRIGHTAL <rendeles@brightal.hu>
MAIL_REPLY_TO=hello@brightal.hu
MAIL_ENABLED=true
SMTP_HOST=smtp.rackhost.hu
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=rendeles@brightal.hu
SMTP_PASS=SZOLGALTATO_ALTAL_MEGADOTT_JELSZO
COMPANY_PHONE=VALOS_TELEFONSZAM
SHOP_PHONE=VALOS_TELEFONSZAM
COMPANY_ADDRESS=VALOS_CEGES_CIM
SHOP_ADDRESS=VALOS_CEGES_CIM
COMPANY_BANK_NAME=OTP Bank Nyrt.
COMPANY_BANK_ACCOUNT=VALOS_SZAMLASZAM
```

587-es port: STARTTLS (`SMTP_SECURE=false`); 465-ös port: közvetlen TLS (`SMTP_SECURE=true`). A szolgáltató szerinti értékek használandók. SPF, DKIM és DMARC DNS-rekordokat is kérj a szolgáltatótól. Ne kapcsold ki a TLS-tanúsítvány ellenőrzését. A végleges domain legyen a PUBLIC_URL, így az e-mailek helyes webcímre mutatnak. Node.js 22+ futtatására alkalmas szerver és HTTPS szükséges.

Az `.env` és az SMTP-jelszó nem kerül Gitbe. A SESSION_SECRET legyen állandó, biztonságosan mentett titok: a privát linkek ehhez kötődnek. Módosítása a meglévő linkeket érvényteleníti.

SMTP nélkül a vásárlói levelek tartós küldési sorban várnak, az adminnál látszik állapotuk. Az éles SMTP bekapcsolása előtt a helyi tesztadatokat különítsd el; az éles szerver ne a fejlesztői adatmappából induljon. Hiányzó bankszámlaszámnál a vásárló kifejezett várakozási tájékoztatást kap, a rendszer nem talál ki számlaszámot.

Az élesítés előtti valós postaládás kézbesítési próbához mindhárom cím és az SMTP-hozzáférés szükséges. A `tests/guest-orders.test.cjs` helyi tesztje külső e-mail küldése nélkül ellenőrzi a folyamatot.

## Rackhost activation

Owner confirms rendeles@ and hello@ are full mailboxes; admin@ is receive-only and forwards to Gmail. Authenticate and send only as rendeles@; use hello@ as Reply-To and admin@ for internal notifications. Owner reports MX/SPF/DKIM and DMARC (p=none) configured.

SMTP_PASS stays in the private .env file. With an SMTP username but no password, delivery remains simulated and customer jobs stay queued. Before activation, review pending test jobs and PUBLIC_URL: localhost links are only suitable for local tests. Production requires the public HTTPS website URL. Restart and verify SMTP authentication after adding the password.

Mac: SMTP_KEYCHAIN_SERVICE=hu.brightal.smtp reads the password from the encrypted macOS login Keychain using SMTP_USER as account. Leave SMTP_PASS empty. The Keychain must be unlocked. Production hosting needs its own secret store; the Mac credential does not travel with Git.
