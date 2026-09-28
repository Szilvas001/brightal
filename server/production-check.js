'use strict';
function problems(cfg, env=process.env) {
 if(!cfg.isProd)return [];
 const out=[];
 if(!/^https:\/\/[^/]+$/.test(cfg.publicUrl))out.push('PUBLIC_URL: HTTPS domain szükséges, útvonal nélkül.');
 if(!env.SESSION_SECRET || env.SESSION_SECRET.length<32 || env.SESSION_SECRET.includes('<'))out.push('SESSION_SECRET: legalább 32 véletlen karakter szükséges.');
 if(!/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(cfg.admin.passwordHash)||cfg.admin.passwordHash.includes('<'))out.push('ADMIN_PASSWORD_HASH: valódi scrypt hash szükséges (npm run hash-password).');
 if(cfg.barion.simulate || cfg.barion.envKey!=='prod' || !cfg.barion.posKey || cfg.barion.posKey.includes('<') || !cfg.barion.payee || cfg.barion.payee.includes('<'))out.push('Barion: valódi production POSKey és payee szükséges, szimuláció nélkül.');
 for(const k of ['name','address','taxNumber','email'])if(!cfg.company[k]||cfg.company[k].includes('<'))out.push('Hiányzó cégadat: '+k);
 return out;
}
module.exports={problems};
