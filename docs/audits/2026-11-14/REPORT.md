# Geometriai audit – munkaverzió, 2026-11-14

**Frissítés:** a Duet-hiba javítását és az új sikeres célzott teszteket a [követő jelentés](halo-fix/FOLLOWUP.md) tartalmazza. Az alábbi táblázatok a korábbi állapot történeti eredményei.

**Nem teljes audit.** A felhasználó kérésére külön munkaágon feltöltött részállapot.

## 1. Leltár

| Stílusazonosító | Megjelenített név |
|---|---|
| solitaire | Örök klasszikus |
| hiddenhalo | Secret Halo |
| bezel | Modern Bezel |
| tension | Suspended Bridge |
| halo | Párizsi fények |
| trilogy | Modern Trio |
| vintage | Rózsakert |
| pave | Pavé ragyogás |
| band | Essential Diamond |
| duet | Dialogue |
| cathedral | Éjszakai múzsa |
| split | Air Split |
| eternity | Diamond Half Band |
| bezelrow | Bubble Bezel |
| scatter | Stardust Cigar |
| chevron | Diamond Wishbone |
| ribbon | Diamond Ribbon |
| graduated | Graduated Rivière |
| eastwest | East–West Capsule |
| alternating | Deco Mosaic |
| crown | Marquise Crown |
| curvedoval | Arc Oval |
| wavebezel | Tidal Bezel |
| openpair | Twin Light |
| contour | Nesting Arc |
| asymmetric | Offset Constellation |
| fullcircle | Full Eternity |
| wave | Liquid |
| rope | Croissant |
| dome | Bombé |
| signet | Diamond Signet |
| open | Sculpted Bypass |
| stack | Connected Stack |
| fluted | Kannelúra |
| petal | Szirom |
| twist | Csavart szalag |
| saddle | Nyereg |
| ripple | Víztükör |
| tapered | Aranyváll |
| aurora | Aurora |
| orbit | Orbit |
| lotus | Lótusz |
| shield | Pajzs |
| braid | Fonat |

### Foglalatok, kőformák és választók

- **shape**: round, oval, cushion, emerald, pear, princess, marquise, radiant, asscher
- **metal**: yellow14, yellow18, white14, white18, rose14, rose18
- **finish**: polished, satin, brushed
- **color**: D, E, F, G, H, I, J
- **clarity**: FL, IF, VVS1, VVS2, VS1, VS2, SI1
- **certificate**: IGI
- **origin**: lab
- **accents**: none, pave, channel
- **profile**: round, flat, knife
- **light**: studio, daylight, evening
- **gemTone**: ice, champagne, blush, canary, sapphire, emeraldGreen, ruby
- **sideTone**: ice, champagne, blush, canary, sapphire, emeraldGreen, ruby
- **sideShape**: round, oval, pear, emerald, marquise, princess, asscher
- **sideMode**: none, pair, cluster, five
- **setting**: claw, bezel, doubleclaw
- **orientation**: north, east
- **headMetal**: match, white18, yellow18, rose18
- **coverage**: shoulders, half, full
- **halo**: single, double
- **engravingFont**: serif, script, modern
- **face**: oval, cushion, round
- **inlay**: metal, onyx, ivory, teal, coral
- **secondaryMetal**: white18, yellow18, rose18

### Numerikus paraméterek

