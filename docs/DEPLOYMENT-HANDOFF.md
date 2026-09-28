# Élesítési átadás – a következő Codex munkamenetnek

Frissítve: 2026-09-28. Repo: Szilvas001/brightal, branch: main.
Az astra-baseline tag változatlan: ae881fbf2b2af8470adf53b3a7b9a1be70d4af55.

## Állapot és döntések

- Meglévő Express/React/Three.js alkalmazás, helyi JSON-adattár. Egyetlen Node-példány fusson; ne legyen PM2 cluster vagy több replika.
- Cél: friss Ubuntu 24.04 x86-64 VPS, /opt/brightal, brightal rendszerfelhasználó, Node 22, systemd + Caddy. Kiinduló erőforráskeret CAD-hoz: legalább 4 GB RAM; a szolgáltatás korlátja 3 GB. A tényleges terhelést élesítés előtt mérni kell.
- A felhasználó végleges árképzési döntése: DIPEN beszerzési modell ×2. Nem Noordia −10%. A modell magánadatai nem kerülhetnek GitHubra.
- A katalógus paraméter alapján beszerzendő köveket kínál. A kép/méret illusztráció, a cert beszerzéskor érkezik. Nincs kitalált készlet vagy IGI-szám.
- A becslés kevés ellenőrzött ajánlaton alapul. Az adminban frissíteni kell a megfigyeléseket és a devizaárfolyamot. Az árfolyam hét nap után lejár; ne frissítsd az időbélyeget ellenőrzés nélkül.
- Mentett gyűrűk: a böngésző saját gyűjteménye localStorage-ban van; localhost → domain váltáskor NEM költözik automatikusan. Költözés előtt mentsd/exportáld a konfigurációkat, vagy készíts admin exportokat.
- CAD fájlok és ügyfélrendelések szerveroldalon tárolódnak; minden CAD API adminjogot kér. STL csak sikeres mesh-validációval, STEP csak támogatott parametrikus családokhoz. Ötvös végső jóváhagyása mindig szükséges.

## A felhasználótól ténylegesen szükséges az élesítéskor

Választott domain és DNS-hozzáférés; VPS IP és SSH-hozzáférés; végleges cégadatok; erős adminjelszó; éles Barion POSKey/payee; SMTP és számlázási szolgáltató adatai. Ezeket ne kérd nyilvános repóba vagy dokumentumba. Szerver még nincs ebben a feladatban kiválasztva/megrendelve. Új szolgáltatás vásárlásához külön konkrét felhatalmazás kell.

## Telepítés

1. Olvasd el a WEBSZERVER-INDITAS.md-t. Ellenőrizd a main friss állapotát; ne írj felül más munkát. Csak tiszta, friss szerveren használd a setup-server.sh-t (tűzfalat és Caddy-konfigurációt módosít).
2. SSH-kulccsal csatlakozz. A DNS A rekord és www rekord a VPS-re mutasson; AAAA csak működő IPv6 esetén. Nyitott portok: a tényleges SSH-port, 80, 443. A Node csak 127.0.0.1:3000-en figyeljen.
3. Klónozd a repót /opt/brightal alá, majd `sudo DOMAIN=valodi-domain.hu bash /opt/brightal/deploy/setup-server.sh`. A telepítő npm ci-t, buildet, CadQuery venv-et, Chromiumot és előnézeteket készít. A Node-ot még nem indítja el.
4. Töltsd ki /opt/brightal/.env-et a production példa alapján; chmod 600, tulajdonos brightal. Ne legyen inline komment egy érték végén. A jelszóhoz `npm run hash-password`; ne tedd parancssori argumentumba. Az éles indítás elutasítja a hiányzó hash-t, HTTPS-t, session titkot, cégadatokat és valódi Barion-beállításokat.
5. Leállított forrás és cél mellett privát SSH/SFTP csatornán másold át a szükséges data/ és public/uploads/ állományokat. Ne másold át vakon a fejlesztői tesztrendeléseket: az üzleti adatokat az adminnal külön azonosítsd. supplier-model.json és CAD exportok különösen fontosak. Beállítások/megfigyelések titkosak; chmod 600 és brightal tulajdonos. A forrásról előbb teljes privát biztonsági mentés kell.
6. `cd /opt/brightal && sudo -u brightal npm run check:production`. A parancsnak hibamentesen kell lefutnia; hiányzó modell, friss árfolyam, CAD-kernel vagy a tíz előnézet is blokkoló.
7. `sudo caddy validate --config /etc/caddy/Caddyfile`; `sudo systemctl daemon-reload`; `sudo systemctl start brightal`; `sudo systemctl reload caddy`.
8. Ellenőrizd a /api/health címet helyben és HTTPS-en. A domainhez Caddy intézi a tanúsítványt. Forrás: https://caddyserver.com/docs/automatic-https . CadQuery telepítés: https://cadquery.readthedocs.io/en/latest/installation.html .

## Átadás előtti kötelező próba a célgépen

- Főoldal/hátterek, ring-builder, feltöltés, diamonds asztali és mobil nézetben.
- Vásárlói belépés és admin; nem admin CAD-kérés 403; valódi mentett terv STEP/STL/ZIP letöltés és visszanyitás.
- Tíz gyémántforma képe és 360° nézete; forma/szín/tisztaság/karát váltás; szerveres ár és checkout egyezése. Beszerzendő kombináció nem igazolt raktárkészlet.
- Barion visszatérés és webhook HTTPS-en, email és számlázás. Éles pénzmozgást csak a felhasználó által engedélyezett összeggel végezz; a helyi szimuláció nem bizonyítja az éles integrációt.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run test:cad`.
- VPS újraindítás utáni automatikus indulás; /opt/backup mentés visszaállítási próba külön könyvtárba. A gépen belüli backup mellett állíts be külön gépre titkosított mentést.

## Üzemeltetés és visszaállás

Frissítés: `sudo bash /opt/brightal/deploy/deploy.sh`; állapot: `systemctl status brightal`; napló: `journalctl -u brightal -n 100` (titkokat ne másolj chatbe). A deploy leállítás után ment és csak fast-forward frissít; hiba esetén kódot visszaállít. Adatséma-változáskor külön migráció/visszaállítás kell, a kódrollback önmagában nem adatrollback.

A mentések a privát modellt és .env-et is tartalmazzák, ezért csak root számára hozzáférhetők. A public/uploads kizárólag alkalmazáson keresztül legyen kiszolgálva; soha ne állítsd a Caddy gyökerét a repo/data könyvtárra. CAD-kimenetnek nincs nyilvános statikus URL-je.

## Helyi bemutató

Linuxon: `npm run build && npm start`, majd http://localhost:3000 . Windows: LOCAL-FUTTATAS.md. Az adminban „Admin CAD-műhely” → mentett terv → „3D terv elkészítése”; a kész fájlok alulról is visszaválaszthatók. A STEP-hez „Terv megnyitása” → „Parametrikus STEP · műszaki beállítások”.
