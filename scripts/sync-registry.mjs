
import fs from 'fs';
import path from 'path';
const root=process.cwd();
const dataFile=path.join(root,'data','tools.js');
const existingText=fs.readFileSync(dataFile,'utf8');
const marker='window.FK_TOOLS = ';
const markerPos=existingText.indexOf(marker);
const jsonStart=markerPos+marker.length;
const semi=existingText.lastIndexOf(';\n');
const arr=JSON.parse(existingText.slice(jsonStart,semi));
const present=new Set(arr.map(x=>x.slug));
const queue=JSON.parse(fs.readFileSync(path.join(root,'content','future-tools.json'),'utf8'));
const startDate=new Date(process.env.AUTOPILOT_START||'2026-11-01T05:00:00Z');
const now=new Date();
let monthsToPublish=(now.getUTCFullYear()-startDate.getUTCFullYear())*12+(now.getUTCMonth()-startDate.getUTCMonth())+1;
if(now<startDate) monthsToPublish=0;
monthsToPublish=Math.max(0,monthsToPublish);
for(let i=0;i<Math.min(monthsToPublish,queue.length);i++){
 const t=queue[i]; if(!present.has(t.slug)){arr.push(t);present.add(t.slug);}
}
fs.writeFileSync(dataFile,marker+JSON.stringify(arr,null,2)+';\n');
console.log(`Registry contains ${arr.length} tools.`);
