/* ══════════════════════════════════════════════════════════════════
   NYELVI SZÓTÁR — magyar / angol
   Új nyelvhez: másold a blokkot és fordítsd le a kulcsokat.
   ══════════════════════════════════════════════════════════════════ */

const I18N = {
  hu: {
    /* --- navigáció --- */
    nav_home: 'Főoldal',
    nav_how: 'Hogyan működik',
    nav_upload: 'Töltsd fel a gyűrűt',
    nav_inspiration: 'Inspiráció',
    nav_orders: 'Rendeléseim',
    nav_account: 'Fiókom',
    nav_admin: 'Admin',
    nav_about: 'Rólunk',
    nav_contact: 'Kapcsolat',
    nav_login: 'Belépés',
    nav_logout: 'Kijelentkezés',

    /* --- hero --- */
    brand_sub: 'COSTUM RING WEBSHOP',
    brand_tagline: 'Your vision. Our craftsmanship.',
    hero_eyebrow: 'EGYEDI GYŰRŰK KÉSZÍTÉSE',
    hero_title_1: 'Egyedi gyűrűk',
    hero_title_2: 'pont, ahogy elképzelted.',
    hero_sub: 'Küldj egy képet, vagy írd körbe az álomgyűrűt — mi megalkotjuk. Kézzel készítve, magyar ötvösműhelyben, a te történetedre szabva.',
    hero_cta: 'Töltsd fel a gyűrűt',
    hero_cta2: 'Hogyan működik?',
    hero_trust_1: 'Árajánlat 1 órán belül',
    hero_trust_2: 'Fizetés csak elfogadás után',
    hero_trust_3: '10–14 munkanap alatt kész',

    /* --- lépések --- */
    how_eyebrow: 'NÉGY LÉPÉS',
    how_title: 'Ennyi az egész',
    step1_t: 'Töltsd fel a képet',
    step1_d: 'Screenshot Pinterestről, Instagramról, vagy egy fotó — bármi, amin látszik az álomgyűrű. JPG vagy PNG.',
    step2_t: 'Megvárod az elfogadást',
    step2_d: 'Ötvösünk kb. 1 órán belül átnézi, és egyedi árajánlatot küld. Semmire nem kötelez.',
    step3_t: 'Fizetsz',
    step3_d: 'Ha rendben az ár, biztonságosan fizetsz bankkártyával a Barion rendszerén keresztül.',
    step4_t: 'Megvárod az elkészítést',
    step4_d: 'Kézzel készítjük el, 10–14 munkanap alatt. Végig követheted a fiókodban.',

    /* --- feltöltés --- */
    up_eyebrow: 'AZ ÁLOMGYŰRŰ',
    up_title: 'Töltsd fel a képet',
    up_sub: 'Mutasd meg, milyen gyűrűre vágyik. A többit ránk bízhatod.',
    up_drop: 'Húzd ide a képet, vagy kattints a tallózáshoz',
    up_formats: 'JPG, PNG vagy WebP · max. {mb} MB · legfeljebb {n} kép',
    up_selected: 'kiválasztott kép',
    up_remove: 'Eltávolítás',
    up_details: 'Részletek (opcionális)',
    up_metal: 'Nemesfém',
    up_metal_ph: 'pl. fehérarany, sárgaarany, platina',
    up_size: 'Gyűrűméret',
    up_size_ph: 'pl. 54 vagy US 7 — ha tudod',
    up_budget: 'Elképzelt keret',
    up_budget_ph: 'pl. 300 000 – 500 000 Ft',
    up_deadline: 'Mikorra kellene?',
    up_deadline_ph: 'pl. 2026. szeptember',
    up_engraving: 'Gravírozás',
    up_engraving_ph: 'pl. A & L · 2026.06.14',
    up_note: 'Bármi, amit tudnunk kell',
    up_note_ph: 'Írd le, ha van bármi fontos a gyűrűvel kapcsolatban…',
    up_contact: 'Kapcsolattartás',
    up_name: 'Neved',
    up_email: 'E-mail cím',
    up_phone: 'Telefonszám',
    up_terms: 'Elfogadom az Általános Szerződési Feltételeket és az Adatkezelési tájékoztatót.',
    up_submit: 'Küldés az ötvösnek',
    up_sending: 'Küldés…',
    up_login_needed: 'A feltöltéshez lépj be — így fogod látni az árajánlatot és tudsz fizetni.',
    up_login_btn: 'Belépés vagy regisztráció',
    up_custom_note: 'A gyűrű kifejezetten a te kérésedre, egyedi paraméterekkel készül, ezért a 45/2014. (II. 26.) Korm. rendelet 29. § (1) c) pontja alapján a 14 napos elállási jog nem illet meg. Fizetni csak az árajánlat elfogadásakor kell — addig bármikor visszaléphetsz.',

    /* --- siker --- */
    ok_title: 'Megkaptuk!',
    ok_sub: 'Elküldtük a visszaigazolást a {email} címre. Ötvösünk kb. {h} órán belül átnézi, és megküldi az árajánlatot.',
    ok_ref: 'Azonosító',
    ok_next: 'Amint elkészül az ajánlat, a Rendeléseim menüpontban látod az árat, és ott tudsz fizetni.',
    ok_orders: 'Rendeléseim',
    ok_another: 'Másik gyűrű feltöltése',

    /* --- rendelések --- */
    ord_eyebrow: 'A FIÓKOD',
    ord_title: 'Rendeléseim',
    ord_empty: 'Még nem töltöttél fel gyűrűt.',
    ord_empty_cta: 'Töltsd fel az elsőt',
    ord_ref: 'Azonosító',
    ord_submitted: 'Beküldve',
    ord_price: 'Ár',
    ord_waiting: 'Árajánlatra vár',
    ord_waiting_d: 'Ötvösünk átnézi a képet. Kb. {h} órán belül értesítünk.',
    ord_approved_d: 'Elfogadva! Az ár elkészült, most már fizethetsz.',
    ord_rejected_d: 'Sajnos ezt a gyűrűt nem tudjuk elkészíteni.',
    ord_paid_d: 'Fizetés megérkezett. A gyártás elkezdődött.',
    ord_production_d: 'Gyártás alatt, {a}–{b} munkanap.',
    ord_completed_d: 'Elkészült! Hamarosan keresünk a részletekkel.',
    ord_pay: 'Fizetés most',
    ord_paying: 'Átirányítás…',
    ord_note: 'Ötvös megjegyzése',
    ord_photos: 'Feltöltött képek',
    ord_vat: 'Ebből ÁFA',

    /* --- státuszok --- */
    st_submitted: 'Elbírálás alatt',
    st_approved: 'Elfogadva · fizethető',
    st_rejected: 'Elutasítva',
    st_paid: 'Kifizetve',
    st_in_production: 'Gyártás alatt',
    st_completed: 'Elkészült',
    st_canceled: 'Visszavonva',

    /* --- belépés --- */
    au_login_t: 'Belépés',
    au_register_t: 'Fiók létrehozása',
    au_login_sub: 'Lépj be, hogy lásd az árajánlatot és fizetni tudj.',
    au_register_sub: 'Pár másodperc, és követheted a rendelésed.',
    au_email: 'E-mail cím',
    au_password: 'Jelszó',
    au_name: 'Neved',
    au_phone: 'Telefonszám (opcionális)',
    au_login_btn: 'Belépés',
    au_register_btn: 'Regisztráció',
    au_no_account: 'Még nincs fiókod?',
    au_have_account: 'Van már fiókod?',
    au_register_link: 'Regisztrálj',
    au_login_link: 'Jelentkezz be',
    au_or: 'VAGY',
    au_pw_hint: 'legalább 8 karakter',

    /* --- inspiráció --- */
    ins_eyebrow: 'INSPIRÁCIÓ',
    ins_title: 'Nem tudod, mit szeretne?',
    ins_sub: 'Böngéssz a Pinteresten, mentsd le, ami tetszik neki — aztán töltsd fel ide.',
    ins_open: 'Megnyitás a Pinteresten',
    ins_tip_t: 'Kis trükk',
    ins_tip_d: 'Nézd meg a Pinterest-tábláit. Nagy eséllyel már el is mentette azt a gyűrűt, amiről álmodik.',
    ins_board: 'Ötlettábláink',

    /* --- admin --- */
    ad_title: 'Admin — beérkezett kérések',
    ad_all: 'Összes',
    ad_search: 'Keresés azonosítóra, névre, e-mailre…',
    ad_revenue: 'Kifizetett bevétel',
    ad_customer: 'Ügyfél',
    ad_setprice: 'Ár megadása',
    ad_price_ph: 'pl. 250000',
    ad_note_ph: 'Megjegyzés az ügyfélnek (opcionális)',
    ad_approve: 'Jóváhagyás és árazás',
    ad_reject: 'Elutasítás',
    ad_toproduction: 'Gyártásba',
    ad_complete: 'Elkészült',
    ad_empty: 'Nincs megjeleníthető kérés.',
    ad_view_cards: 'Kártyák',
    ad_view_table: 'Táblázat',
    ad_export_csv: 'CSV (Excel)',
    ad_export_xls: 'Excel (.xls)',
    ad_count: 'Összes kérés',
    ad_paidcount: 'Kifizetett',
    ad_pending: 'Elbírálásra vár',
    ad_avg: 'Átlagos érték',
    th_id: 'Azonosító',
    th_date: 'Mikor',
    th_customer: 'Ki rendelt',
    th_what: 'Mit',
    th_status: 'Státusz',
    th_price: 'Ár',
    th_paid: 'Fizetve',
    ad_details: 'Részletek',
    ad_history: 'Előzmények',
    ad_approved_ok: 'Jóváhagyva — az ügyfél már fizethet.',

    /* --- fizetés visszatérés --- */
    pr_checking: 'Fizetés ellenőrzése…',
    pr_paid_t: 'Sikeres fizetés!',
    pr_paid_d: 'Köszönjük! A gyártás elkezdődött, {a}–{b} munkanap.',
    pr_failed_t: 'A fizetés sikertelen',
    pr_canceled_t: 'A fizetést megszakítottad',
    pr_pending_t: 'A fizetés feldolgozás alatt',
    pr_retry: 'Fizetés újraindítása',
    pr_orders: 'Rendeléseim',

    /* --- általános --- */
    g_back: 'Vissza',
    g_close: 'Bezárás',
    g_save: 'Mentés',
    g_saved: 'Mentve',
    g_loading: 'Betöltés',
    g_required: 'kötelező',
    footer_rights: 'Minden jog fenntartva',
    footer_secure: 'Biztonságos fizetés a Barion rendszerében',

    /* --- rólunk / kapcsolat --- */
    ab_title: 'Rólunk',
    ab_lead: 'Egy gyűrű, ami annyira egyedi, mint a történetetek. Te elképzeled — mi megalkotjuk.',
    ab_1_t: 'Kézműves',
    ab_1_d: 'Minden gyűrűt magyar ötvösmester készít el, egyesével, a beküldött kép alapján.',
    ab_2_t: 'Őszinte árazás',
    ab_2_d: 'Egyedi árajánlatot adunk minden képre. Nincs rejtett költség, és semmi nem kötelez.',
    ab_3_t: 'Etikus kövek',
    ab_3_d: 'Laborban növesztett gyémántokkal dolgozunk: ugyanaz a ragyogás, tisztább eredet.',
    ab_4_t: 'Titoktartás',
    ab_4_d: 'A feltöltött képeket csak az ötvösünk látja. Sosem tesszük közzé.',
    ct_title: 'Kapcsolat',
    ct_salon: 'Szalon',
    ct_hours: 'H–P 10:00–18:00 · Szo 10:00–14:00',

    /* --- jogi oldalak --- */
    lg_terms: 'ÁSZF',
    lg_terms_long: 'Általános Szerződési Feltételek',
    lg_privacy: 'Adatkezelés',
    lg_privacy_long: 'Adatkezelési tájékoztató',
    lg_impressum: 'Impresszum',
    lg_refund: 'Elállás',
    lg_refund_long: 'Elállási tájékoztató',
    lg_cookies: 'Cookie tájékoztató',
    lg_legal: 'Jogi információk',
    lg_tax: 'Adószám',
    lg_effective: 'Hatályos',
    lg_missing: 'KITÖLTENDŐ',
    lg_toc: 'Tartalom',
    lg_print: 'Nyomtatás / PDF',
    lg_unavailable: 'A tartalom nem tölthető be. Frissítsd az oldalt.',

    /* --- cookie sáv --- */
    ck_title: 'Sütiket használunk',
    ck_text: 'A működéshez szükséges sütiket mindig használjuk. A fizetési méréshez (Barion Pixel) csak a hozzájárulásoddal.',
    ck_accept: 'Elfogadom',
    ck_reject: 'Csak a szükségeseket',
    ck_more: 'Részletek',
    ck_settings: 'Cookie beállítások',
    ck_saved: 'A beállítást elmentettük.',

    /* --- 404 --- */
    nf_code: 'HIBA 404',
    nf_title: 'Ez az oldal nem található',
    nf_sub: 'Lehet, hogy elírtad a címet, vagy az oldal időközben megszűnt.',
    nf_home: 'Vissza a főoldalra',
    nf_upload: 'Töltsd fel a gyűrűt',

    /* --- hibaüzenetek --- */
    e_AUTH_REQUIRED: 'Bejelentkezés szükséges.',
    e_ADMIN_REQUIRED: 'Adminisztrátori jogosultság szükséges.',
    e_INVALID_CREDENTIALS: 'Hibás azonosító vagy jelszó.',
    e_INVALID_EMAIL: 'Érvénytelen e-mail cím.',
    e_PASSWORD_TOO_SHORT: 'A jelszónak legalább 8 karakternek kell lennie.',
    e_EMAIL_TAKEN: 'Ezzel az e-mail címmel már létezik fiók.',
    e_TOO_MANY_ATTEMPTS: 'Túl sok próbálkozás. Várj egy percet.',
    e_NO_PHOTO: 'Legalább egy képet fel kell töltened.',
    e_FILE_TOO_LARGE: 'A kép túl nagy.',
    e_TOO_MANY_FILES: 'Túl sok képet választottál.',
    e_UNSUPPORTED_FILE_TYPE: 'Csak JPG, PNG vagy WebP tölthető fel.',
    e_UPLOAD_FAILED: 'A feltöltés nem sikerült.',
    e_TERMS_REQUIRED: 'Az ÁSZF elfogadása kötelező.',
    e_NAME_REQUIRED: 'A név megadása kötelező.',
    e_NOT_FOUND: 'Nem található.',
    e_FORBIDDEN: 'Nincs jogosultság.',
    e_NOT_PAYABLE: 'Ez a kérés jelenleg nem fizethető.',
    e_ALREADY_PAID: 'Ez már ki van fizetve.',
    e_NO_PRICE: 'Még nincs ár megadva.',
    e_INVALID_PRICE: 'Érvénytelen ár.',
    e_PAYMENT_START_FAILED: 'A fizetés indítása sikertelen.',
    e_GOOGLE_NOT_CONFIGURED: 'A Google belépés nincs beállítva.',
    e_SERVER_ERROR: 'Szerverhiba.',
    e_ADMIN_CANNOT_ORDER: 'Admin fiókkal nem lehet rendelést leadni.'
  },

  en: {
    nav_home: 'Home',
    nav_how: 'How it works',
    nav_upload: 'Upload the ring',
    nav_inspiration: 'Inspiration',
    nav_orders: 'My orders',
    nav_account: 'My account',
    nav_admin: 'Admin',
    nav_about: 'About',
    nav_contact: 'Contact',
    nav_login: 'Sign in',
    nav_logout: 'Sign out',

    brand_sub: 'COSTUM RING WEBSHOP',
    brand_tagline: 'Your vision. Our craftsmanship.',
    hero_eyebrow: 'CUSTOM RINGS, MADE TO ORDER',
    hero_title_1: 'Custom rings,',
    hero_title_2: 'designed around your vision.',
    hero_sub: 'Send us a photo or describe your dream ring — we bring it to life. Handcrafted in a Hungarian goldsmith workshop, as unique as your story.',
    hero_cta: 'Upload the ring',
    hero_cta2: 'How it works',
    hero_trust_1: 'Quote within 1 hour',
    hero_trust_2: 'Pay only after approval',
    hero_trust_3: 'Ready in 10–14 working days',

    how_eyebrow: 'FOUR STEPS',
    how_title: 'That is all it takes',
    step1_t: 'Upload the photo',
    step1_d: 'A screenshot from Pinterest or Instagram, or a photo — anything that shows the dream ring. JPG or PNG.',
    step2_t: 'Wait for approval',
    step2_d: 'Our goldsmith reviews it within about an hour and sends a personal quote. No obligation.',
    step3_t: 'Pay',
    step3_d: 'If the price works for you, pay securely by card through Barion.',
    step4_t: 'Wait for the making',
    step4_d: 'We craft it by hand in 10–14 working days. Follow every step in your account.',

    up_eyebrow: 'THE DREAM RING',
    up_title: 'Upload the photo',
    up_sub: 'Show us the ring she longs for. Leave the rest to us.',
    up_drop: 'Drag a photo here, or click to browse',
    up_formats: 'JPG, PNG or WebP · max {mb} MB · up to {n} photos',
    up_selected: 'photo selected',
    up_remove: 'Remove',
    up_details: 'Details (optional)',
    up_metal: 'Metal',
    up_metal_ph: 'e.g. white gold, yellow gold, platinum',
    up_size: 'Ring size',
    up_size_ph: 'e.g. 54 or US 7 — if you know it',
    up_budget: 'Budget in mind',
    up_budget_ph: 'e.g. 800 – 1400 EUR',
    up_deadline: 'When do you need it?',
    up_deadline_ph: 'e.g. September 2026',
    up_engraving: 'Engraving',
    up_engraving_ph: 'e.g. A & L · 14.06.2026',
    up_note: 'Anything we should know',
    up_note_ph: 'Tell us anything important about the ring…',
    up_contact: 'Contact details',
    up_name: 'Your name',
    up_email: 'Email address',
    up_phone: 'Phone number',
    up_terms: 'I accept the Terms and Conditions and the Privacy Policy.',
    up_submit: 'Send to the goldsmith',
    up_sending: 'Sending…',
    up_login_needed: 'Sign in to upload — this is where you will see the quote and pay.',
    up_login_btn: 'Sign in or register',
    up_custom_note: 'The ring is made specifically to your request with individual parameters, therefore the 14-day right of withdrawal does not apply under Section 29(1)(c) of Government Decree 45/2014 (II. 26.). You only pay when you accept the quote — until then you can step back at any time.',

    ok_title: 'We got it!',
    ok_sub: 'A confirmation is on its way to {email}. Our goldsmith will review it within about {h} hour(s) and send you a quote.',
    ok_ref: 'Reference',
    ok_next: 'Once the quote is ready, you will see the price under My orders and can pay there.',
    ok_orders: 'My orders',
    ok_another: 'Upload another ring',

    ord_eyebrow: 'YOUR ACCOUNT',
    ord_title: 'My orders',
    ord_empty: 'You have not uploaded a ring yet.',
    ord_empty_cta: 'Upload your first one',
    ord_ref: 'Reference',
    ord_submitted: 'Submitted',
    ord_price: 'Price',
    ord_waiting: 'Awaiting quote',
    ord_waiting_d: 'Our goldsmith is reviewing your photo. We will notify you within about {h} hour(s).',
    ord_approved_d: 'Approved! Your quote is ready — you can pay now.',
    ord_rejected_d: 'Unfortunately we cannot craft this particular ring.',
    ord_paid_d: 'Payment received. Production has started.',
    ord_production_d: 'In production, {a}–{b} working days.',
    ord_completed_d: 'Finished! We will be in touch with the details.',
    ord_pay: 'Pay now',
    ord_paying: 'Redirecting…',
    ord_note: 'Goldsmith’s note',
    ord_photos: 'Uploaded photos',
    ord_vat: 'incl. VAT',

    st_submitted: 'Under review',
    st_approved: 'Approved · payable',
    st_rejected: 'Declined',
    st_paid: 'Paid',
    st_in_production: 'In production',
    st_completed: 'Completed',
    st_canceled: 'Cancelled',

    au_login_t: 'Sign in',
    au_register_t: 'Create an account',
    au_login_sub: 'Sign in to see your quote and pay.',
    au_register_sub: 'A few seconds, and you can track your order.',
    au_email: 'Email address',
    au_password: 'Password',
    au_name: 'Your name',
    au_phone: 'Phone number (optional)',
    au_login_btn: 'Sign in',
    au_register_btn: 'Register',
    au_no_account: 'No account yet?',
    au_have_account: 'Already have an account?',
    au_register_link: 'Register',
    au_login_link: 'Sign in',
    au_or: 'OR',
    au_pw_hint: 'at least 8 characters',

    ins_eyebrow: 'INSPIRATION',
    ins_title: 'Not sure what she wants?',
    ins_sub: 'Browse Pinterest, save what looks like her — then upload it here.',
    ins_open: 'Open on Pinterest',
    ins_tip_t: 'A little trick',
    ins_tip_d: 'Check her Pinterest boards. Chances are she has already saved the ring she dreams about.',
    ins_board: 'Our idea boards',

    ad_title: 'Admin — incoming requests',
    ad_all: 'All',
    ad_search: 'Search by reference, name or email…',
    ad_revenue: 'Paid revenue',
    ad_customer: 'Customer',
    ad_setprice: 'Set price',
    ad_price_ph: 'e.g. 250000',
    ad_note_ph: 'Note to the customer (optional)',
    ad_approve: 'Approve and set price',
    ad_reject: 'Decline',
    ad_toproduction: 'To production',
    ad_complete: 'Mark completed',
    ad_empty: 'No requests to show.',
    ad_view_cards: 'Cards',
    ad_view_table: 'Table',
    ad_export_csv: 'CSV (Excel)',
    ad_export_xls: 'Excel (.xls)',
    ad_count: 'Total requests',
    ad_paidcount: 'Paid',
    ad_pending: 'Awaiting review',
    ad_avg: 'Average value',
    th_id: 'Reference',
    th_date: 'When',
    th_customer: 'Who ordered',
    th_what: 'What',
    th_status: 'Status',
    th_price: 'Price',
    th_paid: 'Paid at',
    ad_details: 'Details',
    ad_history: 'History',
    ad_approved_ok: 'Approved — the customer can pay now.',

    pr_checking: 'Verifying payment…',
    pr_paid_t: 'Payment successful!',
    pr_paid_d: 'Thank you! Production has started, {a}–{b} working days.',
    pr_failed_t: 'Payment failed',
    pr_canceled_t: 'You cancelled the payment',
    pr_pending_t: 'Payment is being processed',
    pr_retry: 'Restart payment',
    pr_orders: 'My orders',

    g_back: 'Back',
    g_close: 'Close',
    g_save: 'Save',
    g_saved: 'Saved',
    g_loading: 'Loading',
    g_required: 'required',
    footer_rights: 'All rights reserved',
    footer_secure: 'Secure payment via Barion',

    ab_title: 'About us',
    ab_lead: 'A ring as unique as your story. Your vision, our craftsmanship.',
    ab_1_t: 'Handcrafted',
    ab_1_d: 'Every ring is made one at a time by a Hungarian master goldsmith, from the photo you send.',
    ab_2_t: 'Honest pricing',
    ab_2_d: 'We quote each photo individually. No hidden costs, and no obligation.',
    ab_3_t: 'Ethical stones',
    ab_3_d: 'We work with lab-grown diamonds: the same brilliance, a cleaner origin.',
    ab_4_t: 'Discretion',
    ab_4_d: 'Only our goldsmith sees your uploaded photos. We never publish them.',
    ct_title: 'Contact',
    ct_salon: 'Salon',
    ct_hours: 'Mon–Fri 10:00–18:00 · Sat 10:00–14:00',

    lg_terms: 'Terms',
    lg_terms_long: 'Terms and Conditions',
    lg_privacy: 'Privacy',
    lg_privacy_long: 'Privacy Policy',
    lg_impressum: 'Legal notice',
    lg_refund: 'Withdrawal',
    lg_refund_long: 'Withdrawal information',
    lg_cookies: 'Cookie Policy',
    lg_legal: 'Legal',
    lg_tax: 'Tax number',
    lg_effective: 'Effective from',
    lg_missing: 'TO BE COMPLETED',
    lg_toc: 'Contents',
    lg_print: 'Print / PDF',
    lg_unavailable: 'Content could not be loaded. Please refresh the page.',

    ck_title: 'We use cookies',
    ck_text: 'Strictly necessary cookies are always used. Payment measurement (Barion Pixel) only with your consent.',
    ck_accept: 'Accept',
    ck_reject: 'Necessary only',
    ck_more: 'Details',
    ck_settings: 'Cookie settings',
    ck_saved: 'Your choice has been saved.',

    nf_code: 'ERROR 404',
    nf_title: 'This page could not be found',
    nf_sub: 'The address may be mistyped, or the page no longer exists.',
    nf_home: 'Back to home',
    nf_upload: 'Upload the ring',

    e_AUTH_REQUIRED: 'Please sign in.',
    e_ADMIN_REQUIRED: 'Administrator access required.',
    e_INVALID_CREDENTIALS: 'Incorrect username or password.',
    e_INVALID_EMAIL: 'Invalid email address.',
    e_PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
    e_EMAIL_TAKEN: 'An account with this email already exists.',
    e_TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait a minute.',
    e_NO_PHOTO: 'Please upload at least one photo.',
    e_FILE_TOO_LARGE: 'The photo is too large.',
    e_TOO_MANY_FILES: 'Too many photos selected.',
    e_UNSUPPORTED_FILE_TYPE: 'Only JPG, PNG or WebP can be uploaded.',
    e_UPLOAD_FAILED: 'Upload failed.',
    e_TERMS_REQUIRED: 'You must accept the Terms and Conditions.',
    e_NAME_REQUIRED: 'Your name is required.',
    e_NOT_FOUND: 'Not found.',
    e_FORBIDDEN: 'Access denied.',
    e_NOT_PAYABLE: 'This request is not payable yet.',
    e_ALREADY_PAID: 'This has already been paid.',
    e_NO_PRICE: 'No price has been set yet.',
    e_INVALID_PRICE: 'Invalid price.',
    e_PAYMENT_START_FAILED: 'Could not start the payment.',
    e_GOOGLE_NOT_CONFIGURED: 'Google sign-in is not configured.',
    e_SERVER_ERROR: 'Server error.',
    e_ADMIN_CANNOT_ORDER: 'Admin accounts cannot place orders.'
  }
};
/* ══════════════════════════════════════════════════════════════════
   BRIGHTAL — costum ring webshop · frontend
   ──────────────────────────────────────────────────────────────────
   FORRÁSFÁJL. Módosítás után:  npm run build
   ══════════════════════════════════════════════════════════════════ */

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* ═══════════ SEGÉDEK ═══════════ */

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const res = await fetch('/api' + path, {
    credentials: 'same-origin',
    method: opts.method || 'GET',
    headers: isForm ? undefined : { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: isForm ? opts.body : (opts.body ? JSON.stringify(opts.body) : undefined)
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = { error: 'SERVER_ERROR' }; }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'SERVER_ERROR');
    err.code = (data && data.error) || 'SERVER_ERROR';
    err.detail = data && data.detail;
    throw err;
  }
  return data;
}

