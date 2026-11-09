# Geometriai javítások és az igazolhatóság határai – 2026-11-09

## Talált és javított hibák

- Szög szerinti halo-kiosztás helyett ívhossz és tényleges húrtávolság alapján elhelyezett apró kövek: a csúcsos formáknál nem torlódnak össze a kövek. Megfelelő korábbi kiosztás változatlan maradhat.
- A rejtett halo kőszáma a tényleges kerülethez igazodik, nem feltétlenül 24.
- Az oldalkövek távolsága a teljes központi foglalat/halo térbeli kiterjedését is figyelembe veszi. Fürtös oldalköveknél a csiszolás hossza is számít.
- A kétfőköves Toi & Moi foglalat a forgatott kövek/foglalatok befoglaló méretéhez igazodik.
- A legacy fémtestből a kövek helyét 0,01 mm radiális numerikus ráhagyással vágjuk ki, további felületegyszerűsítés nélkül. Ez a vintage alapmodellnél mért 0,0176 mm³ fém–kő átfedést megszüntette. Ez a számítási ráhagyás nem helyettesíti az ötvös által meghatározott foglalási tűrést.
- A legacy gyűrűk átmeneti, még kivágások nélküli előnézetét nem mutatjuk; a végleges Boolean-modell érkezik a háttérszámításból.

## Folyamatos ellenőrzés és tiltás

Minden részletes modell kap zárt/összefüggő fémtest-ellenőrzést, valódi konvex kőtestek metszetére épülő kőütközés-vizsgálatot, végleges fém–kő metszetvizsgálatot és a névleges ujjnyílást ellenőrző mérést. Számítási küszöbök: kő–kő 0,00001 mm³; fém–kő 0,001 mm³; belső sugár 0,03 mm. Ezek numerikus ellenőrzési küszöbök, nem ötvösi gyártási tűrések.

Hibás modellnél az ajánlatkérés letiltott, a vásárló javítási útmutatást kap. A szerver külön újraszámolja az ajánlatkérést, az adminjóváhagyást és a vásárlói elfogadást/fizetésindítást; a böngésző jelzésének megkerülése nem elég. Hibás műhelycsomaghoz nem mellékelünk validált fém-STL-t. A koncepció-OBJ és az ellenőrzési jelentés továbbra is használható műhelybeli javításhoz.

## Mérési eredmények

- Mind a 44 alapmodell megfelelt a részletes fém-, kőütközés-, fém–kő és belsőméret-ellenőrzésnek.
- Determinisztikus, 1398 kombinációs kőütközés-mátrix: kezdetben 213 hibás eset; a javítások után 30 módosítandó eset maradt. Ezeket a futásidejű ellenőrzés elutasítja. Nem állítjuk, hogy a fennmaradó 1368 mindegyike gyártásra kész: ez a mátrix a kőütközést mérte.
- 17 célzott regressziós teszt sikeres: műhelycsomag, mentés, rendelési folyamat, stílusok, távolságok, új kő/fém ellenőrzések és szerveroldali tiltás.
- A böngészőben külön ellenőrzés készült az érvényes terv engedélyezésére és az ismert hibás terv ajánlatkérésének tiltására.
- Reprodukció: `node scripts/check-assembly-combinations.mjs`; jelentés alapértelmezetten `/tmp/brightal-assembly-combinations.json`, felülírható `ASSEMBLY_AUDIT_OUTPUT` értékkel.

## Nem igazolt gyártási követelmények

Ez nem teljes kombinatorikus bizonyítás és nem gyártási tanúsítás. A több, egymástól függő csúszka, kőválasztás és szabad szöveg összes együttes állapota nem néhány ezer eset. A matematikailag zárt, ütközésmentes modell önmagában nem bizonyít megfelelő helyi falvastagságot, karomszilárdságot, valódi kőrögzítést, szerelhetőséget vagy önthetőséget. A kiválasztott karátérték nem valódi kőszkennelés; a gravírozás a megjelenítésben feliratréteg, nem kivont gyártási geometria. Anyagonkénti zsugorodás, polírozási ráhagyás, valódi kőméretek és műhelytechnológia még szakmai ellenőrzést igényelnek. A parametrikus STEP-előkészítő külön műhelymodell, nem minden tervezőfunkció pontos megfelelője.

**Hetznerre telepítés nem történt. Automatikusan, ötvösi ellenőrzés nélkül gyártható konfigurátorként az élesítés nincs igazolva.**
