/*AI_ENGINE*/
const SEED = /*SEED*/;
const HTML = /*HTML*/;
const ICON = /*ICON*/;
const MAX_AGE=3*60*60*1000;
const KEY='history/draws.json';
export function parseDraw(row){
 const m=/^\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s+C\((\d+)\)\s+R\((\d+)\)\s*$/.exec(row.combinacion||'');
 if(!m||row.game_id!=='LAPR')throw Error('Formato SELAE inesperado');
 const v=m.slice(1).map(Number),numbers=v.slice(0,6).sort((a,b)=>a-b),date=row.fecha_sorteo.slice(0,10);
 if(new Set(numbers).size!==6||numbers.some(n=>n<1||n>49)||v[6]<1||v[6]>49||numbers.includes(v[6])||v[7]<0||v[7]>9||date<'2026-01-01'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('Resultado inválido');
 return {id:String(row.id_sorteo),date,numbers,complementary:v[6],refund:v[7],source:'https://www.loteriasyapuestas.es/f/loterias/resultados/primitiva.html?game_id=LAPR&fecha_sorteo='+date.replaceAll('-','')};
}
export function validateHistory(draws){
 if(!draws.length)throw Error('Histórico vacío');
 if(new Set(draws.map(d=>d.date)).size!==draws.length||new Set(draws.map(d=>d.id)).size!==draws.length)throw Error('Duplicados');
 const dates=new Set(draws.map(d=>d.date)),end=draws[0].date;
 for(let d=new Date('2026-01-01T12:00:00Z');d.toISOString().slice(0,10)<=end;d.setUTCDate(d.getUTCDate()+1))if([1,4,6].includes(d.getUTCDay())&&!dates.has(d.toISOString().slice(0,10)))throw Error('Cobertura incompleta');
}
export function validateArchive(input){
 if(!input||input.schemaVersion!==1||input.source!=='SELAE'||input.startDate!=='2026-01-01'||!Array.isArray(input.draws))throw Error('Archivo no reconocido');
 const stamp=Date.parse(input.checkedAt);
 if(!Number.isFinite(stamp)||stamp>Date.now()+5*60*1000||stamp<Date.now()-24*60*60*1000)throw Error('Fecha de consulta no válida o demasiado antigua');
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
 const draws=input.draws.map(d=>{
  if(!d||!Array.isArray(d.numbers)||d.numbers.length!==6||![...d.numbers,d.complementary,d.refund].every(Number.isInteger)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(Date.parse(d.date))||new Date(d.date).toISOString().slice(0,10)!==d.date||d.date>today||typeof d.id!=='string'||!/^\d+$/.test(d.id))throw Error('Sorteo inválido');
  return parseDraw({game_id:'LAPR',fecha_sorteo:d.date,id_sorteo:d.id,combinacion:d.numbers.join(' - ')+' C('+d.complementary+') R('+d.refund+')'});
 }).sort((a,b)=>b.date.localeCompare(a.date));
 validateHistory(draws);
 if(input.latestDate!==draws[0].date)throw Error('Última fecha inconsistente');
 return {schemaVersion:1,startDate:'2026-01-01',source:'SELAE',checkedAt:new Date(stamp).toISOString(),latestDate:draws[0].date,draws};
}
export async function saveArchive(env,input){
 if(!env.BUCKET)throw Error('Almacenamiento no disponible');
 const next=validateArchive(input),object=await env.BUCKET.get(KEY),current=object?await object.json():SEED;
 if(Date.parse(next.checkedAt)<Date.parse(current.checkedAt))throw Error('No se permite retroceder la fecha de consulta');
 const dates=new Set(next.draws.map(d=>d.date));
 if(current.draws.some(d=>!dates.has(d.date)))throw Error('No se permite perder sorteos guardados');
 const old=new Map(current.draws.map(d=>[d.date,JSON.stringify(d)]));
 for(const d of next.draws)if(old.get(d.date)!==JSON.stringify(d))await env.BUCKET.put('draws/'+d.date+'.json',JSON.stringify(d),{httpMetadata:{contentType:'application/json'}});
 await env.BUCKET.put(KEY,JSON.stringify(next),{httpMetadata:{contentType:'application/json'}});
 return next;
}
export async function getData(env){
 let current=SEED;
 if(!env.BUCKET)return {...SEED,warning:'Almacenamiento no disponible. Se muestra la copia incluida en el proyecto.'};
 try{const obj=await env.BUCKET.get(KEY);if(obj)current=await obj.json();else await env.BUCKET.put(KEY,JSON.stringify(SEED));}
 catch{return {...SEED,warning:'No se pudo leer el archivo del servidor. Se muestra la última copia incluida en el proyecto.'};}
 if(Date.now()-Date.parse(current.checkedAt)>MAX_AGE)return {...current,warning:'La última consulta a SELAE tiene más de tres horas. Se conservan los resultados guardados mientras se reintenta la sincronización.'};
 return current;
}
// Registro separado de la caché: nunca sustituir una propuesta ya emitida.
export async function trackAnalysis(env,archive,report){
 if(report.status!=='ready')return {...report,warning:archive.warning};
 const base={...report,forecast:{...report.forecast,targetDate:nextDrawDate(report.sourceLastDate)},warning:archive.warning};
 if(!env.BUCKET)return {...base,tracking:{targetDate:base.forecast.targetDate,active:null,records:[],persisted:false}};
 const key='ai/tracking/'+report.window+'.json';
 for(let attempt=0;attempt<4;attempt++){
  const object=await env.BUCKET.get(key),previous=object?await object.json():{records:[]};
  const tracking=reconcileForecasts(previous.records,base,archive.draws);
  if(JSON.stringify(previous.records)!==JSON.stringify(tracking.records)){
   const options={httpMetadata:{contentType:'application/json'}};
   // R2 devuelve null si otra petición ha actualizado el objeto entre lectura y escritura.
   if(!object)options.onlyIf={etagDoesNotMatch:'*'};else if(object.etag)options.onlyIf={etagMatches:object.etag};
   const saved=await env.BUCKET.put(key,JSON.stringify({schemaVersion:1,records:tracking.records}),options);
   if(saved===null)continue;
  }
  return {...base,tracking:{...tracking,persisted:true}};
 }
 throw Error('Otra consulta está actualizando las propuestas; reintentar.');
}
const AI_CACHE_VERSION='ai:'+MODEL_VERSION;
export async function getAnalysis(env,window=15){
 if(![5,10,15,20,30,50].includes(window))throw Error('Ventana permitida: 5, 10, 15, 20, 30 o 50');
 const archive=await getData(env);
 const signature=AI_CACHE_VERSION+':'+JSON.stringify(archive.draws.map(d=>[d.date,d.numbers,d.refund]));
 const key='ai/reports/'+window+'.json';
 if(env.BUCKET){try{const saved=await env.BUCKET.get(key);if(saved){const cache=await saved.json();if(cache.signature===signature)return trackAnalysis(env,archive,cache.report);}}catch{/* Recalcular desde el histórico conservado. */}}
 const report=analyze(archive.draws,{window});
 if(env.BUCKET&&report.status==='ready'){
  await env.BUCKET.put('ai/models/'+window+'.json',JSON.stringify(report.modelState),{httpMetadata:{contentType:'application/json'}});
  const forecastKey='ai/forecasts/'+MODEL_VERSION+'/'+window+'/after-'+report.sourceLastDate+'.json';
  if(!await env.BUCKET.get(forecastKey))await env.BUCKET.put(forecastKey,JSON.stringify({version:MODEL_VERSION,window,trainedThrough:report.sourceLastDate,trainingCount:report.drawCount,numbers:report.forecast.numbers,refund:report.forecast.refund}),{httpMetadata:{contentType:'application/json'}});
  await env.BUCKET.put(key,JSON.stringify({signature,report}),{httpMetadata:{contentType:'application/json'}});
 }
 return trackAnalysis(env,archive,report);
}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/api/sync'){
  if(request.method!=='POST')return new Response('Método no permitido',{status:405,headers:{Allow:'POST'}});
  // La puerta de acceso privada de Sites autentica al propietario y el acceso de servicio.
  // El sitio debe seguir siendo privado; no exponer este escritor con audiencia pública.
  if(request.headers.has('Origin'))return new Response('Solo sincronización de servicio',{status:403});
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return new Response('Se requiere JSON',{status:415});
  const body=await request.text();if(body.length>2*1024*1024)return new Response('Archivo demasiado grande',{status:413});
  let input;try{input=JSON.parse(body);}catch{return Response.json({error:'JSON inválido'},{status:400});}
  let next;try{next=await saveArchive(env,input);}catch(error){return Response.json({error:error.message},{status:422,headers:{'Cache-Control':'no-store'}});}
  return Response.json({ok:true,count:next.draws.length,latestDate:next.latestDate,checkedAt:next.checkedAt},{headers:{'Cache-Control':'no-store'}});
 }
 if(request.method!=='GET')return new Response('Método no permitido',{status:405,headers:{Allow:'GET'}});
 const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
 if(url.pathname==='/api/ai'){const requestedWindow=Number(url.searchParams.get('window')||15);if(requestedWindow!==15)return Response.json({error:'El laboratorio usa una ventana fija de 15 sorteos'},{status:400});const window=15;try{return Response.json(await getAnalysis(env,window),{headers:{...headers,'Cache-Control':'no-store',...(url.searchParams.has('download')?{'Content-Disposition':'attachment; filename=\"primitiva-analisis.json\"'}:{})}});}catch{return Response.json({error:'No se pudo calcular el análisis. El histórico sigue disponible.'},{status:503});}}
 if(url.pathname==='/api/draws'){const data=await getData(env);return Response.json(data,{headers:{...headers,'Cache-Control':'no-store',...(url.searchParams.has('download')?{'Content-Disposition':'attachment; filename="primitiva-historico.json"'}:{})}});}
 if(url.pathname==='/icon.svg')return new Response(ICON,{headers:{...headers,'Content-Type':'image/svg+xml;charset=utf-8','Cache-Control':'public, max-age=86400'}});
 if(url.pathname==='/')return new Response(HTML,{headers:{...headers,'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'self'; form-action 'self'"}});
 return new Response('No encontrado',{status:404,headers});
}};