let CUR = { code: 'HUF', symbol: 'Ft', decimals: 0 };
function money(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  try {
    return new Intl.NumberFormat(LANG === 'en' ? 'en-GB' : 'hu-HU', {
      style: 'currency', currency: CUR.code,
      minimumFractionDigits: CUR.decimals, maximumFractionDigits: CUR.decimals
    }).format(v);
  } catch (e) {
    return new Intl.NumberFormat('hu-HU').format(v) + ' ' + CUR.symbol;
  }
}

let LANG = 'hu';
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const fmtDate = iso => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(LANG === 'en' ? 'en-GB' : 'hu-HU', { dateStyle: 'medium', timeStyle: 'short' }); }
  catch (e) { return iso; }
};

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { if (el) el.classList.add('is-visible'); return; }
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ═══════════ ÚTVONALAK ═══════════ */

const ROUTES = [
  ['home', /^\/$/, () => '/'],
  ['how', /^\/(hogyan|how)\/?$/, () => (LANG === 'en' ? '/how' : '/hogyan')],
  ['upload', /^\/(feltoltes|upload)\/?$/, () => (LANG === 'en' ? '/upload' : '/feltoltes')],
  ['inspiration', /^\/(inspiracio|inspiration)\/?$/, () => (LANG === 'en' ? '/inspiration' : '/inspiracio')],
  ['orders', /^\/(rendeleseim|orders)\/?$/, () => (LANG === 'en' ? '/orders' : '/rendeleseim')],
  ['account', /^\/(fiok|account)\/?$/, () => (LANG === 'en' ? '/account' : '/fiok')],
  ['about', /^\/(rolunk|about)\/?$/, () => (LANG === 'en' ? '/about' : '/rolunk')],
  ['contact', /^\/(kapcsolat|contact)\/?$/, () => (LANG === 'en' ? '/contact' : '/kapcsolat')],
  ['admin', /^\/admin\/?$/, () => '/admin'],
  ['payment-return', /^\/payment-return\/?$/, () => '/payment-return'],
  /* jogi oldalak */
  ['terms', /^\/(aszf|terms)\/?$/, () => (LANG === 'en' ? '/terms' : '/aszf')],
  ['privacy', /^\/(adatkezeles|privacy)\/?$/, () => (LANG === 'en' ? '/privacy' : '/adatkezeles')],
  ['impressum', /^\/(impresszum|impressum)\/?$/, () => (LANG === 'en' ? '/impressum' : '/impresszum')],
  ['refund', /^\/(elallas|refund)\/?$/, () => (LANG === 'en' ? '/refund' : '/elallas')],
  ['cookies', /^\/(cookie|cookies)\/?$/, () => (LANG === 'en' ? '/cookies' : '/cookie')],
  ['notfound', /^\/404\/?$/, () => '/404']
];

