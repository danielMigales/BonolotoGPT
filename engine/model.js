// Modelo Bonoloto: analiza dos apuestas independientes de seis números.
// Ambas combinaciones reciben explicación y evaluación retrospectiva propia.
export const MODEL_VERSION='2.15.0';
const range=n=>Array.from({length:n},(_,i)=>i);
const normalize=v=>{const total=v.reduce((a,b)=>a+b,0);return total?v.map(x=>x/total):v.map(()=>1/v.length);};
const softmax=v=>{const max=Math.max(...v);return normalize(v.map(x=>Math.exp(x-max)));};
const round=v=>Math.round(v*10000)/10000;
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function ticket(p,random){const rest=p.slice(),out=[];for(let k=0;k<6;k++){let u=random()*rest.reduce((a,b)=>a+b,0),pick=rest.length-1;for(let i=0;i<rest.length;i++){u-=rest[i];if(u<=0){pick=i;break;}}out.push(pick+1);rest[pick]=0;}return out.sort((a,b)=>a-b);}
const best=p=>p.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]||a[1]-b[1]).slice(0,6).map(x=>x[1]+1).sort((a,b)=>a-b);
const hits=(a,b)=>a.filter(x=>b.includes(x)).length;
export function diversifyCombination(primary,numberScores){
 if(!Array.isArray(primary)||primary.length!==6||new Set(primary).size!==6||!Array.isArray(numberScores))throw Error('Parámetros inválidos para diversificar la combinación');
 const ranked=numberScores.slice().sort((a,b)=>(b.selectionScore??b.score)-(a.selectionScore??a.score)||a.number-b.number);
 if(ranked.length<6)return [];
 let selected=ranked.slice(0,6);
 const prior=primary.slice().sort((a,b)=>a-b);
 const selectedSet=selected.map(x=>x.number).sort((a,b)=>a-b);
 if(selectedSet.every((n,i)=>n===prior[i])){
  if(!ranked[6])return [];
  selected=[...selected.slice(0,5),ranked[6]];
 }
 return selected.map(x=>x.number).sort((a,b)=>a-b);
}
// Evita publicar dos veces seguidas la misma combinación exacta. Es una regla de
// diversificación editorial, no una ventaja estadística ni una mayor probabilidad.
// La segunda apuesta solo puede usar números que hayan aparecido como máximo
// tres veces en los últimos siete sorteos. Si no hay seis candidatos, no se inventa.
function secondCombination(primary,numberScores){
 const eligible=numberScores.filter(x=>x.recent7<=3);
 return diversifyCombination(primary,eligible);
}
export function avoidExactRepeat(numbers,previous,numberScores){
 const current=[...numbers].sort((a,b)=>a-b),prior=[...previous].sort((a,b)=>a-b);
 if(current.length!==6||prior.length!==6||current.some((n,i)=>n!==prior[i]))return current;
 const selected=new Set(current),score=new Map(numberScores.map(x=>[x.number,x.score]));
 const replacement=numberScores.find(x=>!selected.has(x.number));
 if(!replacement)return current;
 const removable=current.slice().sort((a,b)=>(score.get(a)??0)-(score.get(b)??0)||b-a)[0];
 return current.filter(n=>n!==removable).concat(replacement.number).sort((a,b)=>a-b);
}
export function patterns(draws){const frequency=Array(49).fill(0),parity=Array(7).fill(0),pairs=new Map(),gaps=Array(48).fill(0);let gapSum=0,gapCount=0,sum=0;for(const d of draws){const ns=d.numbers.slice().sort((a,b)=>a-b);parity[ns.filter(x=>x%2===0).length]++;for(const n of ns){frequency[n-1]++;sum+=n;}for(let i=1;i<6;i++){const g=ns[i]-ns[i-1];gaps[g-1]++;gapSum+=g;gapCount++;}for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const key=ns[i]+'-'+ns[j];pairs.set(key,(pairs.get(key)||0)+1);}}return {drawCount:draws.length,frequency:frequency.map((count,i)=>({number:i+1,count})),parity:parity.map((count,even)=>({even,odd:6-even,count})),pairs:[...pairs].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,12).map(([key,count])=>({numbers:key.split('-').map(Number),count})),gaps:gaps.map((count,i)=>({gap:i+1,count})),meanGap:round(gapCount?gapSum/gapCount:0),meanSum:round(draws.length?sum/draws.length:0)};}
function structure(history){const parity=Array(7).fill(1),gap=Array(48).fill(1),pairs=new Map();for(const d of history){const ns=d.numbers.slice().sort((a,b)=>a-b);parity[ns.filter(n=>n%2===0).length]++;for(let i=1;i<6;i++)gap[ns[i]-ns[i-1]-1]++;for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){const key=ns[i]+'-'+ns[j];pairs.set(key,(pairs.get(key)||0)+1);}}return {parity:normalize(parity),gap:normalize(gap),pairs};}
function propose(p,shape,random){let winner=best(p),score=-Infinity;for(const ns of [winner,...range(48).map(()=>ticket(p,random))]){let value=ns.reduce((s,n)=>s+Math.log(Math.max(p[n-1],1e-12)),0)+.15*Math.log(shape.parity[ns.filter(n=>n%2===0).length]);for(let i=1;i<6;i++)value+=.06*Math.log(shape.gap[ns[i]-ns[i-1]-1]);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)value+=.015*Math.log(1+(shape.pairs.get(ns[i]+'-'+ns[j])||0));if(value>score){score=value;winner=ns;}}return winner;}
export function markovScores(history){const baseRate=6/49,priorStrength=12,latest=new Set(history.at(-1)?.numbers||[]),presentTrials=Array(49).fill(0),presentSuccess=Array(49).fill(0),absentTrials=Array(49).fill(0),absentSuccess=Array(49).fill(0);for(let i=1;i<history.length;i++){const previous=new Set(history[i-1].numbers),current=new Set(history[i].numbers);for(let n=1;n<=49;n++){const k=n-1;if(previous.has(n)){presentTrials[k]++;if(current.has(n))presentSuccess[k]++;}else{absentTrials[k]++;if(current.has(n))absentSuccess[k]++;}}}return Array.from({length:49},(_,i)=>{const trials=latest.has(i+1)?presentTrials[i]:absentTrials[i],success=latest.has(i+1)?presentSuccess[i]:absentSuccess[i];return (success+priorStrength*baseRate)/(trials+priorStrength);});}
function repeatTransitionScores(history){const baseline=6/49,prior=12,stats=Array.from({length:49},()=>({trials:[0,0,0],successes:[0,0,0]}));for(let lag=1;lag<=3;lag++){for(let i=lag;i<history.length;i++){const before=new Set(history[i-lag].numbers),current=new Set(history[i].numbers);for(let n=1;n<=49;n++)if(before.has(n)){const s=stats[n-1];s.trials[lag-1]++;if(current.has(n))s.successes[lag-1]++;}}}return stats.map(s=>{const rates=s.trials.map((t,i)=>(s.successes[i]+prior*baseline)/(t+prior));return {...s,rates,repeatSignal:.5*rates[0]+.3*rates[1]+.2*rates[2]};});}
function distributions(history,window,count){const recent=history.slice(-window),experts=Array.from({length:7},()=>Array(49).fill(1));history.forEach((d,i)=>{for(const n of d.numbers){experts[1][n-1]++;experts[3][n-1]+=Math.pow(.5,(history.length-1-i)/12);}});for(const d of recent)for(const n of d.numbers)experts[2][n-1]++;const anchors=best(normalize(experts[2])).slice(0,3);for(const d of recent)for(const n of d.numbers)experts[4][n-1]+=1+d.numbers.filter(x=>x!==n&&anchors.includes(x)).length/3;experts[5].fill(20);for(const d of history)for(const n of d.numbers)experts[5][n-1]++;experts[6]=markovScores(history);return {numbers:experts.slice(0,count).map(normalize),recent};}
function predict(history,window){
 // Regla única: frecuencia histórica de los seis números principales.
 // Desempate determinista: número menor primero. Sin Markov, pesos ni estructura.
 const frequency=Array(49).fill(0),recent7=Array(49).fill(0),recent15=Array(49).fill(0);
 for(const draw of history)for(const n of draw.numbers)frequency[n-1]++;
 for(const draw of history.slice(-7))for(const n of draw.numbers)recent7[n-1]++;
 for(const draw of history.slice(-15))for(const n of draw.numbers)recent15[n-1]++;
 const lastSet=new Set(history.at(-1)?.numbers||[]);
 const numberScores=frequency.map((count,i)=>({number:i+1,score:count,selectionScore:count,totalFrequency:count,recent7:recent7[i],recent15:recent15[i],lastDraw:lastSet.has(i+1)}))
  .sort((a,b)=>b.score-a.score||a.number-b.number);
 const numbers=numberScores.slice(0,6).map(x=>x.number).sort((a,b)=>a-b);
 const eligible=numberScores.filter(x=>x.recent7<=3);
 let secondCandidates=eligible.slice(0,6);
 const sameTicket=secondCandidates.length===6&&secondCandidates.map(x=>x.number).sort((a,b)=>a-b).every((n,i)=>n===numbers[i]);
 if(sameTicket&&eligible.length>=7)secondCandidates=[...eligible.slice(0,5),eligible[6]];
 let secondNumbers=secondCandidates.length===6?secondCandidates.map(x=>x.number).sort((a,b)=>a-b):[];
 // Si la primera y la segunda no pueden ser distintas cumpliendo el filtro,
 // no se fabrica una combinación: se informa como no disponible.
 if(secondNumbers.length!==6)secondNumbers=[];
 const distribution=normalize(frequency.map(x=>x+1));
 return {numbers,secondNumbers,experts:[distribution],distributions:[distribution],numberScores,rankedNumbers:49,secondEligibleNumbers:eligible.length,minimumRecentFrequency:null,secondMaximumWeeklyFrequency:3,warning:secondNumbers.length===6?null:'No hay seis números elegibles distintos de la primera apuesta con un máximo de 3 apariciones en los últimos 7 sorteos.'};
}
function choose(n,k){if(k<0||k>n)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;}
export function randomBaseline(){const den=choose(49,6),hitProbabilities=range(7).map(k=>choose(6,k)*choose(43,6-k)/den);return {expectedHits:36/49,atLeastThreeProbability:hitProbabilities.slice(3).reduce((a,b)=>a+b,0),atLeastFourProbability:hitProbabilities.slice(4).reduce((a,b)=>a+b,0),hitProbabilities};}
export function explainSelection(history,prediction,window,numbers=prediction.numbers){
 const frequency=Array(49).fill(0),recent=Array(49).fill(0),recent15=Array(49).fill(0),lastSet=new Set(history.at(-1)?.numbers||[]);
 for(const draw of history)for(const n of draw.numbers)frequency[n-1]++;
 for(const draw of history.slice(-15))for(const n of draw.numbers)recent15[n-1]++;
 for(const draw of history.slice(-window))for(const n of draw.numbers)recent[n-1]++;
 const ranks=new Map(prediction.numberScores.map((x,i)=>[x.number,{rank:i+1,score:x.score}]));
 return numbers.map(number=>{
  const rank=ranks.get(number)||{rank:49,score:frequency[number-1]};
  return {number,rank:rank.rank,score:rank.score,totalFrequency:frequency[number-1],recentFrequency:recent[number-1],recent7:recent[number-1],recent15:recent15[number-1],lastDraw:lastSet.has(number),recentWindow:window,selectedPairs:[]};
 });
}
export function updateExpertWeights(logWeights,distributions,actual,learningRate=.04){if(!Array.isArray(logWeights)||!Array.isArray(distributions)||logWeights.length!==distributions.length||!Array.isArray(actual)||actual.length!==6||!Number.isFinite(learningRate)||learningRate<=0)throw Error('Datos inválidos para actualizar los pesos del modelo');const uniformLogProbability=6*Math.log(1/49);for(let j=1;j<distributions.length;j++){const p=distributions[j];if(!Array.isArray(p)||p.length!==49||p.some(x=>!Number.isFinite(x)||x<=0))throw Error('Distribución de experto inválida');const logSkill=actual.reduce((sum,n)=>sum+Math.log(p[n-1]),0)-uniformLogProbability;logWeights[j]=Math.max(-8,Math.min(8,.98*logWeights[j]+learningRate*logSkill));}logWeights[0]=0;return logWeights;}
export function analyze(draws,{window=7}={}){
 if(![5,7,10,15,20,30,50].includes(window))throw Error('Ventana no válida: usa 5, 7, 10, 15, 20, 30 o 50');
 const ordered=draws.map(d=>({date:d.date,numbers:d.numbers.slice().sort((a,b)=>a-b)})).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(ordered.map(d=>d.date)).size!==ordered.length)throw Error('Fechas duplicadas');
 for(const d of ordered)if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||d.numbers.length!==6||new Set(d.numbers).size!==6||d.numbers.some(n=>!Number.isInteger(n)||n<1||n>49))throw Error('Sorteo inválido');
 if(ordered.length<=window)return {version:MODEL_VERSION,status:'insufficient',window,required:window+1,available:ordered.length};
 const names=['Frecuencia histórica'],logs=Array(names.length).fill(0),rows=[],histogram=Array(7).fill(0);
 const baseline=randomBaseline();let totalHits=0,totalSecondHits=0,totalRandom=0,randomHistogram=Array(7).fill(0),secondHistogram=Array(7).fill(0);
 for(let i=window;i<ordered.length;i++){
  const past=ordered.slice(0,i),weights=softmax(logs),prediction=predict(past,window),actual=ordered[i],count=hits(prediction.numbers,actual.numbers),secondCount=hits(prediction.secondNumbers,actual.numbers),random=ticket(Array(49).fill(1/49),rng(92003+i*313)),randomHits=hits(random,actual.numbers),expertHits=prediction.experts.map(p=>hits(p,actual.numbers));
  rows.push({date:actual.date,trainingCount:i,trainingStart:past[0].date,trainingEnd:past.at(-1).date,windowStart:past.slice(-window)[0].date,predicted:prediction.numbers,predictedSecond:prediction.secondNumbers,actual:actual.numbers,hits:count,secondHits:secondCount,randomNumbers:random,randomHits,expertHits,weightsBefore:weights.map(round),selectionReasons:explainSelection(past,prediction,window),secondSelectionReasons:explainSelection(past,prediction,window,prediction.secondNumbers)});
  histogram[count]++;secondHistogram[secondCount]++;totalHits+=count;totalSecondHits+=secondCount;totalRandom+=randomHits;randomHistogram[randomHits]++;
  updateExpertWeights(logs,prediction.distributions,actual.numbers);
 }
 const weights=[1],next=predict(ordered,window),n=rows.length,last=rows.at(-1);
 return {version:MODEL_VERSION,status:'ready',window,sourceLastDate:ordered.at(-1).date,drawCount:ordered.length,objective:{primary:'historicalFrequencyOnly',predictionStrategy:'deterministicTopSixByHistoricalFrequency',repeatLags:[]},method:'Regla única: ordenar los 49 números por frecuencia histórica en los sorteos anteriores y escoger los seis primeros. En caso de empate, gana el número menor. La segunda apuesta aplica además el filtro confirmado de un máximo de tres apariciones por número en los últimos siete sorteos y no se completa si no hay seis candidatos distintos. La evaluación se compara por separado con el control teórico del azar, cuya media de referencia es 36/49 aciertos por apuesta.',forecast:{targetDate:nextDrawDate(ordered.at(-1).date),afterDate:ordered.at(-1).date,numbers:next.numbers,secondNumbers:next.secondNumbers,numberScores:next.numberScores,rankedNumbers:next.rankedNumbers,secondEligibleNumbers:next.secondEligibleNumbers,minimumRecentFrequency:next.minimumRecentFrequency,secondMaximumWeeklyFrequency:next.secondMaximumWeeklyFrequency,warning:next.warning,selectionReasons:explainSelection(ordered,next,window),secondSelectionReasons:explainSelection(ordered,next,window,next.secondNumbers),rankingReasons:explainSelection(ordered,next,window,next.numberScores.map(x=>x.number)).map((x,i)=>({...x,candidateRank:i+1}))},lastEvaluation:{targetDate:last.date,trainedThrough:last.trainingEnd,numbers:last.predicted,secondNumbers:last.predictedSecond,actual:last.actual,hits:last.hits,secondHits:last.secondHits,selectionReasons:last.selectionReasons,secondSelectionReasons:last.secondSelectionReasons},metrics:{simulations:n,meanHits:round(totalHits/n),secondMeanHits:round(totalSecondHits/n),secondAtLeastThree:secondHistogram.slice(3).reduce((a,b)=>a+b,0),secondAtLeastFour:secondHistogram.slice(4).reduce((a,b)=>a+b,0),secondHistogram,atLeastThree:histogram.slice(3).reduce((a,b)=>a+b,0),atLeastFour:histogram.slice(4).reduce((a,b)=>a+b,0),maxHits:Math.max(...rows.map(r=>r.hits)),histogram,randomMeanHits:round(totalRandom/n),randomAtLeastThree:randomHistogram.slice(3).reduce((a,b)=>a+b,0),randomAtLeastFour:randomHistogram.slice(4).reduce((a,b)=>a+b,0),randomHistogram},baseline,experts:names.map((name,i)=>{const expertTotal=rows.reduce((s,r)=>s+r.expertHits[i],0),randomTotal=rows.reduce((s,r)=>s+r.randomHits,0),wins=rows.filter(r=>r.expertHits[i]>r.randomHits).length,ties=rows.filter(r=>r.expertHits[i]===r.randomHits).length,losses=rows.length-wins-ties;return {name,initialWeight:1/names.length,meanHits:round(expertTotal/n),atLeastThree:rows.filter(r=>r.expertHits[i]>=3).length,randomMeanHits:round(randomTotal/n),deltaVsRandom:round((expertTotal-randomTotal)/n),beatRandomRate:round(wins/n),wins,ties,losses,numberWeight:round(weights[i])}}),patterns:patterns(ordered),rows,modelState:{version:MODEL_VERSION,window,trainedThrough:ordered.at(-1).date,numberLogWeights:logs,numberWeights:weights}};
}
export function nextDrawDate(afterDate){const day=new Date(afterDate+'T12:00:00Z');if(!Number.isFinite(day.getTime()))throw Error('Fecha inválida');day.setUTCDate(day.getUTCDate()+1);return day.toISOString().slice(0,10);}
export function reconcileForecasts(records,report,draws,now=new Date()){const official=new Map(draws.map(d=>[d.date,d])),targetDate=nextDrawDate(report.sourceLastDate),parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now),part=t=>parts.find(p=>p.type===t).value,today=part('year')+'-'+part('month')+'-'+part('day'),time=part('hour')+':'+part('minute'),next=records.map(r=>({...r,numbers:[...r.numbers],secondNumbers:r.secondNumbers?[...r.secondNumbers]:undefined}));if(!next.some(r=>r.targetDate===targetDate)&&!report.warning&&!report.forecast?.warning&&Array.isArray(report.forecast?.numbers)&&report.forecast.numbers.length===6&&Array.isArray(report.forecast?.secondNumbers)&&report.forecast.secondNumbers.length===6&&(targetDate>today||(targetDate===today&&time<'20:30')))next.push({targetDate,createdAt:now.toISOString(),version:report.version,window:report.window,trainedThrough:report.sourceLastDate,trainingCount:report.drawCount,numbers:[...report.forecast.numbers],secondNumbers:[...report.forecast.secondNumbers]});const reconciled=next.map(r=>{const actual=official.get(r.targetDate),hits=actual?r.numbers.filter(n=>actual.numbers.includes(n)).length:null,secondHits=actual&&Array.isArray(r.secondNumbers)?r.secondNumbers.filter(n=>actual.numbers.includes(n)).length:null;return {...r,status:actual?'published':'pending',publishedAt:actual?(r.publishedAt||now.toISOString()):null,actual:actual?{date:actual.date,numbers:[...actual.numbers],source:actual.source}:null,hits,secondHits,combinationHits:actual?(secondHits===null?[hits]:[hits,secondHits]):null};}).sort((a,b)=>b.targetDate.localeCompare(a.targetDate));return {targetDate,active:reconciled.find(r=>r.targetDate===targetDate)||null,records:reconciled};}
