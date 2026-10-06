const fs=require('fs'), vm=require('vm');
const root=require('path').dirname(__dirname);
const LANGS=['en','ru','es','fr','de','pt','it','pl'];
const TOOL_FILES=['currencies.js','tools.js','tool-fields.js'];
function runLang(lang){
  const values={};
  const context={
    console,
    window:{FK_CONFIG:{defaultLanguage:lang,repoName:'freelancekit'},FK_LOCALES:{},FK_CURRENCIES:[],FK_TOOLS:[],FK_REGIONS:{}},
    localStorage:{getItem:(k)=>k==='fk-lang'?lang:null,setItem:()=>{}},
    navigator:{language:lang+'-'+lang.toUpperCase()},
    location:{protocol:'file:',pathname:root+'/tools/hourly-rate-calculator/index.html',href:'file://'+root+'/tools/hourly-rate-calculator/index.html',search:''},
    URLSearchParams,URL,Intl,Date,Math,Number,parseFloat,encodeURIComponent,
    fetch:async()=>{throw new Error('network disabled in test')},setTimeout,clearTimeout
  };
  context.document={
    documentElement:{lang:''},
    body:{insertAdjacentHTML(){}},
    querySelector(sel){
      if(sel==='#app') return {innerHTML:''};
      const m=sel.match(/^#(.+)$/);
      if(m) return {value:values[m[1]]??'',addEventListener(){},textContent:''};
      return null;
    },
    querySelectorAll(){return[];},
    addEventListener(){},
    values
  };
  context.window.addEventListener=()=>{};
  const load=(f)=>vm.runInNewContext(fs.readFileSync(f,'utf8'),context,{filename:f});
  for(const f of TOOL_FILES) load(root+'/data/'+f);
  load(root+'/data/locales/'+lang+'.js');
  load(root+'/site-config.js');
  load(root+'/app.js');
  const core=context.window.FK_CORE;
  if(!core) throw new Error(lang+': FK_CORE missing');
  const tools=context.window.FK_TOOLS;
  if(tools.length!==46) throw new Error(lang+`: expected 46 tools, got ${tools.length}`);
  if(Object.keys(context.window.FK_LOCALES[lang].fields).length!==115) throw new Error(lang+': field translation count mismatch');
  return {context,core,tools};
}
(async()=>{
  let generatorCount=0;
  for(const lang of LANGS){
    const {context,core,tools}=runLang(lang);
    for(const tool of tools){
      const defs=core.toolFields(tool.slug);
      if(!defs.length && tool.category!=='Generators') throw new Error(lang+': no fields '+tool.slug);
      for(const d of defs) context.document.values[d.id]=d.value??(d.type==='select'?(d.options?.[0]?.value||''):'');
      context.document.values.start=context.document.values.start||new Date().toISOString().slice(0,10);
      context.document.values.end=context.document.values.end||new Date(Date.now()+7*86400000).toISOString().slice(0,10);
      context.document.values.date=context.document.values.date||new Date(Date.now()+30*86400000).toISOString().slice(0,10);
      context.document.values.business='yes';
      context.document.values.from='USD'; context.document.values.to='USD';
      context.document.values.fromTz='UTC'; context.document.values.toTz='Europe/Paris';
      context.document.values.time='09:00';
      context.document.values.client='Alex'; context.document.values.project='website redesign'; context.document.values.notes='';
      if(tool.category!=='Generators'){
        const v=await core.compute(tool.slug);
        if(v===undefined||v===null||String(v)==='') throw new Error(lang+': empty result '+tool.slug);
      }
    }
    if(typeof core.invoiceGenerator==='function'){
      context.document.values.invoiceBusiness='Studio'; context.document.values.invoiceClient='Client'; context.document.values.invoiceNumber='INV-1'; context.document.values.invoiceIssueDate='2026-10-06'; context.document.values.invoiceDueDate='2026-10-20'; context.document.values.itemDescription1='Design'; context.document.values.itemDescription2='Support'; context.document.values.quantity1='1'; context.document.values.quantity2='2'; context.document.values.unitPrice1='100'; context.document.values.unitPrice2='50'; context.document.values.invoiceTaxRate='20'; context.document.values.invoiceNotes='';
      const inv=core.invoiceGenerator(); if(!inv || !inv.includes('INV-1')) throw new Error(lang+': invoice generator failed'); generatorCount++;
    }
    for(const slug of Object.keys(context.window.FK_LOCALES[lang].generators)){
      context.document.values.client='Alex'; context.document.values.project='website redesign'; context.document.values.notes='';
      const g=core.generator(slug); if(!g) throw new Error(lang+': empty generator '+slug); generatorCount++;
    }
  }
  console.log(`PASS: ${LANGS.length} languages × 46 tools = ${LANGS.length*46} calculator runs; ${generatorCount} generator runs; 115 exact field translations per language.`);
})().catch(e=>{console.error(e);process.exit(1)});
