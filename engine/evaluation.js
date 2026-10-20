// Auditoría retrospectiva reproducible frente a controles aleatorios en las mismas fechas.
// No forma parte del algoritmo que genera las predicciones.
const range=n=>Array.from({length:n},(_,i)=>i);
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function randomTicket(random){
 const pool=range(49).map(i=>i+1);
 for(let i=0;i<6;i++){const j=i+Math.floor(random()*(49-i));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,6).sort((a,b)=>a-b);
}
const hits=(a,b)=>a.filter(n=>b.includes(n)).length;
const mean=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
const round=x=>Math.round(x*10000)/10000;
function percentile(sorted,p){return sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(p*sorted.length)-1))];}
export function auditBacktest(rows,{randomTrialsPerDraw=200,nullReplicates=5000,bootstrapReplicates=3000,blockLength=7,seed=20261020}={}){
 if(!Array.isArray(rows)||!rows.length)throw Error('La auditoría requiere predicciones históricas.');
 if(!Number.isInteger(randomTrialsPerDraw)||randomTrialsPerDraw<1||!Number.isInteger(nullReplicates)||nullReplicates<1||!Number.isInteger(bootstrapReplicates)||bootstrapReplicates<1)throw Error('Parámetros de auditoría no válidos.');
 for(const row of rows)if(!Array.isArray(row.predicted)||row.predicted.length!==6||!Array.isArray(row.actual)||row.actual.length!==6||row.predicted.some(n=>!Number.isInteger(n)||n<1||n>49)||row.actual.some(n=>!Number.isInteger(n)||n<1||n>49))throw Error('Predicción histórica inválida para la auditoría.');
 const modelHits=rows.map(r=>hits(r.predicted,r.actual));
 const baselineRng=rng(seed),randomMeanByDraw=rows.map(row=>{let total=0;for(let j=0;j<randomTrialsPerDraw;j++)total+=hits(randomTicket(baselineRng),row.actual);return total/randomTrialsPerDraw;});
 const modelMean=mean(modelHits),randomMean=mean(randomMeanByDraw),differences=modelHits.map((v,i)=>v-randomMeanByDraw[i]),delta=mean(differences);
 const nullRng=rng(seed^0x5bd1e995);let atLeastAsHigh=0;
 for(let b=0;b<nullReplicates;b++){let total=0;for(const row of rows)total+=hits(randomTicket(nullRng),row.actual);if(total/rows.length>=modelMean)atLeastAsHigh++;}
 const pValue=(atLeastAsHigh+1)/(nullReplicates+1);
 const bootRng=rng(seed^0x27d4eb2d),block=Math.max(1,Math.min(Math.floor(blockLength)||1,rows.length)),bootMeans=[];
 for(let b=0;b<bootstrapReplicates;b++){const sample=[];while(sample.length<rows.length){const start=Math.floor(bootRng()*(rows.length-block+1));for(let j=0;j<block&&sample.length<rows.length;j++)sample.push(differences[start+j]);}bootMeans.push(mean(sample));}
 bootMeans.sort((a,b)=>a-b);
 const ci=[percentile(bootMeans,.025),percentile(bootMeans,.975)];
 const supportsHistoricalSignal=pValue<.05&&ci[0]>0;
 return {method:'Auditoría retrospectiva por fecha: múltiples controles aleatorios independientes por sorteo, prueba unilateral de aleatorización y bootstrap por bloques temporales.',simulations:rows.length,randomTrialsPerDraw,nullReplicates,bootstrapReplicates,blockLength:block,modelMeanHits:round(modelMean),randomMeanHits:round(randomMean),expectedUniformMeanHits:round(36/49),deltaVsRandom:round(delta),ci95Delta:ci.map(round),pValueOneSided:round(pValue),supportsHistoricalSignal,conclusion:supportsHistoricalSignal?'Se observa una señal histórica favorable; requiere confirmación en sorteos futuros no usados para desarrollar el modelo.':'No hay evidencia estadística clara de ventaja frente al azar en esta evaluación histórica.',caution:'Análisis retrospectivo exploratorio. El histórico ya ha sido usado durante el desarrollo; no equivale a una prueba independiente ni garantiza resultados futuros.'};
}
