# Pavé alapstílus és szerkesztési ellenőrzés – 2026-11-03

A pavé hiányzott a névvel és beállításokkal ellátott alapmodellekből. A katalógus tartalékbeállítása a szoliter geometriáját használta, kikapcsolt sínkövezéssel. A saját pavé alapmodell most félkörös, egysoros kövezéssel indul: 1 főkő és 22 sínkő. A szoliter továbbra is 1 főköves, sima sínnel.

A meglévő mentett terveket nem írjuk át: a korábban sima sínnel mentett pavé tervnél az alapstílus újbóli kiválasztása vagy a sín berakásának bekapcsolása alkalmazza a kövezést. Az új előnézeti kép konfigurációhoz kötött címet kap, így a régi képet nem használja az új stíluscsempe.

## Ellenőrzés

- Új regresszió: mind a 44 alapstílus tényleges hálógeometriája különböző, nem csupán a neve vagy a konfigurációja.
- Új regresszió: a pavé alapmodell több valódi követ tartalmaz, mint a szoliter; a stílusváltás a teljes alapbeállítást állítja vissza.
- Mind a 44 stílus részletes nézete sikeresen betöltött a böngészőben.
- A szoliter és pavé csempére kattintás és a pavé kövezés kikapcsolása/visszakapcsolása ellenőrizve.
- Mobilon és asztali nézetben működik a forgatás, nagyítás, eltolás és nézet-visszaállítás. Nincs vízszintes túlcsordulás vagy rögzített böngészőhiba.
- Build, lint, típusellenőrzés és forrásszintaktika sikeres.

A geometriai vezérlők ellenőrzése tényleges hálóváltozást vizsgál. Az eredet, tisztaság és tanúsítvány igényelt termékspecifikáció; ezek nem feltétlenül változtatják a látványtervet. A geometriai teszt nem helyettesíti a gyárthatóság ötvösi ellenőrzését, és nem bizonyít minden lehetséges többváltozós kombinációt.

A teljes tesztcsomag eredménye: **59 sikeres, 0 hibás, 0 kihagyott**. Az új geometriai különbözőség-regressziót külön futtattuk a két meglévő stílusteszttel: **3 sikeres, 0 hibás** (ebből egy új teszt). A teljes csomag a regresszió hozzáadása előtt indult, ezért az összesített futása 59 tesztet tartalmaz.
