import json,os,csv,collections,sys
S='/tmp/claude-0/-home-user/f08bcb06-42d8-52e6-a47d-f23c6b82b25c/scratchpad/src'
base=f'{S}/enem-api/public'
result={}
def L(v):
    v=(v or '').strip()
    return '' if v=='' else str(int(float(v)))
for y in range(2009,2024):
    qs={}
    for d in os.listdir(f'{base}/{y}/questions'):
        qs[d]=json.load(open(f'{base}/{y}/questions/{d}/details.json'))['correctAlternative']
    rows=list(csv.DictReader(open(f'{S}/analise-enem/src/tri_enem/data/itens/{y}/ITENS_PROVA_{y}.csv',encoding='latin-1'),delimiter=';'))
    byp=collections.defaultdict(dict)
    for r in rows:
        byp[(r['SG_AREA'],r['CO_PROVA'])][(int(float(r['CO_POSICAO'])),L(r.get('TP_LINGUA')))]=r
    def get(m,i,lang):
        if lang: return m.get((i,lang))
        return m.get((i,'')) or m.get((i,'0')) if (i,'1') not in m or (i,'') in m else None
    m={}
    for blk in range(4):
        keys=[k for k in qs if (blk*45)< int(k.split('-')[0]) <= blk*45+45]
        best=None
        for key,mm in byp.items():
            for off in (-135,-90,-45,0,45,90,135):
                hit=tot=0
                for k in keys:
                    i=int(k.split('-')[0]); lang='' if '-' not in k else ('0' if 'ingles' in k else '1')
                    r=get(mm,i+off,lang)
                    if r: tot+=1; hit+=r['TX_GABARITO']==qs[k]
                if best is None or hit>best[0]: best=(hit,tot,key,off)
        hit,tot,key,off=best
        print(y,blk,len(keys),best[:2],key,off,file=sys.stderr)
        if hit < 0.8*len(keys): continue
        for k in keys:
            i=int(k.split('-')[0]); lang='' if '-' not in k else ('0' if 'ingles' in k else '1')
            r=get(byp[key],i+off,lang)
            if r and r['TX_GABARITO']==qs[k]:
                m[k]=dict(area=key[0],item=r['CO_ITEM'],hab=r['CO_HABILIDADE'],a=r['NU_PARAM_A'],b=r['NU_PARAM_B'],c=r['NU_PARAM_C'],aban=r['IN_ITEM_ABAN'],prova=key[1])
    result[y]=m
json.dump(result,open(f'{S}/match.json','w'))
print(sum(len(v) for v in result.values()),file=sys.stderr)
