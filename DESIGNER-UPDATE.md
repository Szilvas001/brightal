# Gyűrűtervező – vezetett alkotási élmény (2026-10-22)

## Felhasználói változások

- A meglévő hat lépés érthető segítséget kapott: alapforma, kő/sziluett, fém, kísérőrészletek, méret és személyes részletek, összesítés.
- A nyitó stílusválasztó mind a 44 alapformát mutatja. Név szerinti keresés, találatszám, törlés és a meglévő kategóriaszűrők segítik a választást.
- Három kipróbálható színvilág: Meleg klasszikus, Lágy romantika, Hűvös karakter. Ezek a fémet, a kő színét és a felületet állítják; a modell és a gyűrűméret megmarad.
- Az új variáció gomb az aktuális alapformán belül változtat fémet, felületet, kőszínt és csiszolást. A korábbi véletlen alapstíluscsere megszűnt.
- A szerkeszthető rövid összesítő közvetlenül a megfelelő lépésre navigál.
- Minden csúszkához pontos számbevitel tartozik. Enterrel vagy a mező elhagyásakor alkalmazzuk; az értékeket a modell határai és normalizálása ellenőrzik.
- Vissza gomb és a következő lépést megnevező gomb; magyar és angol szövegek.
- Mobil elrendezés, nagyobb kattintási célok és látható billentyűzetfókusz.

## Megőrzött működés

A 44 alapstílus definíciója, geometriai motorja, gyárthatósági korlátai és meglévő opciói változatlanok. A mentés, import, export, megosztás, visszavonás és ajánlatkérés továbbra is a meglévő rendszert használja. Az elérhető beállítások modellenként különböznek.

## Ellenőrzés

- Webshop és tervező build: sikeres.
- `node --test tests/builder.test.cjs tests/designs.test.cjs`: 12 sikeres teszt; geometria, korlátok, megosztási körút, tervarchívum és beküldés.
- Böngészős próba: 44 stílus megjelenítése; „szoliter” keresés 1 találattal; lépésváltás; romantikus színvilág alkalmazása változatlan Szoliter alapon; visszavonás; EU méret átállítása 54-ről 58-ra pontos bevitellel.
- A böngészőben a részletes 3D modell betöltődött.

Az SMTP és a Google-belépés beállításai nem részei ennek a módosításnak.
