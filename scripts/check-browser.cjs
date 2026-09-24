const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const errors=[],results=[];
try{for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/diamonds');await page.waitForSelector('.diamond-card');await page.locator('.diamond-card').last().scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('.diamond-preview img')].every(x=>x.complete&&x.naturalWidth>0),{},{timeout:60000});
 const data=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,canvases:document.querySelectorAll('canvas').length,cards:document.querySelectorAll('.diamond-card').length,previewBytes:performance.getEntriesByType('resource').filter(x=>x.name.includes('/preview/')).reduce((s,x)=>s+x.transferSize,0),domReady:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd}));results.push({page:'diamonds',...data});
 await page.screenshot({path:'/tmp/brightal-diamonds-'+viewport.width+'.png',fullPage:true});
 await page.locator('.diamond-card').first().click();await page.waitForSelector('.diamond-canvas canvas');await page.getByRole('button',{name:'Nagyítás',exact:true}).click();await page.getByRole('button',{name:'Nézet visszaállítása',exact:true}).click();await page.getByRole('button',{name:'Bezárás',exact:true}).click();
 await page.goto('http://localhost:3000/upload');await page.waitForSelector('.lock-ring');results.push({page:'upload',width:viewport.width,loginGate:true});
 await page.goto('http://localhost:3000/ring-builder');await page.waitForSelector('.rb-canvas canvas',{timeout:60000});await page.waitForSelector('.rb-canvas[data-quality=detailed]',{timeout:60000});await page.screenshot({path:'/tmp/brightal-builder-'+viewport.width+'.png',fullPage:false});results.push({page:'builder',width:viewport.width,canvas:true,quality:'detailed',overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.close();
}
}finally{await browser.close();}console.log(JSON.stringify({results,errors},null,2));if(errors.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1;});
