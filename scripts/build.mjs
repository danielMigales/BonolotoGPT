import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';

const seed=JSON.parse(await readFile('data/draws.json','utf8'));
const logic=await readFile('web/logic.js','utf8');
const html=(await readFile('web/index.html','utf8')).replace('/*LOGIC*/',logic.replaceAll('export ',''));
await mkdir('public',{recursive:true});
await writeFile('public/index.html',html);
await rm('public/icon.svg',{force:true});
await mkdir('public/data',{recursive:true});
await cp('data/draws.json','public/data/draws.json');
await cp('data/jackpot.json','public/data/jackpot.json');

// No se publican predicciones ni informes experimentales sin ventaja demostrada.
for(const file of ['public/data/ai-analysis-5.json','public/data/ai-analysis-7.json','public/data/ai-analysis-10.json','public/data/ai-analysis-15.json','public/data/ai-analysis-20.json','public/data/ai-analysis-30.json','public/data/ai-analysis-50.json','data/ai-analysis.json','data/ai-model.json']){
  await rm(file,{force:true});
}
console.log('Generada página estática: '+seed.draws.length+' sorteos oficiales; sin laboratorio ni predicciones.');
