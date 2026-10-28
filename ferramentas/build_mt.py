import json,os,re,io,base64,sys,collections
sys.path.insert(0,os.path.dirname(__file__))
from PIL import Image
S='/tmp/claude-0/-home-user/f08bcb06-42d8-52e6-a47d-f23c6b82b25c/scratchpad'
base=f'{S}/src/enem-api/public'
OUT=f'{S}/app/data'
match=json.load(open(f'{S}/src/match.json'))
coef=json.load(open(f'{S}/src/analise-enem/src/tri_enem/coeficientes_data.json'))['por_prova']
ORDER={**{y:['CN','CH','LC','MT'] for y in [2009]},**{y:['CH','CN','LC','MT'] for y in range(2010,2017)},**{y:['LC','CH','CN','MT'] for y in range(2017,2024)}}
imgcache={}
def img(url,y):
    m=re.search(r'enem\.dev/(.+)$',url)
    if not m: return None
    p=f'{base}/{m.group(1)}'
    if not os.path.exists(p): return None
    if p in imgcache: return imgcache[p]
    try:
        if p.endswith('.svg') or p.endswith('.latex'):
            return None
        im=Image.open(p)
        if im.mode in ('P','LA','RGBA','1','L','I;16','I'):
            im=im.convert('RGBA'); bg=Image.new('RGB',im.size,'white'); bg.paste(im,mask=im.split()[3]); im=bg
        else: im=im.convert('RGB')
        w,h=im.size
        if w>1000: im=im.resize((1000,int(h*1000/w)),Image.LANCZOS)
        b=io.BytesIO(); im.save(b,'WEBP',quality=72,method=6)
        d='data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
    except Exception as e:
        print('img fail',p,e,file=sys.stderr); d=None
    imgcache[p]=d; return d
NOMES=dict(A='Aritmética',R='Razão e proporção',F='Funções',GP='Geometria plana',GE='Geometria espacial',J='Porcentagem e juros',E='Estatística',G='Gráficos e tabelas',P='Probabilidade',C='Análise combinatória',U='Grandezas e unidades',S='Sequências (PA e PG)',T='Trigonometria',GA='Geometria analítica')
_ids=[l.split('|')[0] for l in open(f'{S}/mt_dump.txt',encoding='utf-8',errors='replace')]
_lab=open(f'{S}/mt_labels.txt').read().split()
assert len(_ids)==len(_lab)==670
ROT={k:NOMES[v] for k,v in zip(_ids,_lab)}
index=[]; transforms={}
for y in range(2009,2024):
    qs=[]; images={}
    def repl(m,y=y):
        d=img(m.group(1),y)
        if not d: return ''
        k=f'i{len(images)}'; images[k]=d; return f'![](#{k})'
    for dname in sorted(os.listdir(f'{base}/{y}/questions'),key=lambda s:(int(s.split('-')[0]),s)):
        j=json.load(open(f'{base}/{y}/questions/{dname}/details.json'))
        i=int(dname.split('-')[0]); lang=j.get('language')
        area=ORDER[y][(i-1)//45]
        if area!='MT': continue
        ctx=re.sub(r'!\[[^\]]*\]\(([^)]+)\)',repl,j['context'] or '')
        alts=[]
        for a in j['alternatives']:
            f=None
            if a.get('file'):
                d=img(a['file'],y)
                if d: f=f'i{len(images)}'; images[f]=d
            alts.append([a['letter'],a['text'] or '',f])
        disc=ROT['%02d-%s'%(y%100,dname.split('-')[0])]
        mm=match[str(y)].get(dname)
        q=dict(id=f'{y}-{dname}',y=y,n=i,ar=area,lg=lang,d=disc,t=ctx,q=j['alternativesIntroduction'] or '',al=alts,g=j['correctAlternative'])
        meta=dict(id=q['id'],y=y,n=i,ar=area,lg=lang,d=disc,g=q['g'])
        if mm and mm['b']:
            try:
                meta['p']=[round(float(mm['a']),4),round(float(mm['b']),4),round(float(mm['c']),4)]
                if mm['hab']: meta['h']=int(float(mm['hab']))
                meta['pv']=mm['prova']
                ck=f"{y},{area},{mm['prova']}"
                if ck in coef: transforms[f'{y}-{area}']=[round(coef[ck]['slope'],4),round(coef[ck]['intercept'],4)]
            except ValueError: pass
        if not (ctx.strip() or q['q'].strip()): continue
        qs.append(q); index.append(meta)
    json.dump(dict(y=y,q=qs,img=images),open(f'{OUT}/{y}.json','w'),ensure_ascii=False,separators=(',',':'))
    print(y,len(qs),round(os.path.getsize(f'{OUT}/{y}.json')/1e6,2),'MB',file=sys.stderr)
json.dump(dict(q=index,tr=transforms),open(f'{OUT}/index.json','w'),ensure_ascii=False,separators=(',',':'))
print('index',len(index),os.path.getsize(f'{OUT}/index.json'),file=sys.stderr)
print(collections.Counter(m['d'] for m in index),file=sys.stderr)
