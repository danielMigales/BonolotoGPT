// Modelo Bonoloto: analiza una única combinación de seis números.
export const MODEL_VERSION='2.16.0';
const range=n=>Array.from({length:n},(_,i)=>i);
const normalize=v=>{const total=v.reduce((a,b)=>a+b,0);return total?v.map(x=>x/total):v.map(()=>1/v.length);};
const softmax=v=>{const max=Math.max(...v);return normalize(v.map(x=>Math.exp(x-max)));};
const round=v=>Math.round(v*10000)/10000;
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function ticket(p,random){const rest=p.slice(),out=[];for(let k=0;k<6;k++){let u=random()*rest.reduce((a,b)=>a+b,0),pick=rest.length-1;for(let i=0;i<rest.length;i++){u-=rest[i];if(u<=0){pick=i;break;}}out.push(pick+1);rest[pick]=0;}return out.sort((a,b)=>a-b);}
const best=p=>p.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,6).map(x=>x[1]+1).sort((a,b)=>a-b);
const hits=(a,b)=>a.filter(x=>b.includes(x)).length;
export function patterns(draws){const frequency=Array(49).fill(0),parity=Array(7).fill(0),pairs=new Map(),gaps=Array(48).fill(0);let gapSum=0,gapCount=0,sum=0;for(const d of draws){const ns=d.numbers.slice().sort((a,b)=>a-b);parity[ns.filter(x=>x%2===0).length]++;for(const n of ns){frequency[n-1]++;sum+=n;}for(let i=1;i<6;i++){const g=ns[i]-ns[i-1];gaps[g-1]++;gapSum+=g;gapCount++;}for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const key=ns[i]+'-'+ns[j];pairs.set(key,(pairs.get(key)||0)+1);}}return {drawCount:draws.length,frequency:frequency.map((count,i)=>({number:i+1,count})),parity:parity.map((count,even)=>({even,odd:6-even,count})),pairs:[...pairs].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,12).map(([key,count])=>({numbers:key.split('-').map(Number),count})),gaps:gaps.map((count,i)=>({gap:i+1,count})),meanGap:round(gapCount?gapSum/gapCount:0),meanSum:round(draws.length?sum/draws.length:0)};}
function structure(history){const parity=Array(7).fill(1),gap=Array(48).fill(1),pairs=new Map();for(const d of history){const ns=d.numbers.slice().sort((a,b)=>a-b);parity[ns.filter(n=>n%2===0).length]++;for(let i=1;i<6;i++)gap[ns[i]-ns[i-1]-1]++;for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const key=ns[i]+'-'+ns[j];pairs.set(key,(pairs.get(key)||0)+1);}}return {parity:normalize(parity),gap:normalize(gap),pairs};}
function propose(p,shape,random){let winner=best(p),score=-Infinity;for(const ns of [winner,...range(48).map(()=>ticket(p,random))]){let value=ns.reduce((s,n)=>s+Math.log(Math.max(p[n-1],1e-12)),0)+.15*Math.log(shape.parity[ns.filter(n=>n%2===0).length]);for(let i=1;i<6;i++)value+=.06*Math.log(shape.gap[ns[i]-ns[i-1]-1]);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)value+=.015*Math.log(1+(shape.pairs.get(ns[i]+'-'+ns[j])||0));if(value>score){score=value;winner=ns;}}return winner;}
export function markovScores(history){const baseRate=6/49,priorStrength=12,latest=new Set(history.at(-1)?.numbers||[]),presentTrials=Array(49).fill(0),presentSuccess=Array(49).fill(0),absentTrials=Array(49).fill(0),absentSuccess=Array(49).fill(0);for(let i=1;i<history.length;i++){const previous=new Set(history[i-1].numbers),current=new Set(history[i].numbers);for(let n=1;n<=49;n++){const k=n-1;if(previous.has(n)){presentTrials[k]++;if(current.has(n))presentSuccess[k]++;}else{absentTrials[k]++;if(current.has(n))absentSuccess[k]++;}}}return Array.from({length:49},(_,i)=>{const trials=latest.has(i+1)?presentTrials[i]:absentTrials[i],success=latest.has(i+1)?presentSuccess[i]:absentSuccess[i];return (success+priorStrength*baseRate)/(trials+priorStrength);});}
function repeatTransitionScores(history){const baseline=6/49,prior=12,stats=Array.from({length:49},()=>({trials:[0,0,0],successes:[0,0,0]}));for(let lag=1;lag<=3;lag++){for(let i=lag;i<history.length;i++){const before=new Set(history[i-lag].numbers),current=new Set(history[i].numbers);for(let n=1;n<=49;n++)if(before.has(n)){const s=stats[n-1];s.trials[lag-1]++;if(current.has(n))s.successes[lag-1]++;}}}return stats.map(s=>{const rates=s.trials.map((t,i)=>(s.successes[i]+prior*baseline)/(t+prior));return {...s,rates,repeatSignal:.5*rates[0]+.3*rates[1]+.2*rates[2]};});}
function distributions(history,window,count){const recent=history.slice(-window),experts=Array.from({length:7},()=>Array(49).fill(1));history.forEach((d,i)=>{for(const n of d.numbers){experts[1][n-1]++;experts[3][n-1]+=Math.pow(.5,(history.length-1-i)/12);}});for(const d of recent)for(const n of d.numbers)experts[2][n-1]++;const anchors=best(normalize(experts[2])).slice(0,3);for(const d of recent)for(const n of d.numbers)experts[4][n-1]+=1+d.numbers.filter(x=>x!==n&&anchors.includes(x)).length/3;experts[5].fill(20);for(const d of history)for(const n of d.numbers)experts[5][n-1]++;experts[6]=markovScores(history);return {numbers:experts.slice(0,count).map(normalize),recent};}
function predict(history,window,weights,step){
 const data=distributions(history,window,weights.length),random=rng(73471+step*101),shape=structure(data.recent),experts=data.numbers.map((p,i)=>i===0?ticket(p,random):i===4?propose(p,shape,random):best(p)),mixed=range(49).map(i=>data.numbers.reduce((s,p,j)=>s+weights[j]*p[i],0));
 const recent7=Array(49).fill(0),recent15=Array(49).fill(0),lastSet=new Set(history.at(-1)?.numbers||[]);
 for(const draw of history.slice(-7))for(const n of draw.numbers)recent7[n-1]++;
 for(const draw of history.slice(-15))for(const n of draw.numbers)recent15[n-1]++;
 const repeat=repeatTransitionScores(history);
 const rawScores=mixed.map((score,i)=>({number:i+1,score:round(score),recent7:recent7[i],recent15:recent15[i],lastDraw:lastSet.has(i+1),repeatTrials:repeat[i].trials,repeatSuccesses:repeat[i].successes,repeatRates:repeat[i].rates.map(round),repeatSignal:round(repeat[i].repeatSignal)}));
 const scoreMin=Math.min(...mixed),scoreMax=Math.max(...mixed),repeatMin=Math.min(...repeat.map(x=>x.repeatSignal)),repeatMax=Math.max(...repeat.map(x=>x.repeatSignal));
 const scoredNumbers=rawScores.map(x=>{const scaled=scoreMax>scoreMin?(x.score-scoreMin)/(scoreMax-scoreMin):.5,repeatScaled=repeatMax>repeatMin?(x.repeatSignal-repeatMin)/(repeatMax-repeatMin):.5;return {...x,selectionScore:round(scaled*.40+repeatScaled*.20+(x.recent7/7)*.10+(x.recent15/15)*.02)};});
 // La misma puntuación que ordena el ranking alimenta la selección combinatoria.
 // La estructura solo desempata/complementa candidatos; ya no se selecciona desde `mixed` ignorando las repeticiones.
 const numberScores=scoredNumbers.slice().sort((a,b)=>b.selectionScore-a.selectionScore||b.score-a.score||a.number-b.number);
 const selectionDistribution=normalize(scoredNumbers.map(x=>Math.max(x.selectionScore,1e-9)));
 const numbers=propose(selectionDistribution,shape,random);
 return {numbers,experts,distributions:data.numbers,numberScores,rankedNumbers:numberScores.length,minimumRecentFrequency:null};
}
function choose(n,k){if(k<0||k>n)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;}
export function randomBaseline(){const den=choose(49,6),hitProbabilities=range(7).map(k=>choose(6,k)*choose(43,6-k)/den);return {expectedHits:36/49,atLeastThreeProbability:hitProbabilities.slice(3).reduce((a,b)=>a+b,0),atLeastFourProbability:hitProbabilities.slice(4).reduce((a,b)=>a+b,0),hitProbabilities};}
export function explainSelection(history,prediction,window,numbers=prediction.numbers){
 const frequency=Array(49).fill(0),recent=Array(49).fill(0),recent15=Array(49).fill(0),lastSet=new Set(history.at(-1)?.numbers||[]),pairCounts=new Map();
 for(const draw of history)for(const n of draw.numbers)frequency[n-1]++;
 const recentDraws=history.slice(-window);for(const draw of history.slice(-15))for(const n of draw.numbers)recent15[n-1]++;
 for(const draw of recentDraws){
  for(const n of draw.numbers)recent[n-1]++;
  for(let i=0;i<draw.numbers.length;i++)for(let j=i+1;j<draw.numbers.length;j++){
   const a=Math.min(draw.numbers[i],draw.numbers[j]),b=Math.max(draw.numbers[i],draw.numbers[j]),key=a+'-'+b;
   pairCounts.set(key,(pairCounts.get(key)||0)+1);
  }
 }
 const ranks=new Map(prediction.numberScores.map((x,i)=>[x.number,{rank:i+1,score:x.score,repeatTrials:x.repeatTrials,repeatSuccesses:x.repeatSuccesses,repeatRates:x.repeatRates,repeatSignal:x.repeatSignal}]));
 return numbers.map(number=>{
  const selectedPairs=numbers.filter(other=>other!==number).map(other=>{
   const a=Math.min(number,other),b=Math.max(number,other);
   return {numbers:[a,b],count:pairCounts.get(a+'-'+b)||0};
  }).filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,2);
  const rank=ranks.get(number)||{rank:49,score:0};
  return {number,rank:rank.rank,score:rank.score,selectionScore:rank.selectionScore,totalFrequency:frequency[number-1],recentFrequency:recent[number-1],recent7:recent[number-1],recent15:recent15[number-1],lastDraw:lastSet.has(number),repeatTrials:rank.repeatTrials||[0,0,0],repeatSuccesses:rank.repeatSuccesses||[0,0,0],repeatRates:rank.repeatRates||[],repeatSignal:rank.repeatSignal||0,recentWindow:window,selectedPairs};
 });
}
export function updateExpertWeights(logWeights,distributions,actual,learningRate=.04){if(!Array.isArray(logWeights)||!Array.isArray(distributions)||logWeights.length!==distributions.length||!Array.isArray(actual)||actual.length!==6||!Number.isFinite(learningRate)||learningRate<=0)throw Error('Datos inválidos para actualizar los pesos del modelo');const uniformLogProbability=6*Math.log(1/49);for(let j=1;j<distributions.length;j++){const p=distributions[j];if(!Array.isArray(p)||p.length!==49||p.some(x=>!Number.isFinite(x)||x<=0))throw Error('Distribución de experto inválida');const logSkill=actual.reduce((sum,n)=>sum+Math.log(p[n-1]),0)-uniformLogProbability;logWeights[j]=Math.max(-8,Math.min(8,.98*logWeights[j]+learningRate*logSkill));}logWeights[0]=0;return logWeights;}
export function analyze(draws,{window=7}={}){
 if(![5,7,10,15,20,30,50].includes(window))throw Error('Ventana no válida: usa 5, 7, 10, 15, 20, 30 o 50');
 const ordered=draws.map(d=>({date:d.date,numbers:d.numbers.slice().sort((a,b)=>a-b)})).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(ordered.map(d=>d.date)).size!==ordered.length)throw Error('Fechas duplicadas');
 for(const d of ordered)if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||d.numbers.length!==6||new Set(d.numbers).size!==6||d.numbers.some(n=>!Number.isInteger(n)||n<1||n>49))throw Error('Sorteo inválido');
 if(ordered.length<=window)return {version:MODEL_VERSION,status:'insufficient',window,required:window+1,available:ordered.length};
 const names=['Azar uniforme','Frecuencia acumulada','Frecuencia reciente','Recencia ponderada','Parejas y estructura','Bayes regularizado','Markov regularizado'],logs=Array(names.length).fill(0),rows=[],histogram=Array(7).fill(0);
 const baseline=randomBaseline();let totalHits=0,totalRandom=0,randomHistogram=Array(7).fill(0);
 for(let i=window;i<ordered.length;i++){
  const past=ordered.slice(0,i),weights=softmax(logs),prediction=predict(past,window,weights,i),actual=ordered[i],count=hits(prediction.numbers,actual.numbers),random=ticket(Array(49).fill(1/49),rng(92003+i*313)),randomHits=hits(random,actual.numbers),expertHits=prediction.experts.map(p=>hits(p,actual.numbers));
  rows.push({date:actual.date,trainingCount:i,trainingStart:past[0].date,trainingEnd:past.at(-1).date,windowStart:past.slice(-window)[0].date,predicted:prediction.numbers,actual:actual.numbers,hits:count,randomNumbers:random,randomHits,expertHits,weightsBefore:weights.map(round),selectionReasons:explainSelection(past,prediction,window)});
  histogram[count]++;totalHits+=count;totalRandom+=randomHits;randomHistogram[randomHits]++;
  updateExpertWeights(logs,prediction.distributions,actual.numbers);
 }
 const weights=softmax(logs),next=predict(ordered,window,weights,ordered.length),n=rows.length,last=rows.at(-1);
 return {version:MODEL_VERSION,status:'ready',window,sourceLastDate:ordered.at(-1).date,drawCount:ordered.length,objective:{primary:'rankedSelectionScoreWithStructure',predictionStrategy:'frequency-transition-repeat-recency-and-structure',repeatLags:[1,2,3]},method:'Selección combinatoria a partir de la misma puntuación que ordena el ranking: 40% señal mixta, 20% transición de repetición a 1-3 sorteos, 10% frecuencia de los últimos 7 sorteos y 2% frecuencia de los últimos 15; la estructura de la combinación actúa después sobre esa distribución. Los pesos de expertos se actualizan secuencialmente y se comparan con el control teórico uniforme (36/49 aciertos esperados). No implica ventaja predictiva.',forecast:{targetDate:nextDrawDate(ordered.at(-1).date),afterDate:ordered.at(-1).date,numbers:next.numbers,numberScores:next.numberScores,rankedNumbers:next.rankedNumbers,minimumRecentFrequency:next.minimumRecentFrequency,selectionReasons:explainSelection(ordered,next,window),rankingReasons:explainSelection(ordered,next,window,next.numberScores.map(x=>x.number)).map((x,i)=>({...x,candidateRank:i+1}))},lastEvaluation:{targetDate:last.date,trainedThrough:last.trainingEnd,numbers:last.predicted,actual:last.actual,hits:last.hits,selectionReasons:last.selectionReasons},metrics:{simulations:n,meanHits:round(totalHits/n),atLeastThree:histogram.slice(3).reduce((a,b)=>a+b,0),atLeastFour:histogram.slice(4).reduce((a,b)=>a+b,0),maxHits:Math.max(...rows.map(r=>r.hits)),histogram,randomMeanHits:round(totalRandom/n),randomAtLeastThree:randomHistogram.slice(3).reduce((a,b)=>a+b,0),randomAtLeastFour:randomHistogram.slice(4).reduce((a,b)=>a+b,0),randomHistogram},baseline,experts:names.map((name,i)=>{const expertTotal=rows.reduce((s,r)=>s+r.expertHits[i],0),randomTotal=rows.reduce((s,r)=>s+r.randomHits,0),wins=rows.filter(r=>r.expertHits[i]>r.randomHits).length,ties=rows.filter(r=>r.expertHits[i]===r.randomHits).length,losses=rows.length-wins-ties;return {name,initialWeight:1/names.length,meanHits:round(expertTotal/n),atLeastThree:rows.filter(r=>r.expertHits[i]>=3).length,randomMeanHits:round(randomTotal/n),deltaVsRandom:round((expertTotal-randomTotal)/n),beatRandomRate:round(wins/n),wins,ties,losses,numberWeight:round(weights[i])}}),patterns:patterns(ordered),rows,modelState:{version:MODEL_VERSION,window,trainedThrough:ordered.at(-1).date,numberLogWeights:logs,numberWeights:weights}};
}
export function nextDrawDate(afterDate){const day=new Date(afterDate+'T12:00:00Z');if(!Number.isFinite(day.getTime()))throw Error('Fecha inválida');day.setUTCDate(day.getUTCDate()+1);return day.toISOString().slice(0,10);}