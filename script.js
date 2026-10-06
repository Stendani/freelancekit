function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)}
function num(id){return parseFloat(document.getElementById(id).value)||0}
function hourlyRate(){const income=num('hr-income'),hours=num('hr-hours');const value=hours>0?income/hours:0;document.getElementById('hr-result').textContent=money(value)+' / hour'}
function monthlyIncome(){const value=num('mi-rate')*num('mi-hours');document.getElementById('mi-result').textContent=money(value)+' / month'}
function projectPrice(){const base=num('pp-hours')*num('pp-rate');const value=base*(1+num('pp-buffer')/100);document.getElementById('pp-result').textContent=money(value)}
function invoiceTotal(){const subtotal=num('in-work')+num('in-exp');const value=subtotal*(1-num('in-disc')/100);document.getElementById('in-result').textContent=money(value)}
function deadline(){const start=new Date(document.getElementById('dl-start').value+'T12:00:00');let days=Math.max(0,Math.floor(num('dl-days')));if(isNaN(start.getTime())){document.getElementById('dl-result').textContent='Choose a start date';return}let d=start;while(days>0){d=new Date(d);d.setDate(d.getDate()+1);const day=d.getDay();if(day!==0&&day!==6)days--}document.getElementById('dl-result').textContent=d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
(function(){const el=document.getElementById('dl-start');el.value=new Date().toISOString().slice(0,10);hourlyRate();monthlyIncome();projectPrice();invoiceTotal();deadline()})();
