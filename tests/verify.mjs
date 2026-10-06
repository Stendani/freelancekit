const fs=require('fs'),vm=require('vm');
const root=__dirname.replace(/\\tests$/,'');
const context={
  console,window:{FK_CONFIG:{defaultLanguage:'en',repoName:'freelancekit'},FK_I18N:{},FK_LOCALES:{},FK_CURRENCIES:[],FK_TOOLS:[],FK_REGIONS:[]},
  localStorage:{getItem:()=>null,setItem:()=>{}},navigator:{language:'en-US'},location:{protocol:'file:',pathname:root+'/tools/hourly-rate-calculator/index.html',href:'file://'+root+'/tools/hourly-rate-calculator/index.html',search:''},URLSearchParams,URL,Intl,Date,Math,Number,parseFloat,encodeURIComponent,fetch:async()=>{throw new Error('network disabled in test')},setTimeout,clearTimeout
};
context.document={documentElement:{lang:''},body:{insertAdjacentHTML(){},},querySelector(sel){ if(sel==='#app') return {innerHTML:''}; const m=sel.match(/^#(.+)$/); if(m) return {value:this.values?.[m[1]]??'',addEventListener(){},textContent:''}; return null;},querySelectorAll(){return[];},addEventListener(){},values:{}};
context.window.addEventListener=()=>{};
function load(file){vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});}
load(root+'/data/currencies.js'); load(root+'/data/tools.js'); load(root+'/data/tool-fields.js');
for(const l of ['en','ru','es','fr','de','pt','it','pl']) load(root+`/data/locales/${l}.js`);
load(root+'/site-config.js'); load(root+'/app.js');
const core=context.window.FK_CORE; if(!core) throw new Error('FK_CORE missing');
const tools=context.window.FK_TOOLS;
if(tools.length!==45) throw new Error(`Expected 45 tools, got ${tools.length}`);
let ok=0;
for(const lang of Object.keys(context.window.FK_LOCALES)){
  const loc=context.window.FK_LOCALES[lang];
  const localeKeys=Object.keys(loc.fields);
  if(localeKeys.length<115) throw new Error(`${lang}: only ${localeKeys.length} field translations`);
}
for(const tool of tools){
  const defs=core.toolFields(tool.slug);
  if(!defs.length && tool.category!=='Generators') throw new Error(`No fields for ${tool.slug}`);
  for(const d of defs){context.document.values[d.id]=d.value??(d.type==='select'?(d.options?.[0]?.value||''):'');}
  // Special date/select defaults used by functions.
  context.document.values.start=context.document.values.start||new Date().toISOString().slice(0,10);
  context.document.values.end=context.document.values.end||new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  context.document.values.date=context.document.values.date||new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  context.document.values.business=context.document.values.business||'yes';
  context.document.values.from=context.document.values.from||'USD'; context.document.values.to=context.document.values.to||'USD';
  context.document.values.fromTz=context.document.values.fromTz||'UTC'; context.document.values.toTz=context.document.values.toTz||'Europe/Paris';
  context.document.values.time=context.document.values.time||'09:00';
  // Compute test per language using same pure logic.
  for(const lang of ['en','ru','es','fr','de','pt','it','pl']){
    context.window.FK_CONFIG.defaultLanguage=lang;
    const r=core.compute(tool.slug);
    Promise.resolve(r).then(v=>{ if(v===undefined||v===null||String(v)==='') throw new Error(`Empty result ${lang}/${tool.slug}`); }).catch(e=>{throw e;});
  }
  ok++;
}
// Since compute can be async for one path, explicitly await the shared set through a second pass.
(async()=>{
 for(const tool of tools){
  const defs=core.toolFields(tool.slug);
  for(const d of defs) context.document.values[d.id]=d.value??(d.type==='select'?(d.options?.[0]?.value||''):'');
  context.document.values.start=context.document.values.start||new Date().toISOString().slice(0,10);context.document.values.end=context.document.values.end||new Date(Date.now()+7*86400000).toISOString().slice(0,10);context.document.values.date=context.document.values.date||new Date(Date.now()+30*86400000).toISOString().slice(0,10);context.document.values.business='yes';context.document.values.from='USD';context.document.values.to='USD';context.document.values.fromTz='UTC';context.document.values.toTz='Europe/Paris';context.document.values.time='09:00';
  for(const lang of ['en','ru','es','fr','de','pt','it','pl']){context.window.FK_CONFIG.defaultLanguage=lang;const v=await core.compute(tool.slug);if(v===undefined||v===null||String(v)==='')throw new Error(`Empty result ${lang}/${tool.slug}`);}
 }
 for(const slug of Object.keys(context.window.FK_LOCALES.en.generators)){context.document.values.client='Alex';context.document.values.project='website redesign';context.document.values.notes='';for(const lang of ['en','ru','es','fr','de','pt','it','pl']){context.window.FK_CONFIG.defaultLanguage=lang;const g=core.generator(slug);if(!g)throw new Error(`Empty generator ${lang}/${slug}`);}}
 console.log(`PASS: 45 tools × 8 languages, all calculator functions returned non-empty results; generators returned non-empty drafts.`);
})().catch(e=>{console.error(e);process.exit(1)});
