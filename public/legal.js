/* ══════════════════════════════════════════════════════════════════
   BRIGHTAL — JOGI TARTALOM (ÁSZF, adatkezelés, impresszum, elállás, cookie)
   ──────────────────────────────────────────────────────────────────
   Ez NEM React-fájl, nincs fordítás — a böngésző közvetlenül tölti be.
   Módosítás után elég frissíteni az oldalt (nem kell npm run build).

   ⚠  A szövegek MINTÁK, magyar webshopra szabva. Élesítés előtt
      nézesse át jogásszal — a felelősség a boltüzemeltetőé.

   Behelyettesíthető jelölők (a /api/config-ból töltődnek ki):
      {{company.name}}       {{company.address}}     {{company.taxNumber}}
      {{company.regNumber}}  {{company.email}}       {{company.phone}}
      {{company.hostingName}} {{company.hostingAddress}}
      {{shop.name}}          {{shop.productionDays}} {{shop.vatRate}}
   Ami üresen marad, ott piros [KITÖLTENDŐ] jelölés látszik az oldalon.

   Blokk-formátum egy szakaszon belül (b tömb):
      'szöveg'                  → bekezdés
      ['elem', 'elem']          → felsorolás
      { t: [['cím','érték']] }  → adattáblázat
      { note: 'szöveg' }        → kiemelt figyelmeztető doboz
   ══════════════════════════════════════════════════════════════════ */

