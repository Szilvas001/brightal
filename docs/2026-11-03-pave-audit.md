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

## Külön opció-összehasonlítás

Az ismételt stílusellenőrzés után új, páronkénti opcióellenőrzés készült (`node scripts/check-option-differences.mjs`). 2134 vizsgált változatban nem talált egyező geometriai/megjelenési eredményt az adott, alkalmazható opcióértékek között. A modell hálóját, transzformációit, fémanyagát és optikai paramétereit hasonlítja össze. A modern formáknál a közös előnézeti modellt használja, a Boolean geometriát igénylő formáknál a teljes modellt. A részletes modellek külön ellenőrzése a fent dokumentált teljes csomagban szerepel.

A feltételes opciókat érvényes környezetben vizsgálja: oldalkőszín bekapcsolt oldalkövekkel, berakáshossz bekapcsolt kövezéssel, tájolás ovális kővel. Szimmetrikus kőnél a tájolás szándékosan nem választható. A „foglalat a sínnel egyező fémből” és ugyanannak a fémnek a konkrét kiválasztása természetesen azonos eredményt adhat; ez nem hibás vagy hatástalan opció.

További 528 esetben a tisztaság, tanúsítvány és eredet adatának megőrzését ellenőrzi, JSON-mentés/visszaolvasás után is. Ezek rendelési specifikációk, nem külön gyűrűformák.

A böngészőben a gravírozás mindhárom betűtípusa ténylegesen eltérő feliratréteget rajzolt ki, ékezetes szöveggel és szívjellel is (`node scripts/check-engraving-browser.cjs`). Új működési hibát ez a külön ellenőrzés nem talált; további termékmódosítás nem volt szükséges. Az ellenőrzés a megadott alapállapotokat és függő beállításokat fedi le, nem az összes lehetséges együttes paraméterkombináció matematikai bizonyítása.