function parseLocation() {
  for (const [page, re] of ROUTES) if (location.pathname.match(re)) return page;
  return 'notfound';
}
const pathFor = page => {
  const r = ROUTES.find(x => x[0] === page);
  return r ? r[2]() : '/';
};

/* ═══════════ GLOBÁLIS ÁLLAPOT ═══════════ */

const Ctx = createContext(null);
const useA = () => useContext(Ctx);

function Prov({ children }) {
  const [page, setPage] = useState(parseLocation());
  const [lang, setLangState] = useState(() => store.get('ssy_lang', null) || 'hu');
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [authModal, setAuthModal] = useState(null);
  /* süti-hozzájárulás: null = még nem döntött, 'all' | 'necessary' */
  const [consent, setConsentState] = useState(() => {
    const saved = store.get('ssy_consent', null);
    if (!saved || !saved.value) return null;
    /* 12 hónap után újra rákérdezünk */
    if (saved.at && Date.now() - saved.at > 365 * 24 * 3600 * 1000) return null;
    return saved.value;
  });

  LANG = lang;

  useEffect(() => {
    Promise.all([api('/config').catch(() => null), api('/auth/me').catch(() => ({ user: null }))])
      .then(([cf, me]) => {
        if (cf) {
          CUR = cf.currency;
          setConfig(cf);
          if (!store.get('ssy_lang', null)) { setLangState(cf.defaultLang); LANG = cf.defaultLang; }
        }
        setUser(me ? me.user : null);
        setLoading(false);
      });
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback(l => { setLangState(l); LANG = l; store.set('ssy_lang', l); }, []);

  /* fordító függvény, {kulcs} helyettesítéssel */
  const t = useCallback((key, vars) => {
    const dict = I18N[lang] || I18N.hu;
    let s = dict[key] !== undefined ? dict[key] : (I18N.hu[key] !== undefined ? I18N.hu[key] : key);
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }, [lang]);

  /* hibakód → olvasható üzenet */
  const te = useCallback(code => {
    const dict = I18N[lang] || I18N.hu;
    return dict['e_' + code] || dict.e_SERVER_ERROR || code;
  }, [lang]);

  const navigate = useCallback(p => {
    const url = pathFor(p);
    if (location.pathname !== url) history.pushState({ page: p }, '', url);
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPop = () => setPage(parseLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toast = useCallback((msg, kind) => {
    const id = uid();
    setToasts(x => [...x, { id, msg, kind }]);
    setTimeout(() => setToasts(x => x.filter(y => y.id !== id)), 4500);
  }, []);

  const logout = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch (e) {}
    setUser(null);
    navigate('home');
  }, [navigate]);

  const isAdmin = !!(user && user.role === 'admin');

  /* ---------- süti-hozzájárulás ---------- */
  const setConsent = useCallback(v => {
    setConsentState(v);
    store.set('ssy_consent', { value: v, at: Date.now() });
  }, []);

  /* A Barion Pixel CSAK marketing-hozzájárulás után töltődik be.
     Ha a szerveren PIXEL_REQUIRES_CONSENT=false, akkor azonnal. */
  useEffect(() => {
    if (!config || !config.barion || !config.barion.pixelId) return;
    const needsConsent = !config.cookies || config.cookies.pixelRequiresConsent !== false;
    if (needsConsent && consent !== 'all') return;
    if (window.__barionPixelLoaded) return;
    window.__barionPixelLoaded = true;

    /* hivatalos Barion Pixel betöltő, tömörítve */
    window.barion_pixel_id = config.barion.pixelId;
    window.bp = window.bp || function () { (window.bp.q = window.bp.q || []).push(arguments); };
    window.bp.l = Date.now();
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://pixel.barion.com/bp.js';
    document.head.appendChild(s);
    window.bp('init', 'addBarionPixelId', config.barion.pixelId);
  }, [config, consent]);

  /* ══════════════════════════════════════════════════════════════
     MÉLYSÉG — a háttérrétegek finom parallaxisa
     A kép NEM nagyítódik és nem homályosodik: a térérzet kizárólag
     abból jön, hogy a két réteg eltérő ütemben mozdul el az egérrel
     és a görgetéssel. Így a háttér végig pixelre éles marad.
     ══════════════════════════════════════════════════════════════ */
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const fine = !window.matchMedia || window.matchMedia('(pointer: fine)').matches;
    let raf = 0;
    let tx = 0, ty = 0;          // cél
    let cx = 0, cy = 0;          // aktuális (simított)
    let scrollTarget = 0, scrollCur = 0;

    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

    function tick() {
      raf = 0;
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      scrollCur += (scrollTarget - scrollCur) * 0.10;

      /* a görgetés-eltolás korlátozva, hogy hosszú oldalon se ússzon el */
      const scrollShift = Math.min(56, scrollCur * 0.035);

      root.style.setProperty('--pax-x', (-cx * 16).toFixed(2) + 'px');
      root.style.setProperty('--pax-y', (-cy * 11 - scrollShift).toFixed(2) + 'px');

      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008 || Math.abs(scrollTarget - scrollCur) > 0.4) schedule();
    }

    const onMove = e => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      schedule();
    };
    const onScroll = () => { scrollTarget = window.scrollY; schedule(); };

    if (fine) window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    schedule();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <Ctx.Provider value={{
    page, navigate, lang, setLang, t, te, config, user, setUser, isAdmin,
    loading, toast, toasts, authModal, setAuthModal, logout,
    consent, setConsent
  }}>{children}</Ctx.Provider>;
}

/* ═══════════ IKONOK ═══════════ */

const Ico = {
  upload: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  user: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  close: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  check: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
  clock: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  lock: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  ring: ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="12" cy="15" r="6" /><path d="M9 6.5 12 2l3 4.5-3 3.2z" /></svg>,
  mail: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>,
  hammer: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="m15 12-8.5 8.5a2.1 2.1 0 1 1-3-3L12 9" /><path d="M17.6 6.4 14 2.8l-3 3 3.6 3.6z" /><path d="m21.2 10-3.6-3.6-3 3L18.2 13z" /></svg>,
  card: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
  pin: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.2-2 0-2.9l1.2-5.1s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3.1-2.3 3.1-5 0-2.1-1.4-3.6-3.9-3.6-2.9 0-4.6 2.1-4.6 4.3 0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.8c-.1.3-.3.4-.5.2-1.2-.5-1.8-2-1.8-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2.1 6.5-5.1 6.5-1 0-2-.6-2.4-1.2l-.6 2.5c-.2.8-.7 1.7-1.1 2.3.9.3 1.8.4 2.8.4 5.5 0 10-4.5 10-10S17.5 2 12 2z" /></svg>,
  camera: ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  gem: ({ s = 24 }) => <svg width={s} height={s} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round"><path d="M12 40 L30 14 L50 34 L70 14 L88 40 L50 88 Z" /><path d="M12 40 H88" /><path d="M30 14 L38 40 M70 14 L62 40" /><path d="M38 40 L50 88 M62 40 L50 88" /></svg>,
  download: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  table: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="9" y1="10" x2="9" y2="20" /></svg>,
  cards: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /></svg>,
  globe: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
};

/* ═══════════ APRÓ KOMPONENSEK ═══════════ */

const Spinner = ({ dark, size = 20 }) =>
  <span className={'spinner' + (dark ? ' dark' : '')} style={{ width: size, height: size }} />;

function Toasts() {
  const { toasts } = useA();
  if (!toasts.length) return null;
  return <div className="toast-wrap">
    {toasts.map(x => <div key={x.id} className={'toast' + (x.kind === 'err' ? ' err' : '')}>
      <span style={{ color: x.kind === 'err' ? '#E8A08C' : 'var(--gold)', display: 'flex', flexShrink: 0 }}>
        {x.kind === 'err' ? <Ico.close s={15} /> : <Ico.check s={15} />}
      </span>
      <span>{x.msg}</span>
    </div>)}
  </div>;
}

const Section = ({ children, style, className }) => {
  const ref = useReveal();
  return <section ref={ref} className={'reveal ' + (className || '')} style={style}>{children}</section>;
};

const Field = ({ label, error, hint, children }) => <div className="field">
  {label && <label className="label">{label}</label>}
  {children}
  {hint && !error && <div className="hint">{hint}</div>}
  {error && <div className="err-msg">{error}</div>}
</div>;

/* státuszjelvény */
function StatusBadge({ status }) {
  const { t } = useA();
  const colors = {
    submitted: ['#8A7B4E', 'rgba(217,179,130,.14)'],
    approved: ['#4E7A56', 'rgba(94,140,102,.15)'],
    rejected: ['#9C5A4E', 'rgba(156,90,78,.13)'],
    paid: ['#3F6B7A', 'rgba(63,107,122,.14)'],
    in_production: ['#7A5E3F', 'rgba(122,94,63,.14)'],
    completed: ['#4E7A56', 'rgba(94,140,102,.15)'],
    canceled: ['#7A7A7A', 'rgba(120,120,120,.12)']
  };
  const [c, bg] = colors[status] || colors.canceled;
  return <span className="badge-status" style={{ color: c, background: bg }}>{t('st_' + status)}</span>;
}
/* ═══════════ MÁRKAJEL ═══════════ */
/* A Facebook-oldal logója: vonalrajzos gyémánt + ritkított BRIGHTAL felirat. */
function BrandLockup({ size = 26, sub = true }) {
  const { t } = useA();
  return <>
    <span className="brand-gem" style={{ width: size, height: size }}><Ico.gem s={size} /></span>
    <span className="brand-text">
      <span className="brand-mark">BRIGHTAL</span>
      {sub && <span className="brand-sub">{t('brand_sub')}</span>}
    </span>
  </>;
}

/* ═══════════ NAVIGÁCIÓ ═══════════ */

function Nav() {
  const { page, navigate, lang, setLang, t, user, isAdmin, setAuthModal, logout } = useA();
  const [sc, setSc] = useState(false);
  const [mob, setMob] = useState(false);

  useEffect(() => {
    const h = () => setSc(window.scrollY > 30);
    h(); window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  useEffect(() => { setMob(false); }, [page]);
  useEffect(() => { document.body.style.overflow = mob ? 'hidden' : ''; }, [mob]);

  const items = isAdmin
    ? [['admin', t('nav_admin')], ['about', t('nav_about')], ['contact', t('nav_contact')]]
    : [['how', t('nav_how')], ['upload', t('nav_upload')], ['inspiration', t('nav_inspiration')],
       ['about', t('nav_about')], ['contact', t('nav_contact')]];

  const LangSwitch = ({ block }) => <div className={'lang-switch' + (block ? ' block' : '')}>
    <Ico.globe s={13} />
    {['hu', 'en'].map(l => <button key={l} className={lang === l ? 'on' : ''}
      onClick={() => setLang(l)} aria-label={l}>{l.toUpperCase()}</button>)}
  </div>;

  return <>
    <nav className={'nav' + (sc || mob || page !== 'home' ? ' scrolled' : '')}>
      <div className="nav-inner">
        <button className="brand" onClick={() => navigate('home')}>
          <BrandLockup />
        </button>

        <div className="nav-links">
          {items.map(([id, label]) =>
            <button key={id} className={'nav-link' + (page === id ? ' active' : '')} onClick={() => navigate(id)}>{label}</button>)}
          {user && !isAdmin &&
            <button className={'nav-link' + (page === 'orders' ? ' active' : '')} onClick={() => navigate('orders')}>{t('nav_orders')}</button>}
        </div>

        <div className="nav-actions">
          <LangSwitch />
          {user ? <div className="user-chip">
            {user.picture
              ? <img src={user.picture} alt="" referrerPolicy="no-referrer" />
              : <span className="avatar">{(user.name || '?')[0].toUpperCase()}</span>}
            <div className="user-menu">
              <div className="user-menu-head">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              {!isAdmin && <button onClick={() => navigate('orders')}>{t('nav_orders')}</button>}
              {!isAdmin && <button onClick={() => navigate('account')}>{t('nav_account')}</button>}
              {isAdmin && <button onClick={() => navigate('admin')}>{t('nav_admin')}</button>}
              <button onClick={logout}>{t('nav_logout')}</button>
            </div>
          </div> : <button className="btn btn-dark btn-sm hide-mob" onClick={() => setAuthModal('login')}>{t('nav_login')}</button>}
          {!isAdmin && <button className="btn btn-gold btn-sm hide-mob" onClick={() => navigate('upload')}>{t('nav_upload')}</button>}
          <button className="burger" aria-label="Menu" onClick={() => setMob(m => !m)}>
            <span style={mob ? { transform: 'rotate(45deg) translate(3px,4px)' } : null} />
            <span style={mob ? { opacity: 0 } : null} />
            <span style={mob ? { transform: 'rotate(-45deg) translate(3px,-4px)' } : null} />
          </button>
        </div>
      </div>
    </nav>

    {mob && <div className="mobile-menu">
      {items.map(([id, label]) => <button key={id} onClick={() => navigate(id)}>{label}</button>)}
      {user && !isAdmin && <button onClick={() => navigate('orders')}>{t('nav_orders')}</button>}
      {user && !isAdmin && <button onClick={() => navigate('account')}>{t('nav_account')}</button>}
      <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {!isAdmin && <button className="btn btn-gold btn-sm" onClick={() => navigate('upload')}>{t('nav_upload')}</button>}
        {user
          ? <button className="btn btn-ghost btn-sm" onClick={logout}>{t('nav_logout')}</button>
          : <button className="btn btn-ghost btn-sm" onClick={() => { setMob(false); setAuthModal('login'); }}>{t('nav_login')}</button>}
        <LangSwitch block />
      </div>
    </div>}
  </>;
}

/* ═══════════ LÁBLÉC ═══════════ */

function Footer() {
  const { t, navigate, config, isAdmin, setConsent } = useA();
  const shop = (config && config.shop) || {};
  const company = (config && config.company) || {};
  return <footer className="footer">
    <div className="footer-grid">
      <div>
        <div className="brand" style={{ marginBottom: 4 }}><BrandLockup size={24} /></div>
        <p style={{ marginTop: 14, maxWidth: 300, lineHeight: 1.8 }}>
          {t('hero_sub').split('.')[0]}.
        </p>
        <p style={{ marginTop: 16, fontSize: 12 }}>{shop.address}</p>
        <p style={{ fontSize: 12 }}>{shop.email}</p>
      </div>
      <div>
        <h4>{t('nav_how')}</h4>
        <button onClick={() => navigate('how')}>{t('nav_how')}</button>
        {!isAdmin && <button onClick={() => navigate('upload')}>{t('nav_upload')}</button>}
        <button onClick={() => navigate('inspiration')}>{t('nav_inspiration')}</button>
      </div>
      <div>
        <h4>{t('nav_account')}</h4>
        {!isAdmin && <button onClick={() => navigate('orders')}>{t('nav_orders')}</button>}
        {!isAdmin && <button onClick={() => navigate('account')}>{t('nav_account')}</button>}
        <button onClick={() => navigate('about')}>{t('nav_about')}</button>
        <button onClick={() => navigate('contact')}>{t('nav_contact')}</button>
      </div>
      <div>
        <h4>{t('lg_legal')}</h4>
        <button onClick={() => navigate('terms')}>{t('lg_terms')}</button>
        <button onClick={() => navigate('privacy')}>{t('lg_privacy')}</button>
        <button onClick={() => navigate('refund')}>{t('lg_refund')}</button>
        <button onClick={() => navigate('impressum')}>{t('lg_impressum')}</button>
        <button onClick={() => navigate('cookies')}>{t('lg_cookies')}</button>
        <button onClick={() => setConsent(null)}>{t('ck_settings')}</button>
      </div>
    </div>
    {company.name && <div className="footer-company">
      {company.name}
      {company.address ? ' · ' + company.address : ''}
      {company.taxNumber ? ` · ${t('lg_tax')}: ${company.taxNumber}` : ''}
    </div>}
    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} BRIGHTAL — {t('footer_rights')}</span>
      <div className="pay-badges">
        <span className="pay-badge">BARION</span>
        <span className="pay-badge">VISA</span>
        <span className="pay-badge">MASTERCARD</span>
        {config && config.barion && config.barion.environment === 'test' &&
          <span className="pay-badge gold">{config.barion.simulated ? 'SZIMULÁLT FIZETÉS' : 'BARION SANDBOX'}</span>}
      </div>
    </div>
  </footer>;
}

/* ═══════════ GOOGLE GOMB ═══════════ */

function GoogleButton({ onDone, onError }) {
  const { config, lang } = useA();
  const ref = useRef(null);
  const enabled = config && config.google && config.google.enabled;

  useEffect(() => {
    if (!enabled || !ref.current) return;
    let dead = false;
    const render = () => {
      if (dead || !window.google || !ref.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: config.google.clientId,
          callback: async resp => {
            try {
              const d = await api('/auth/google', { method: 'POST', body: { credential: resp.credential } });
              onDone(d.user);
            } catch (e) { onError(e.code || e.message); }
          }
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline', size: 'large', width: 300, text: 'continue_with', locale: lang
        });
      } catch (e) { /* csendes */ }
    };
    if (window.google && window.google.accounts) { render(); return () => { dead = true; }; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.onload = render;
    document.head.appendChild(s);
    return () => { dead = true; };
  }, [enabled, lang]);

  if (!enabled) return null;
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center', minHeight: 44, marginBottom: 4 }} />;
}

/* ═══════════ BELÉPÉS / REGISZTRÁCIÓ ═══════════ */

function AuthModal() {
  const { authModal, setAuthModal, setUser, toast, t, te, config, navigate } = useA();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', name: '', phone: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (authModal) { setMode(authModal); setErr(''); } }, [authModal]);
  if (!authModal) return null;

  const close = () => setAuthModal(null);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const d = mode === 'login'
        ? await api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password } })
        : await api('/auth/register', { method: 'POST', body: f });
      setUser(d.user);
      close();
      toast(d.user.role === 'admin' ? 'Admin' : t(mode === 'login' ? 'au_login_btn' : 'au_register_btn') + ' ✓');
      if (d.user.role === 'admin') navigate('admin');
    } catch (e) { setErr(te(e.code)); }
    setBusy(false);
  };

  const googleOn = config && config.google && config.google.enabled;

  return <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) close(); }}>
    <div className="modal">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <p className="eyebrow-gold">BRIGHTAL</p>
          <h2 className="h-display" style={{ fontSize: 26, marginTop: 8 }}>
            {t(mode === 'login' ? 'au_login_t' : 'au_register_t')}
          </h2>
        </div>
        <button onClick={close} className="icon-x"><Ico.close /></button>
      </div>

      <p className="lead-sm">{t(mode === 'login' ? 'au_login_sub' : 'au_register_sub')}</p>

      {googleOn && <>
        <GoogleButton onDone={u => { setUser(u); close(); toast('Google ✓'); }} onError={c => setErr(te(c))} />
        <div className="or-line"><span /><em>{t('au_or')}</em><span /></div>
      </>}

      {mode === 'register' && <>
        <Field label={t('au_name')}>
          <input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label={t('au_phone')}>
          <input className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        </Field>
      </>}

      <Field label={t('au_email')}>
        <input className="input" type="text" autoComplete="username" value={f.email}
          onChange={e => setF({ ...f, email: e.target.value })} placeholder="you@example.com" />
      </Field>
      <Field label={t('au_password')} hint={mode === 'register' ? t('au_pw_hint') : null}>
        <input className="input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={f.password} onChange={e => setF({ ...f, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && submit()} placeholder="••••••••" />
      </Field>

      {err && <div className="err-msg" style={{ marginBottom: 12 }}>{err}</div>}

      <button className="btn btn-dark btn-block" disabled={busy} onClick={submit}>
        {busy ? <Spinner size={15} /> : t(mode === 'login' ? 'au_login_btn' : 'au_register_btn')}
      </button>

      <p className="modal-foot">
        {t(mode === 'login' ? 'au_no_account' : 'au_have_account')}{' '}
        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {t(mode === 'login' ? 'au_register_link' : 'au_login_link')}
        </button>
      </p>
    </div>
  </div>;
}
/* ═══════════ FŐOLDAL ═══════════ */

