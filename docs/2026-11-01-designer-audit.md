# 3D és szerkesztési ellenőrzés – 2026-11-01

## Javítás

A signet, open és stack stílusok gyors előnézete inicializálatlan geometriai kernelt használt a fő böngészőszálon. Ezeket most közvetlenül az inicializált geometriai worker rajzolja ki. A javítás a tervezőben és a rendelés látványtervében is érvényes.

## Ellenőrzött eredmények

- Mind a 44 katalógusstílus részletes 3D nézete betöltött valódi böngészőben.
- A teljes automatikus tesztcsomag: 59 sikeres, 0 hibás, 0 kihagyott teszt. Szerkesztési vezérlők, geometria, stílusváltás, rendelési folyamat, levelezési sablonok és árazási szabályok ellenőrzése. A tesztlevelek nem valódi vásárlóknak mentek.
- Asztali és mobil nézetben működik a forgatás, nagyítás, eltolás és visszaállítás; nincs vízszintes túlcsordulás vagy rögzített böngészőhiba.
- Mind a 11 CAD-próba sikeres STEP/STL exporttal és geometriai ellenőrzéssel. A Cathedral első, hideg indítása időtúllépést okozott; célzott ismétlésben 11 másodperc alatt sikerült. Ez nem jelenti azt, hogy mind a 44 stílushoz külön parametrikus STEP-gyártási modell készült.
- Lint, típusellenőrzés és forrásszintaktika: sikeres.
- A helyi CAD-környezet telepítve. Az adminjelszó helyi tárolása hashre váltott, a belépési jelszó változtatása nélkül.

## Élesítési korlátok

A production-ellenőrzés továbbra is blokkolja a teljes éles használatot: hiányzik a publikus HTTPS PUBLIC_URL, a valódi COMPANY_BANK_ACCOUNT és az ellenőrzött data/supplier-model.json beszállítói ármodell. Ezeket üzleti adatok nélkül nem lehet hitelesen kitölteni. A helyi környezet és a titkos beállítások nem kerülnek GitHubra; az éles gépen külön beállítás szükséges.

Az automatikus ellenőrzés nem helyettesíti az ötvös gyárthatósági jóváhagyását, és nem bizonyít minden lehetséges paraméterkombinációt. Az ellenőrzött böngésző- és tesztesetekben minden vizsgált funkció működött.

Új ismételhető ellenőrzés: `npm run test:styles-browser` (futó localhost:3000 mellett). Egy CAD-stílus célzott ellenőrzése: `CAD_TEST_STYLE=cathedral npm run test:cad`.
