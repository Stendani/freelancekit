
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const base = (process.env.SITE_URL || 'https://freelancekit-tools.pages.dev').replace(/\/$/, '');
const urls = new Set([
  `${base}/`,
  `${base}/tools/`,
  `${base}/about.html`,
  `${base}/privacy.html`,
  `${base}/terms.html`
]);
const toolsDir=path.join(root,'tools');
for(const slug of fs.readdirSync(toolsDir,{withFileTypes:true})){
  if(slug.isDirectory() && fs.existsSync(path.join(toolsDir,slug.name,'index.html'))) urls.add(`${base}/tools/${slug.name}/`);
}
const xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',...Array.from(urls).sort().map(u=>`  <url><loc>${u}</loc></url>`),'</urlset>'].join('\n');
fs.writeFileSync(path.join(root,'sitemap.xml'),xml+'\n');
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
console.log(`Generated sitemap with ${urls.size} URLs for ${base}`);
