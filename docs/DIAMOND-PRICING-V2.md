# DIPEN-hez rögzített, minőségi faktoros árazás

## Források és bizonyosság

GIA: https://www.gia.edu/diamond-quality-factor – a karát, szín, tisztaság és csiszolás a fő minőségi tényezők.
IGI: https://www.igi.org/reports/lab-grown-diamond-report/ – arányok, csiszolás, polírozás és szimmetria minősítése. A csiszolási osztály nem minden fancy formánál szerepel ugyanúgy; a konfigurátorban specifikáció, nem létező tanúsítvány állítása.

Ezek a források NEM közölnek DIPEN-árlistát vagy számszerű lab-grown felárakat. A server/diamond-factors.js táblái a megrendelő által kért kereskedelmi becslési politika, nem statisztikailag igazolt beszállítói faktorok. A kevés jelenlegi egységárból az önálló szín-, tisztaság-, forma- és kidolgozási felár nem azonosítható. Az admin figyelmeztetést és faktorbontást lát.

## Modell

A karátkitevő 1,15 (óvatos induló feltételezés). A szín/tisztaság fokozatai monoton súlyok; külön forma-, cut-, polish-, symmetry- és fluorescence faktor. Az alap F/VS1, ovális, Excellent kidolgozás és fluoreszcencia nélkül.

Minden hiteles megfigyelés árát a saját karát- és minőségi faktorával normalizáljuk. A normalizált árak logaritmikus átlagát karáttávolság szerint súlyozzuk, majd a célkő faktorait alkalmazzuk. Pontos történeti egyezésnél az adott DIPEN-adat az árhorgony. Időbeli áresést kizárólag azonos specifikációjú ismételt adatokból becsülünk; ezek nélkül nincs kitalált éves áresés.

A méretek, depth/table és hossz-szélesség arány nem kapnak önkényes további felárat: ezek már összefüggenek a tömeggel, formával és csiszolással, kettős árazásuk torzítana. CVD/HPHT, utókezelés, árnyalat, növekedési csíkok, átlátszóság, bow-tie és tanúsítás aktuális költsége megfelelő beszállítói adat nélkül nem kap számszerű faktort. Ezeket a beszerzéskor kell ellenőrizni; a modell nem helyettesít valódi árajánlatot.

Az USD becslés két tizedesre rögzül, majd fixpontos USD/HUF-konverzió következik. A bruttó eladási ár továbbra is DIPEN-becslés ×2, egész HUF ROUND_HALF_UP kerekítéssel. A faktorok nem egy további rejtett szorzóként kerülnek rá a kétszeres árra. Admin, lista, ajánlat és checkout ugyanazt a szervermodult használja. Elfogadott rendelés ára rögzített; későbbi modellváltozás nem módosítja visszamenőleg.

## Katalógus és képek

Alapesetben 100 beszerzendő specifikáció: 10 forma × 10 karátérték, változó színnel/tisztasággal. A szűrők konfigurációt is képeznek: a kijelölt szín és tisztaság minden formára alkalmazható. A felső egyedi konfigurátor 0,1–30 ct között fogad pontos értéket. Nincs állítás 100 fizikailag raktáron lévő kőről és nincs kitalált IGI-szám.

Tíz cache-elt WebP szolgálja ki az összes kombinációt; a részletes 3D csak megnyitáskor indul. Az előnézetek és méretek szemléltetők. A szerverfaktorok, DIPEN-forrásárak és megfigyelések nem kerülnek a klienscsomagba.

## Kalibrálás

Új DIPEN-megfigyeléseknél importáld az egységárat, dátumot, bizonyítékot és az összes ismert minőségi mezőt az adminban. A hiányzó kidolgozási adatok alapértékei assumedQuality-ként megmaradnak. Következő kalibráláskor hasonlíts össze azonos tömegű, formájú és egyéb minőségű párokat; a faktorok átírását verziózd és futtasd a quality-pricing/combination-orders teszteket. A devizaárfolyamot legfeljebb hét naponta valóban ellenőrizni kell.
