#!/usr/bin/env node
'use strict';
/**
 * ══════════════════════════════════════════════════════════════════
 *  ADMIN JELSZÓ HASH ELŐÁLLÍTÁSA
 * ══════════════════════════════════════════════════════════════════
 *  Használat:
 *      npm run hash-password
 *      npm run hash-password -- "a-jelszavam"
 *
 *  A kiírt sort másold be a .env fájlba, és a nyílt szöveges
 *  ADMIN_PASSWORD sort kommenteld ki vagy töröld.
 * ══════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');
const readline = require('readline');

function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${h}`;
}

/** Egyszerű erősségvizsgálat — csak figyelmeztet, nem tilt. */
function weakness(pw) {
  const bad = [];
  if (pw.length < 12) bad.push('rövidebb 12 karakternél');
  if (!/[a-záéíóöőúüű]/i.test(pw)) bad.push('nincs benne betű');
  if (!/[0-9]/.test(pw)) bad.push('nincs benne szám');
  if (!/[^A-Za-z0-9]/.test(pw)) bad.push('nincs benne speciális karakter');
  if (/^(12345|password|jelszo|admin|qwerty)/i.test(pw)) bad.push('nagyon gyakori jelszókezdet');
  return bad;
}

function output(password) {
  const bad = weakness(password);
  const line = '─'.repeat(70);

  console.log(`\n${line}`);
  if (bad.length) {
    console.log('  ⚠  FIGYELEM — gyenge jelszó:');
    bad.forEach(b => console.log(`     · ${b}`));
    console.log(`${line}`);
  }
  console.log('  Másold be ezt a két sort a .env fájlba:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash(password)}`);
  console.log('# ADMIN_PASSWORD=   <- ezt a sort töröld vagy hagyd üresen');
  console.log(`\n${line}`);
  console.log('  A jelszót magát SEHOVA ne mentsd el — csak jelszókezelőbe.');
  console.log(`${line}\n`);
}

const fromArgv = process.argv.slice(2).join(' ').trim();
if (fromArgv) {
  output(fromArgv);
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Add meg az új admin jelszót: ', answer => {
    rl.close();
    const pw = String(answer || '').trim();
    if (!pw) {
      console.error('\n✗ Üres jelszó — nem történt semmi.\n');
      process.exit(1);
    }
    output(pw);
  });
}
