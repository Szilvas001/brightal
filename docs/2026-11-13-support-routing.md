# Tartórudak és foglalatok javítása

## A bejelentett hiba

A kőhely kivágása önmagában nem igazolja a tartószerkezet helyességét: egy eredetileg kövön áthaladó rúd a kivágás után a kő felületénél végződő csonkká válhat. Ez magyarázta a friss képen is látható problémát.

## Változtatások

- A tartók a gyűrűtest oldalához csatlakoznak. Az útvonaltervezés a szomszédos köveket, a pavé sort és a rejtett halót is figyelembe veszi. Szükség esetén a bekötési pont a kosár mentén, illetve a gyűrű kerülete mentén elmozdul.
- A tartószakaszok kövekkel való ütközését már a kőhelyek kivágása előtt vizsgáljuk. Az ellenőrzés nem néhány képpontot vagy pillanatképet, hanem a teljes egyenes szakaszt és a rúd sugarával bővített kőtérfogatot használja. Sikertelen útvonalhoz nem engedélyezett az ajánlatkérés.
- A nyitott fémrudak zárt, lekerekített szakaszok Boolean-egyesítéséből készülnek. Így egy vastag, szűken kanyarodó cső belső felülete nem fordulhat önmagába.
- A kosár alacsonyabb csatlakozási síkot, a kősor pedig a gyűrűtest és a pavé méretéhez igazodó minimális magasságot kapott. A felhasználó magasságbeállítása továbbra is hozzáadódik ehhez.
- A dupla karmok közötti távolság a kő körvonalához és méretéhez igazodik. A marquise hegyénél önmagába forduló cső helyett zárt, síkbeli eltolásból képzett foglalat készül.
- A csatornasínek a kősorok mellett helyezkednek el, és folytonos fémfallal kapcsolódnak a gyűrűtesthez.
- Az üreges kőhely negatív térfogatú héját nem szabad leválasztott fémdarabnak tekinteni és törölni, mert az visszatöltené a kő helyét fémmel. A teljesen zárt kis kőhelyek a korona felől rövid hozzáférési nyílást kapnak; megmaradó zárt üreg nem megy át az ellenőrzésen.
- A felületellenőrzés az egyetlen ponton összeérő testeket is elutasítja. A Float32-export nanométeres élmaradványainál legfeljebb 0,00000125 mm-es rácsra illesztés után az összes ellenőrzés újra lefut; az ütközési tűrések nem lazultak.
- A hibás terv figyelmeztetése a letiltott ajánlatkérési állapotban is látszik. A nézet-visszaállítás a teljes gyűrű befoglaló méretéhez igazítja a kamerát.

## Bizonyíték és korlát

A bejelentett pavé/pear/8 karom/5 princess oldalkő konfiguráció külön tesztje a kivágás **előtti**, zárt tartórudakat is metszi a tényleges kövekkel: mind a 20 tartó ütközésmentes. Külön ellenőrzés védi a kész fémtestet, a kő–kő távolságot, az ujjnyílást és a kosár/gyűrűtest kapcsolódását.

A `--supports` tesztmátrix a tartóútvonalakat vizsgálja; ez nem azonos a teljes kész fémtest minden változatának auditjával. A teljes kombinációs késztest-vizsgálat és a teljes tesztcsomag korábbi, fejlesztés közbeni futásai nem befejezett kiadási bizonyítékok. A sikeres célzott ellenőrzéseket ettől külön kell értelmezni.

A változtatás nem szilárdsági, öntészeti vagy kőtartási minősítés. Az összes lehetséges beállítás gyárthatósága nem igazolt; a látványtervet gyártás előtt az ötvösnek és a gyártási CAD-et készítő szakembernek ellenőriznie kell.

## Lezárt kiadási ellenőrzések

- 969 tartóútvonal-változat: 0 ütköző útvonal.
- 44 alapstílus: a kész geometria ellenőrzése után az összes új előnézeti kép elkészült.
- 12 célzott teszt sikeres (geometriai regressziók, szerelvényellenőrzés, oldalkőtávolságok és a tartók valódi csatlakozása).
- Build, lint, típusellenőrzés és forrásszintaxis-ellenőrzés sikeres.
