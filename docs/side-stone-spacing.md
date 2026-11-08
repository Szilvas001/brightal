# Oldalkövek távolsága

A gyűrűtervező Oldalkövek lépésében, aktív oldalkövek vagy sínkövezés mellett:

- Távolítás a főkőtől: 0–1 mm, 0,05 mm-es lépések. Páros oldalköveket, teljes fürtöt/ötköves csoportot vagy a sínkövezés kezdetét mozgatja kifelé. A Toi & Moi két főkövének távolságát is növeli.
- Oldalkövek közötti térköz növelése: 0–0,8 mm, 0,05 mm-es lépések. Fürtnél a kisebb köveket, ötköves elrendezésnél a külső köveket távolítja. Pavé/channel esetén a sín menti kőközöket növeli; kevesebb kő férhet el.

A 0 az alapmodell foglalási távolsága, az érték további ráhagyás, nem teljes él–él hézag. Egyszerű oldalkőpárnál nincs külön, egymástól független második távolság. A modern kősoros modellek meglévő Kősor térköze vezérlője változatlan.

A beállítás a 3D modellben, mentésben, megosztásban, rendelési konfigurációban és műhelycsomagban megmarad. Az alapértelmezett 0 érték megőrzi a korábbi modelleket és bélyegképcímeket. Az egyedi távolságot nem támogató külön parametrikus STEP-előkészítő egyértelmű hibaüzenettel a teljes 3D/mesh exporthoz irányít, nem ad ki eltérő geometriát csendben. A végleges gyárthatóságot az ötvös ellenőrzi.

Ellenőrzés: 10 célzott szerver/geometria/mentés teszt; 3 stílusregresszió; mobil és asztali böngészőben mindkét vezérlő, részletes kirajzolás és mentés; maximális távolságokkal páros/fürtös/ötköves és pavé/channel részletes geometria; build, lint, típus- és forrásellenőrzés. A teljes változatlan tesztmátrixot nem futtattuk újra.
