export function frequencies(draws, kind = 'numbers') {
  const result = new Map();
  for (const draw of draws) for (const n of (kind === 'refund' ? [draw.refund] : draw.numbers)) result.set(n, (result.get(n) || 0) + 1);
  return result;
}
export function repeated(draws, kind = 'numbers') {
  return [...frequencies(draws, kind)].filter(([, count]) => count > 1).sort((a,b) => a[0]-b[0]);
}
export function windowDraws(draws, end, size = 5) {
  return draws.filter(d => !end || d.date <= end).slice(0,size);
}

// Solo propuestas emitidas y evaluadas con un resultado oficial; no simulaciones.
export function summarizeIssued(records=[]){
 const published=records.filter(r=>r.status==='published'&&r.actual);
 const evaluate=r=>({hits:r.numbers.filter(n=>r.actual.numbers.includes(n)).length,refund:r.refund===r.actual.refund});
 const rows=published.map(evaluate),n=rows.length,refunds=rows.filter(r=>r.refund).length;
 const z=1.959963984540054,p=n?refunds/n:null,d=n?1+z*z/n:0;
 const center=n?(p+z*z/(2*n))/d:null,margin=n?z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d:null;
 const versions=[...new Set(published.map(r=>r.version))].sort().map(version=>{
  const trials=published.filter(r=>r.version===version).map(evaluate);
  return {version,evaluated:trials.length,refunds:trials.filter(r=>r.refund).length,three:trials.filter(r=>r.hits>=3).length};
 });
 return {issued:records.length,pending:records.filter(r=>r.status!=='published'||!r.actual).length,evaluated:n,refunds,three:rows.filter(r=>r.hits>=3).length,joint:rows.filter(r=>r.hits>=3&&r.refund).length,meanHits:n?rows.reduce((s,r)=>s+r.hits,0)/n:null,refundRate:p,refundInterval:n?[Math.max(0,center-margin),Math.min(1,center+margin)]:null,versions};
}
