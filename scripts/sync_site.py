"""Carga el archivo validado en el sitio privado; el acceso efímero llega solo por stdin."""
import json, pathlib, sys, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
def main():
    print('Preparado para acceso de servicio por stdin (no se registra).',flush=True)
    config=json.loads(sys.stdin.readline())
    url=config['url'].rstrip('/')
    if url!='https://primitiva-archivo-2026.wittyeel5.chatgpt.site':
        raise ValueError('Destino no autorizado')
    headers={'OAI-Sites-Authorization':'Bearer '+config['token'],'Content-Type':'application/json'}
    payload=(ROOT/'data/draws.json').read_bytes()
    archive=json.loads(payload)
    request=urllib.request.Request(url+'/api/sync',data=payload,headers=headers,method='POST')
    with urllib.request.urlopen(request,timeout=90) as response:
        saved=json.load(response)
    if not saved.get('ok'):
        raise ValueError('No se confirmó el guardado')
    previous=None
    for _ in range(2):
        request=urllib.request.Request(url+'/api/draws',headers={'OAI-Sites-Authorization':headers['OAI-Sites-Authorization']})
        with urllib.request.urlopen(request,timeout=60) as response:
            result=json.load(response)
        if result.get('warning'):
            raise ValueError(result['warning'])
        for field in ('latestDate','checkedAt'):
            if result[field]!=saved[field]:
                raise ValueError('La lectura no coincide con el guardado: '+field)
        if len(result['draws'])!=len(archive['draws']) or {r['id'] for r in result['draws']}!={r['id'] for r in archive['draws']}:
            raise ValueError('El histórico persistido no coincide')
        if previous is not None and result!=previous:
            raise ValueError('Las lecturas consecutivas difieren')
        previous=result
    request=urllib.request.Request(url+'/api/ai?window=30',headers={'OAI-Sites-Authorization':headers['OAI-Sites-Authorization']})
    with urllib.request.urlopen(request,timeout=90) as response:
        analysis=json.load(response)
    if analysis.get('status')!='ready' or analysis.get('sourceLastDate')!=result['latestDate'] or analysis.get('warning'):
        raise ValueError('No se pudo confirmar el aprendizaje con el último histórico')
    print(json.dumps({'ok':True,'count':len(result['draws']),'latestDate':result['latestDate'],'checkedAt':result['checkedAt'],'warning':None,'modelVersion':analysis['version'],'simulations':analysis['metrics']['simulations']}),flush=True)
if __name__=='__main__':
    main()
