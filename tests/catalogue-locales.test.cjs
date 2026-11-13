const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('only gold, lab-grown diamonds and IGI are offered, including restored presets',async()=>{
 const {OPTIONS,normalize}=await import('../public/builder/state.mjs');const {PRESETS}=await import('../public/builder/catalog.mjs');
 assert.deepEqual(OPTIONS.origin,['lab']);assert.deepEqual(OPTIONS.certificate,['IGI']);
 assert.equal(OPTIONS.metal.length,6);for(const k of ['metal','headMetal','secondaryMetal'])assert(!OPTIONS[k].includes('platinum'));
 const c=normalize({metal:'platinum',headMetal:'platinum',secondaryMetal:'platinum',origin:'natural',certificate:'GIA'});
 for(const k of ['metal','headMetal','secondaryMetal'])assert.equal(c[k],'white18');assert.equal(c.origin,'lab');assert.equal(c.certificate,'IGI');
 for(const {config}of PRESETS){assert(OPTIONS.metal.includes(config.metal));assert.equal(config.origin,'lab');assert.equal(config.certificate,'IGI');}
});
test('German dictionary covers every webshop translation key and keeps interpolation tokens',()=>{
 const src=fs.readFileSync('public/app.jsx','utf8');const en=vm.runInNewContext(src.slice(0,src.indexOf('I18N.de ='))+';I18N.en');const de=require('../public/locales/de.json');
 for(const [key,value]of Object.entries(en)){assert.equal(typeof de[value],'string',key);assert.deepEqual(de[value].match(/\{\w+\}/g)||[],value.match(/\{\w+\}/g)||[],key);}
});
