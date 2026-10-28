'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cfg=require('./config');
function snapshot(){
 const context={window:{}};vm.createContext(context);
 for(const name of ['legal.js','legal-source.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',name),'utf8'),context,{timeout:1000});
 const doc=context.window.LEGAL.hu.terms;
 const block=b=>typeof b==='string'?b:Array.isArray(b)?b.map(block).join('\n'):b?.t?b.t.map(row=>row.join(': ')).join('\n'):b?.note||'';
 return [doc.title,doc.lead,...doc.sections.map(s=>s.h+'\n'+s.b.map(block).join('\n\n'))].join('\n\n').replace(/\{\{([\w.]+)\}\}/g,(_,key)=>key.split('.').reduce((o,k)=>o?.[k],cfg)||'[KITÖLTENDŐ]');
}
module.exports={snapshot};
