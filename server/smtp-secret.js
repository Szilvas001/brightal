'use strict';
const {execFileSync}=require('node:child_process');
function read(password,service,account){
 if(!service)return password;
 if(process.platform!=='darwin')throw Error('SMTP Keychain requires macOS; configure the deployment secret store instead.');
 try{return execFileSync('/usr/bin/security',['find-generic-password','-s',service,'-a',account,'-w'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:15000}).replace(/\r?\n$/,'');}
 catch{throw Error('SMTP Keychain credential unavailable. Unlock the login Keychain.');}
}
module.exports={read};
