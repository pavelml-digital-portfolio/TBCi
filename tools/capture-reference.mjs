// Run after npm run build and starting a local static server for apps/web/dist.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const screens=JSON.parse(fs.readFileSync('docs/specification/screens.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4330';
const open=async(s)=>{await page.goto(base+s.route);if(s.id==='CAB-04'||s.id==='CAB-06'){await page.waitForURL(u=>u.pathname==='/app/');await page.getByRole('dialog').waitFor()}await page.locator('h1').waitFor();await page.waitForFunction(()=>!document.querySelector('astro-island[ssr]'));await page.evaluate(()=>document.fonts.ready)};
fs.mkdirSync('docs/frontend/screens',{recursive:true});const results=[];
for(const s of screens){await page.setViewportSize({width:s.width,height:s.height});await open(s);await page.screenshot({path:`docs/frontend/screens/${s.id}.jpg`,type:'jpeg',quality:85,fullPage:s.id!=='CAB-04'&&s.id!=='CAB-06'});results.push({id:s.id,route:s.route,width:s.width,sourceHeight:s.height,renderHeight:await page.evaluate(()=>document.documentElement.scrollHeight)});}
const mobile=[];for(const width of [375,320])for(const s of screens){await page.setViewportSize({width,height:850});await open(s);const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);if(scroll>width)mobile.push({id:s.id,width,scroll});}
const report={source:'TBCI.rar',screens:results,mobileOverflows:mobile,pageErrors:errors};fs.writeFileSync('docs/frontend/SCREEN_REVIEW.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));await browser.close();if(errors.length||mobile.length)process.exitCode=1;
