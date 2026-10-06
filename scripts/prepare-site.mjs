
import fs from 'fs';
import path from 'path';

const root=process.cwd();
const owner=process.env.GITHUB_REPOSITORY_OWNER || 'YOUR-USERNAME';
const repo=process.env.GITHUB_REPOSITORY_NAME || 'freelancekit';

function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ent.name==='.git'||ent.name==='node_modules')continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
for(const file of walk(root)){
  if(!/\.(html|xml|txt|js|json|webmanifest|md)$/.test(file))continue;
  let s=fs.readFileSync(file,'utf8');
  const before=s;
  s=s.replaceAll('YOUR-USERNAME',owner);
  s=s.replaceAll(siteUrl,siteUrl);
  if(s!==before)fs.writeFileSync(file,s);
}
console.log(`Prepared site for ${owner}/${repo}`);
