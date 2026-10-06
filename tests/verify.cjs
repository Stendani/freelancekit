const fs=require('fs'), path=require('path'), vm=require('vm');
const root=path.dirname(__dirname);
const LANGS=['en','ru','es','fr','de','pt','it','pl'];
const LOCALE_FILES=LANGS.map(l=>'data/locales/'+l+'.js');
const read=p=>fs.readFileSync(p,'utf8');
function loadContext(lang='en'){
  const values={};
  const context={
    console,window:{FK_CONFIG:{defaultLanguage:lang,repoName:'freelancekit'},FK_LOCALES:{},FK_CURRENCIES:[],FK_TOOLS:[]},
    localStorage:{getItem:(k)=>k==='fk-lang'?lang:null,setItem:()=>{}},navigator:{language:lang+'-'+lang.toUpperCase()},
    location:{protocol:'file:',pathname:root+'/tools/hourly-rate-calculator/index.html',href:'file://'+root+'/tools/hourly-rate-calculator/index.html',search:''},
    URLSearchParams,URL,Intl,Date,Math,Number,parseFloat,encodeURIComponent,fetch:async()=>{throw new Error('network disabled in test')},setTimeout,clearTimeout
  };
  context.document={documentElement:{lang:''},body:{insertAdjacentHTML(){}},values,
    querySelector(sel){if(sel==='#app')return {innerHTML:''};const m=sel.match(/^#(.+)$/);if(m)return {value:values[m[1]]??'',addEventListener(){},textContent:''};return null;},
    querySelectorAll(){return[];},addEventListener(){}}
  context.window.addEventListener=()=>{};
  const load=f=>vm.runInNewContext(read(f),context,{filename:f});
  for(const f of ['data/currencies.js','data/tools.js','data/tool-fields.js'])load(path.join(root,f));
  for(const l of LANGS)load(path.join(root,'data/locales',l+'.js'));
  load(path.join(root,'site-config.js'));load(path.join(root,'app.js'));
  return {context,core:context.window.FK_CORE,tools:context.window.FK_TOOLS};
}
function assert(cond,msg){if(!cond)throw new Error(msg);}
function setValues(ctx, defs, values){for(const d of defs)ctx.document.values[d.id]=values[d.id] ?? d.value ?? (d.type==='select'?(d.options?.[0]?.value||''):'');}
function getEnglishToolContext(){return loadContext('en');}

(async()=>{
  // File/link integrity.
  const htmlFiles=[...fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&e.name==='tools'?walk(path.join(root,e.name)):e.name.endsWith('.html')?[path.join(root,e.name)]:[])];
  function walk(dir){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(p));else if(e.name.endsWith('.html'))out.push(p);}return out;}
  assert(htmlFiles.length===52,'Expected 52 HTML files (5 top-level/static incl. 404 + tools index + 46 tool pages)');
  for(const file of htmlFiles){
    const s=read(file);
    for(const m of s.matchAll(/(?:src|href)="([^"]+)"/g)){
      const href=m[1];
      if(!href||href.startsWith('http')||href.startsWith('#')||href.startsWith('data:')||href.startsWith('mailto:'))continue;
      const clean=href.split('?')[0].split('#')[0];
      if(clean.endsWith('/'))continue;
      const target=path.resolve(path.dirname(file),clean);
      assert(fs.existsSync(target),`${path.relative(root,file)} -> missing ${clean}`);
    }
    assert(!s.includes('github.io'),`${path.relative(root,file)} still contains a GitHub Pages canonical`);
  }
  const sw=read(path.join(root,'sw.js')); assert(sw.includes("freelancekit-v3.1.1"),'service worker cache version mismatch');

  // Load all languages and structural parity.
  const base=getEnglishToolContext();
  const tools=base.tools;
  assert(tools.length===46,'Expected exactly 46 tools');
  const slugs=new Set(tools.map(t=>t.slug)); assert(slugs.size===46,'Tool slugs must be unique');
  const localeObjects=base.context.window.FK_LOCALES;
  const enKeys={ui:Object.keys(localeObjects.en.ui).sort(),fields:Object.keys(localeObjects.en.fields).sort(),tools:Object.keys(localeObjects.en.tools).sort(),generators:Object.keys(localeObjects.en.generators).sort(),units:Object.keys(localeObjects.en.units).sort(),currencyNames:Object.keys(localeObjects.en.currencyNames).sort()};
  for(const lang of LANGS){
    const loc=localeObjects[lang]; assert(loc,`Missing locale ${lang}`);
    for(const section of ['ui','fields','tools','generators','currencyNames']) assert(JSON.stringify(Object.keys(loc[section]).sort())===JSON.stringify(enKeys[section].sort()),`${lang}: locale ${section} keys differ from English`);
    const unitBaseKeys=enKeys.units.filter(k=>!(lang==='ru'||lang==='pl')||!k.endsWith('_plural'));
    for(const k of unitBaseKeys) assert(k in loc.units,`${lang}: missing unit key ${k}`);
    if(['ru','pl'].includes(lang)) for(const kind of ['project','month','client','retainer','hour','business_day']) for(const form of ['few','many']) assert(`${kind}_${form}` in loc.units,`${lang}: missing ${kind}_${form}`);
    assert(Object.keys(loc.fields).length===115,`${lang}: expected 115 exact field translations`);
    assert(Object.keys(loc.tools).length===64,`${lang}: expected 64 prepared tool titles (46 current + 18 future)`);
    assert(Object.keys(loc.generators).length===10,`${lang}: expected 10 generator templates`);
    for(const t of tools) assert(loc.tools[t.slug]&&loc.tools[t.slug].trim(),`${lang}: missing title ${t.slug}`);
  }

  // Exact field translation and no word-by-word fallback behavior.
  for(const t of tools){
    if(t.category==='Generators')continue;
    const defs=base.core.toolFields(t.slug); assert(defs.length>0,`No field definitions for ${t.slug}`);
    for(const lang of LANGS){
      const loc=localeObjects[lang];
      for(const d of defs) assert(Object.prototype.hasOwnProperty.call(loc.fields,d.label)&&String(loc.fields[d.label]).trim()!=='',`${lang}/${t.slug}: missing field translation ${d.label}`);
    }
  }

  // All generators return a localized draft containing the requested variables.
  for(const lang of LANGS){
    const {context,core}=loadContext(lang);
    context.document.values.client='Alex'; context.document.values.project='website redesign'; context.document.values.notes='Budget is flexible.';
    for(const slug of Object.keys(context.window.FK_LOCALES[lang].generators)){
      const template=context.window.FK_LOCALES[lang].generators[slug]; const out=core.generator(slug); if(template.includes('{{client}}')) assert(out.includes('Alex'),`${lang}/${slug}: generator lost client variable`); if(template.includes('{{project}}')) assert(out.includes('website redesign'),`${lang}/${slug}: generator lost project variable`); if(template.includes('{{notes}}')) assert(out.includes('Budget is flexible.'),`${lang}/${slug}: generator lost notes`);
    }
  }

  // All calculator functions return sensible output in all 8 languages.
  let calculatorRuns=0;
  for(const lang of LANGS){
    const {context,core,tools}=loadContext(lang);
    for(const t of tools.filter(x=>x.category!=='Generators')){
      const defs=core.toolFields(t.slug); setValues(context,defs,{});
      context.document.values.start='2026-10-06'; context.document.values.end='2026-10-13'; context.document.values.date='2026-10-06'; context.document.values.business='yes';
      context.document.values.from='USD';context.document.values.to='USD';context.document.values.fromTz='UTC';context.document.values.toTz='Europe/Paris';context.document.values.time='09:00';
      const out=await core.compute(t.slug); assert(out!==undefined&&out!==null&&String(out).trim()!=='',`${lang}/${t.slug}: empty result`); calculatorRuns++;
    }
  }

  // Representative formula assertions in English, using independent expected values.
  const {context,core}=loadContext('en');
  const cases=[
    ['hourly-rate-calculator',{target:5000,expenses:500,tax:20,hours:100},'$68.75'],
    ['monthly-income-calculator',{rate:40,hours:100},'$4,000.00'],
    ['annual-income-calculator',{monthly:4000},'$48,000.00'],
    ['project-price-calculator',{hours:40,rate:50,buffer:15},'$2,300.00'],
    ['day-rate-calculator',{rate:50,dayhours:7},'$350.00'],
    ['effective-hourly-rate',{revenue:5000,billable:80,unpaid:20},'$50.00'],
    ['profit-margin-calculator',{revenue:5000,costs:3000},'40%'],
    ['markup-calculator',{cost:100,markup:30},'$130.00'],
    ['discount-calculator',{price:500,discount:15},'$425.00 · save $75.00'],
    ['break-even-calculator',{fixed:1000,price:1000,variable:200},'1.25 projects'],
    ['revenue-target-calculator',{target:5000,avg:1000},'5 projects'],
    ['retainer-price-calculator',{hours:20,rate:60,buffer:10},'$1,320.00'],
    ['tax-estimate-calculator',{gross:5000,rate:20},'$1,000.00'],
    ['invoice-total-calculator',{subtotal:1000,discount:5,tax:20},'$1,140.00 · tax $190.00'],
    ['payment-fee-calculator',{desired:1000,feeRate:2.9,fixedFee:0.3},'$1,030.18'],
    ['cash-flow-calculator',{income:5000,expenses:3000},'$2,000.00'],
    ['runway-calculator',{cash:12000,burn:2000},'6 months'],
    ['savings-goal-calculator',{goal:6000,current:2000,months:8},'$500.00'],
    ['roi-calculator',{gain:1500,cost:1000},'50%'],
    ['utilization-calculator',{available:160,billable:100},'62.5%'],
    ['billable-hours-calculator',{days:20,hoursDay:8,nonbillable:25},'120 hours'],
    ['overtime-rate-calculator',{rate:40,mult:1.5},'$60.00'],
    ['late-fee-calculator',{invoice:1000,rate:2,months:3},'$60.00'],
    ['vacation-rate-calculator',{annual:60000,weeks:4,hoursWeek:30},'$41.67'],
    ['deposit-calculator',{total:3000,deposit:50},'$1,500.00 deposit · $1,500.00 remaining'],
    ['installment-calculator',{total:1200,count:6},'$200.00 each'],
    ['cost-plus-pricing-calculator',{cost:100,markup:25},'$125.00'],
    ['quote-total-calculator',{line1:500,line2:300,line3:200,discount:10,tax:20},'$1,080.00'],
    ['project-buffer-calculator',{hours:40,buffer:25},'50 hours'],
    ['client-lifetime-value-calculator',{avg:500,months:12},'$6,000.00'],
    ['deadline-calculator',{start:'2026-10-06',days:5,business:'no'},'2026-10-11'],
    ['business-days-calculator',{start:'2026-10-05',end:'2026-10-09'},'5 business days'],
    ['working-hours-calculator',{days:5,hours:8,breaks:1},'35 hours'],
    ['commission-calculator',{sales:10000,rate:10},'$1,000.00'],
    ['client-capacity-calculator',{hours:160,perClient:20},'8 clients'],
    ['project-profit-calculator',{revenue:5000,hours:40,rate:50,other:500},'$2,500.00'],
    ['rate-increase-impact-calculator',{oldRate:50,newRate:60,hours:100},'$5,000.00 → $6,000.00 (20% increase)'],
    ['sick-day-buffer-calculator',{income:60000,weeks:48,sick:2,hoursDay:8},'$31.51'],
    ['holiday-buffer-calculator',{income:60000,weeks:48,holiday:4,hoursWeek:30},'$45.45'],
    ['monthly-client-target-calculator',{target:5000,avg:1000},'5 clients'],
    ['weekly-revenue-target-calculator',{monthly:4000,weeks:4},'$1,000.00'],
    ['retainer-capacity-calculator',{hours:100,retainer:20},'5 retainers'],
    ['proposal-conversion-calculator',{wins:8,proposals:40},'20% win rate'],
    ['average-order-value-calculator',{revenue:5000,count:10},'$500.00'],
    ['lead-to-client-calculator',{leads:100,conversion:7},'7 clients'],
    ['pipeline-value-calculator',{pipeline:20000,win:25},'$5,000.00'],
    ['client-acquisition-cost-calculator',{spend:1200,clients:6},'$200.00'],
    ['freelance-salary-equivalent-calculator',{salary:60000,benefits:6000,overhead:9000},'$75,000.00'],
    ['monthly-profit-goal-calculator',{profit:3000,expenses:1000,tax:20},'$5,000.00'],
    ['price-per-deliverable-calculator',{total:1200,deliverables:6},'$200.00']
  ];
  for(const [slug,vals,expected] of cases){setValues(context,core.toolFields(slug),vals);const out=await core.compute(slug);assert(String(out)===expected,`${slug}: expected ${expected}, got ${out}`);}

  // Invoice generator: local text, tax arithmetic, and two line items.
  for(const lang of LANGS){
    const {context,core}=loadContext(lang);
    const vals={invoiceBusiness:'Studio North',invoiceClient:'Acme Ltd',invoiceNumber:'INV-42',invoiceIssueDate:'2026-10-06',invoiceDueDate:'2026-10-20',itemDescription1:'Design',quantity1:'2',unitPrice1:'100',itemDescription2:'Support',quantity2:'3',unitPrice2:'50',invoiceTaxRate:'20',invoiceNotes:'Thanks'};
    Object.assign(context.document.values,vals);
    const out=core.invoiceGenerator();
    assert(out.includes('INV-42'),`${lang}: invoice number missing`);
    assert(out.includes('Studio North'),`${lang}: invoice business missing`);
    assert(out.includes('Acme Ltd'),`${lang}: invoice client missing`);
    assert(out.includes('Design'),`${lang}: first line missing`);
    assert(out.includes('Support'),`${lang}: second line missing`);
    assert(out.includes('350'),`${lang}: invoice subtotal missing`);
  }

  // Converter same-currency is local/offline; timezone is local/Intl based.
  context.document.values.amount=100;context.document.values.from='USD';context.document.values.to='USD';assert((await core.compute('currency-converter'))==='$100.00','currency converter same-currency failed');
  context.document.values.time='09:00';context.document.values.fromTz='UTC';context.document.values.toTz='Europe/Paris';const tz=await core.compute('time-zone-converter');assert(/09:00|10:00|11:00|12:00/.test(tz),'timezone converter returned unexpected output');

  console.log(`PASS: structural integrity, local translation parity, 35 calculators × 8 languages (${calculatorRuns} runs), 80 generator runs, and ${cases.length} independent formula checks.`);
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1)});
