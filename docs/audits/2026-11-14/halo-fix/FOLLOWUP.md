# Rejtett halo: javítás utáni ellenőrzés – 2026-11-14

A korábbi REPORT.md 11 sikeres / 1 hibás célzott tesztje történeti eredmény. Az ott nyitott Duet/channel/hidden-halo hiba ebben a javításban megszűnt.

## Ok és javítás

A kis halo-gyémántok egy része már a kiinduló modellben a karom belsejébe került. A kivágás ilyenkor zárt üreget hagyott; a nyílás meghosszabbítása a karom átfúrását jelentette volna.

A `halo-layout.mjs` a tényleges karmos/rudas foglalat hálójával vizsgálja a teljes rejtett kősor lehetséges helyeit. Előbb fél kőközzel eltolja a mintát, szükség esetén kifelé igazítja a kősor sugarát. A kövek számát megtartja. A perem és a bekötések ugyanazt az új elhelyezést használják. A gömbpróba csak helykeresés; a regresszió külön, a tényleges kő- és fémtestek térfogati metszésével ellenőriz.

## Befejezett ellenőrzések

- 12/12 célzott regressziós teszt sikeres, beleértve a korábban hibás Duet/channel/hidden-halo esetet.
- Külön új teszt: 54/54 nyers rejtetthalo–foglalat eset sikeres: 9 kőforma × 3 foglalat × 0,3 és 5 ct. Kövek száma változatlan, nincs pozitív térfogati metszés a karmokkal/rudakkal.
- 44/44 alapmodell sikeres a meglévő szerkezeti, háló-, ütközés- és furatellenőrzéseken; részletek a szomszédos JSON-fájlokban.
- 24 kész modell a 0 és 6 mm emelési határon; 20 központi tartószimmetria-eset; a 61 magasságállás milliméteres elmozdulása ellenőrizve.
- Build, lint, típusellenőrzés és forrásszintaxis sikeres.

## Ami továbbra sem lezárt

A 77 195 állapotú teljes bejárás nem futott le. Az összes karom szögeloszlása/hossza, a teljes és többfoglalatos szimmetria, a végső test globális falvastagsága, a kőrögzítés, az önmetszés és az export teljes visszaolvasási bizonyítása továbbra is nyitott. A célzott tesztek sikere nem jelent teljes geometriai vagy gyárthatósági tanúsítást.
