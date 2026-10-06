
import fs from 'fs';
import path from 'path';

const root=process.cwd();
const repo=process.env.GITHUB_REPOSITORY_NAME || 'freelancekit';
const base=(process.env.SITE_URL || 'https://freelancekit-tools.pages.dev').replace(/\/$/, '');
const start=new Date(process.env.AUTOPILOT_START||'2026-11-01T05:00:00Z');
const now=new Date();
let months=(now.getUTCFullYear()-start.getUTCFullYear())*12+(now.getUTCMonth()-start.getUTCMonth());
if(now<start) months=-1;
const queue=JSON.parse(fs.readFileSync(path.join(root,'content','future-tools.json'),'utf8'));
const targetCount=Math.min(Math.max(months+1,0),queue.length);
if(targetCount<=0){console.log('Autopilot: not started yet.');process.exit(0);}
let published=0;
for(let i=0;i<targetCount;i++){
  const tool=queue[i];
  const dir=path.join(root,'tools',tool.slug);
  if(fs.existsSync(path.join(dir,'index.html'))) continue;
  fs.mkdirSync(dir,{recursive:true});
  const desc=tool.description.replaceAll('"','&quot;');
  const title=tool.title.replaceAll('&','&amp;');
  const slug=tool.slug;
  const doc=`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — FreelanceKit</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${base}/tools/${slug}/">
<link rel="stylesheet" href="../../style.css">
<script src="../../site-config.js"></script><script src="../../data/locales/en.js"></script><script src="../../data/locales/ru.js"></script><script src="../../data/locales/es.js"></script><script src="../../data/locales/fr.js"></script><script src="../../data/locales/de.js"></script><script src="../../data/locales/pt.js"></script><script src="../../data/locales/it.js"></script><script src="../../data/locales/pl.js"></script><script src="../../data/currencies.js"></script><script src="../../data/tools.js"></script><script src="../../data/tool-fields.js"></script>
<script>window.FK_AUTOPUBLISHED_TOOL=${JSON.stringify(tool)};</script>
</head><body><div id="app"></div><script src="../../app.js"></script></body></html>`;
  fs.writeFileSync(path.join(dir,'index.html'),doc);
  published++;
  console.log(`Published ${tool.slug}`);
}
process.exitCode=0;
console.log(`Autopilot: ${published} new tool(s).`);
