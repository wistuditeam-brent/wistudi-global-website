import fs from 'node:fs';
const path='functions/_middleware.js';
let s=fs.readFileSync(path,'utf8');
const wrong='  "${articlePath}": {';
const right='  "/resources/community-notes/wistudi-at-vietnam-edtech-expo-2026/": {';
if(!s.includes(wrong))throw new Error('Literal article metadata placeholder not found');
s=s.replace(wrong,right);
fs.writeFileSync(path,s);
console.log('Corrected Resources article metadata key');