| Paraméter | Minimum | Maximum | Lépés | Alapérték |
|---|---:|---:|---:|---:|
| carat | 0.3 | 5 | 0.1 | 1.5 |
| width | 1.6 | 10 | 0.1 | 2 |
| size | 44 | 72 | 1 | 54 |
| sideCarat | 0.1 | 1.5 | 0.05 | 0.3 |
| sideMainGap | 0 | 1 | 0.05 | 0 |
| sideSpacing | 0 | 0.8 | 0.05 | 0 |
| accentSize | 0.6 | 2 | 0.1 | 1 |
| haloSize | 0.6 | 1.6 | 0.1 | 1 |
| height | 0 | 6 | 0.1 | 0 |
| fire | 0.5 | 1.5 | 0.1 | 1 |
| sculpt | 0.4 | 2.5 | 0.1 | 1.2 |
| rhythm | 2 | 8 | 1 | 4 |
| layers | 2 | 4 | 1 | 3 |
| gap | 0.3 | 1.5 | 0.1 | 0.7 |
| faceSize | 5 | 11 | 0.5 | 7 |
| dailyCount | 1 | 9 | 1 | 5 |
| dailyCarat | 0.05 | 0.3 | 0.01 | 0.1 |
| dailySpacing | 0 | 0.5 | 0.05 | 0.15 |
| stoneLength | 1.5 | 6 | 0.1 | 2.6 |
| stoneWidth | 1.5 | 5 | 0.1 | 2.6 |
| stoneDepth | 1 | 3.5 | 0.1 | 1.6 |
| thickness | 1.4 | 3.4 | 0.1 | 1.6 |
| bezelWall | 0.35 | 0.7 | 0.05 | 0.45 |
| motifDepth | 0 | 1.2 | 0.1 | 0.5 |
| motifOffset | -1 | 1 | 0.1 | 0 |
| edgeSoftness | 0.35 | 1.2 | 0.05 | 0.7 |

Karomszám: 4, 6, 8; mellékkősorok: 1, 2. Logikai választók: rotate, hiddenHalo, mixedMetal, alternateGems, fashionStone. Gravírozás: legfeljebb 24 karakter.

A fenti nyers tartományokat a normalizálás tovább szűkíti. A 33 modern stílus csak bezel foglalatot támogat; a nem támogatott foglalatot a kód átírja. A kőméret, sávszélesség, vastagság és kőszám egymástól függő határokkal rendelkezik. A modern stílusokban a magasság és a karátsúly nem azonos vezérlőként működik a klasszikus modellekkel.

## 2. Talált hibák

