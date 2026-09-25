'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path');
process.chdir(path.join(__dirname,'..'));
// Override production .env settings for a predictable, simulated local session.
process.env.NODE_ENV='development';
process.env.PORT=process.env.LOCAL_PORT||'3000';
process.env.PUBLIC_URL='http://localhost:'+process.env.PORT;
process.env.BARION_SIMULATE='true';
process.env.MAIL_ENABLED='false';
process.env.INVOICE_ENABLED='false';
const result=spawnSync(process.execPath,['scripts/build.js'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const previews=spawnSync(process.execPath,['scripts/thumbnails.mjs','--missing'],{stdio:'inherit'});
if(previews.status!==0)process.exit(previews.status||1);
require('../server/index');
