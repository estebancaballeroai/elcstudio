const {chromium}=require('playwright');const sleep=n=>new Promise(r=>setTimeout(r,n));
const shr=s=>String(s||'').replace(/\s+/g,' ').slice(0,300);
(async()=>{let browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let results=[];
async function open(repo){let c=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});let p=await c.newPage();p.setDefaultTimeout(5000);let errors=[];p.on('pageerror',e=>errors.push(shr(e.message)));let response=await p.goto('https://estebancaballeroai.github.io/'+repo+'/',{waitUntil:'domcontentloaded',timeout:35000});await sleep(650);return {p,c,errors,http:response.status()}}
async function diag(p,id){return await p.locator(id).evaluate(e=>{let r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,t=document.elementFromPoint(x,y);return {visible:!!r.width,button:e.outerHTML.slice(0,140),cover:t?.outerHTML?.slice(0,160),same:t===e||e.contains(t),rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],anim:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionProperty}})}
async function click(p,id){const l=p.locator(id);const before=(await p.locator('body').innerText()).slice(0,5000);let regular='';try{await l.click({timeout:2000});regular='clicked'}catch(e){regular='blocked '+shr(e.message).slice(0,100);await l.evaluate(el=>el.click());regular+='; DOM click dispatched'}await sleep(300);const after=(await p.locator('body').innerText()).slice(0,5000);return{regular,changed:before!==after}}
async function scenario(name,repo,test){let o=await open(repo);let record={name,repo,http:o.http,steps:[],errors:[],diagnostics:[]};try{await test(o.p,record)}catch(e){record.steps.push('TEST_ERROR '+shr(e.message))}record.errors=o.errors;results.push(record);console.log('DEEP_QA '+JSON.stringify(record));await o.c.close()}
await scenario('Monde CE1–CE2 Fantasy','e-ecole',async(p,r)=>{
await click(p,'#startBtn');for(const level of ['CE1','CE2']){await p.locator('[data-level="'+level+'"]').click();await sleep(100);
for(const realm of ['francais','maths','lecture','logique','orthographe','defi']){
await p.locator('[data-kingdom="'+realm+'"]').click();await sleep(75);
let opts=await p.locator('[data-choice]').count(),txt=await p.locator('#questTitle').textContent(),answer='not run';
if(opts){let choice=p.locator('[data-choice]:not([disabled])').first();if(await choice.count()){await choice.click();answer=await p.locator('#nextBtn').isEnabled()?'next enabled':'next disabled'}else answer='previously solved'}
r.steps.push(level+'/'+realm+' options='+opts+' '+answer+' '+shr(txt));await p.locator('#backToMap').click();
}}
let before=await p.evaluate(()=>localStorage.getItem('mondeCE1CE2FantasyProgressV1'));await p.reload({waitUntil:'domcontentloaded'});let after=await p.evaluate(()=>localStorage.getItem('mondeCE1CE2FantasyProgressV1'));r.steps.push('save persists='+Boolean(before&&before===after));});
await scenario('Théoscope','theoscope2',async(p,r)=>{
r.diagnostics.push(await diag(p,'#integralBtn'));r.steps.push('start '+JSON.stringify(await click(p,'#integralBtn')));r.steps.push('startModeBtn visible '+await p.locator('#startModeBtn').isVisible());
if(await p.locator('#startModeBtn').isVisible()){r.steps.push('start mode '+JSON.stringify(await click(p,'#startModeBtn')))}
r.steps.push('question screen '+(await p.locator('body').innerText()).slice(0,250).replace(/\s+/g,' '));
});
await scenario('IMPERIA','imperia1',async(p,r)=>{
r.diagnostics.push(await diag(p,'#newGameBtn'));r.steps.push('new game '+JSON.stringify(await click(p,'#newGameBtn')));r.steps.push('launch visible '+await p.locator('#launchGameBtn').isVisible());if(await p.locator('#launchGameBtn').isVisible()){r.steps.push('launch '+JSON.stringify(await click(p,'#launchGameBtn')));r.steps.push('turn visible '+await p.locator('#endTurnBtn').isVisible());if(await p.locator('#endTurnBtn').isVisible())r.steps.push('end turn '+JSON.stringify(await click(p,'#endTurnBtn')))}
});
await scenario('Maths Quest','mathsquest',async(p,r)=>{
r.steps.push('start count '+await p.locator('[data-action="start"]').count());let start=p.locator('[data-action="start"]').first();if(await start.count()){r.steps.push('start '+JSON.stringify(await click(p,'[data-action="start"]')));r.steps.push('submit count '+await p.locator('[data-action="submit"]').count());r.steps.push('skip count '+await p.locator('[data-action="skip"]').count());if(await p.locator('[data-action="skip"]').count())r.steps.push('skip '+JSON.stringify(await click(p,'[data-action="skip"]')))}
});
await scenario('Fútbol Pulse','footapp',async(p,r)=>{
for(const tab of ['fixture','standings','favorites']){let q=p.locator('[data-tab="'+tab+'"]').first();if(await q.isVisible()){let c=await click(p,'[data-tab="'+tab+'"]');r.steps.push(tab+' '+JSON.stringify(c))}else r.steps.push(tab+' not visible')}
});
await scenario('EXODUS 2149','exodusesp',async(p,r)=>{
r.steps.push('new campaign '+JSON.stringify(await click(p,'#startBtn')));r.steps.push('save '+JSON.stringify(await click(p,'#saveBtn')));r.steps.push('explore '+(await p.locator('#exploreBtn').isVisible()?JSON.stringify(await click(p,'#exploreBtn')):'not visible'));
});
await browser.close();const stats=results.map(x=>({name:x.name,hasTestFailure:x.steps.some(s=>s.includes('TEST_ERROR')||s.includes('next disabled')||s.includes('options=0')),errors:x.errors.length,steps:x.steps.length}));console.log('DEEP_QA_SUMMARY '+JSON.stringify(stats));
})().catch(e=>{console.error(e);process.exit(1)});