function StepCard({ n, icon, title, desc }) {
  return <div className="step-card">
    <div className="step-num">{n}</div>
    <span className="step-icon">{icon}</span>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>;
}

function Steps() {
  const { t, config } = useA();
  const days = (config && config.shop && config.shop.productionDays) || [10, 14];
  return <div className="steps-grid">
    <StepCard n="1" icon={<Ico.camera s={22} />} title={t('step1_t')} desc={t('step1_d')} />
    <StepCard n="2" icon={<Ico.clock s={22} />} title={t('step2_t')} desc={t('step2_d')} />
    <StepCard n="3" icon={<Ico.card s={22} />} title={t('step3_t')} desc={t('step3_d')} />
    <StepCard n="4" icon={<Ico.hammer s={22} />} title={t('step4_t')}
      desc={t('step4_d').replace('10–14', days[0] + '–' + days[1])} />
  </div>;
}

function HomePage() {
  const { t, navigate, isAdmin } = useA();
  return <div>
    <section className="hero">
      <div className="hero-glow a" /><div className="hero-glow b" />
      <div className="hero-inner">
        <div className="fade-in hero-logo">
          <img src="/assets/brightal-logo.jpg" alt="BRIGHTAL" width="320" height="320" />
        </div>
        <p className="fade-in d1 eyebrow-gold" style={{ marginTop: 26 }}>{t('hero_eyebrow')}</p>
        <h1 className="fade-in d1 h-display hero-title">
          {t('hero_title_1')}<br /><em>{t('hero_title_2')}</em>
        </h1>
        <div className="fade-in d1 rule" />
        <p className="fade-in d2 hero-sub" style={{ marginBottom: 10 }}>{t('hero_sub')}</p>
        <p className="fade-in d2 brand-tagline" style={{ marginBottom: 34 }}>{t('brand_tagline')}</p>
        <div className="fade-in d3 hero-cta">
          {!isAdmin && <button className="btn btn-gold btn-lg" onClick={() => navigate('upload')}>
            <Ico.upload s={16} /> {t('hero_cta')}
          </button>}
          <button className="btn btn-outline btn-lg" onClick={() => navigate('how')}>{t('hero_cta2')}</button>
        </div>
        <div className="fade-in d3 hero-trust">
          {[t('hero_trust_1'), t('hero_trust_2'), t('hero_trust_3')].map(x =>
            <span key={x}><Ico.check s={13} /> {x}</span>)}
        </div>
      </div>
    </section>

    <Section style={{ padding: '0 40px 90px' }}>
      <div className="wrap center-head">
        <p className="eyebrow">{t('how_eyebrow')}</p>
        <h2 className="h-display sec-title">{t('how_title')}</h2>
        <div className="rule" />
      </div>
      <div className="wrap"><Steps /></div>
    </Section>

    <Section className="quote-band">
      <div className="wrap">
        <Ico.ring s={30} />
        <h2 className="h-display">{t('ab_lead')}</h2>
        {!isAdmin && <button className="btn btn-gold" onClick={() => navigate('upload')}>{t('hero_cta')}</button>}
      </div>
    </Section>

    <Footer />
  </div>;
}

