# Képfeltöltéses rendelés: GIF és forgatható 3D terv

A gyűrűtervező rendelési útja változatlan. A fotó alapján készülő terv külön `photoDesign` mezőben tárolódik, nem válik vásárló által beküldött `design`-ná.

1. A vásárló a Képfeltöltés oldalon referenciaképet és elérhetőséget küld. Az első visszaigazolás automatikusan sorba kerül.
2. A műhely a fotó alapján elkészíti a 3D tervet. Egyetlen fotóból a nem látható részek, méretek és anyagok nem állapíthatók meg biztosan; ezekhez egyeztetés szükséges.
3. Az admin feltölti a forgó GIF-et az e-mailhez és a hozzá tartozó BRIGHTAL JSON-tervfájlt a forgatható nézethez. A JSON jelenleg a BRIGHTAL által támogatott gyűrűgeometriákat írja le; tetszőleges GLB/STL/STEP nem tölthető ide. Ez nem automatikus fotórekonstrukció.
4. Az admin megadja a végleges specifikációt, árat és határidőt, majd jóváhagyja. A második e-mail a feltöltött GIF-et beágyazva és a privát rendelési linket tartalmazza.
5. A privát oldalon a jóváhagyott JSON-ból a böngésző valós időben rajzolja ki a gyűrűt. Egérrel vagy érintéssel forgatható és nagyítható. A jóváhagyás gomb a részletes 3D betöltéséig nem aktív.

A 3D terv és a látványkép metaadata az ajánlat változatlan másolatának és tartalmi lenyomatának része. Ha az admin az ajánlat elfogadása előtt fájlt cserél, az előző ajánlat érvénytelenné válik, új adminjóváhagyás szükséges. Vásárlói elfogadás után fájlcsere nem engedélyezett. A régi, 3D nélküli fotós ajánlatok továbbra is a korábbi GIF-nézetüket használják.

## Próbafájl

A `docs/examples/photo-order-demo.json` egy négykarmos, ovális köves, sárgaarany szoliter közelítő próbaterve. Fotóforrás: https://uk.pinterest.com/pin/761389880793518196/ . A referencia nem került a Git-repositoryba. A méret, karát, finomság és nem látható részletek tesztfeltevések, nem a fotóból mért adatok; a fájl nem gyártási dokumentáció.

A hozzá tartozó GIF-et ugyanebből a konfigurációból a meglévő `scripts/order-preview.cjs` készíti. Az admin mindkét fájlt ugyanahhoz a fotós rendeléshez töltse fel.

## Ellenőrzés

`MAIL_ENABLED=false node --test tests/guest-orders.test.cjs tests/order-workflow.test.cjs tests/offers.test.cjs`

Ellenőrzi az első levél sorba állítását, az adminjogosultságot, a hiányzó/hibás 3D fájl elutasítását, az ajánlati másolatot, a privát hozzáférést és a vásárlói jóváhagyást. A designer eset továbbra is a meglévő design mezővel működik.
