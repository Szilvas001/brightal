Futásidejű adatok (a szerver első indításakor jönnek létre):
  users.json        - regisztrált felhasználók
  requests.json     - beérkezett kérések, teljes eseménynaplóval
  sessions.json     - aktív munkamenetek
  mail-outbox.log   - kiküldött levelek (ha nincs SMTP beállítva)
  .session-secret   - automatikusan generált aláírókulcs

ÉLES ÜZEMBEN EZT A MAPPÁT RENDSZERESEN MENTENI KELL!
A public/uploads/ mappát (feltöltött képek) szintén.
