# Kínálat, nyelvváltás és geometriai hibajavítás

## Kínálat és nyelvek

- Kizárólag 14/18 karátos sárga-, fehér- és rozéarany választható. A foglalat és a másodlagos fém választója is csak aranyat tartalmaz.
- A korábbi platinás szerkeszthető tervek fehérarannyal nyílnak meg; a mintatervek is aranyból készülnek.
- A gyémánt eredete csak lab-grown, a tanúsítvány csak IGI lehet.
- Magyar alapnyelv, megjegyzett HU/EN/DE választás. Német szövegek a fő vásárlói oldalakon, a teljes tervező kezelőfelületén és a rendelés/fizetés lépésein. A korábban csak magyar rendelési szövegek angol fordítást is kaptak.
- A szerződéses dokumentumok tartalmát, az admin belépést és az e-mail-küldési szabályokat ez a változtatás nem írja át. A szerződés nyelve továbbra is magyar.

## Geometria

A jelentett eset: pavé, 1,3 ct csepp főkő, 8 karom, 0,3 ct princess oldalkövek ötköves elrendezésben, EU 50, 2,4 mm szélesség, 2 mm vastagság, 0,5 foglalatemelés.

A Boolean műveletek után a Float32-konverzió azonos helyre eső, ellentétes irányú háromszögpárokat hagyott. Ezek miatt a zártság ellenőrzése hibát jelzett, a régi felület pedig a nyers, még ki nem vágott fémrészeket jelenítette meg. Az ilyen háromszögpárokat most csúcspontmozgatás nélkül eltávolítjuk. Az azonos irányú duplikációkat nem engedjük át ezen a javításon. A kész testet ezután ismét zártságra, összefüggőségre és kőátfedésekre ellenőrizzük.

A rejtett halo a főkő pavilonjától kijjebb és lejjebb kerül. Dupla halónál a két sor közötti tényleges kőtávolságot ellenőrizzük, mert nem kör alakú körvonalnál a sugárkülönbség önmagában nem elég.

A tervező és a rendelési 3D nézet nem jeleníti meg a hibás nyers modellt. Az új konfiguráció ellenőrzése alatt sem látszik kivágatlan gyorselőnézet. Hibás konfigurációhoz nem engedélyezett az ajánlatkérés/jóváhagyás; az eddigi szerveroldali ellenőrzés is megmarad.

## Ellenőrzés és korlátok

- A konkrét jelentett gyűrű külön regressziós tesztje sikeres: egy zárt fémtest, nincs kimutatott kő–kő vagy fém–kő átfedés.
- A korábbi 30 kőütközéses tesztváltozat ismételt vizsgálatánál nincs kő–kő átfedés.
- A kínálati és fordítási tesztek sikeresek; minden webshop-szótárkulcshoz van német fordítás, a helyettesítő változók megmaradnak.
- Böngészőben ellenőrzött HU/EN/DE nyelvváltás, német képfeltöltés és tervező, kizárólag lab-grown/IGI választás. A jelentett gyűrű részletesen kirajzolódik, hibaüzenet nélkül, engedélyezett ajánlatkéréssel.
- A generált képek mind a 44 alapstílushoz elkészültek.

A tesztmátrix reprodukálása: `node scripts/check-assembly-combinations.mjs --finished`. A `--shard=0/4` … `--shard=3/4` felosztás ugyanazokat az eseteket vizsgálja külön folyamatokban; mindegyikhez külön `ASSEMBLY_AUDIT_OUTPUT` útvonalat kell megadni. Az eredmény diagnosztika: a kimutatott, tiltott változatok száma önmagában nem gyártási megfelelőségi igazolás.

A program nem igazolja automatikusan az ötvözet szilárdságát, a karmok tényleges kőtartását, a legkisebb helyi falvastagságot, az öntési zsugorodást, a polírozási ráhagyást vagy a ténylegesen beszerzett kő méretét. A geometriailag elfogadott látványterv továbbra is ötvösi ellenőrzést és gyártási CAD-előkészítést igényel. Hetzner-élesítés nem történt.
