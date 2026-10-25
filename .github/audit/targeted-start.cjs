const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});for(const [repo,id,next] of [['theoscope2','#integralBtn',null],['imperia1','#newGameBtn','#launchGameBtn']]){
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('https://estebancaballeroai.github.io/'+repo+'/',{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(1600);
let target=p.locator(id),firstVisible=await target.isVisible(),firstEnabled=await target.isEnabled(),firstBox=await target.boundingBox(),result='NOT_TESTED',detail='';
try{await target.click({timeout:3000});await p.waitForTimeout(450);result='CLICK_OK';if(next){let n=p.locator(next);detail='setupVisible='+await n.isVisible();if(await n.isVisible()){await n.click({timeout:3000});await p.waitForTimeout(350);result='TWO_CLICKS_OK'}}}catch(e){result='CLICK_FAIL';detail=String(e.message).slice(0,280)}
console.log('TARGETED_AUDIT '+JSON.stringify({repo,firstVisible,firstEnabled,firstBox,result,detail,errors,body:(await p.locator('body').innerText()).slice(0,350)}));await p.close()}await b.close()})().catch(e=>{console.error(e);process.exit(1)});