/* ═══════════ HOGYAN MŰKÖDIK ═══════════ */

function HowPage() {
  const { t, navigate, config, isAdmin } = useA();
  const h = (config && config.shop && config.shop.reviewHours) || 1;
  const days = (config && config.shop && config.shop.productionDays) || [10, 14];

  const faq = LANG === 'hu' ? [
    ['Mennyibe kerül?', `Minden gyűrű egyedi, ezért a képed alapján adunk személyre szabott árajánlatot. Az ajánlat semmire nem kötelez — csak akkor fizetsz, ha elfogadod.`],
    ['Mi van, ha rossz a kép minősége?', 'Nem baj. Ötvösünk megnézi, és ha kell, e-mailben kérdez. Több képet is feltölthetsz különböző szögekből.'],
    ['Nem tudom a méretét. Gond?', 'Nem. A méretet később is pontosíthatjuk, és az első méretigazítás nálunk díjmentes.'],
    ['Mikor kell fizetnem?', `Csak azután, hogy az ötvös elfogadta a kérésed és látod a konkrét árat a fiókodban.`],
    ['Meddig tart?', `A fizetés beérkezésétől ${days[0]}–${days[1]} munkanap.`],
    ['Ki látja a képeimet?', 'Csak az ötvösünk. Sosem tesszük közzé, és nem használjuk marketingre.']
  ] : [
    ['How much does it cost?', 'Every ring is unique, so we quote each photo individually. The quote carries no obligation — you only pay if you accept it.'],
    ['What if the photo quality is poor?', 'Not a problem. Our goldsmith will look at it and email you if anything is unclear. You can upload several photos from different angles.'],
    ['I do not know her ring size. Is that an issue?', 'No. We can confirm the size later, and your first resizing is free of charge.'],
    ['When do I pay?', 'Only after the goldsmith has approved your request and you can see the exact price in your account.'],
    ['How long does it take?', `${days[0]}–${days[1]} working days from the moment your payment arrives.`],
    ['Who sees my photos?', 'Only our goldsmith. We never publish them or use them for marketing.']
  ];

  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('how_eyebrow')}</p>
      <h1 className="h-display page-title">{t('how_title')}</h1>
      <div className="rule" />
    </div>
    <div className="wrap" style={{ paddingBottom: 50 }}><Steps /></div>

    <Section style={{ padding: '10px 40px 40px' }}>
      <div className="wrap-n">
        <div className="timeline">
          {[[t('step1_t'), LANG === 'hu' ? 'most' : 'now'],
            [t('step2_t'), LANG === 'hu' ? `~${h} óra` : `~${h} hour`],
            [t('step3_t'), LANG === 'hu' ? 'amikor neked jó' : 'whenever suits you'],
            [t('step4_t'), `${days[0]}–${days[1]} ${LANG === 'hu' ? 'munkanap' : 'working days'}`]
          ].map(([k, v], i) => <div className="tl-row" key={i}>
            <span className="tl-dot" />
            <div><strong>{k}</strong><em>{v}</em></div>
          </div>)}
        </div>
      </div>
    </Section>

    <Section style={{ padding: '20px 40px 80px' }}>
      <div className="wrap-n">
        <h2 className="h-display" style={{ fontSize: 27, marginBottom: 22 }}>FAQ</h2>
        {faq.map(([q, a]) => <details className="faq" key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>)}
        {!isAdmin && <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button className="btn btn-gold btn-lg" onClick={() => navigate('upload')}>
            <Ico.upload s={16} /> {t('hero_cta')}
          </button>
        </div>}
      </div>
    </Section>
    <Footer />
  </div>;
}

/* ═══════════ INSPIRÁCIÓ (Pinterest) ═══════════ */

const PIN_SEARCHES = {
  hu: [
    ['Klasszikus szoliter', 'szoliter eljegyzési gyűrű'],
    ['Ovális gyémánt', 'ovális eljegyzési gyűrű'],
    ['Vintage stílus', 'vintage eljegyzési gyűrű'],
    ['Rozéarany', 'rozéarany eljegyzési gyűrű'],
    ['Smaragdcsiszolás', 'smaragd csiszolású gyűrű'],
    ['Haló foglalat', 'haló eljegyzési gyűrű'],
    ['Minimalista', 'minimalista eljegyzési gyűrű'],
    ['Csepp forma', 'csepp alakú eljegyzési gyűrű'],
    ['Háromköves', 'háromköves eljegyzési gyűrű']
  ],
  en: [
    ['Classic solitaire', 'solitaire engagement ring'],
    ['Oval diamond', 'oval engagement ring'],
    ['Vintage style', 'vintage engagement ring'],
    ['Rose gold', 'rose gold engagement ring'],
    ['Emerald cut', 'emerald cut engagement ring'],
    ['Halo setting', 'halo engagement ring'],
    ['Minimalist', 'minimalist engagement ring'],
    ['Pear shape', 'pear shaped engagement ring'],
    ['Three stone', 'three stone engagement ring']
  ]
};

function InspirationPage() {
  const { t, lang, navigate, config, isAdmin } = useA();
  const list = PIN_SEARCHES[lang] || PIN_SEARCHES.hu;
  const board = config && config.pinterest
    ? (lang === 'en' ? config.pinterest.boardEn : config.pinterest.boardHu) : null;
  const boardRef = useRef(null);

  /* Pinterest beágyazó szkript — csak ha van megadva tábla */
  useEffect(() => {
    if (!board || !boardRef.current) return;
    const s = document.createElement('script');
    s.src = 'https://assets.pinterest.com/js/pinit.js';
    s.async = true; s.defer = true;
    document.body.appendChild(s);
    return () => { try { document.body.removeChild(s); } catch (e) {} };
  }, [board]);

  const pinUrl = q => 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(q);

  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('ins_eyebrow')}</p>
      <h1 className="h-display page-title">{t('ins_title')}</h1>
      <div className="rule" />
      <p className="page-lead">{t('ins_sub')}</p>
    </div>

    <div className="wrap" style={{ paddingBottom: 40 }}>
      <div className="tip-card">
        <span className="pin-badge"><Ico.pin s={15} /></span>
        <div>
          <strong>{t('ins_tip_t')}</strong>
          <p>{t('ins_tip_d')}</p>
        </div>
      </div>

      <div className="pin-grid">
        {list.map(([label, q]) => <a key={q} className="pin-card" href={pinUrl(q)} target="_blank" rel="noopener noreferrer">
          <span className="pin-ico"><Ico.pin s={16} /></span>
          <div>
            <strong>{label}</strong>
            <em>{t('ins_open')} ↗</em>
          </div>
        </a>)}
      </div>

      {board && <div style={{ marginTop: 50 }}>
        <h2 className="h-display" style={{ fontSize: 25, marginBottom: 18 }}>{t('ins_board')}</h2>
        <div ref={boardRef}>
          <a data-pin-do="embedBoard" data-pin-board-width="100%" data-pin-scale-height="380"
            data-pin-scale-width="80" href={board}>{t('ins_board')}</a>
        </div>
      </div>}

      {!isAdmin && <div style={{ textAlign: 'center', marginTop: 50 }}>
        <button className="btn btn-gold btn-lg" onClick={() => navigate('upload')}>
          <Ico.upload s={16} /> {t('hero_cta')}
        </button>
      </div>}
    </div>
    <Footer />
  </div>;
}

/* ═══════════ RÓLUNK ═══════════ */

function AboutPage() {
  const { t } = useA();
  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('ab_title')}</p>
      <h1 className="h-display page-title" style={{ maxWidth: 760, margin: '14px auto 0' }}>{t('ab_lead')}</h1>
      <div className="rule" />
    </div>
    <Section>
      <div className="wrap-n value-grid">
        {[1, 2, 3, 4].map(i => <div key={i}>
          <h3 className="h-display">{t('ab_' + i + '_t')}</h3>
          <p>{t('ab_' + i + '_d')}</p>
        </div>)}
      </div>
    </Section>
    <Footer />
  </div>;
}

/* ═══════════ KAPCSOLAT ═══════════ */

function ContactPage() {
  const { t, config } = useA();
  const shop = (config && config.shop) || {};
  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('ct_title')}</p>
      <h1 className="h-display page-title">{t('ct_title')}</h1>
      <div className="rule" />
    </div>
    <div className="wrap-n contact-grid" style={{ paddingBottom: 70 }}>
      <div className="panel soft-green">
        <h3 className="h-display">{t('ct_salon')}</h3>
        <p>{shop.address}<br />{t('ct_hours')}</p>
      </div>
      <div className="panel soft-gold">
        <h3 className="h-display"><Ico.mail s={16} /> E-mail</h3>
        <p>{shop.email}<br />{shop.phone}</p>
      </div>
    </div>
    <Footer />
  </div>;
}
/* ═══════════ JOGI OLDALAK ═══════════ */
/* A tartalom a public/legal.js fájlból jön (window.LEGAL), a
   {{company.name}} típusú jelölőket a /api/config adataiból töltjük ki. */

/** Egy jelölő feloldása: 'company.name' → a config megfelelő mezője. */
function resolveToken(token, config) {
  const parts = String(token).split('.');
  let v = config;
  for (const p of parts) {
    if (v === null || v === undefined) return null;
    v = v[p];
  }
  if (Array.isArray(v)) return v.join('–');          // productionDays: [10,14]
  if (typeof v === 'number') return String(v);
  return v ? String(v) : null;
}

/** Szöveg → React csomópontok: jelölők kitöltése, e-mail/URL linkelése. */
function legalText(str, config, t, keyBase) {
  const out = [];
  let k = 0;
  const pieces = String(str).split(/(\{\{[a-zA-Z0-9_.]+\}\})/g);

  for (const piece of pieces) {
    if (!piece) continue;
    const m = piece.match(/^\{\{([a-zA-Z0-9_.]+)\}\}$/);
    if (m) {
      const val = resolveToken(m[1], config);
      if (val) out.push(<span key={`${keyBase}-v${k++}`} className="legal-val">{val}</span>);
      else out.push(<mark key={`${keyBase}-m${k++}`} className="legal-missing" title={m[1]}>[{t('lg_missing')}: {m[1]}]</mark>);
      continue;
    }
    /* e-mail címek és linkek kattinthatóvá tétele */
    const sub = piece.split(/(https?:\/\/[^\s,;)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g);
    for (const s of sub) {
      if (!s) continue;
      if (/^https?:\/\//.test(s)) {
        out.push(<a key={`${keyBase}-a${k++}`} href={s} target="_blank" rel="noopener noreferrer" className="legal-link">{s}</a>);
      } else if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s)) {
        out.push(<a key={`${keyBase}-e${k++}`} href={'mailto:' + s} className="legal-link">{s}</a>);
      } else {
        out.push(<React.Fragment key={`${keyBase}-t${k++}`}>{s}</React.Fragment>);
      }
    }
  }
  return out;
}

