import fs from 'node:fs';

// Keep site-level i18n out of the editorial article itself. The article-language runtime owns that subtree.
{
  const path='assets/js/i18n.js';
  let s=fs.readFileSync(path,'utf8');
  const old=`  const translateNode=(node,dict)=>{\n    if(node.nodeType===Node.TEXT_NODE){\n      const raw=node.nodeValue||'';`;
  const next=`  const translateNode=(node,dict)=>{\n    const owner=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;\n    if(owner?.closest?.('.page-resource-article main article'))return;\n    if(node.nodeType===Node.TEXT_NODE){\n      const raw=node.nodeValue||'';`;
  if(!s.includes(old))throw new Error('i18n translateNode target missing');
  s=s.replace(old,next);
  fs.writeFileSync(path,s);
}

// Tighten real-preview assertions: only menu buttons count as language choices; Arabic hub translation can use the resource eyebrow wording.
{
  const path='scripts/resources_preview_localization_qa.mjs';
  let s=fs.readFileSync(path,'utf8');
  s=s.replace("      if(path==='/resources/'){\n        const eyebrow=(await page.locator('.res-eyebrow').first().textContent()||'').trim();\n        if(!eyebrow.includes(expected.nav)&&!eyebrow.includes(expected.hub))failures.push(`${locale}: Resources hub did not translate; eyebrow '${eyebrow}'`);\n        const body=(await page.locator('body').innerText()).slice(0,4000);", "      if(path==='/resources/'){\n        const body=(await page.locator('body').innerText()).slice(0,4000);");
  s=s.replace("      choices:document.querySelectorAll('[data-article-locale]').length,", "      choices:document.querySelectorAll('.res-article-language-menu [data-article-locale]').length,");
  fs.writeFileSync(path,s);
}

console.log('Article/site translation boundary corrected.');