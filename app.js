(function(){
const cfg=window.FK_CONFIG||{};
const tools=window.FK_TOOLS||[];
const currencies=window.FK_CURRENCIES||[];
const locales=window.FK_LOCALES||{};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const langNames={en:"English",ru:"Русский",es:"Español",fr:"Français",de:"Deutsch",pt:"Português",it:"Italiano",pl:"Polski"};
const fallbackLang=cfg.defaultLanguage||"en";
const qp=new URLSearchParams(location.search);
let lang=qp.get("lang")||localStorage.getItem("fk-lang")||navigator.language.slice(0,2);
if(!locales[lang]) lang=fallbackLang;
let currency=localStorage.getItem("fk-currency")||qp.get("currency")||cfg.defaultCurrency||"USD";
if(!currencies.some(x=>x.code===currency)) currency="USD";
const L=()=>locales[lang]||locales[fallbackLang];
function tr(key){return L().ui[key]??locales.en.ui[key]??key;}
function toolTitle(tool){return L().tools[tool.slug]||locales.en.tools[tool.slug]||tool.title;}
const categoryDesc={
 en:{Money:"Calculate money metrics for freelance work.",Pricing:"Estimate prices and rates for freelance projects.",Business:"Plan and measure important freelance business numbers.",Time:"Plan and measure your working time.",Conversion:"Convert values and time zones quickly.",Generators:"Create a ready-to-use client draft in seconds."},
 ru:{Money:"Рассчитывайте денежные показатели фрилансера.",Pricing:"Оценивайте цены и ставки для проектов.",Business:"Планируйте и оценивайте ключевые показатели бизнеса.",Time:"Планируйте и измеряйте рабочее время.",Conversion:"Быстро конвертируйте значения и часовые пояса.",Generators:"Создавайте готовые черновики для клиентов за секунды."},
 es:{Money:"Calcula métricas financieras para tu trabajo freelance.",Pricing:"Estima precios y tarifas para proyectos freelance.",Business:"Planifica y mide las cifras clave de tu negocio.",Time:"Planifica y mide tu tiempo de trabajo.",Conversion:"Convierte valores y zonas horarias rápidamente.",Generators:"Crea un borrador listo para clientes en segundos."},
 fr:{Money:"Calculez les indicateurs financiers de votre activité freelance.",Pricing:"Estimez les prix et tarifs de vos projets.",Business:"Planifiez et mesurez les indicateurs clés de votre activité.",Time:"Planifiez et mesurez votre temps de travail.",Conversion:"Convertissez rapidement des valeurs et des fuseaux horaires.",Generators:"Créez un brouillon prêt à l’emploi en quelques secondes."},
 de:{Money:"Berechnen Sie wichtige Finanzwerte für Ihre Freelance-Arbeit.",Pricing:"Schätzen Sie Preise und Sätze für Projekte.",Business:"Planen und messen Sie wichtige Kennzahlen Ihres Geschäfts.",Time:"Planen und messen Sie Ihre Arbeitszeit.",Conversion:"Konvertieren Sie Werte und Zeitzonen schnell.",Generators:"Erstellen Sie in Sekunden einen fertigen Entwurf für Kunden."},
 pt:{Money:"Calcule métricas financeiras para o seu trabalho freelance.",Pricing:"Estime preços e taxas para projetos freelance.",Business:"Planeie e acompanhe os principais indicadores do negócio.",Time:"Planeie e acompanhe o seu tempo de trabalho.",Conversion:"Converta valores e fusos horários rapidamente.",Generators:"Crie um rascunho pronto para clientes em segundos."},
 it:{Money:"Calcola i principali dati economici del lavoro freelance.",Pricing:"Stima prezzi e tariffe per i progetti freelance.",Business:"Pianifica e misura i numeri chiave della tua attività.",Time:"Pianifica e misura il tuo tempo di lavoro.",Conversion:"Converti rapidamente valori e fusi orari.",Generators:"Crea una bozza pronta per i clienti in pochi secondi."},
 pl:{Money:"Obliczaj wskaźniki finansowe dla pracy freelancera.",Pricing:"Szacuj ceny i stawki dla projektów.",Business:"Planuj i mierz kluczowe liczby swojej działalności.",Time:"Planuj i mierz czas pracy.",Conversion:"Szybko przeliczaj wartości i strefy czasowe.",Generators:"Twórz gotowe szkice dla klientów w kilka sekund."}
};
function toolDescription(tool){return L().descriptions?.[tool.slug]||locales.en.descriptions?.[tool.slug]||categoryDesc[lang]?.[tool.category]||categoryDesc.en[tool.category]||tool.description;}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function interpolate(s,vars){return String(s).replace(/\{\{(\w+)\}\}/g,(_,k)=>vars[k]??"");}
function fieldLabel(label){return L().fields[label]||locales.en.fields[label]||label;}
function optionLabel(label){const map={Yes:"yes",No:"no",Professional:"professional",Friendly:"friendly"}; return map[label]?tr(map[label]):label;}
function plural(kind,n){const u=L().units; n=Math.abs(Number(n)||0); if((lang==='ru'||lang==='uk')&&n!==Math.trunc(n)) return u[kind+'_few']||u[kind+'_many']; if(lang==='ru') return n%10===1&&n%100!==11?u[kind+'_singular']:(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?u[kind+'_few']:u[kind+'_many']); if(lang==='pl'){if(n!==Math.trunc(n)) return u[kind+'_fraction']||u[kind+'_many']; return n===1?u[kind+'_singular']:(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14)?u[kind+'_few']:u[kind+'_many']);} return n===1?u[kind+'_singular']:u[kind+'_plural'];}
function numberFmt(n,digits=2){const x=Number(n)||0;try{return new Intl.NumberFormat(lang,{minimumFractionDigits:0,maximumFractionDigits:digits}).format(x);}catch{return x.toFixed(digits);}}
function money(n,code=currency){const c=currencies.find(x=>x.code===code)||currencies[0]||{symbol:"$",code:"USD"}; try{return new Intl.NumberFormat(lang,{style:"currency",currency:c.code,maximumFractionDigits:2}).format(Number(n)||0);}catch{return `${c.symbol}${(Number(n)||0).toFixed(2)}`;}}
function num(id){return parseFloat($("#"+id)?.value)||0;}
function dateVal(id){return $("#"+id)?.value||"";}
function addDays(s,n,biz=false){let d=new Date(s+"T00:00:00");let left=Math.max(0,Math.floor(Number(n)||0));while(left>0){d.setDate(d.getDate()+1);if(!biz||![0,6].includes(d.getDay()))left--;}return d.toISOString().slice(0,10);}
function basePath(){if(location.protocol==="file:"){const p=location.pathname.replace(/\\/g,"/");if(/\/tools\/[^/]+\/index\.html$/.test(p))return "../../";if(/\/tools\/(?:index\.html)?$/.test(p))return "../";return "./";}const parts=location.pathname.split("/").filter(Boolean);const i=parts.indexOf(cfg.repoName||"freelancekit");return i>=0?"/"+parts.slice(0,i+1).join("/")+"/":"/";}
function getTool(slug){return tools.find(x=>x.slug===slug);}
function nav(){document.body.insertAdjacentHTML("afterbegin",`<header class="site-header"><div class="container nav"><a class="brand" href="${basePath()}index.html"><span class="brand-mark">F</span> FreelanceKit</a><nav class="nav-links"><a href="${basePath()}index.html">${tr("home")}</a><a href="${basePath()}tools/index.html">${tr("tools")}</a><a href="${basePath()}about.html">${tr("about")}</a></nav><div class="controls"><select id="lang" class="select" aria-label="${esc(tr("language"))}">${Object.keys(locales).map(k=>`<option value="${k}">${langNames[k]||k}</option>`).join("")}</select><select id="cur" class="select" aria-label="${esc(tr("currency"))}">${currencies.map(x=>`<option value="${x.code}">${x.symbol} ${x.code} — ${esc(L().currencyNames[x.code]||x.name)}</option>`).join("")}</select></div></div></header>`);$("#lang").value=lang;$("#cur").value=currency;$("#lang").addEventListener("change",e=>{localStorage.setItem("fk-lang",e.target.value);location.href=withQuery(e.target.value,currency)});$("#cur").addEventListener("change",e=>{localStorage.setItem("fk-currency",e.target.value);location.reload()});}
function withQuery(nextLang,nextCurrency){const u=new URL(location.href);u.searchParams.set("lang",nextLang);if(nextCurrency)u.searchParams.set("currency",nextCurrency);return u.toString();}
function footer(){document.body.insertAdjacentHTML("beforeend",`<footer class="footer"><div class="container footer-inner"><div>© ${new Date().getFullYear()} FreelanceKit</div><div class="footer-links"><a href="${basePath()}privacy.html">${tr("privacy")}</a><a href="${basePath()}terms.html">${tr("terms")}</a><a href="${basePath()}about.html">${tr("about")}</a></div></div></footer>`);}
function input(def){const label=fieldLabel(def.label),ph=def.placeholder?fieldLabel(def.placeholder):"",type=def.type||"number";if(type==="textarea")return `<div class="field"><label for="${def.id}">${esc(label)}</label><textarea id="${def.id}" placeholder="${esc(ph)}"></textarea></div>`;if(type==="select")return `<div class="field"><label for="${def.id}">${esc(label)}</label><select id="${def.id}">${(def.options||[]).map(o=>`<option value="${esc(o.value)}">${esc(optionLabel(o.label))}</option>`).join("")}</select></div>`;return `<div class="field"><label for="${def.id}">${esc(label)}</label><input id="${def.id}" type="${type}" min="${def.min??""}" step="${def.step??"any"}" value="${def.value??""}" placeholder="${esc(ph)}"></div>`;}
function resultText(kind, value, extra){const u=L().units;switch(kind){case'numberUnit':{const n=Number(value)||0;return `${numberFmt(n)} ${plural(extra.kind,n)}`;}case'currency':return money(value);case'percent':return `${numberFmt(value)}%`;case'discount':return `${extra.price} · ${u.save} ${extra.savings}`;case'tax':return `${extra.total} · ${u.tax} ${extra.tax}`;case'deposit':return `${extra.deposit} ${u.deposit} · ${extra.remaining} ${u.remaining}`;case'fee':return `${extra.total} · ${u.tax} ${extra.fee}`;case'rateIncrease':return `${extra.old} → ${extra.new} (${numberFmt(extra.pct,1)}% ${u.increase})`;case'notReachable':return u.notReachable;case'rateUnavailable':return u.rateUnavailable;case'timeZoneUnavailable':return u.timeZoneUnavailable;case'date':return value;case'text':return String(value);default:return String(value??"");}}
async function compute(slug){const f=(id)=>num(id);switch(slug){
case"hourly-rate-calculator":{const target=f("target"),exp=f("expenses"),tax=f("tax")/100,h=f("hours");return resultText('currency',(target+exp)/(h*Math.max(1-tax,0.0001)));}
case"monthly-income-calculator":return resultText('currency',f("rate")*f("hours"));
case"annual-income-calculator":return resultText('currency',f("monthly")*12);
case"project-price-calculator":return resultText('currency',f("hours")*f("rate")*(1+f("buffer")/100));
case"day-rate-calculator":return resultText('currency',f("rate")*f("dayhours"));
case"effective-hourly-rate":return resultText('currency',f("revenue")/Math.max(f("billable")+f("unpaid"),1));
case"profit-margin-calculator":return resultText('percent',(f("revenue")?((f("revenue")-f("costs"))/f("revenue")*100):0).toFixed(2));
case"markup-calculator":return resultText('currency',f("cost")*(1+f("markup")/100));
case"discount-calculator":{const total=f("price")*(1-f("discount")/100),savings=f("price")*f("discount")/100;return resultText('discount',null,{price:money(total),savings:money(savings)});}
case"break-even-calculator":{const cm=f("price")-f("variable");return cm>0?resultText('numberUnit',(f("fixed")/cm).toFixed(2),{kind:'project'}):resultText('notReachable');}
case"revenue-target-calculator":return resultText('numberUnit',Math.ceil(f("target")/Math.max(f("avg"),1)),{kind:'project'});
case"retainer-price-calculator":return resultText('currency',f("hours")*f("rate")*(1+f("buffer")/100));
case"tax-estimate-calculator":return resultText('currency',f("gross")*f("rate")/100);
case"invoice-total-calculator":{const sub=f("subtotal")*(1-f("discount")/100),tax=sub*f("tax")/100;return resultText('tax',null,{total:money(sub+tax),tax:money(tax)});}
case"payment-fee-calculator":{const d=f("desired"),r=Math.min(Math.max(f("feeRate")/100,0),0.999999),ff=Math.max(f("fixedFee"),0);return resultText('currency',(d+ff)/(1-r));}
case"cash-flow-calculator":return resultText('currency',f("income")-f("expenses"));
case"runway-calculator":return resultText('numberUnit',(f("cash")/Math.max(f("burn"),1)).toFixed(1),{kind:'month'});
case"savings-goal-calculator":return resultText('currency',Math.max(f("goal")-f("current"),0)/Math.max(f("months"),1));
case"roi-calculator":return resultText('percent',((f("gain")-f("cost"))/Math.max(f("cost"),1)*100).toFixed(2));
case"utilization-calculator":return resultText('percent',(f("billable")/Math.max(f("available"),1)*100).toFixed(2));
case"billable-hours-calculator":return resultText('numberUnit',(f("days")*f("hoursDay")*(1-f("nonbillable")/100)).toFixed(2),{kind:'hour'});
case"overtime-rate-calculator":return resultText('currency',f("rate")*f("mult"));
case"late-fee-calculator":return resultText('currency',f("invoice")*f("rate")/100*f("months"));
case"vacation-rate-calculator":{const weeks=Math.max(1,52-f("weeks")),hrs=weeks*f("hoursWeek");return resultText('currency',f("annual")/Math.max(hrs,1));}
case"deposit-calculator":{const d=f("total")*f("deposit")/100;return resultText('deposit',null,{deposit:money(d),remaining:money(f("total")-d)});}
case"installment-calculator":return `${money(f("total")/Math.max(f("count"),1))} ${L().units.each}`;
case"cost-plus-pricing-calculator":return resultText('currency',f("cost")*(1+f("markup")/100));
case"quote-total-calculator":{const s=f("line1")+f("line2")+f("line3"),d=s*(1-f("discount")/100);return resultText('currency',d*(1+f("tax")/100));}
case"project-buffer-calculator":return resultText('numberUnit',(f("hours")*(1+f("buffer")/100)).toFixed(2),{kind:'hour'});
case"client-lifetime-value-calculator":return resultText('currency',f("avg")*f("months"));
case"currency-converter":return convertCurrency();
case"deadline-calculator":return addDays(dateVal("start"),f("days"),$("#business").value==="yes");
case"business-days-calculator":{let s=dateVal("start"),e=dateVal("end");if(!s||!e)return "";let d=new Date(s+"T00:00:00"),end=new Date(e+"T00:00:00");if(end<d)[d,end]=[end,d];let count=0;while(d<=end){if(![0,6].includes(d.getDay()))count++;d.setDate(d.getDate()+1);}return resultText('numberUnit',count,{kind:'business_day'});}
case"working-hours-calculator":return resultText('numberUnit',(f("days")*Math.max(f("hours")-f("breaks"),0)).toFixed(2),{kind:'hour'});
case"time-zone-converter":return convertTime();
case"commission-calculator":return resultText('currency',f("sales")*f("rate")/100);
case"client-capacity-calculator":return resultText('numberUnit',Math.floor(f("hours")/Math.max(f("perClient"),1)),{kind:'client'});
case"project-profit-calculator":return resultText('currency',f("revenue")-(f("hours")*f("rate"))-f("other"));
case"rate-increase-impact-calculator":return resultText('rateIncrease',null,{old:money(f("oldRate")*f("hours")),new:money(f("newRate")*f("hours")),pct:((f("newRate")/Math.max(f("oldRate"),1)-1)*100).toFixed(1)});
case"sick-day-buffer-calculator":return resultText('currency',f("income")/Math.max((f("weeks")*5-f("sick"))*f("hoursDay"),1));
case"holiday-buffer-calculator":return resultText('currency',f("income")/Math.max((f("weeks")-f("holiday"))*f("hoursWeek"),1));
case"monthly-client-target-calculator":return resultText('numberUnit',Math.ceil(f("target")/Math.max(f("avg"),1)),{kind:'client'});
case"weekly-revenue-target-calculator":return resultText('currency',f("monthly")/Math.max(f("weeks"),1));
case"retainer-capacity-calculator":return resultText('numberUnit',Math.floor(f("hours")/Math.max(f("retainer"),1)),{kind:'retainer'});
case"proposal-conversion-calculator":return `${numberFmt(f("wins")/Math.max(f("proposals"),1)*100)}% ${L().units.winRate}`;
case"average-order-value-calculator":return resultText('currency',f("revenue")/Math.max(f("count"),1));
case"lead-to-client-calculator":return resultText('numberUnit',Math.round(f("leads")*f("conversion")/100),{kind:'client'});
case"pipeline-value-calculator":return resultText('currency',f("pipeline")*f("win")/100);
case"client-acquisition-cost-calculator":return resultText('currency',f("spend")/Math.max(f("clients"),1));
case"freelance-salary-equivalent-calculator":return resultText('currency',f("salary")+f("benefits")+f("overhead"));
case"monthly-profit-goal-calculator":return resultText('currency',(f("profit")+f("expenses"))/Math.max(1-f("tax")/100,.01));
case"price-per-deliverable-calculator":return resultText('currency',f("total")/Math.max(f("deliverables"),1));
case"project-deadline-buffer-calculator":{const d=new Date(dateVal("date")+"T00:00:00");d.setDate(d.getDate()+f("buffer"));return d.toISOString().slice(0,10);}
default:return "";}}
async function convertCurrency(){const amount=num("amount"),from=$("#from").value,to=$("#to").value;if(from===to)return money(amount,to);try{const r=await fetch(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);if(!r.ok)throw new Error("rate");const d=await r.json();return `${money(amount*d.rate,to)} (1 ${from} = ${d.rate.toFixed(6)} ${to})`;}catch{return resultText('rateUnavailable');}}
function convertTime(){const time=$("#time").value||"09:00",ft=$("#fromTz").value,tt=$("#toTz").value;try{const [hh,mm]=time.split(":").map(Number);const now=new Date();const base=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),hh,mm));const parts=(tz)=>Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(base).map(p=>[p.type,p.value]));let s=parts(ft);const sourceAsUtc=Date.UTC(Number(s.year),Number(s.month)-1,Number(s.day),Number(s.hour)%24,Number(s.minute));const offset=sourceAsUtc-base.getTime();const instant=new Date(base.getTime()-offset);return new Intl.DateTimeFormat(lang,{timeZone:tt,hour:"2-digit",minute:"2-digit",weekday:"short",hour12:false}).format(instant);}catch{return resultText('timeZoneUnavailable');}}
function generator(slug){const loc=L().generators[slug];if(!loc)return "";const client=$("#client")?.value||"Alex";const project=$("#project")?.value||"website redesign";const notes=$("#notes")?.value?`\n\n${tr("extraNotes")}\n${$("#notes").value}`:"";return interpolate(loc,{client,project,notes});}
function invoiceGenerator(){
 const business=$("#invoiceBusiness")?.value?.trim()||tr("invoiceBusiness");
 const client=$("#invoiceClient")?.value?.trim()||tr("invoiceClient");
 const number=$("#invoiceNumber")?.value?.trim()||"0001";
 const issue=$("#invoiceIssueDate")?.value||"";
 const due=$("#invoiceDueDate")?.value||"";
 const rows=[1,2].map(i=>({desc:$("#itemDescription"+i)?.value?.trim(),qty:Math.max(num("quantity"+i),0),price:Math.max(num("unitPrice"+i),0)})).filter(r=>r.desc||r.qty||r.price);
 const safeRows=rows.length?rows:[{desc:tr("invoiceExampleItem1"),qty:1,price:0}];
 const subtotal=safeRows.reduce((sum,r)=>sum+r.qty*r.price,0);
 const taxRate=Math.max(num("invoiceTaxRate"),0); const tax=subtotal*taxRate/100; const total=subtotal+tax;
 const notes=$("#invoiceNotes")?.value?.trim()||"";
 const lines=[tr("invoiceTitle"),"",`${tr("invoiceFrom")}: ${business}`,`${tr("invoiceTo")}: ${client}`,`${tr("invoiceNumber")}: ${number}`];
 if(issue)lines.push(`${tr("issueDate")}: ${issue}`); if(due)lines.push(`${tr("dueDate")}: ${due}`);
 lines.push("",`${tr("description")}:`);
 safeRows.forEach((r,i)=>lines.push(`${i+1}. ${r.desc||tr("invoiceExampleItem"+(i+1))} — ${numberFmt(r.qty)} × ${money(r.price)}`));
 lines.push("",`${tr("invoiceSubtotal")}: ${money(subtotal)}`,`${tr("invoiceTax")}: ${money(tax)} (${numberFmt(taxRate,2)}%)`,`${tr("invoiceTotal")}: ${money(total)}`);
 if(notes)lines.push("",`${tr("invoiceNotesLabel")}:`,notes);
 lines.push("",tr("invoiceFooter"));
 return lines.join("\n");
}
function buildToolPage(slug){
 const tool=getTool(slug); if(!tool)return; document.title=`${toolTitle(tool)} — FreelanceKit`; nav();
 const isGen=tool.category==="Generators"; const isInvoice=slug==="invoice-generator";
 let content;
 if(isInvoice){
   const today=new Date().toISOString().slice(0,10),due=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
   content=`<div class="form-grid invoice-grid">
     <div class="field"><label for="invoiceBusiness">${esc(tr("invoiceBusiness"))}</label><input id="invoiceBusiness" type="text" value=""></div>
     <div class="field"><label for="invoiceClient">${esc(tr("invoiceClient"))}</label><input id="invoiceClient" type="text" value=""></div>
     <div class="field"><label for="invoiceNumber">${esc(tr("invoiceNumber"))}</label><input id="invoiceNumber" type="text" value="0001"></div>
     <div class="field"><label for="invoiceIssueDate">${esc(tr("issueDate"))}</label><input id="invoiceIssueDate" type="date" value="${today}"></div>
     <div class="field"><label for="invoiceDueDate">${esc(tr("dueDate"))}</label><input id="invoiceDueDate" type="date" value="${due}"></div>
     <div class="field full"><label for="itemDescription1">${esc(tr("itemDescription1"))}</label><input id="itemDescription1" type="text" value="${esc(tr("invoiceExampleItem1"))}"></div>
     <div class="field"><label for="quantity1">${esc(tr("quantity1"))}</label><input id="quantity1" type="number" min="0" step="0.01" value="1"></div>
     <div class="field"><label for="unitPrice1">${esc(tr("unitPrice1"))}</label><input id="unitPrice1" type="number" min="0" step="0.01" value="100"></div>
     <div class="field full"><label for="itemDescription2">${esc(tr("itemDescription2"))}</label><input id="itemDescription2" type="text" value="${esc(tr("invoiceExampleItem2"))}"></div>
     <div class="field"><label for="quantity2">${esc(tr("quantity2"))}</label><input id="quantity2" type="number" min="0" step="0.01" value="1"></div>
     <div class="field"><label for="unitPrice2">${esc(tr("unitPrice2"))}</label><input id="unitPrice2" type="number" min="0" step="0.01" value="50"></div>
     <div class="field"><label for="invoiceTaxRate">${esc(tr("taxRate"))}</label><input id="invoiceTaxRate" type="number" min="0" step="0.01" value="20"></div>
     <div class="field full"><label for="invoiceNotes">${esc(tr("invoiceNotes"))}</label><textarea id="invoiceNotes" placeholder="${esc(tr("invoiceDraftHint"))}"></textarea></div>
   </div><p class="muted">${esc(tr("invoiceDraftHint"))}</p>`;
 } else if(isGen){
   content=`<div class="form-grid">${input({id:"client",label:"Client name",type:"text",value:"Alex"})}${input({id:"project",label:"Project / service",type:"text",value:"website redesign"})}${input({id:"tone",label:"Tone",type:"select",options:[{value:"professional",label:"Professional"},{value:"friendly",label:"Friendly"}]})}${input({id:"notes",label:"Extra notes",type:"textarea",placeholder:"Optional details..."})}</div><p class="muted">${esc(tr("generatorHint"))}</p>`;
 } else {
   content=`<div class="form-grid">${window.FK_TOOL_FIELDS(slug).map(input).join("")}</div>`;
 }
 const actionLabel=isInvoice?tr("createInvoice"):tr("calculate");
 const actionHtml=`<div class="actions"><button class="btn primary" id="run">${actionLabel}</button><button class="btn ghost" id="reset">${tr("reset")}</button>${isInvoice?`<button class="btn ghost" id="print">${tr("print")}</button>`:""}</div>`;
 const outputHtml=isInvoice?`<div class="result"><div class="copyline"><strong>${tr("output")}</strong><button class="btn" id="copy">${tr("copy")}</button></div><pre class="text-output" id="out"></pre></div>`:(isGen?`<div class="result"><div class="copyline"><strong>${tr("output")}</strong><button class="btn" id="copy">${tr("copy")}</button></div><div class="text-output" id="out"></div></div>`:`<div class="result"><div class="small">${tr("result")}</div><div class="result-value" id="out">—</div></div>`);
 document.querySelector("#app").innerHTML=`<main><div class="container tool-hero"><div class="crumbs"><a href="${basePath()}tools/index.html">${tr("backToTools")}</a> / ${esc(tr(tool.category.toLowerCase()))}</div><h1>${esc(toolTitle(tool))}</h1><p class="muted">${esc(toolDescription(tool))}</p></div><div class="container tool-layout"><section class="panel"><h2>${tr("input")}</h2>${content}${actionHtml}${outputHtml}</section><aside class="panel"><h2>${tr("how")}</h2><p class="muted">${esc(tr("disclaimer"))}</p><div class="notice">${esc(toolDescription(tool))} ${esc(tr("howInstruction"))}</div><h3>${tr("related")}</h3><div id="related"></div></aside></div></main>`;
 const out=$("#out");
 $("#run").addEventListener("click",async()=>{if(isInvoice)out.textContent=invoiceGenerator();else out.textContent=isGen?generator(slug):await compute(slug);});
 $("#reset").addEventListener("click",()=>location.reload());
 $("#copy")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(out.textContent);$("#copy").textContent=tr("copySuccess");setTimeout(()=>$("#copy").textContent=tr("copy"),1200);}catch{}});
 $("#print")?.addEventListener("click",()=>window.print());
 if(!isGen)$("#run").click();
 const rel=tools.filter(x=>x.category===tool.category&&x.slug!==slug).slice(0,4); $("#related").innerHTML=rel.map(x=>`<p><a href="${basePath()}tools/${x.slug}/index.html">${esc(toolTitle(x))}</a></p>`).join(""); footer();
}
function card(x){return `<a class="card" href="${basePath()}tools/${x.slug}/index.html"><span class="tag">${esc(tr(x.category.toLowerCase()))}</span><h3>${esc(toolTitle(x))}</h3><p>${esc(toolDescription(x))}</p><span class="arrow">${esc(tr("open"))}</span></a>`;}
function buildHome(){
 nav();
 const featuredSlugs=["project-price-calculator","proposal-generator","invoice-generator","client-onboarding-generator","quote-total-calculator","invoice-total-calculator","project-scope-generator","late-payment-email-generator"];
 const featured=featuredSlugs.map(s=>getTool(s)).filter(Boolean);
 const goals=[
  ["goalPrice","goalPriceDesc","project-price-calculator"],
  ["goalSell","goalSellDesc","proposal-generator"],
  ["goalGetPaid","goalGetPaidDesc","invoice-generator"],
  ["goalRun","goalRunDesc","runway-calculator"]
 ];
 document.querySelector("#app").innerHTML=`<main>
 <section class="hero"><div class="container"><span class="eyebrow">${tr("homeEyebrow")}</span><h1>${tr("homeTitle")}</h1><p>${tr("homeDesc")}</p><div class="hero-actions"><a class="btn primary" href="${basePath()}tools/project-price-calculator/index.html">${tr("goalPrice")}</a><a class="btn ghost" href="${basePath()}tools/invoice-generator/index.html">${tr("createInvoice")}</a></div></div></section>
 <section class="section"><div class="container"><div class="section-head"><div><div class="tag">${tr("workflowEyebrow")}</div><h2>${tr("workflowTitle")}</h2><p class="muted">${tr("workflowDesc")}</p></div></div><div class="workflow-grid">
 <a class="workflow-step" href="${basePath()}tools/project-price-calculator/index.html"><span>1</span><div><h3>${tr("workflowQuoteTitle")}</h3><p>${tr("workflowQuoteDesc")}</p></div></a>
 <a class="workflow-step" href="${basePath()}tools/proposal-generator/index.html"><span>2</span><div><h3>${tr("workflowProposalTitle")}</h3><p>${tr("workflowProposalDesc")}</p></div></a>
 <a class="workflow-step" href="${basePath()}tools/invoice-generator/index.html"><span>3</span><div><h3>${tr("workflowInvoiceTitle")}</h3><p>${tr("workflowInvoiceDesc")}</p></div></a>
 <a class="workflow-step" href="${basePath()}tools/client-onboarding-generator/index.html"><span>4</span><div><h3>${tr("workflowClientTitle")}</h3><p>${tr("workflowClientDesc")}</p></div></a>
 </div></div></section>
 <section class="section"><div class="container"><div class="section-head"><div><div class="tag">${tr("featured")}</div><h2>${tr("startWith")}</h2></div><a class="btn" href="${basePath()}tools/index.html">${tr("tools")}</a></div><div class="grid">${featured.map(card).join("")}</div></div></section>
 <section class="section"><div class="container"><div class="section-head"><div><div class="tag">${tr("browseByGoal")}</div><h2>${tr("whyTitle")}</h2></div></div><div class="goal-grid">${goals.map(([t,d,s])=>`<a class="goal-card" href="${basePath()}tools/${s}/index.html"><h3>${tr(t)}</h3><p>${tr(d)}</p><span class="arrow">${esc(tr("open"))}</span></a>`).join("")}</div></div></section>
 <section class="section"><div class="container"><div class="grid why-grid"><div class="panel"><strong>${tr("whyNoAccount")}</strong><p class="muted">${tr("whyNoAccountDesc")}</p></div><div class="panel"><strong>${tr("whyLocal")}</strong><p class="muted">${tr("whyLocalDesc")}</p></div><div class="panel"><strong>${tr("whyStatic")}</strong><p class="muted">${tr("whyStaticDesc")}</p></div></div></div></section>
 <section class="section"><div class="container kpi"><div class="panel"><strong>${tools.length}+</strong><div class="muted">${tr("coreTools")}</div></div><div class="panel"><strong>8</strong><div class="muted">${tr("languages")}</div></div><div class="panel"><strong>${currencies.length}</strong><div class="muted">${tr("currencies")}</div></div><div class="panel"><strong>$0</strong><div class="muted">${tr("freeToUse")}</div></div></div></section>
 </main>`; footer();
}
function buildToolsIndex(){
 nav();
 const cats=[...new Set(tools.map(x=>x.category))];
 const priority=["invoice-generator","project-price-calculator","proposal-generator","invoice-total-calculator","quote-total-calculator","project-scope-generator","client-onboarding-generator","late-payment-email-generator","hourly-rate-calculator"];
 const ordered=[...priority.map(s=>getTool(s)).filter(Boolean),...tools.filter(t=>!priority.includes(t.slug))];
 document.querySelector("#app").innerHTML=`<main class="section"><div class="container"><div class="section-head"><div><div class="tag">${tr("tools")}</div><h1>${tr("allTools")}</h1><p class="muted">${tr("toolsHint")}</p></div></div><div class="search-row"><input id="search" class="search" placeholder="${tr("search")}"></div><div class="chip-row" id="chips"><button class="chip active" data-cat="all">${tr("all")}</button>${cats.map(c=>`<button class="chip" data-cat="${c}">${tr(c.toLowerCase())}</button>`).join("")}</div><div class="grid" id="grid" style="margin-top:18px">${ordered.map(card).join("")}</div></div></main>`;
 let cat="all"; const grid=$("#grid"),search=$("#search");
 function render(){const q=search.value.toLowerCase();const list=ordered.filter(x=>(cat==="all"||x.category===cat)&&(`${toolTitle(x)} ${toolDescription(x)}`).toLowerCase().includes(q));grid.innerHTML=list.map(card).join("")||`<div class="empty">${tr("noresults")}</div>`;}
 $$("#chips .chip").forEach(b=>b.addEventListener("click",()=>{$$("#chips .chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");cat=b.dataset.cat;render();}));
 search.addEventListener("input",render); footer();
}
function buildStatic(title,body){nav();document.querySelector("#app").innerHTML=`<main class="section"><div class="container"><article class="panel"><h1>${title}</h1>${body}</article></div></main>`;footer();}
function init(){document.documentElement.lang=lang;const path=location.pathname;if(path.endsWith("/tools/index.html")||/\/tools\/?$/.test(path))return buildToolsIndex();const match=path.match(/\/tools\/([^\/]+)\/(?:index\.html)?$/);if(match&&getTool(match[1]))return buildToolPage(match[1]);if(path.endsWith("index.html")||path.endsWith("/"))return buildHome();if(path.endsWith("about.html"))return buildStatic(tr("aboutTitle"),`<p>${tr("aboutBody1")}</p><p>${tr("aboutBody2")}</p><p class="notice">${tr("aboutBody3")}</p><p class="notice">${tr("localTranslations")}</p>`);if(path.endsWith("privacy.html"))return buildStatic(tr("privacyTitle"),`<p>${tr("privacyBody1")}</p><p>${tr("privacyBody2")}</p><p>${tr("privacyBody3")}</p>`);if(path.endsWith("terms.html"))return buildStatic(tr("termsTitle"),`<p>${tr("termsBody1")}</p><p>${tr("termsBody2")}</p><p>${tr("termsBody3")}</p>`);buildHome();}
window.FK_CORE={compute,toolFields:window.FK_TOOL_FIELDS,generator,invoiceGenerator,fieldLabel,toolTitle,toolDescription,numberFmt,plural};
if("serviceWorker" in navigator && location.protocol!=="file:"){navigator.serviceWorker.register(basePath()+"sw.js").catch(()=>{});}
window.addEventListener("DOMContentLoaded",init);
})();