/** Egy tartalmi blokk kirajzolása (bekezdés / lista / táblázat / kiemelés). */
function LegalBlock({ block, config, t, id }) {
  if (typeof block === 'string') {
    return <p className="legal-p">{legalText(block, config, t, id)}</p>;
  }
  if (Array.isArray(block)) {
    return <ul className="legal-list">
      {block.map((li, i) => <li key={i}>{legalText(li, config, t, `${id}-${i}`)}</li>)}
    </ul>;
  }
  if (block && block.note) {
    return <div className="legal-note">{legalText(block.note, config, t, id)}</div>;
  }
  if (block && block.t) {
    return <div className="legal-table-wrap">
      <table className="legal-table"><tbody>
        {block.t.map((row, i) => <tr key={i}>
          <th>{row[0]}</th>
          <td>{legalText(row[1], config, t, `${id}-${i}`)}</td>
        </tr>)}
      </tbody></table>
    </div>;
  }
  return null;
}

function LegalPage({ doc }) {
  const { t, lang, config, navigate } = useA();
  const data = (window.LEGAL && window.LEGAL[lang] && window.LEGAL[lang][doc])
    || (window.LEGAL && window.LEGAL.hu && window.LEGAL.hu[doc])
    || null;

  useEffect(() => {
    if (data) document.title = `${data.title} — BRIGHTAL`;
    return () => { document.title = 'BRIGHTAL — costum ring webshop'; };
  }, [data, lang]);

  if (!data) return <div className="page">
    <div className="page-head">
      <h1 className="h-display page-title">{t('lg_unavailable')}</h1>
      <div className="btn-row"><button className="btn btn-outline" onClick={() => navigate('home')}>{t('nf_home')}</button></div>
    </div>
    <Footer />
  </div>;

  const effective = (config && config.company && config.company.legalEffectiveFrom) || null;

  return <div className="page legal-page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('lg_legal')}</p>
      <h1 className="h-display page-title">{data.title}</h1>
      <div className="rule" />
      <p className="page-lead">{data.lead}</p>
      {effective && <p className="legal-effective">{t('lg_effective')}: {effective}</p>}
    </div>

    <div className="wrap-n legal-body">
      {/* tartalomjegyzék */}
      <nav className="legal-toc">
        <h4>{t('lg_toc')}</h4>
        <ol>
          {data.sections.map((s, i) =>
            <li key={i}><a href={'#sec-' + i}>{s.h}</a></li>)}
        </ol>
      </nav>

      {data.sections.map((s, i) => <section key={i} id={'sec-' + i} className="legal-section">
        <h2 className="h-display">{s.h}</h2>
        {s.b.map((block, j) =>
          <LegalBlock key={j} block={block} config={config} t={t} id={`${i}-${j}`} />)}
      </section>)}

      <div className="legal-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>{t('lg_print')}</button>
        <LegalNav current={doc} />
      </div>
    </div>
    <Footer />
  </div>;
}

/** Átlépés a többi jogi oldalra. */
function LegalNav({ current }) {
  const { t, navigate } = useA();
  const docs = [
    ['terms', 'lg_terms_long'], ['privacy', 'lg_privacy_long'],
    ['impressum', 'lg_impressum'], ['refund', 'lg_refund_long'], ['cookies', 'lg_cookies']
  ];
  return <div className="legal-nav">
    {docs.filter(d => d[0] !== current).map(d =>
      <button key={d[0]} className="btn btn-ghost btn-sm" onClick={() => navigate(d[0])}>{t(d[1])}</button>)}
  </div>;
}

/* ═══════════ 404 ═══════════ */

function NotFoundPage() {
  const { t, navigate, isAdmin } = useA();
  return <div className="page">
    <div className="notfound">
      <span className="nf-gem"><Ico.gem s={52} /></span>
      <p className="eyebrow-gold" style={{ marginTop: 26 }}>{t('nf_code')}</p>
      <h1 className="h-display page-title">{t('nf_title')}</h1>
      <div className="rule" />
      <p className="page-lead">{t('nf_sub')}</p>
      <div className="btn-row">
        <button className="btn btn-dark btn-lg" onClick={() => navigate('home')}>{t('nf_home')}</button>
        {!isAdmin && <button className="btn btn-outline btn-lg" onClick={() => navigate('upload')}>{t('nf_upload')}</button>}
      </div>
    </div>
    <Footer />
  </div>;
}

/* ═══════════ COOKIE SÁV ═══════════ */

function CookieBanner() {
  const { t, consent, setConsent, navigate, toast, config } = useA();
  if (consent) return null;
  /* Ha nincs Pixel beállítva, nincs mit engedélyezni — de a
     tájékoztatás akkor is kötelező, ezért a sáv megjelenik. */
  const hasPixel = !!(config && config.barion && config.barion.pixelId);

  const choose = v => {
    setConsent(v);
    /* Ha a Pixel már betöltött, azt szkripttel nem lehet visszavonni —
       a hozzájárulás visszavonásakor ezért újratöltjük az oldalt. */
    if (v === 'necessary' && window.__barionPixelLoaded) { location.reload(); return; }
    toast(t('ck_saved'));
  };

  return <div className="cookie-bar" role="dialog" aria-live="polite" aria-label={t('ck_title')}>
    <div className="cookie-inner">
      <div className="cookie-text">
        <strong>{t('ck_title')}</strong>
        <p>{t('ck_text')}</p>
      </div>
      <div className="cookie-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('cookies')}>{t('ck_more')}</button>
        <button className="btn btn-ghost btn-sm" onClick={() => choose('necessary')}>{t('ck_reject')}</button>
        <button className="btn btn-gold btn-sm" onClick={() => choose(hasPixel ? 'all' : 'necessary')}>{t('ck_accept')}</button>
      </div>
    </div>
  </div>;
}

/* ═══════════ FELTÖLTÉS ═══════════ */