| Kombináció | Szabály | Mért hiba / ok |
|---|---|---|
| split alapmodell | A | Tartók tükörkülönbsége: 2.858171 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| trilogy alapmodell | A | Tartók tükörkülönbsége: 1.491513 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| hiddenhalo alapmodell | A | Tartók tükörkülönbsége: 1.299698 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| bezel alapmodell | A | Tartók tükörkülönbsége: 1.541023 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| tension alapmodell | A | Tartók tükörkülönbsége: 3.065736 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| pave alapmodell | A | Tartók tükörkülönbsége: 1.559563 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| solitaire alapmodell | A | Tartók tükörkülönbsége: 1.299698 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| halo alapmodell | A | Tartók tükörkülönbsége: 1.820480 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| cathedral alapmodell | A | Tartók tükörkülönbsége: 1.437300 mm³; egymástól független útvonalkeresés és középvonal-oldalválasztás. |
| 11 klasszikus stílus | D | A javítás előtti nyers tartók mért átmérője kb. 0,386 mm. A külön CAD-modul 0,6 mm fal- és 0,7 mm karomminimumot használ. |
| Duet; 5 ct főkő, 1,5 ct mellékkő, EU44, 5 mm sáv, channel + hidden halo | B/D | A legutóbbi regresszióban két zárt üreg maradt: −0,113463 mm³ / üreg. Nyitott hiba. |
| halo / claw / cushion (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 157.00115, 0.076303, 0.076303, 0.076303, 0.076303, 0, 0 |
| halo / claw / pear (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 158.898414, 0.077398, 0.075564 |
| halo / doubleclaw / round (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 158.508539, 0.072983, 0.072983, 0.072983, 0.072983 |
| halo / doubleclaw / pear (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 160.525863, 0.084095, 0.077532 |
| halo / doubleclaw / princess (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 159.537455, 0.080135, 0.080132 |
| vintage / claw / round (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 162.679661, 0.067361, 0.067361, 0.067361, 0.067361 |
| vintage / claw / marquise (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 167.530592, 0.073494, 0.073494, 0.073494, 0.073494 |
| vintage / doubleclaw / cushion (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 164.152011, 0.070456, 0.070456, 0.070456, 0.070456 |
| vintage / doubleclaw / pear (köztes változat) | B/D | Assembly is not a single metal solid; component volumes mm3: 166.380259, 0.072975 |

## 3. Módosítások

- `support-layout.mjs`: közös jelöltválasztás négy tükrözött tartóra; diagonális bekötések, egyenkénti aszimmetrikus keresés helyett.
- `model.mjs`: tükrözött rudakhoz tükrözött háromszögháló; pavé tartók tükrözött, kőközi lábpontja; növelt szerkezeti átmérők.
- `manufacturing-policy.mjs`: a meglévő CAD-minimumok és a sokszögű keresztmetszet korrekciója.
- `solidify.mjs`: leváló alkatrészek eltávolítása megszűnt; az elkülönült részek hibát okoznak. A kis kövek koronanyílása a tartó átmérőjéhez igazodik.
- `structural-audit.mjs`: tényleges térfogati csatlakozás, tartók tükörkülönbsége, furat–modell metszés, mintavételezett nyers rúdvastagság.
- `audit-ring-system.mjs`: leltár, normalizált kombinációk, gépi részjelentések és kiadást tiltó ellenőrzés.
- `structural-audit.test.cjs`: szándékosan elrontott csatlakozás és szimmetria, szélső foglalatmagasságok, furatba lógó felület regressziói.

## 4. Ellenőrzés eredménye

- A legutóbbi szigorú alapmodell-futás: 44/44 teljesült a jelenleg implementált csatlakozás-, központi tartószimmetria-, háló-, ütközés- és furatellenőrzéseken. Ez nem az A–F szabályok teljes igazolása.
- Összevont célzott regresszió: **11 sikeres, 1 hibás**. A Duet/channel/hidden-halo eset nincs kész.
- Lint és forrásszintaxis: sikeres.
- A köztes stílus × foglalat × kőforma mátrix tervezett mérete 594 normalizált modell. A részjelentés pontos feldolgozott darabszáma a `matrix/manifest-base.json` fájlban; ez a futás a vastagítás előtti kódot ellenőrizte.
- A paraméterenkénti minimum/közép/maximum és választólista bejárás terve 206 712 kérésből 77 195 egyedi állapotot adott a tervezéskori normalizálással. **Nem futott le.** Ez sem az összes paraméter teljes Descartes-szorzata.
- A `before-views` és `after-views` fájlok a tényleges hálók négy ortografikus nézetét tartalmazzák. A képek szemléltetnek, nem helyettesítik a geometriai bizonyítást.

## 5. Nyitott tételek

1. Duet rejtett halo zárt üregeinek megszüntetése; a hibás regresszió változatlanul bukik.
2. Teljes 77 195 konfigurációs futás és a javítások utáni tiszta eredmény hiányzik.
3. Összes karom szögeloszlásának/hosszának mérése, párosított mellékfoglalatok és teljes test tükörszimmetriája még nincs lefedve.
4. A nyers rúdon vett átmérőminták nem igazolják a végső, kivágott test globális minimális falvastagságát. A modern bezel 0,35–0,7 mm-es tartománya külön felülvizsgálatot igényel.
5. Stabil kőrögzítés, tényleges alátámasztás és szerelhetőség még nincs gépileg bizonyítva.
6. A hálómanifold-vizsgálat nem teljes önmetszésbizonyítás.
7. STL/OBJ/CAD export-visszaolvasási egyezés és a külön parametrikus STEP-útvonal teljes funkcióegyezése még nincs igazolva.

**Kiadási döntés: TILTVA. Nincs gyárthatósági vagy teljes hibamentességi állítás.**
