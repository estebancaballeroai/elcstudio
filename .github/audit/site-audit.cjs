const {chromium}=require('playwright'), fs=require('fs');
const apps=[['Fútbol Pulse','footapp'],['ClubPilot','hat3'],['À deux pas','salidas'],['Frigo & Menus','cocinafacil'],['Cap A+ Territorial','inet'],['Délib’MLH','delib'],['Cap Sénat 68','capsenat'],['Maths Quest','mathsquest'],['Monde CE1–CE2 Fantasy','e-ecole'],['Théoscope','theoscope2'],['Mandat & Service','mets41'],['EXODUS 2149','exodusesp'],['Camino a la Gloria','caminoalagloria3'],['IMPERIA','imperia1'],['HORS-JEU','horsjeu']];
const sleep=t=>new Promise(r=>setTimeout(r,t)), short=s=>String(s||'').replace(/\s+/g,' ').slice(0,160);
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
for(const [name,repo] of apps){
const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
const page=await ctx.newPage();page.setDefaultTimeout(5000);
const rec={name,repo,url:'https://estebancaballeroai.github.io/'+repo+'/',http:0,bodyChars:0,visibleButtons:0,errors:[],brokenAssets:[],horizontalOverflow:false,start:'not tested',notes:[]};
page.on('pageerror',e=>rec.errors.push(short(e.message)));
page.on('response',r=>{if(r.status()>=400 && r.url().startsWith('https://estebancaballeroai.github.io/'+repo+'/'))rec.brokenAssets.push(r.status()+' '+short(r.url()));});
try{
const response=await page.goto(rec.url,{waitUntil:'domcontentloaded',timeout:35000});rec.http=response?.status()||0;await sleep(1200);
rec.bodyChars=await page.locator('body').evaluate(e=>(e.innerText||'').trim().length);
rec.visibleButtons=await page.locator('button:visible').count();
rec.horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+18);
if(repo==='e-ecole'){
await page.locator('#startBtn').click();await sleep(450);
const kingdoms=await page.locator('[data-kingdom]').count();
if(kingdoms>=5){await page.locator('[data-kingdom="maths"]').click();const choices=await page.locator('[data-choice]').count();
if(choices>1){await page.locator('[data-choice]').first().click();rec.start=await page.locator('#nextBtn').isEnabled()?'PASSED: start/map/answer/next':'FAILED: next locked';}
else rec.start='FAILED: no question options';}
else rec.start='FAILED: no kingdoms';
}else{
const buttons=page.getByRole('button',{name:/^(?:▶️?\s*)?(?:commencer|démarrer|jouer|start|empezar|jugar|nueva partida|nouvelle partie|iniciar|entrer|continuar|continuer|découvrir|comenzar)\b/i});
if(await buttons.count() && await buttons.first().isVisible() && await buttons.first().isEnabled()){
const old=await page.locator('body').innerText().catch(()=>''),url=page.url();try{await buttons.first().click();await sleep(400);const now=await page.locator('body').innerText().catch(()=>'');rec.start=(old!==now||url!==page.url())?'clicked, view changed':'clicked, no visible change';}
catch(e){rec.start='FAILED: click '+short(e.message)}}
else rec.start='No recognized start button';
}
if(repo==='theoscope2'){const b=await page.locator('button').allTextContents();rec.notes.push('Buttons: '+b.map(x=>short(x).slice(0,30)).slice(0,9).join(' | '))}
}catch(e){rec.notes.push('Navigation: '+short(e.message))}
rec.errors=[...new Set(rec.errors)].slice(0,8);rec.brokenAssets=[...new Set(rec.brokenAssets)].slice(0,9);
rec.result=(rec.http!==200||rec.bodyChars<25||rec.errors.length||rec.brokenAssets.length||rec.start.startsWith('FAILED'))?'ISSUE':rec.start.startsWith('PASSED')?'BASIC_PASS':'REVIEW';
results.push(rec);console.log('APP_AUDIT '+JSON.stringify(rec));await ctx.close();
}
await browser.close();fs.mkdirSync('audit-results',{recursive:true});fs.writeFileSync('audit-results/report.json',JSON.stringify({date:new Date().toISOString(),method:'Playwright Chrome, mobile 390x844, public GitHub Pages',results},null,2));
const lines=['# ELC Studio Mobile QA','', '| Application | HTTP | JS errors | HTTP 4xx | Start | Status |','|---|---:|---:|---:|---|---|'];
for(const r of results){lines.push('| '+r.name+' | '+r.http+' | '+r.errors.length+' | '+r.brokenAssets.length+' | '+r.start.replace(/\|/g,'/')+' | '+r.result+' |');lines.push('');lines.push('Errors '+r.name+': '+JSON.stringify(r.errors)+'; Missing: '+JSON.stringify(r.brokenAssets)+'; Notes: '+JSON.stringify(r.notes))}
fs.writeFileSync('audit-results/report.md',lines.join('\n'));
console.log('AUDIT_SUMMARY '+JSON.stringify({total:results.length,issues:results.filter(x=>x.result==='ISSUE').length,review:results.filter(x=>x.result==='REVIEW').length,basic:results.filter(x=>x.result==='BASIC_PASS').length}));
})().catch(e=>{console.error(e);process.exit(1)});