window.LEGAL = {

/* ═══════════════════════════════════════════════════════════════════
   MAGYAR
   ═══════════════════════════════════════════════════════════════════ */
hu: {

/* ─────────────────────────── IMPRESSZUM ─────────────────────────── */
impressum: {
  title: 'Impresszum',
  lead: 'Az elektronikus kereskedelmi szolgáltatásokról szóló 2001. évi CVIII. törvény 4. §-a alapján közzétett szolgáltatói adatok.',
  sections: [
    {
      h: 'A szolgáltató adatai',
      b: [{ t: [
        ['Cégnév / név', '{{company.name}}'],
        ['Székhely', '{{company.address}}'],
        ['Levelezési cím', '{{company.mailingAddress}}'],
        ['Adószám', '{{company.taxNumber}}'],
        ['Közösségi adószám', '{{company.euTaxNumber}}'],
        ['Cégjegyzék- / nyilvántartási szám', '{{company.regNumber}}'],
        ['Nyilvántartó hatóság', '{{company.regAuthority}}'],
        ['Képviselő', '{{company.representative}}'],
        ['E-mail', '{{company.email}}'],
        ['Telefon', '{{company.phone}}'],
        ['Bankszámlaszám', '{{company.bankAccount}}'],
        ['Számlavezető bank', '{{company.bankName}}']
      ] }]
    },
    {
      h: 'A tárhelyszolgáltató adatai',
      b: [{ t: [
        ['Név', '{{company.hostingName}}'],
        ['Cím', '{{company.hostingAddress}}'],
        ['E-mail', '{{company.hostingEmail}}']
      ] }]
    },
    {
      h: 'Fizetési szolgáltató',
      b: [
        'Az online bankkártyás fizetések a Barion rendszerén keresztül valósulnak meg. A bankkártya adatai a kereskedőhöz nem jutnak el.',
        { t: [
          ['Szolgáltató', 'Barion Payment Zrt.'],
          ['Székhely', '1117 Budapest, Irinyi József utca 4–20. 2. emelet'],
          ['Nyilvántartási szám', '13389942-2-43'],
          ['Engedély száma', 'H-EN-I-1064/2013'],
          ['Weboldal', 'https://www.barion.com']
        ] }
      ]
    },
    {
      h: 'Felügyeleti szervek',
      b: [[
        'Fogyasztóvédelem: a lakóhely szerint illetékes fővárosi/megyei kormányhivatal fogyasztóvédelmi osztálya',
        'Adatvédelem: Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), 1055 Budapest, Falk Miksa utca 9–11., ugyfelszolgalat@naih.hu',
        'Békéltető testület: {{company.arbitrationBoard}}, {{company.arbitrationAddress}}, {{company.arbitrationEmail}}'
      ]]
    },
    {
      h: 'Szerzői jog',
      b: [
        'A weboldalon megjelenő tartalmak (szövegek, grafikák, fényképek, márkajelzés) a szolgáltató szellemi tulajdonát képezik, azok engedély nélküli felhasználása tilos.',
        'A vásárló által feltöltött képek a vásárló, illetve a kép jogosultjának tulajdonában maradnak — ezeket kizárólag az árajánlat elkészítéséhez és a gyűrű legyártásához használjuk fel.'
      ]
    }
  ]
},

/* ────────────────────────────── ÁSZF ────────────────────────────── */
terms: {
  title: 'Általános Szerződési Feltételek',
  lead: 'Kérjük, hogy megrendelés leadása előtt figyelmesen olvassa el ezt a dokumentumot. Megrendelésével elfogadja az itt leírtakat.',
  sections: [
    {
      h: '1. A szolgáltató',
      b: [
        'Jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) {{company.name}} (székhely: {{company.address}}, adószám: {{company.taxNumber}}, e-mail: {{company.email}}) mint szolgáltató és a {{shop.name}} webáruházban vásárló (a továbbiakban: Vásárló) közötti szerződés feltételeit szabályozza.',
        'A részletes szolgáltatói és tárhelyszolgáltatói adatokat az Impresszum tartalmazza.'
      ]
    },
    {
      h: '2. A szerződés tárgya, a szolgáltatás jellege',
      b: [
        'A szolgáltató egyedi, kifejezetten a Vásárló utasítása alapján, a Vásárló által feltöltött kép, illetve megadott paraméterek szerint elkészített ékszert (gyűrűt) készít és értékesít.',
        'A webáruházban nincs raktárkészletről azonnal megvásárolható termék: minden megrendelés egyedi gyártásra irányul.',
        { note: 'Mivel a termék kifejezetten a Vásárló kérésére, egyedi paraméterekkel készül, a fogyasztót a 45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés c) pontja alapján nem illeti meg a 14 napos elállási jog. Részletek az Elállási tájékoztatóban.' }
      ]
    },
    {
      h: '3. A megrendelés menete',
      b: [
        'A megrendelés az alábbi lépésekben történik:',
        [
          'A Vásárló regisztrál vagy bejelentkezik, majd feltölt legalább egy képet a kívánt gyűrűről, és megadja az esetleges részleteket (nemesfém, méret, gravírozás, határidő, keret).',
          'A feltöltés még nem megrendelés és nem jár fizetési kötelezettséggel — ez ajánlatkérésnek minősül.',
          'A szolgáltató ötvöse a képet átnézi, és egyedi árajánlatot ad, jellemzően {{shop.reviewHours}} órán belül. Az árajánlatról a Vásárló e-mailben értesítést kap, az ár a fiókjában is megjelenik.',
          'A szolgáltató fenntartja a jogot, hogy a kérést indokolás nélkül elutasítsa (például kivitelezhetetlen minta, jogsértő tartalom, vagy kapacitáshiány esetén).',
          'A Vásárló az árajánlatot a fizetéssel fogadja el. A szerződés a fizetés sikeres teljesülésével jön létre.',
          'A szolgáltató a megrendelést e-mailben visszaigazolja.'
        ],
        'Az árajánlat a közlésétől számított 15 napig érvényes, ezt követően a szolgáltató nem köteles azon az áron teljesíteni.'
      ]
    },
    {
      h: '4. Árak',
      b: [
        'Az árajánlatban feltüntetett ár magyar forintban (vagy a bolt beállítása szerinti pénznemben) értendő, és az általános forgalmi adót tartalmazza. A fizetendő végösszeg minden esetben a fizetés előtt, összesítve megjelenik.',
        'Az ár tartalmazza a gyűrű előállításának teljes költségét. A kiszállítás díja — ha a felek szállításban állapodnak meg — az árajánlatban külön szerepel.',
        'Ha a szolgáltató minden gondossága ellenére hibás ár kerül feltüntetésre, nem köteles a nyilvánvalóan hibás áron teljesíteni, hanem felajánlja a helyes áron történő teljesítést. Ilyen esetben a Vásárló elállhat a vásárlástól, és a már megfizetett összeg maradéktalanul visszajár.'
      ]
    },
    {
      h: '5. Fizetés',
      b: [
        'A fizetés online bankkártyával, a Barion Payment Zrt. rendszerén keresztül történik. A szolgáltató bankkártyaadatot nem lát és nem tárol — azokat a Vásárló a Barion PCI-DSS tanúsítvánnyal rendelkező oldalán adja meg.',
        'A fizetés csak a szolgáltató által jóváhagyott és beárazott kérésre indítható, kizárólag a kérést leadó Vásárló saját fiókjából.',
        'Sikertelen vagy megszakított fizetés esetén a megrendelés nem jön létre, a Vásárló a fizetést bármikor újraindíthatja.',
        'A szolgáltató a fizetés beérkezését követően elektronikus számlát állít ki, amelyet a Vásárló által megadott e-mail címre küld meg. A Vásárló az elektronikus számla befogadását a megrendeléssel elfogadja.'
      ]
    },
    {
      h: '6. Teljesítési határidő, átvétel',
      b: [
        'A gyártás a fizetés beérkezésétől indul, várható időtartama {{shop.productionDays}} munkanap. Rendkívüli esetben (alapanyag-hiány, egyedi kőbeszerzés) a szolgáltató a Vásárlót haladéktalanul értesíti, és új határidőt egyeztet.',
        'Az elkészült ékszert a Vásárló személyesen veheti át a szolgáltató szalonjában, vagy — előzetes egyeztetés szerint — biztosított futárszolgálattal kerül kiszállításra.',
        'A megrendelés állapotát a Vásárló bármikor nyomon követheti a fiókjában, a „Rendeléseim" menüpontban.'
      ]
    },
    {
      h: '7. A feltöltött képekre vonatkozó szabályok',
      b: [
        'A Vásárló szavatolja, hogy az általa feltöltött képek feltöltésére és felhasználására jogosult, azok harmadik személy szerzői vagy személyiségi jogát nem sértik.',
        'A szolgáltató a feltöltött képeket kizárólag az árajánlat elkészítése és a gyűrű legyártása céljából használja fel, azokat nyilvánosságra nem hozza, harmadik félnek marketing célból nem adja át.',
        'A szolgáltató fenntartja a jogot, hogy jogsértő, obszcén vagy nyilvánvalóan más márka védjegyét sértő minta esetén a kérést elutasítsa.',
        'A feltöltött képek csak a Vásárló és a szolgáltató adminisztrátora számára hozzáférhetők; a képekhez tartozó címet illetéktelen nem tudja megnyitni.'
      ]
    },
    {
      h: '8. Elállási jog',
      b: [
        'Tekintettel arra, hogy a termék kifejezetten a fogyasztó kérésére, egyedi paraméterekkel készül, a fogyasztót a 45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés c) pontja alapján az elállási jog nem illeti meg.',
        'A Vásárló a fizetés teljesítése előtt bármikor, következmény nélkül visszaléphet: a kérés leadása és az árajánlat elfogadása között nincs fizetési kötelezettsége.',
        'A részletes tájékoztatást — beleértve azt is, hogy mely esetekben él mégis az elállási jog — az Elállási tájékoztató tartalmazza.'
      ]
    },
    {
      h: '9. Szavatosság, jótállás',
      b: [
        'Kellékszavatosság: hibás teljesítés esetén a Vásárló kijavítást vagy kicserélést, ennek hiányában árleszállítást kérhet, vagy — végső esetben — elállhat a szerződéstől. A Vásárló a hiba felfedezése után késedelem nélkül, de legfeljebb két hónapon belül köteles a hibát közölni. A szerződés teljesítésétől számított két éves elévülési határidőn túl szavatossági igény nem érvényesíthető.',
        'Termékszavatosság: a Vásárló a termék hibája esetén a gyártótól közvetlenül is kérheti a hiba kijavítását vagy a termék kicserélését, a termék forgalomba hozatalától számított két éven belül.',
        'Nem minősül hibás teljesítésnek a nemesfém természetes kopása, a rendeltetésellenes használatból (ütés, vegyszer, sport) eredő sérülés, illetve a méret utólagos változtatásának igénye.',
        'Egyedi készítésű ékszer esetén a kézi megmunkálásból eredő, a mintától való minimális, esztétikai jellegű eltérés nem minősül hibának.'
      ]
    },
    {
      h: '10. Panaszkezelés, jogorvoslat',
      b: [
        'A Vásárló panaszát a {{company.email}} e-mail címen vagy a {{company.phone}} telefonszámon terjesztheti elő. A szolgáltató a panaszt 30 napon belül, írásban megválaszolja.',
        'Ha a panasz elutasításra kerül, a Vásárló az alábbi fórumokhoz fordulhat:',
        [
          'Fogyasztóvédelmi hatóság: a lakóhely szerint illetékes kormányhivatal fogyasztóvédelmi osztálya',
          'Békéltető testület: {{company.arbitrationBoard}} — {{company.arbitrationAddress}}, {{company.arbitrationEmail}}',
          'Online vitarendezési platform (ODR): https://ec.europa.eu/odr',
          'Bíróság: a Vásárló igényét bírósági úton is érvényesítheti'
        ],
        'A szolgáltatót a békéltető testületi eljárásban együttműködési kötelezettség terheli.'
      ]
    },
    {
      h: '11. Adatkezelés',
      b: [
        'A személyes adatok kezelésének részleteit — beleértve a feltöltött képek kezelését — az Adatkezelési tájékoztató tartalmazza, amely jelen ÁSZF elválaszthatatlan része.'
      ]
    },
    {
      h: '12. Vegyes rendelkezések',
      b: [
        'A szolgáltató jogosult jelen ÁSZF-et egyoldalúan módosítani; a módosítás a weboldalon való közzététellel lép hatályba, és a már leadott megrendelésekre nem hat ki.',
        'A jelen ÁSZF-ben nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény, az elektronikus kereskedelmi szolgáltatásokról szóló 2001. évi CVIII. törvény, valamint a fogyasztó és a vállalkozás közötti szerződések részletes szabályairól szóló 45/2014. (II. 26.) Korm. rendelet rendelkezései irányadók.',
        'A szerződés nyelve magyar. A szerződés nem minősül írásba foglalt szerződésnek, azt a szolgáltató nem iktatja, utólag nem hozzáférhető — a megrendelés adatai azonban a Vásárló fiókjában bármikor megtekinthetők.'
      ]
    }
  ]
},

/* ─────────────────── ADATKEZELÉSI TÁJÉKOZTATÓ ─────────────────── */
privacy: {
  title: 'Adatkezelési tájékoztató',
  lead: 'Az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR) alapján készült tájékoztató arról, hogyan kezeljük a személyes adatait.',
  sections: [
    {
      h: '1. Az adatkezelő',
      b: [{ t: [
        ['Adatkezelő', '{{company.name}}'],
        ['Székhely', '{{company.address}}'],
        ['Adószám', '{{company.taxNumber}}'],
        ['E-mail', '{{company.email}}'],
        ['Telefon', '{{company.phone}}']
      ] },
      'Adatvédelmi tisztviselő kinevezésére nem került sor, mivel az adatkezelés jellege azt nem teszi kötelezővé.'
      ]
    },
    {
      h: '2. Milyen adatokat kezelünk, milyen célból és milyen jogalapon?',
      b: [
        'Fiók létrehozása és belépés',
        { t: [
          ['Kezelt adatok', 'név, e-mail cím, jelszó (kizárólag titkosított, visszafejthetetlen formában), opcionálisan telefonszám és cím'],
          ['Cél', 'a felhasználó azonosítása, a megrendelés nyomon követhetősége'],
          ['Jogalap', 'szerződés teljesítése — GDPR 6. cikk (1) b)'],
          ['Megőrzés', 'a fiók törléséig, illetve az utolsó belépéstől számított 3 évig']
        ] },
        'Ajánlatkérés és a feltöltött képek',
        { t: [
          ['Kezelt adatok', 'a feltöltött fényképek, a megadott név, e-mail cím, telefonszám, valamint a gyűrűre vonatkozó adatok (nemesfém, méret, gravírozás szövege, keret, határidő, megjegyzés)'],
          ['Cél', 'az egyedi árajánlat elkészítése és a gyűrű legyártása'],
          ['Jogalap', 'szerződés teljesítése, illetve szerződéskötést megelőző lépések — GDPR 6. cikk (1) b)'],
          ['Megőrzés', 'a megrendelés teljesítésétől számított 5 évig (általános polgári jogi elévülés); nem teljesült ajánlatkérés esetén 1 évig']
        ] },
        { note: 'A gravírozás szövege és a feltöltött kép személyes, akár érzelmileg érzékeny információt is tartalmazhat (például nevek, dátumok). Ezeket bizalmasan kezeljük, nyilvánosságra nem hozzuk, és marketingcélra nem használjuk fel.' },
        'Fizetés',
        { t: [
          ['Kezelt adatok', 'a tranzakció azonosítója, összege, státusza és időpontja. Bankkártyaadatot NEM kezelünk és nem is látunk.'],
          ['Cél', 'a fizetés lebonyolítása és igazolása'],
          ['Jogalap', 'szerződés teljesítése — GDPR 6. cikk (1) b)'],
          ['Megőrzés', 'a számviteli bizonylatokkal együtt 8 évig']
        ] },
        'Számlázás',
        { t: [
          ['Kezelt adatok', 'név, számlázási cím, a megrendelés adatai, a fizetett összeg'],
          ['Cél', 'jogszabályi számlaadási és megőrzési kötelezettség teljesítése'],
          ['Jogalap', 'jogi kötelezettség — GDPR 6. cikk (1) c), a számvitelről szóló 2000. évi C. törvény 169. §'],
          ['Megőrzés', '8 év — ez az idő jogszabályi kötelezettség, nem törölhető kérésre sem']
        ] },
        'Sütik és a Barion Pixel',
        { t: [
          ['Kezelt adatok', 'munkamenet-azonosító, nyelvi beállítás, hozzájárulási állapot; hozzájárulás esetén a Barion Pixel által gyűjtött böngészési adatok'],
          ['Cél', 'a weboldal működése, a csalásmegelőzés és — hozzájárulás esetén — a fizetési élmény mérése'],
          ['Jogalap', 'működéshez feltétlenül szükséges sütik: jogos érdek — GDPR 6. cikk (1) f); minden más süti: hozzájárulás — GDPR 6. cikk (1) a)'],
          ['Megőrzés', 'lásd a Cookie tájékoztatót']
        ] }
      ]
    },
    {
      h: '3. Kik férhetnek hozzá az adatokhoz? (adatfeldolgozók)',
      b: [
        'Az adatokat a szolgáltató munkatársain kívül kizárólag az alábbi adatfeldolgozók ismerhetik meg, kizárólag a feladatuk ellátásához szükséges mértékben:',
        { t: [
          ['Tárhelyszolgáltató', '{{company.hostingName}} — {{company.hostingAddress}} (a weboldal és az adatok tárolása)'],
          ['Fizetési szolgáltató', 'Barion Payment Zrt., 1117 Budapest, Irinyi József utca 4–20. (a fizetés lebonyolítása; önálló adatkezelőként is eljár)'],
          ['Számlázó', 'a bolt által használt számlázóprogram üzemeltetője (elektronikus számla kiállítása és megküldése)'],
          ['E-mail szolgáltató', 'a bolt által használt levélküldő szolgáltatás (értesítő e-mailek kézbesítése)'],
          ['Google (opcionális)', 'Google Ireland Ltd. — kizárólag akkor, ha a Vásárló a Google-fiókjával lép be']
        ] },
        'Adatait harmadik országba nem továbbítjuk, kivéve ha valamely fenti szolgáltató az EU-n kívül működik — ilyenkor a továbbítás az Európai Bizottság megfelelőségi határozata vagy általános szerződési feltételek alapján történik.',
        'Adatait nem adjuk el, és marketing célból nem adjuk át harmadik félnek.'
      ]
    },
    {
      h: '4. Adatbiztonság',
      b: [
        'A weboldal titkosított (HTTPS) kapcsolaton keresztül érhető el.',
        'A jelszavak kizárólag scrypt algoritmussal, egyedi sóval képzett, visszafejthetetlen formában tárolódnak.',
        'A feltöltött képek nem nyilvánosak: azokat kizárólag a feltöltő felhasználó és a szolgáltató adminisztrátora érheti el, bejelentkezés után.',
        'Bankkártyaadat a szolgáltató rendszerébe soha nem kerül be.',
        'A rendszerről rendszeres biztonsági mentés készül.'
      ]
    },
    {
      h: '5. Az Ön jogai',
      b: [
        'A GDPR alapján Önt az alábbi jogok illetik meg:',
        [
          'Hozzáférés: tájékoztatást kérhet arról, hogy milyen adatait kezeljük, és másolatot kérhet azokról.',
          'Helyesbítés: kérheti a pontatlan adatok javítását — a fiókjában több adatot maga is módosíthat.',
          'Törlés („elfeledtetéshez való jog"): kérheti adatai törlését, kivéve ha az adatkezelés jogi kötelezettségen alapul (például a számlaadatok 8 éves megőrzése).',
          'Az adatkezelés korlátozása: kérheti, hogy adatait csak tároljuk, de ne kezeljük tovább.',
          'Adathordozhatóság: kérheti adatait géppel olvasható formátumban.',
          'Tiltakozás: tiltakozhat a jogos érdeken alapuló adatkezelés ellen.',
          'Hozzájárulás visszavonása: a sütikre adott hozzájárulást bármikor visszavonhatja, ez a korábbi adatkezelés jogszerűségét nem érinti.'
        ],
        'Kérelmét a {{company.email}} címre küldheti. Kérelmére legkésőbb 30 napon belül válaszolunk.'
      ]
    },
    {
      h: '6. Jogorvoslat',
      b: [
        'Ha úgy érzi, hogy adatai kezelése során jogsérelem érte, először kérjük, forduljon hozzánk a {{company.email}} címen.',
        'Panasszal a felügyeleti hatósághoz is fordulhat:',
        { t: [
          ['Hatóság', 'Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)'],
          ['Cím', '1055 Budapest, Falk Miksa utca 9–11.'],
          ['E-mail', 'ugyfelszolgalat@naih.hu'],
          ['Weboldal', 'https://naih.hu']
        ] },
        'Jogainak megsértése esetén bírósághoz is fordulhat; a per — választása szerint — a lakóhelye szerinti törvényszék előtt is megindítható.'
      ]
    }
  ]
},

/* ──────────────────── ELÁLLÁSI TÁJÉKOZTATÓ ──────────────────── */
refund: {
  title: 'Elállási tájékoztató',
  lead: 'Tájékoztató a fogyasztót megillető elállási jogról, és arról, hogy egyedi készítésű ékszer esetén ez miért nem alkalmazható.',
  sections: [
    {
      h: '1. A fő szabály',
      b: [
        'A 45/2014. (II. 26.) Korm. rendelet alapján a fogyasztót főszabály szerint 14 napon belül indokolás nélküli elállási jog illeti meg a távollévők között kötött szerződéseknél.'
      ]
    },
    {
      h: '2. Kivétel: az egyedi készítésű termék',
      b: [
        { note: 'A {{shop.name}} minden ékszere kifejezetten a Vásárló kérésére, az általa feltöltött kép és megadott paraméterek (nemesfém, méret, gravírozás) alapján készül. Ezért a hivatkozott rendelet 29. § (1) bekezdés c) pontja alapján a fogyasztót NEM illeti meg a 14 napos elállási jog.' },
        'A rendelet szó szerint kizárja az elállást „olyan nem előre gyártott termék esetében, amelyet a fogyasztó utasítása alapján vagy kifejezett kérésére állítottak elő, vagy olyan termék esetében, amelyet egyértelműen a fogyasztó személyére szabtak".',
        'Erre a körülményre a szolgáltató a megrendelés leadása előtt, jelen tájékoztatóban és az ÁSZF-ben kifejezetten felhívja a figyelmet. A Vásárló ezt a megrendelés leadásakor, a feltételek elfogadásával kifejezetten tudomásul veszi.'
      ]
    },
    {
      h: '3. Mikor léphet vissza mégis következmény nélkül?',
      b: [
        'A folyamat úgy épül fel, hogy a Vásárló kockázat nélkül gondolhassa meg magát:',
        [
          'A kép feltöltése és az ajánlatkérés ingyenes, és semmilyen fizetési kötelezettséggel nem jár.',
          'Az árajánlat kézhezvétele után a Vásárló szabadon dönthet: ha nem fizet, szerződés nem jön létre.',
          'A gyártás kizárólag a fizetés beérkezése után indul.'
        ],
        'A fizetés teljesítése tehát egyben az ajánlat elfogadása és a gyártás megindítására adott kifejezett kérés.'
      ]
    },
    {
      h: '4. Mikor él mégis az elállási jog?',
      b: [
        'Ha a szolgáltató kivételesen nem egyedi, hanem előre gyártott, készletről értékesített terméket ad el, arra a 14 napos elállási jog a általános szabályok szerint érvényes. Ilyen esetben az elállási szándékot egyértelmű nyilatkozattal kell közölni a {{company.email}} címen, és a terméket sértetlenül, hiánytalanul vissza kell juttatni.',
        'A szolgáltató az elállás közlésétől számított 14 napon belül visszatéríti a kifizetett összeget, ugyanolyan fizetési módon, ahogyan azt megkapta.'
      ]
    },
    {
      h: '5. Ez nem érinti a szavatossági jogokat',
      b: [
        'Az elállási jog kizárása a hibás teljesítésből eredő jogokat nem érinti. Ha az elkészült ékszer hibás, a Vásárlót kellékszavatosság és termékszavatosság illeti meg — kijavítást, kicserélést, árleszállítást vagy végső esetben elállást kérhet.',
        'A szavatossági igényt a hiba felfedezése után késedelem nélkül, de legfeljebb két hónapon belül kell közölni. A részleteket az ÁSZF 9. pontja tartalmazza.'
      ]
    },
    {
      h: '6. Kapcsolat elállási vagy szavatossági ügyben',
      b: [{ t: [
        ['E-mail', '{{company.email}}'],
        ['Telefon', '{{company.phone}}'],
        ['Postacím', '{{company.mailingAddress}}']
      ] }]
    }
  ]
},

/* ────────────────────── COOKIE TÁJÉKOZTATÓ ────────────────────── */
cookies: {
  title: 'Cookie (süti) tájékoztató',
  lead: 'A weboldal a működéséhez feltétlenül szükséges sütiket használ, minden mást csak az Ön hozzájárulásával.',
  sections: [
    {
      h: '1. Mi az a süti?',
      b: [
        'A süti (cookie) egy kis adatfájl, amelyet a weboldal helyez el a böngészőjében. Segítségével a weboldal „megjegyzi", hogy Ön be van jelentkezve, vagy hogy milyen nyelvet választott.'
      ]
    },
    {
      h: '2. Milyen sütiket használunk?',
      b: [
        'Működéshez feltétlenül szükséges sütik — ezek hozzájárulás nélkül is elhelyezhetők, mert nélkülük a weboldal nem működik:',
        { t: [
          ['ssy_session', 'A bejelentkezett állapotot tartja fenn. HttpOnly, SameSite=Lax, titkosított kapcsolaton. Élettartam: 30 nap.'],
          ['ssy_lang', 'A választott nyelvet (magyar / angol) jegyzi meg. Élettartam: a böngésző tárolójában, törlésig.'],
          ['ssy_consent', 'A süti-hozzájárulásra adott válaszát tárolja, hogy ne kérdezzük meg újra. Élettartam: 12 hónap.']
        ] },
        'Hozzájáruláshoz kötött sütik — ezek csak akkor töltődnek be, ha Ön az „Elfogadom" gombra kattint:',
        { t: [
          ['Barion Pixel', 'A Barion Payment Zrt. mérőkódja, amely a fizetési folyamat eredményességét és a csalásmegelőzést szolgálja. Adatkezelő: Barion Payment Zrt. További információ: https://www.barion.com/hu/adatvedelmi-tajekoztato/']
        ] },
        { note: 'A weboldal nem használ Google Analytics-et, Facebook Pixelt vagy hasonló hirdetési nyomkövetőt.' }
      ]
    },
    {
      h: '3. Hogyan vonhatja vissza a hozzájárulását?',
      b: [
        'A hozzájárulást bármikor visszavonhatja: az oldal alján a „Cookie beállítások" gombra kattintva újra megjelenik a választási lehetőség.',
        'A már elhelyezett sütiket a böngészője beállításaiban is törölheti. Felhívjuk a figyelmét, hogy a működéshez szükséges sütik letiltása esetén a bejelentkezés és a megrendelés nem fog működni.'
      ]
    },
    {
      h: '4. További információ',
      b: [
        'A sütikkel kapcsolatos adatkezelés részleteit — jogalapok, megőrzési idő, az Ön jogai — az Adatkezelési tájékoztató tartalmazza.'
      ]
    }
  ]
}

},

/* ═══════════════════════════════════════════════════════════════════
   ENGLISH
   ═══════════════════════════════════════════════════════════════════ */
en: {

impressum: {
  title: 'Legal notice',
  lead: 'Service provider information published under Act CVIII of 2001 on electronic commerce services (Hungary).',
  sections: [
    {
      h: 'The service provider',
      b: [{ t: [
        ['Company name', '{{company.name}}'],
        ['Registered seat', '{{company.address}}'],
        ['Mailing address', '{{company.mailingAddress}}'],
        ['Tax number', '{{company.taxNumber}}'],
        ['EU VAT number', '{{company.euTaxNumber}}'],
        ['Registration number', '{{company.regNumber}}'],
        ['Registering authority', '{{company.regAuthority}}'],
        ['Represented by', '{{company.representative}}'],
        ['Email', '{{company.email}}'],
        ['Phone', '{{company.phone}}'],
        ['Bank account', '{{company.bankAccount}}'],
        ['Bank', '{{company.bankName}}']
      ] }]
    },
    {
      h: 'Hosting provider',
      b: [{ t: [
        ['Name', '{{company.hostingName}}'],
        ['Address', '{{company.hostingAddress}}'],
        ['Email', '{{company.hostingEmail}}']
      ] }]
    },
    {
      h: 'Payment provider',
      b: [
        'Online card payments are processed by Barion. Card details never reach the merchant.',
        { t: [
          ['Provider', 'Barion Payment Zrt.'],
          ['Seat', '4–20 Irinyi József street, 2nd floor, 1117 Budapest, Hungary'],
          ['Registration number', '13389942-2-43'],
          ['Licence number', 'H-EN-I-1064/2013'],
          ['Website', 'https://www.barion.com']
        ] }
      ]
    },
    {
      h: 'Supervisory authorities',
      b: [[
        'Consumer protection: the consumer protection department of the competent government office',
        'Data protection: Hungarian National Authority for Data Protection and Freedom of Information (NAIH), 9–11 Falk Miksa street, 1055 Budapest, ugyfelszolgalat@naih.hu',
        'Arbitration board: {{company.arbitrationBoard}}, {{company.arbitrationAddress}}, {{company.arbitrationEmail}}'
      ]]
    },
    {
      h: 'Copyright',
      b: [
        'All content on this website (texts, graphics, photographs, branding) is the intellectual property of the service provider and may not be used without permission.',
        'Photographs uploaded by the customer remain the property of the customer or the rights holder — we use them solely to prepare the quote and craft the ring.'
      ]
    }
  ]
},

terms: {
  title: 'Terms and Conditions',
  lead: 'Please read this document carefully before placing an order. By ordering you accept these terms.',
  sections: [
    {
      h: '1. The service provider',
      b: [
        'These Terms and Conditions govern the contract between {{company.name}} (seat: {{company.address}}, tax number: {{company.taxNumber}}, email: {{company.email}}) as service provider and the customer of the {{shop.name}} web shop.',
        'Full provider and hosting details are set out in the Legal notice.'
      ]
    },
    {
      h: '2. Subject of the contract',
      b: [
        'The service provider crafts and sells bespoke jewellery (rings) made specifically to the customer’s instructions, based on the photograph uploaded and the parameters supplied by the customer.',
        'No item is sold from stock: every order is for an individually manufactured piece.',
        { note: 'Because the product is made specifically to the customer’s specification, the 14-day right of withdrawal does not apply, pursuant to Section 29(1)(c) of Government Decree 45/2014 (II. 26.). See the Withdrawal information page.' }
      ]
    },
    {
      h: '3. How ordering works',
      b: [
        'An order is placed in the following steps:',
        [
          'The customer registers or signs in, uploads at least one photograph of the desired ring and may supply details (metal, size, engraving, deadline, budget).',
          'Uploading is not yet an order and carries no payment obligation — it is a request for a quote.',
          'Our goldsmith reviews the photograph and sends an individual quote, typically within {{shop.reviewHours}} hour(s). The customer is notified by email and the price also appears in their account.',
          'The service provider may decline a request without giving reasons (for example an unfeasible design, infringing content or lack of capacity).',
          'The customer accepts the quote by paying. The contract is concluded when payment succeeds.',
          'The service provider confirms the order by email.'
        ],
        'A quote remains valid for 15 days from the date it is issued.'
      ]
    },
    {
      h: '4. Prices',
      b: [
        'Prices are stated in Hungarian forint (or the currency configured for the shop) and include VAT. The total payable is always shown in full before payment.',
        'The price covers the entire cost of making the ring. Delivery cost, if the parties agree on shipping, is itemised separately in the quote.',
        'If, despite all care, an incorrect price is displayed, the service provider is not obliged to fulfil at the manifestly incorrect price but will offer fulfilment at the correct price. The customer may then withdraw and any amount already paid is refunded in full.'
      ]
    },
    {
      h: '5. Payment',
      b: [
        'Payment is made online by bank card through Barion Payment Zrt. The service provider never sees or stores card details — these are entered on Barion’s PCI-DSS certified page.',
        'Payment can only be initiated for a request that has been approved and priced by the service provider, and only from the account that submitted it.',
        'If payment fails or is cancelled, no order is created and the customer may retry at any time.',
        'Following receipt of payment the service provider issues an electronic invoice and sends it to the email address supplied. By ordering, the customer accepts electronic invoicing.'
      ]
    },
    {
      h: '6. Delivery time and collection',
      b: [
        'Production starts once payment is received and normally takes {{shop.productionDays}} working days. In exceptional cases (material shortage, sourcing a specific stone) the customer is notified without delay and a new deadline is agreed.',
        'The finished piece may be collected in person at our salon or, by prior arrangement, delivered by insured courier.',
        'Order status can be followed at any time under “My orders” in the customer account.'
      ]
    },
    {
      h: '7. Rules on uploaded photographs',
      b: [
        'The customer warrants that they are entitled to upload and use the photographs supplied and that these do not infringe any third party’s copyright or personality rights.',
        'The service provider uses uploaded photographs solely to prepare the quote and craft the ring; they are never published or passed to third parties for marketing.',
        'The service provider may decline requests involving infringing, obscene content or designs that clearly infringe another brand’s trademark.',
        'Uploaded photographs are accessible only to the customer and the service provider’s administrator.'
      ]
    },
    {
      h: '8. Right of withdrawal',
      b: [
        'As the product is made specifically to the consumer’s specification, the right of withdrawal does not apply under Section 29(1)(c) of Government Decree 45/2014 (II. 26.).',
        'The customer may step back at any time before payment without any consequence: there is no payment obligation between submitting a request and accepting the quote.',
        'Full details are set out on the Withdrawal information page.'
      ]
    },
    {
      h: '9. Warranty',
      b: [
        'Warranty for defects: in the event of defective performance the customer may request repair or replacement, failing that a price reduction, or ultimately withdraw from the contract. Defects must be reported without delay and at the latest within two months of discovery. Claims cannot be enforced beyond the two-year limitation period from performance.',
        'Product warranty: in the event of a product defect the customer may also approach the manufacturer directly for repair or replacement within two years of the product being placed on the market.',
        'Natural wear of precious metal, damage from improper use (impact, chemicals, sport) and later size changes do not constitute defective performance.',
        'For handcrafted jewellery, minimal aesthetic deviation from the reference image inherent in hand finishing is not a defect.'
      ]
    },
    {
      h: '10. Complaints and remedies',
      b: [
        'Complaints may be submitted to {{company.email}} or by phone on {{company.phone}}. The service provider replies in writing within 30 days.',
        'If a complaint is rejected, the customer may turn to:',
        [
          'The consumer protection authority: the consumer protection department of the competent government office',
          'Arbitration board: {{company.arbitrationBoard}} — {{company.arbitrationAddress}}, {{company.arbitrationEmail}}',
          'The EU Online Dispute Resolution platform: https://ec.europa.eu/odr',
          'The courts'
        ],
        'The service provider is obliged to cooperate in arbitration board proceedings.'
      ]
    },
    {
      h: '11. Data processing',
      b: [
        'Details of the processing of personal data — including uploaded photographs — are set out in the Privacy Policy, which forms an inseparable part of these Terms.'
      ]
    },
    {
      h: '12. Miscellaneous',
      b: [
        'The service provider may amend these Terms unilaterally; amendments take effect upon publication on the website and do not affect orders already placed.',
        'Matters not regulated here are governed by Act V of 2013 on the Civil Code, Act CVIII of 2001 on electronic commerce services and Government Decree 45/2014 (II. 26.) on contracts between consumers and businesses.',
        'The language of the contract is Hungarian. The contract is not filed and is not subsequently retrievable — however, order details remain visible in the customer account at any time.'
      ]
    }
  ]
},

privacy: {
  title: 'Privacy Policy',
  lead: 'How we handle your personal data, in accordance with Regulation (EU) 2016/679 (GDPR).',
  sections: [
    {
      h: '1. The controller',
      b: [{ t: [
        ['Controller', '{{company.name}}'],
        ['Seat', '{{company.address}}'],
        ['Tax number', '{{company.taxNumber}}'],
        ['Email', '{{company.email}}'],
        ['Phone', '{{company.phone}}']
      ] },
      'No data protection officer has been appointed, as the nature of the processing does not make this mandatory.'
      ]
    },
    {
      h: '2. What data we process, why and on what legal basis',
      b: [
        'Account creation and sign-in',
        { t: [
          ['Data', 'name, email address, password (stored only in irreversible encrypted form), optionally phone number and address'],
          ['Purpose', 'identifying the user, allowing the order to be tracked'],
          ['Legal basis', 'performance of a contract — GDPR Art. 6(1)(b)'],
          ['Retention', 'until the account is deleted, or 3 years from last sign-in']
        ] },
        'Quote requests and uploaded photographs',
        { t: [
          ['Data', 'uploaded photographs, name, email address, phone number and ring details (metal, size, engraving text, budget, deadline, notes)'],
          ['Purpose', 'preparing the individual quote and crafting the ring'],
          ['Legal basis', 'performance of a contract and pre-contractual steps — GDPR Art. 6(1)(b)'],
          ['Retention', '5 years from fulfilment; 1 year for requests that do not result in an order']
        ] },
        { note: 'Engraving text and uploaded images may contain personal or emotionally sensitive information (names, dates). We treat these confidentially, never publish them and never use them for marketing.' },
        'Payment',
        { t: [
          ['Data', 'transaction id, amount, status and time. We do NOT process or see card details.'],
          ['Purpose', 'processing and evidencing the payment'],
          ['Legal basis', 'performance of a contract — GDPR Art. 6(1)(b)'],
          ['Retention', '8 years, together with accounting records']
        ] },
        'Invoicing',
        { t: [
          ['Data', 'name, billing address, order details, amount paid'],
          ['Purpose', 'statutory invoicing and record-keeping obligations'],
          ['Legal basis', 'legal obligation — GDPR Art. 6(1)(c), Section 169 of Act C of 2000 on Accounting'],
          ['Retention', '8 years — a statutory period that cannot be shortened on request']
        ] },
        'Cookies and the Barion Pixel',
        { t: [
          ['Data', 'session identifier, language preference, consent state; with consent, browsing data collected by the Barion Pixel'],
          ['Purpose', 'operating the website, fraud prevention and — with consent — measuring the payment experience'],
          ['Legal basis', 'strictly necessary cookies: legitimate interest — GDPR Art. 6(1)(f); all others: consent — GDPR Art. 6(1)(a)'],
          ['Retention', 'see the Cookie Policy']
        ] }
      ]
    },
    {
      h: '3. Who has access to the data? (processors)',
      b: [
        'Besides our own staff, only the following processors may access data, and only to the extent needed for their task:',
        { t: [
          ['Hosting', '{{company.hostingName}} — {{company.hostingAddress}}'],
          ['Payment', 'Barion Payment Zrt., 4–20 Irinyi József street, 1117 Budapest (also acts as an independent controller)'],
          ['Invoicing', 'the operator of the invoicing software used by the shop'],
          ['Email', 'the transactional email service used by the shop'],
          ['Google (optional)', 'Google Ireland Ltd. — only if the customer signs in with a Google account']
        ] },
        'We do not transfer data to third countries, except where one of the providers above operates outside the EU — such transfers rely on an adequacy decision of the European Commission or standard contractual clauses.',
        'We never sell your data or pass it to third parties for marketing.'
      ]
    },
    {
      h: '4. Data security',
      b: [
        'The website is served exclusively over an encrypted (HTTPS) connection.',
        'Passwords are stored only in irreversible form using the scrypt algorithm with a unique salt.',
        'Uploaded photographs are not public: only the uploading user and the administrator can access them, after signing in.',
        'Card details never enter the service provider’s systems.',
        'Regular backups are taken of the system.'
      ]
    },
    {
      h: '5. Your rights',
      b: [
        'Under the GDPR you have the following rights:',
        [
          'Access: to be informed what data we process about you and to receive a copy.',
          'Rectification: to have inaccurate data corrected — you can edit much of it yourself in your account.',
          'Erasure (“right to be forgotten”): to have your data deleted, unless processing rests on a legal obligation (such as the 8-year retention of invoices).',
          'Restriction: to have your data merely stored and not processed further.',
          'Portability: to receive your data in a machine-readable format.',
          'Objection: to object to processing based on legitimate interest.',
          'Withdrawal of consent: you may withdraw cookie consent at any time; this does not affect the lawfulness of prior processing.'
        ],
        'Requests can be sent to {{company.email}}. We respond within 30 days at the latest.'
      ]
    },
    {
      h: '6. Remedies',
      b: [
        'If you believe your rights have been infringed, please contact us first at {{company.email}}.',
        'You may also lodge a complaint with the supervisory authority:',
        { t: [
          ['Authority', 'Hungarian National Authority for Data Protection and Freedom of Information (NAIH)'],
          ['Address', '9–11 Falk Miksa street, 1055 Budapest, Hungary'],
          ['Email', 'ugyfelszolgalat@naih.hu'],
          ['Website', 'https://naih.hu']
        ] },
        'You may also bring court proceedings, which may be initiated before the court of your place of residence.'
      ]
    }
  ]
},

refund: {
  title: 'Withdrawal information',
  lead: 'Information on the consumer right of withdrawal and why it does not apply to bespoke jewellery.',
  sections: [
    {
      h: '1. The general rule',
      b: [
        'Under Government Decree 45/2014 (II. 26.), consumers generally have 14 days to withdraw from a distance contract without giving reasons.'
      ]
    },
    {
      h: '2. Exception: custom-made products',
      b: [
        { note: 'Every piece of {{shop.name}} jewellery is made specifically to the customer’s request, based on the uploaded photograph and the parameters supplied (metal, size, engraving). Therefore, under Section 29(1)(c) of the Decree, the 14-day right of withdrawal does NOT apply.' },
        'The Decree expressly excludes withdrawal for “non-prefabricated goods produced to the consumer’s instructions or at their express request, or goods clearly personalised for the consumer”.',
        'The service provider draws express attention to this before an order is placed, both here and in the Terms and Conditions. The customer expressly acknowledges this when accepting the terms at checkout.'
      ]
    },
    {
      h: '3. When can you still step back without consequence?',
      b: [
        'The process is designed so that you can change your mind at no risk:',
        [
          'Uploading a photo and requesting a quote is free and carries no payment obligation.',
          'After receiving the quote you are free to decide: if you do not pay, no contract is concluded.',
          'Production only begins once payment has been received.'
        ],
        'Payment therefore constitutes both acceptance of the quote and an express request to begin production.'
      ]
    },
    {
      h: '4. When does the right of withdrawal still apply?',
      b: [
        'If the service provider exceptionally sells a prefabricated item from stock rather than a bespoke piece, the 14-day right of withdrawal applies under the general rules. In that case the intention to withdraw must be communicated by a clear statement to {{company.email}}, and the product returned intact and complete.',
        'The service provider refunds the amount paid within 14 days of the withdrawal being communicated, using the same payment method.'
      ]
    },
    {
      h: '5. This does not affect warranty rights',
      b: [
        'The exclusion of withdrawal does not affect rights arising from defective performance. If the finished piece is defective, the customer has warranty rights — repair, replacement, price reduction or ultimately withdrawal.',
        'Warranty claims must be notified without delay and at the latest within two months of discovering the defect. See section 9 of the Terms and Conditions.'
      ]
    },
    {
      h: '6. Contact for withdrawal or warranty matters',
      b: [{ t: [
        ['Email', '{{company.email}}'],
        ['Phone', '{{company.phone}}'],
        ['Postal address', '{{company.mailingAddress}}']
      ] }]
    }
  ]
},

cookies: {
  title: 'Cookie Policy',
  lead: 'This website uses strictly necessary cookies to function, and anything else only with your consent.',
  sections: [
    {
      h: '1. What is a cookie?',
      b: [
        'A cookie is a small data file placed in your browser by the website. It lets the site “remember” that you are signed in, or which language you chose.'
      ]
    },
    {
      h: '2. Which cookies do we use?',
      b: [
        'Strictly necessary cookies — these may be set without consent because the site cannot work without them:',
        { t: [
          ['ssy_session', 'Maintains your signed-in state. HttpOnly, SameSite=Lax, over an encrypted connection. Lifetime: 30 days.'],
          ['ssy_lang', 'Remembers your language choice (Hungarian / English). Lifetime: in browser storage until cleared.'],
          ['ssy_consent', 'Stores your cookie choice so we do not ask again. Lifetime: 12 months.']
        ] },
        'Consent-based cookies — these load only if you click “Accept”:',
        { t: [
          ['Barion Pixel', 'Measurement code of Barion Payment Zrt. serving payment conversion measurement and fraud prevention. Controller: Barion Payment Zrt. More: https://www.barion.com/en/privacy-policy/']
        ] },
        { note: 'This website does not use Google Analytics, the Facebook Pixel or any similar advertising tracker.' }
      ]
    },
    {
      h: '3. How to withdraw your consent',
      b: [
        'You may withdraw consent at any time: click “Cookie settings” at the bottom of the page and the choice reappears.',
        'You can also delete cookies already set through your browser settings. Please note that disabling strictly necessary cookies will prevent signing in and ordering.'
      ]
    },
    {
      h: '4. Further information',
      b: [
        'Details of cookie-related processing — legal bases, retention and your rights — are set out in the Privacy Policy.'
      ]
    }
  ]
}

}
};