function UploadPage() {
  const { t, te, user, setAuthModal, config, toast, navigate, lang, isAdmin } = useA();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [errors, setErrors] = useState({});
  const inputRef = useRef(null);

  const [f, setF] = useState({
    name: '', email: '', phone: '',
    metal: '', ringSize: '', budget: '', deadline: '', engraving: '', note: '',
    acceptTerms: false
  });

  const up = (config && config.upload) || { maxMb: 8, maxFiles: 4, allowed: [] };

  useEffect(() => {
    if (!user) return;
    setF(p => ({ ...p, name: p.name || user.name || '', email: p.email || user.email || '', phone: p.phone || user.phone || '' }));
  }, [user]);

  /* előnézetek felszabadítása */
  useEffect(() => () => previews.forEach(u => URL.revokeObjectURL(u)), [previews]);

  const addFiles = list => {
    const incoming = Array.from(list || []);
    const ok = [];
    for (const file of incoming) {
      if (!up.allowed.includes(file.type)) { toast(te('UNSUPPORTED_FILE_TYPE'), 'err'); continue; }
      if (file.size > up.maxMb * 1024 * 1024) { toast(te('FILE_TOO_LARGE'), 'err'); continue; }
      ok.push(file);
    }
    const merged = [...files, ...ok].slice(0, up.maxFiles);
    setFiles(merged);
    previews.forEach(u => URL.revokeObjectURL(u));
    setPreviews(merged.map(x => URL.createObjectURL(x)));
    setErrors(e => ({ ...e, photos: null }));
  };

  const removeFile = i => {
    const merged = files.filter((_, j) => j !== i);
    setFiles(merged);
    previews.forEach(u => URL.revokeObjectURL(u));
    setPreviews(merged.map(x => URL.createObjectURL(x)));
  };

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!files.length) e.photos = te('NO_PHOTO');
    if (String(f.name).trim().length < 2) e.name = te('NAME_REQUIRED');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = te('INVALID_EMAIL');
    if (!f.acceptTerms) e.acceptTerms = te('TERMS_REQUIRED');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach(file => fd.append('photos', file));
      Object.entries(f).forEach(([k, v]) => fd.append(k, typeof v === 'boolean' ? String(v) : v));
      fd.append('lang', lang);
      const d = await api('/requests', { method: 'POST', body: fd });
      setDone(d.request);
      setFiles([]); setPreviews([]);
      window.scrollTo(0, 0);
    } catch (e) { toast(te(e.code), 'err'); }
    setBusy(false);
  };

  /* --- admin nem rendelhet --- */
  if (isAdmin) return <div className="page">
    <div className="wrap-s" style={{ textAlign: 'center', padding: '40px 0 80px' }}>
      <p className="lead-sm">{te('ADMIN_CANNOT_ORDER')}</p>
      <button className="btn btn-dark" onClick={() => navigate('admin')}>{t('nav_admin')}</button>
    </div>
    <Footer />
  </div>;

  /* --- siker --- */
  if (done) {
    const h = (config && config.shop && config.shop.reviewHours) || 1;
    return <div className="page">
      <div className="wrap-s" style={{ paddingBottom: 70 }}>
        <div className="panel success-panel">
          <div className="success-ring"><Ico.check s={26} /></div>
          <h1 className="h-display" style={{ fontSize: 30, marginBottom: 12 }}>{t('ok_title')}</h1>
          <p className="lead-sm">{t('ok_sub', { email: done.images ? f.email || (user && user.email) : '', h })}</p>
          <div className="ref-box">
            <span>{t('ok_ref')}</span>
            <strong>{done.requestNumber}</strong>
          </div>
          <p className="lead-sm">{t('ok_next')}</p>
          <div className="btn-row">
            <button className="btn btn-dark" onClick={() => navigate('orders')}>{t('ok_orders')}</button>
            <button className="btn btn-ghost" onClick={() => { setDone(null); setF(p => ({ ...p, note: '', engraving: '' })); }}>
              {t('ok_another')}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>;
  }

  /* --- belépés szükséges --- */
  if (!user) return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('up_eyebrow')}</p>
      <h1 className="h-display page-title">{t('up_title')}</h1>
      <div className="rule" />
    </div>
    <div className="wrap-s" style={{ paddingBottom: 80 }}>
      <div className="panel" style={{ padding: '40px 32px', textAlign: 'center' }}>
        <span className="lock-ring"><Ico.lock s={20} /></span>
        <p className="lead-sm" style={{ margin: '18px 0 22px' }}>{t('up_login_needed')}</p>
        <button className="btn btn-gold btn-lg" onClick={() => setAuthModal('login')}>{t('up_login_btn')}</button>
      </div>
    </div>
    <Footer />
  </div>;

  /* --- űrlap --- */
  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('up_eyebrow')}</p>
      <h1 className="h-display page-title">{t('up_title')}</h1>
      <div className="rule" />
      <p className="page-lead">{t('up_sub')}</p>
    </div>

    <div className="wrap-n" style={{ paddingBottom: 80 }}>
      {/* dropzone */}
      <div className={'dropzone' + (drag ? ' over' : '') + (errors.photos ? ' err' : '')}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current && inputRef.current.click()}>
        <span className="drop-ico"><Ico.upload s={26} /></span>
        <p className="drop-main">{t('up_drop')}</p>
        <p className="drop-sub">{t('up_formats', { mb: up.maxMb, n: up.maxFiles })}</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {errors.photos && <div className="err-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.photos}</div>}

      {!!previews.length && <div className="thumb-grid">
        {previews.map((src, i) => <div className="thumb-item" key={i}>
          <img src={src} alt="" />
          <button onClick={e => { e.stopPropagation(); removeFile(i); }} aria-label={t('up_remove')}><Ico.close s={13} /></button>
        </div>)}
        <div className="thumb-count">{files.length} / {up.maxFiles} {t('up_selected')}</div>
      </div>}

      {/* részletek */}
      <div className="panel form-panel">
        <h3 className="h-display">{t('up_details')}</h3>
        <div className="grid-2-gap">
          <Field label={t('up_metal')}>
            <input className="input" value={f.metal} onChange={e => set('metal', e.target.value)} placeholder={t('up_metal_ph')} />
          </Field>
          <Field label={t('up_size')}>
            <input className="input" value={f.ringSize} onChange={e => set('ringSize', e.target.value)} placeholder={t('up_size_ph')} />
          </Field>
          <Field label={t('up_budget')}>
            <input className="input" value={f.budget} onChange={e => set('budget', e.target.value)} placeholder={t('up_budget_ph')} />
          </Field>
          <Field label={t('up_deadline')}>
            <input className="input" value={f.deadline} onChange={e => set('deadline', e.target.value)} placeholder={t('up_deadline_ph')} />
          </Field>
        </div>
        <Field label={t('up_engraving')}>
          <input className="input" maxLength={40} value={f.engraving} onChange={e => set('engraving', e.target.value)} placeholder={t('up_engraving_ph')} />
        </Field>
        <Field label={t('up_note')}>
          <textarea className="textarea" rows={3} maxLength={1000} value={f.note}
            onChange={e => set('note', e.target.value)} placeholder={t('up_note_ph')} />
        </Field>
      </div>

      {/* kapcsolat */}
      <div className="panel form-panel">
        <h3 className="h-display">{t('up_contact')}</h3>
        <div className="grid-2-gap">
          <Field label={t('up_name') + ' *'} error={errors.name}>
            <input className={'input' + (errors.name ? ' err' : '')} value={f.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label={t('up_phone')}>
            <input className="input" value={f.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
        </div>
        <Field label={t('up_email') + ' *'} error={errors.email}>
          <input className={'input' + (errors.email ? ' err' : '')} type="email" value={f.email} onChange={e => set('email', e.target.value)} />
        </Field>

        <label className="checkline">
          <input type="checkbox" checked={f.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)} />
          <span>
            {t('up_terms')} *
            {' '}
            <a className="legal-link" onClick={e => { e.preventDefault(); navigate('terms'); }} href={pathFor('terms')}>{t('lg_terms_long')}</a>
            {' · '}
            <a className="legal-link" onClick={e => { e.preventDefault(); navigate('privacy'); }} href={pathFor('privacy')}>{t('lg_privacy_long')}</a>
            {' · '}
            <a className="legal-link" onClick={e => { e.preventDefault(); navigate('refund'); }} href={pathFor('refund')}>{t('lg_refund_long')}</a>
          </span>
        </label>
        {/* Az elállási jog kizárására a jogszabály kifejezett tájékoztatást ír elő. */}
        <p className="legal-inline-note">{t('up_custom_note')}</p>
        {errors.acceptTerms && <div className="err-msg">{errors.acceptTerms}</div>}

        <button className="btn btn-gold btn-block btn-lg" style={{ marginTop: 18 }} disabled={busy} onClick={submit}>
          {busy ? <><Spinner size={15} /> {t('up_sending')}</> : <><Ico.upload s={15} /> {t('up_submit')}</>}
        </button>
        <p className="fine-print"><Ico.lock s={11} /> {t('ab_4_d')}</p>
      </div>
    </div>
    <Footer />
  </div>;
}

/* ═══════════ RENDELÉSEIM ═══════════ */

function OrderCard({ req, onPay, paying }) {
  const { t, config } = useA();
  const days = req.productionDays || [10, 14];
  const h = (config && config.shop && config.shop.reviewHours) || 1;

  const desc = {
    submitted: t('ord_waiting_d', { h }),
    approved: t('ord_approved_d'),
    rejected: t('ord_rejected_d'),
    paid: t('ord_paid_d'),
    in_production: t('ord_production_d', { a: days[0], b: days[1] }),
    completed: t('ord_completed_d'),
    canceled: ''
  }[req.status];

  return <div className="panel order-card">
    <div className="order-head">
      <div>
        <p className="mono-sm">{t('ord_ref')}: <strong>{req.requestNumber}</strong></p>
        <p className="mono-sm dim">{t('ord_submitted')}: {fmtDate(req.createdAt)}</p>
      </div>
      <StatusBadge status={req.status} />
    </div>

    {!!req.images.length && <div className="order-thumbs">
      {req.images.map((im, i) => <a key={i} href={im.url} target="_blank" rel="noopener noreferrer">
        <img src={im.url} alt={im.name} loading="lazy" />
      </a>)}
    </div>}

    <p className="order-desc">{desc}</p>

    {req.adminNote && <div className="note-box">
      <span>{t('ord_note')}</span>
      <p>{req.adminNote}</p>
    </div>}

    {req.price > 0 && <div className="price-row">
      <div>
        <span className="mono-sm dim">{t('ord_price')}</span>
        <div className="price-big">{money(req.price)}</div>
        {req.vat ? <span className="mono-sm dim">{t('ord_vat')}: {money(req.vat)}</span> : null}
      </div>
      {req.payable && <button className="btn btn-gold" disabled={paying} onClick={() => onPay(req)}>
        {paying ? <><Spinner size={14} /> {t('ord_paying')}</> : <><Ico.lock s={13} /> {t('ord_pay')}</>}
      </button>}
    </div>}

    {(req.details && (req.details.metal || req.details.ringSize || req.details.engraving)) &&
      <div className="detail-chips">
        {req.details.metal && <span>{req.details.metal}</span>}
        {req.details.ringSize && <span>{req.details.ringSize}</span>}
        {req.details.engraving && <span>„{req.details.engraving}”</span>}
      </div>}
  </div>;
}

function OrdersPage() {
  const { t, te, user, setAuthModal, navigate, toast } = useA();
  const [list, setList] = useState(null);
  const [paying, setPaying] = useState(null);

  const load = useCallback(() => {
    api('/requests').then(d => setList(d.requests)).catch(() => setList([]));
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  /* fizetés indítása */
  const pay = async req => {
    setPaying(req.requestNumber);
    try {
      const d = await api('/payment/start', { method: 'POST', body: { requestNumber: req.requestNumber } });
      window.location.href = d.gatewayUrl;
    } catch (e) {
      toast(te(e.code) + (e.detail ? ' — ' + e.detail : ''), 'err');
      setPaying(null);
    }
  };

  if (!user) return <div className="page">
    <div className="wrap-s" style={{ textAlign: 'center', paddingBottom: 80 }}>
      <h1 className="h-display page-title">{t('ord_title')}</h1>
      <p className="lead-sm" style={{ margin: '16px 0 24px' }}>{t('au_login_sub')}</p>
      <button className="btn btn-dark" onClick={() => setAuthModal('login')}>{t('nav_login')}</button>
    </div>
    <Footer />
  </div>;

  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('ord_eyebrow')}</p>
      <h1 className="h-display page-title">{t('ord_title')}</h1>
      <div className="rule" />
    </div>
    <div className="wrap-n" style={{ paddingBottom: 80 }}>
      {list === null && <div style={{ textAlign: 'center', padding: 40 }}><Spinner dark size={26} /></div>}
      {list && !list.length && <div className="empty-state">
        <span className="lock-ring"><Ico.ring s={22} /></span>
        <p>{t('ord_empty')}</p>
        <button className="btn btn-gold" onClick={() => navigate('upload')}>{t('ord_empty_cta')}</button>
      </div>}
      {list && list.map(r => <OrderCard key={r.requestNumber} req={r} onPay={pay} paying={paying === r.requestNumber} />)}
    </div>
    <Footer />
  </div>;
}

/* ═══════════ FIZETÉS VISSZATÉRÉS ═══════════ */

function PaymentReturnPage() {
  const { t, te, navigate, toast } = useA();
  const [state, setState] = useState('checking');
  const [req, setReq] = useState(null);
  const tries = useRef(0);

  useEffect(() => {
    const rn = new URLSearchParams(location.search).get('request');
    if (!rn) { setState('unknown'); return; }
    let stop = false;
    const poll = async () => {
      if (stop) return;
      tries.current++;
      try {
        const d = await api('/payment/status/' + encodeURIComponent(rn));
        setReq(d.request);
        if (d.request.status === 'paid') { setState('paid'); return; }
        if (d.request.paymentStatus && ['Canceled', 'Failed', 'Expired'].includes(d.request.paymentStatus)) {
          setState(d.request.paymentStatus === 'Canceled' ? 'canceled' : 'failed'); return;
        }
      } catch (e) { if (tries.current > 3) { setState('error'); return; } }
      if (tries.current > 12) { setState('pending'); return; }
      setTimeout(poll, 1400);
    };
    poll();
    return () => { stop = true; };
  }, []);

  if (state === 'checking') return <div className="page center-screen">
    <Spinner dark size={32} />
    <p className="lead-sm" style={{ marginTop: 18 }}>{t('pr_checking')}</p>
  </div>;

  const map = {
    paid: ['✓', 'var(--green)', t('pr_paid_t')],
    failed: ['✕', '#9C5A4E', t('pr_failed_t')],
    canceled: ['–', '#7A7A7A', t('pr_canceled_t')],
    pending: ['…', 'var(--gold-deep)', t('pr_pending_t')],
    error: ['!', '#9C5A4E', te('SERVER_ERROR')],
    unknown: ['?', '#7A7A7A', te('NOT_FOUND')]
  };
  const [sym, color, title] = map[state] || map.error;
  const days = (req && req.productionDays) || [10, 14];

  const retry = async () => {
    try {
      const d = await api('/payment/start', { method: 'POST', body: { requestNumber: req.requestNumber } });
      window.location.href = d.gatewayUrl;
    } catch (e) { toast(te(e.code), 'err'); }
  };

  return <div className="page">
    <div className="wrap-s" style={{ paddingBottom: 80 }}>
      <div className="panel success-panel">
        <div className="success-ring" style={{ borderColor: color, color }}>{sym}</div>
        <h1 className="h-display" style={{ fontSize: 29, marginBottom: 12 }}>{title}</h1>
        {state === 'paid' && <p className="lead-sm">{t('pr_paid_d', { a: days[0], b: days[1] })}</p>}
        {req && <div className="ref-box">
          <span>{t('ord_ref')}</span>
          <strong>{req.requestNumber}</strong>
          {req.price ? <em>{money(req.price)}</em> : null}
        </div>}
        <div className="btn-row">
          <button className="btn btn-dark" onClick={() => navigate('orders')}>{t('pr_orders')}</button>
          {req && (state === 'failed' || state === 'canceled') &&
            <button className="btn btn-gold" onClick={retry}>{t('pr_retry')}</button>}
        </div>
      </div>
    </div>
    <Footer />
  </div>;
}

/* ═══════════ FIÓK ═══════════ */

function AccountPage() {
  const { t, te, user, setUser, setAuthModal, toast, logout, navigate } = useA();
  const [f, setF] = useState({ name: '', phone: '', address: { country: '', zip: '', city: '', street: '' } });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setF({
      name: user.name || '', phone: user.phone || '',
      address: user.address || { country: '', zip: '', city: '', street: '' }
    });
  }, [user]);

  if (!user) return <div className="page">
    <div className="wrap-s" style={{ textAlign: 'center', paddingBottom: 80 }}>
      <h1 className="h-display page-title">{t('nav_account')}</h1>
      <button className="btn btn-dark" style={{ marginTop: 20 }} onClick={() => setAuthModal('login')}>{t('nav_login')}</button>
    </div>
    <Footer />
  </div>;

  const save = async () => {
    setBusy(true);
    try { const d = await api('/auth/me', { method: 'PUT', body: f }); setUser(d.user); toast(t('g_saved')); }
    catch (e) { toast(te(e.code), 'err'); }
    setBusy(false);
  };

  const A = (k, v) => setF(p => ({ ...p, address: { ...p.address, [k]: v } }));

  return <div className="page">
    <div className="page-head">
      <p className="eyebrow-gold">{t('ord_eyebrow')}</p>
      <h1 className="h-display page-title">{user.name}</h1>
      <p className="page-lead">{user.email}{user.provider === 'google' ? ' · Google' : ''}</p>
    </div>
    <div className="wrap-s" style={{ paddingBottom: 80 }}>
      <div className="panel form-panel">
        <Field label={t('au_name')}><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('au_phone')}><input className="input" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
        <div className="grid-2-gap">
          <Field label={LANG === 'hu' ? 'Ország' : 'Country'}><input className="input" value={f.address.country} onChange={e => A('country', e.target.value)} /></Field>
          <Field label={LANG === 'hu' ? 'Város' : 'City'}><input className="input" value={f.address.city} onChange={e => A('city', e.target.value)} /></Field>
          <Field label={LANG === 'hu' ? 'Irányítószám' : 'Postcode'}><input className="input" value={f.address.zip} onChange={e => A('zip', e.target.value)} /></Field>
          <Field label={LANG === 'hu' ? 'Utca, házszám' : 'Street'}><input className="input" value={f.address.street} onChange={e => A('street', e.target.value)} /></Field>
        </div>
        <button className="btn btn-dark btn-block" disabled={busy} onClick={save}>{busy ? <Spinner size={14} /> : t('g_save')}</button>
      </div>
      <div className="btn-row" style={{ marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate('orders')}>{t('nav_orders')}</button>
        <button className="btn btn-ghost" onClick={logout}>{t('nav_logout')}</button>
      </div>
    </div>
    <Footer />
  </div>;
}
/* ═══════════ ADMIN ═══════════ */

