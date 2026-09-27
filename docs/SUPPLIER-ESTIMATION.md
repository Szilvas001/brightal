# Privát beszállítói modell

A `data/supplier-model.json` kizárólag szerveroldali adat, Git által kizárt. Az admin külön egységár-megfigyeléseket, USD/HUF árfolyamot és az ellenőrzés során félretett tételeket lát. Az admin teljes JSON-mentést tölthet le és tölthet vissza. A nyilvános ajánlat végpont csak kombinációt, HUF eladási árat és rendelhetőséget közöl.

## Mit jelent a becslés?

A modell a karát logaritmusa, szín, tisztaság és forma szerinti távolsággal súlyozza a megfigyelt USD/karát árakat. Pontosan azonos kombinációnál a legutóbbi megfigyelést használja. Időbeli változást csak ismételt összehasonlítható specifikációkból becsül; eltérő kövek árváltozásából nem számol automatikus áresést.

Ez kevés adat mellett heurisztikus becslés, nem függetlenül megtanult felár minden dimenzióra. Nem megfigyelt alakok vagy fokozatok akár azonos becslést is kaphatnak. Az admin figyelmeztetést kap a hiányzó lefedettségre és a karáttartományon kívüli extrapolációra. A rendszer nem állítja, hogy a beszállító a becsült áron ténylegesen szállít.

A csomagösszegből nem képzünk önkényesen külön kőárakat. Az öt követ tartalmazó csomag egyetlen megfigyelt végösszeg; amíg a szállítás és az egyedi kőárak nincsenek elkülönítve, ellenőrzési jegyzetként tároljuk. A természetes és fancy színes kövek adatai nem kerülnek a D–M laborgyémánt-egységármodellbe.

## Eladási ár

`bruttó HUF eladási ár = kerekítés(becsült USD kőár × USD/HUF × 2)`.

Az árfolyam legfeljebb hét napos lehet. A jelenleg támogatott kombinációk: tíz forma, D–M, FL–SI2, 0,1–30 karát. A tartomány távoli részein a bizonytalanság nagyobb. A vásárló szerződéses eladási árat fogad el; a checkout újraszámolja és ellenőrzi az árat, majd a mentett rendelés ára rögzített. A későbbi árfolyamváltozás nem módosítja a kifizetendő összeget.

## Költöztetés

Az adminban letöltött privát modellt az új szerveren az adminon keresztül importáld, vagy másold a `data/supplier-model.json` helyre. A GitHub-push nem tartalmazza a privát beszállítói adatokat, az ügyféladatokat vagy kulcsokat. A modell exportjának eléréséhez adminjogosultság kell.