function AdminRow({ req, onChanged, defaultOpen }) {
  const { t, te, toast } = useA();
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  const [price, setPrice] = useState(req.price || '');
  const [note, setNote] = useState(req.adminNote || '');
  const [busy, setBusy] = useState(false);

  const call = async (action, body) => {
    setBusy(true);
    try {
      const d = await api(`/admin/requests/${encodeURIComponent(req.requestNumber)}/${action}`, { method: 'POST', body });
      onChanged(d.request);
      toast(action === 'approve' ? t('ad_approved_ok') : t('g_saved'));
      if (action === 'approve') setOpen(false);
    } catch (e) { toast(te(e.code), 'err'); }
    setBusy(false);
  };

  const canApprove = ['submitted', 'approved', 'rejected'].includes(req.status);
  const canReject = ['submitted', 'approved'].includes(req.status);

  return <div className="panel admin-row">
    <div className="admin-head" onClick={() => setOpen(o => !o)}>
      <div className="admin-thumbs">
        {req.images.slice(0, 2).map((im, i) => <img key={i} src={im.url} alt="" loading="lazy" />)}
        {req.images.length > 2 && <span className="more">+{req.images.length - 2}</span>}
      </div>
      <div className="admin-main">
        <p className="mono-sm"><strong>{req.requestNumber}</strong></p>
        <p className="mono-sm dim">{req.customer.name} · {req.customer.email}</p>
        <p className="mono-sm dim">{fmtDate(req.createdAt)}</p>
      </div>
      <div className="admin-side">
        {req.price ? <div className="price-big sm">{money(req.price)}</div> : null}
        <StatusBadge status={req.status} />
      </div>
      <span className={'chev' + (open ? ' up' : '')}>▾</span>
    </div>

    {open && <div className="admin-body">
      <div className="admin-grid">
        <div>
          <h4>{t('ord_photos')}</h4>
          <div className="order-thumbs big">
            {req.images.map((im, i) => <a key={i} href={im.url} target="_blank" rel="noopener noreferrer">
              <img src={im.url} alt={im.name} loading="lazy" />
            </a>)}
          </div>
        </div>
        <div>
          <h4>{t('ad_details')}</h4>
          <dl className="kv">
            {[['Email', req.customer.email], ['Tel', req.customer.phone],
              [t('up_metal'), req.details.metal], [t('up_size'), req.details.ringSize],
              [t('up_budget'), req.details.budget], [t('up_deadline'), req.details.deadline],
              [t('up_engraving'), req.details.engraving]]
              .filter(([, v]) => v).map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
          </dl>
          {req.note && <div className="note-box"><span>{t('up_note')}</span><p>{req.note}</p></div>}
        </div>
      </div>

      {(canApprove || canReject) && <div className="admin-actions">
        <h4>{t('ad_setprice')}</h4>
        <div className="price-form">
          <input className="input" type="number" min="0" step="100" value={price}
            onChange={e => setPrice(e.target.value)} placeholder={t('ad_price_ph')} />
          <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder={t('ad_note_ph')} />
        </div>
        <div className="btn-row" style={{ marginTop: 12 }}>
          {canApprove && <button className="btn btn-gold" disabled={busy || !price}
            onClick={() => call('approve', { price: Number(price), adminNote: note })}>
            {busy ? <Spinner size={14} /> : <><Ico.check s={14} /> {t('ad_approve')}</>}
          </button>}
          {canReject && <button className="btn btn-ghost danger" disabled={busy}
            onClick={() => call('reject', { adminNote: note })}>{t('ad_reject')}</button>}
        </div>
      </div>}

      {req.status === 'paid' && <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn btn-dark btn-sm" disabled={busy}
          onClick={() => call('status', { status: 'in_production' })}>{t('ad_toproduction')}</button>
      </div>}
      {req.status === 'in_production' && <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn btn-dark btn-sm" disabled={busy}
          onClick={() => call('status', { status: 'completed' })}>{t('ad_complete')}</button>
      </div>}

      {req.history && <details className="faq" style={{ marginTop: 16 }}>
        <summary>{t('ad_history')}</summary>
        <ul className="history">
          {req.history.map((h, i) => <li key={i}>
            <em>{fmtDate(h.at)}</em> — {h.event}{h.price ? ` (${money(h.price)})` : ''}{h.barionStatus ? ` · ${h.barionStatus}` : ''}
          </li>)}
        </ul>
      </details>}
    </div>}
  </div>;
}

/**
 * Táblázatos nézet: egy pillantással látszik, ki mit mikor rendelt.
 * Bármelyik fejlécre kattintva rendezhető, sorra kattintva megnyílik
 * a részletes kártya. A látott lista tölthető le CSV / Excel formában.
 */
function AdminTable({ requests, onOpen }) {
  const { t } = useA();
  const [sort, setSort] = useState({ key: 'createdAt', dir: -1 });

  const cols = [
    ['requestNumber', t('th_id'), r => r.requestNumber],
    ['createdAt', t('th_date'), r => r.createdAt],
    ['customer', t('th_customer'), r => (r.customer.name || '') + r.customer.email],
    ['what', t('th_what'), r => (r.details && r.details.metal) || ''],
    ['status', t('th_status'), r => r.status],
    ['price', t('th_price'), r => r.price || 0],
    ['paidAt', t('th_paid'), r => r.paidAt || '']
  ];

  const rows = useMemo(() => {
    const col = cols.find(c => c[0] === sort.key) || cols[1];
    return requests.slice().sort((a, b) => {
      const x = col[2](a), y = col[2](b);
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir;
      return String(x).localeCompare(String(y), 'hu') * sort.dir;
    });
  }, [requests, sort]);

  const head = (key, label) => <th key={key}
    onClick={() => setSort(p => ({ key, dir: p.key === key ? -p.dir : -1 }))}>
    {label}<span className="sort">{sort.key === key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}</span>
  </th>;

  const total = rows.reduce((n, r) => n + (r.price || 0), 0);

  return <div className="table-wrap">
    <table className="admin-table">
      <thead><tr><th style={{ width: 46 }} />{cols.map(c => head(c[0], c[1]))}</tr></thead>
      <tbody>
        {rows.map(r => <tr key={r.requestNumber} onClick={() => onOpen(r.requestNumber)}>
          <td>{r.images && r.images[0]
            ? <img className="tbl-thumb" src={r.images[0].url} alt="" loading="lazy" />
            : <span className="tbl-thumb" style={{ display: 'inline-block', background: 'var(--bg-warm)' }} />}</td>
          <td className="id">{r.requestNumber}</td>
          <td className="dim">{fmtDate(r.createdAt)}</td>
          <td>
            <div>{r.customer.name}</div>
            <div style={{ color: 'var(--text-mute)', fontSize: 11 }}>{r.customer.email}</div>
          </td>
          <td className="dim">
            {[(r.details && r.details.metal), (r.details && r.details.ringSize)].filter(Boolean).join(' · ') || '—'}
            <span style={{ marginLeft: 6, color: 'var(--text-mute)' }}>({(r.images || []).length}📷)</span>
          </td>
          <td><StatusBadge status={r.status} /></td>
          <td className="num">{r.price ? money(r.price) : '—'}</td>
          <td className="dim">{r.paidAt ? fmtDate(r.paidAt) : '—'}</td>
        </tr>)}
      </tbody>
      <tfoot><tr>
        <td colSpan={6}>{rows.length} {t('ad_count').toLowerCase()}</td>
        <td className="num">{money(total)}</td>
        <td />
      </tr></tfoot>
    </table>
  </div>;
}

function AdminPage() {
  const { t, isAdmin, setAuthModal, navigate, config } = useA();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState('table');     // táblázat az alapértelmezett nézet
  const [openRow, setOpenRow] = useState(null);  // táblázatból megnyitott sor

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (q) params.set('q', q);
    api('/admin/requests?' + params.toString()).then(setData).catch(() => setData({ requests: [], counts: {}, revenue: 0 }));
  }, [filter, q]);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  /* automatikus frissítés 30 mp-enként, hogy az új kérések megjelenjenek */
  useEffect(() => {
    if (!isAdmin) return;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [isAdmin, load]);

  if (!isAdmin) return <div className="page">
    <div className="wrap-s" style={{ textAlign: 'center', paddingBottom: 80 }}>
      <h1 className="h-display page-title">Admin</h1>
      <p className="lead-sm" style={{ margin: '16px 0 22px' }}>{t('e_ADMIN_REQUIRED')}</p>
      <button className="btn btn-dark" onClick={() => setAuthModal('login')}>{t('nav_login')}</button>
    </div>
    <Footer />
  </div>;

  const counts = (data && data.counts) || {};
  const tabs = ['all', 'submitted', 'approved', 'paid', 'in_production', 'completed', 'rejected'];
  const list = (data && data.requests) || [];
  const paidCount = (counts.paid || 0) + (counts.in_production || 0) + (counts.completed || 0);
  const avg = paidCount ? Math.round((data.revenue || 0) / paidCount) : 0;
  /* az export ugyanazt a szűrést kapja, amit a képernyőn látunk */
  const exportQs = (() => {
    const p = new URLSearchParams();
    if (filter !== 'all') p.set('status', filter);
    if (q) p.set('q', q);
    const qs = p.toString();
    return qs ? '?' + qs : '';
  })();

  const onChanged = updated => setData(d => ({
    ...d, requests: d.requests.map(r => r.requestNumber === updated.requestNumber ? updated : r)
  }));

  return <div className="page">
    <div className="wrap" style={{ paddingBottom: 70 }}>
      <div className="admin-top">
        <div>
          <p className="eyebrow-gold">ADMIN</p>
          <h1 className="h-display" style={{ fontSize: 30, marginTop: 8 }}>{t('ad_title')}</h1>
          {config && config.barion && <p className="mono-sm dim" style={{ marginTop: 8 }}>
            Barion: {config.barion.simulated
              ? 'szimuláció (nincs POSKey)'
              : config.barion.environment === 'test' ? 'SANDBOX — teszt pénz' : 'ÉLES — valódi fizetés'}
          </p>}
        </div>
        {data && <div className="stat-box">
          <span>{t('ad_revenue')}</span>
          <strong>{money(data.revenue || 0)}</strong>
        </div>}
      </div>

      <div className="stat-strip">
        <div className="stat-mini"><span>{t('ad_count')}</span><strong>{counts.all || 0}</strong></div>
        <div className="stat-mini"><span>{t('ad_pending')}</span><strong>{counts.submitted || 0}</strong></div>
        <div className="stat-mini"><span>{t('ad_paidcount')}</span><strong>{paidCount}</strong></div>
        <div className="stat-mini"><span>{t('ad_avg')}</span><strong>{avg ? money(avg) : '—'}</strong></div>
      </div>

      <div className="admin-tabs">
        {tabs.map(s => <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>
          {s === 'all' ? t('ad_all') : t('st_' + s)}
          <em>{counts[s] || 0}</em>
        </button>)}
      </div>

      <div className="admin-toolbar">
        <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder={t('ad_search')} />
        <div className="view-switch">
          <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}>
            <Ico.table s={13} /> {t('ad_view_table')}
          </button>
          <button className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}>
            <Ico.cards s={13} /> {t('ad_view_cards')}
          </button>
        </div>
        <a className="btn btn-ghost btn-sm" href={'/api/admin/export.csv' + exportQs}>
          <Ico.download s={13} /> {t('ad_export_csv')}
        </a>
        <a className="btn btn-ghost btn-sm" href={'/api/admin/export.xls' + exportQs}>
          <Ico.download s={13} /> {t('ad_export_xls')}
        </a>
      </div>

      {!data && <div style={{ textAlign: 'center', padding: 40 }}><Spinner dark size={26} /></div>}
      {data && !list.length && <div className="empty-state"><p>{t('ad_empty')}</p></div>}

      {data && !!list.length && view === 'table' &&
        <AdminTable requests={list} onOpen={n => { setOpenRow(n); setView('cards'); }} />}

      {data && !!list.length && view === 'cards' && list.map(r =>
        <AdminRow key={r.requestNumber} req={r} onChanged={onChanged}
          defaultOpen={openRow === r.requestNumber} />)}
    </div>
    <Footer />
  </div>;
}

/* ═══════════ GYÖKÉR ═══════════ */

const PAGES = {
  home: HomePage, how: HowPage, upload: UploadPage, inspiration: InspirationPage,
  orders: OrdersPage, account: AccountPage, about: AboutPage, contact: ContactPage,
  admin: AdminPage, 'payment-return': PaymentReturnPage,
  /* jogi oldalak — mind ugyanazt a komponenst használja, más tartalommal */
  terms: () => <LegalPage doc="terms" />,
  privacy: () => <LegalPage doc="privacy" />,
  impressum: () => <LegalPage doc="impressum" />,
  refund: () => <LegalPage doc="refund" />,
  cookies: () => <LegalPage doc="cookies" />,
  notfound: NotFoundPage
};

function App() {
  const { page, loading, t } = useA();
  const Page = PAGES[page] || NotFoundPage;
  if (loading) return <>
    <Nav />
    <div className="center-screen">
      <Spinner dark size={28} />
      <p className="loading-label">{t('g_loading')}</p>
    </div>
  </>;
  return <><Nav /><Page /><AuthModal /><Toasts /><CookieBanner /></>;
}

function boot() {
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') { setTimeout(boot, 60); return; }
  ReactDOM.createRoot(document.getElementById('root')).render(<Prov><App /></Prov>);
}
boot();
