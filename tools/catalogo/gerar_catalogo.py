#!/usr/bin/env python3
"""Gera catalog.json + items.jsonl a partir dos CSV/JSONL públicos já baixados em ../04_evidencias_*/dados.
Regra: só preenche o que a fonte diz; o que não consta vira null/unknown (nunca inventado)."""
import csv,json,re,collections,sys,os
csv.field_size_limit(10**9)
D=sys.argv[1]; HOJE="2026-11-26"; BASE="https://projetoindustrial.github.io"
rd=lambda f:list(csv.DictReader(open(os.path.join(D,f),encoding='utf-8-sig',newline='')))
# --- licenças: só mapeia rótulo EXATO para enum; senão open-unknown + license_label ---
LIC={'cc0':('cc0','https://creativecommons.org/publicdomain/zero/1.0/'),
 'cc by 4.0':('cc-by-4.0','https://creativecommons.org/licenses/by/4.0/'),
 'cc by-sa 4.0':('cc-by-sa-4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
 'mit':('mit','https://opensource.org/licenses/MIT'),
 'apache 2.0':('apache-2.0','https://www.apache.org/licenses/LICENSE-2.0'),'apache-2.0':('apache-2.0','https://www.apache.org/licenses/LICENSE-2.0'),
 'domínio público':('public-domain','https://creativecommons.org/publicdomain/mark/1.0/')}
def lic_exata(label):
    k=re.sub(r'\s*\(.*$','',label.strip().lower()); return LIC.get(k)
def status(lic,url,licenses=None):
    if lic in('cc0','cc-by-4.0','cc-by-sa-4.0','mit','apache-2.0','public-domain'): return 'verified' if url else 'unstated'
    if lic in('open-unknown','open-unstated'): return 'unstated'
    if lic in('restricted','proprietary'): return 'restricted'
    if lic=='blocked': return 'blocked'
    return 'unknown'
def norm_url(u):
    u=(u or '').strip()
    if not u: return None
    if re.search(r'\s',u): print('AVISO url com texto anexado na fonte (mantido só o 1º token):',u[:70]); u=u.split()[0]
    return u if re.match(r'https?://',u) else 'https://'+u   # fonte traz URL sem esquema em alguns itens
items=[]; seq=collections.Counter()
def add(block,ds,kind,title,url,vl,lic,lurl,label,lv,sid=None,source_name=None):
    seq[block]+=1
    # schema: open license + url => verified; sem url => status derivado 'unstated'
    it={"id":f"{block}-{seq[block]:04d}","block":block,"dataset_id":ds,"kind":kind,"title":title.strip()[:300],
        "url":norm_url(url),"source_url":None,"last_verified":lv,"verification_level":vl,"license":lic,
        "license_status":status(lic,lurl),"license_url":lurl,"data_kind":"current","valid_until":None}
    if label: it["license_label"]=label.strip()[:240]
    if sid: it["source_id"]=sid
    if source_name: it["source_name"]=source_name
    items.append(it)
# ---- Manutenção ----
M=rd('manutencao.csv'); VL={'CONFIRMADO':'verified_double','VERIFICADO':'verified_single','CONFIRMADO_RESTRICAO_LICENCA':'restricted','AMBIGUO':'ambiguous','BLOQUEADO_FERRAMENTA':'blocked','BLOQUEADO':'unavailable'}
for r in M:
    rl=r['risco_legal']; ex=lic_exata(r['licenca'])
    if rl=='BLOQUEADO': lic,lu='blocked',None
    elif rl=='RESTRITO': lic,lu='restricted',None
    elif rl in('OK','ABERTO'): lic,lu=ex if ex else ('open-unknown',None)
    else: lic,lu='unknown',None
    add('manutencao','ds-manutencao-2026-10','resource',r['nome'],r['url'],VL[r['status']],lic,lu,r['licenca'],'2026-10-18',sid=r['id'])
# ---- Fontes de dados ----
for r in rd('fontes.csv'):
    k=r['k']; ex=lic_exata(r['l'])
    if k=='c': lic,lu=ex if ex else ('open-unknown',None)
    elif k=='g': lic,lu='open-unstated',None
    else: lic,lu='restricted',None
    add('fontes-industriais','ds-fontes-industriais','resource',r['n'],r['u'],'unverified_heuristic',lic,lu,r['l'],None)
# ---- Bancada (umi) ----
KIND={'ferramenta':'tool','norma':'norm','base':'resource','artigo':'resource','outro':'resource'}
for r in rd('umi.csv'):
    lc=r['lc']; ex=lic_exata(r['l']) if lc=='verificada' else None
    if lc=='verificada': lic,lu=ex if ex else ('open-unknown',None); vl='verified_single'
    elif lc=='restrita': lic,lu,vl='restricted',None,'restricted'
    else: lic,lu,vl='unknown',None,'unverified_heuristic'
    lv=(lambda d:f"{d[6:]}-{d[3:5]}-{d[:2]}" if d else None)(r['ld']) or None
    add('umi','ds-umi-2026-11',KIND.get(r['t'],'resource'),r['n'],r['u'],vl,lic,lu,r['l'],lv,sid=r['i'])
# ---- Recursos O&G ----
for r in rd('recursos.csv'):
    add('recursos','ds-recursos-v17','resource',(r['categoria'] or r['area'] or 'recurso')+' — '+r['plataforma'],r['link'],'unverified_heuristic','not-applicable',None,None,'2026-10-18',sid=r['id'])
for it in items:
    if not it['title'].strip() or not (it['url'] or '').startswith('http'): print('AVISO item sem título/url:',it['id'],(it['url'] or '')[:60])
# ---- Playbooks de Ativo (31 <details id=...> dentro do index.html único) ----
PB=open(os.path.join(D,'..','h_playbooks.html'),encoding='utf-8').read()
cov=collections.Counter()
for m in re.finditer(r'<details[^>]*\bid="([^"]+)"[^>]*>(.*?)</details>',PB,re.S):
    pid,body=m.group(1),m.group(2)
    sm=re.search(r'<summary[^>]*>(.*?)</summary>',body,re.S); t=re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',sm.group(1))).strip() if sm else pid
    c=re.search(r'(Boa cobertura de dados|Cobertura parcial|Poucos dados)',t+' '+body[:1500]); cov[c.group(1) if c else 'sem_rotulo']+=1
    seq['playbooks-de-ativo']+=1
    items.append({"id":f"playbooks-de-ativo-{seq['playbooks-de-ativo']:04d}","block":"playbooks-de-ativo","dataset_id":None,"kind":"playbook","title":t[:200] or pid,
      "url":f"{BASE}/playbooks-de-ativo/#{pid}","source_url":None,"last_verified":"2026-11-22","verification_level":"unverified_heuristic","license":"unknown","license_status":"unknown",
      "data_kind":"current","valid_until":None,"source_id":pid})
print('playbooks',seq['playbooks-de-ativo'],dict(cov))
# ---- contagens ----
def cnt(b,key): return dict(collections.Counter(i[key] for i in items if i['block']==b))
def blk(id,name,path,purpose,counts,fb=None,items_url=None,lv=None,ds=(),status_='active',pwa=False,aliases=(),shares=(),layers=('curated',)):
    b={"id":id,"name":name,"url":f"{BASE}/{path}","fallback_url":fb and f"{BASE}/{fb}","items_url":items_url and f"{BASE}/{items_url}",
       "purpose":purpose,"status":status_,"pwa":pwa,"last_verified":lv,"valid_until":None,"counts":counts,"datasets":list(ds),"layers":list(layers)}
    if aliases: b["aliases"]=list(aliases)
    if shares: b["shares_dataset_with"]=list(shares)
    return b
def bv(b):
    c=cnt(b,'verification_level'); return {k:v for k,v in c.items()}
cursos=rd('cursos.csv'); atual=sum(1 for c in cursos if c['situacao']=='atual'); hist=len(cursos)-atual
blocos=collections.Counter(c['bloco'] for c in cursos)
vagas=rd('vagas.csv'); emp_ids=len({v['empresa_id'] for v in vagas}); emp_json=len(json.load(open(os.path.join(D,'empresas.json'),encoding='utf-8')))
print('empresas: únicas em vagas.csv =',emp_ids,'| empresas.json =',emp_json,'| llms.txt diz 271')
mv=bv('manutencao'); uv=bv('umi')
blocks=[
 blk('recursos','Recursos O&G','recursos/','Grupos, canais, portais, dados e normas de petróleo e gás offshore.',{"total":350,"by_unit":{"recursos":350}},fb='recursos/',items_url='recursos/dados/recursos.jsonl',lv='2026-10-18',ds=['ds-recursos-v17'],aliases=['Recursos O&G em texto']),
 blk('vagas','Painel de Vagas','vagas/','Vagas e canais de candidatura de empresas de petroquímica, química e O&G.',{"total":len(vagas),"by_unit":{"vagas":len(vagas),"empresas_monitoradas":271,"empresas_com_vaga":emp_ids,"empresas_duplicata_com_pagina":4,"vagas_brasil":1209,"vagas_fora_do_brasil":sum(1 for v in vagas if v["pais"]=="Fora do Brasil")}},fb='vagas/empresas/',items_url='vagas/dados/vagas.jsonl',lv='2026-10-14',ds=['ds-vagas-2026-10'],pwa=True),
 blk('umi','Bancada Industrial','umi/','Ferramentas, bases de dados e normas de engenharia de processos, materiais e dados industriais.',{"total":569,"verified":62,"by_unit":{"eixos":20},"by_verification":uv},fb='umi/catalogo/',items_url='umi/dados/catalogo.jsonl',lv='2026-11-06',ds=['ds-umi-2026-11'],layers=['curated','heuristic'],pwa=True,aliases=['UMI']),
 blk('manutencao','Manutenção','manutencao/','Fontes de dado para manutenção preditiva, com verificação graduada e risco legal.',{"total":157,"by_unit":{"frentes":8},"by_verification":mv},fb='manutencao/frentes/',items_url='manutencao/dados/catalogo.jsonl',lv='2026-10-18',ds=['ds-manutencao-2026-10']),
 blk('fontes-industriais','Fontes de dados industriais','fontes-industriais/','Fontes abertas de dados industriais por tema, com licença resumida.',{"total":446,"by_unit":{"temas":14}},fb='fontes-industriais/temas/',items_url='fontes-industriais/dados/catalogo.jsonl',ds=['ds-fontes-industriais']),
 blk('portal-rede-federal','Portal Rede Federal','portal-rede-federal/','Cursos e matrículas das instituições da Rede Federal EPCT (catálogo 2026 + censo PNP 2023).',{"total":1415+8587,"historical":8587,"by_unit":{"instituicoes":64,"cursos_atuais":1415,"ofertas_censo_2023":8587}},fb='portal-rede-federal/instituicoes/',ds=['ds-rede-federal-cursos-2026','ds-censo-pnp-2023'],shares=['catalogo-cursos-gratuitos']),
 blk('catalogo-cursos-gratuitos','Catálogo de cursos gratuitos','catalogo-cursos-gratuitos/','Cursos gratuitos em 6 blocos e 62 trilhas (ofertas atuais + censo PNP 2023).',{"total":len(cursos),"historical":hist,"by_unit":{"atuais":atual,"historico_pnp_2023":hist,"trilhas":62,**{k:v for k,v in blocos.items()}}},fb='catalogo-cursos-gratuitos/trilhas/',items_url='catalogo-cursos-gratuitos/dados/cursos.jsonl',ds=['ds-catalogo-ofertas-2026','ds-censo-pnp-2023'],shares=['portal-rede-federal'],aliases=['Cursos']),
 blk('industriaedu','IndústriaEDU','industriaedu/','Trilhas de carreira, perfis técnicos CNCT, empresas e normas para a indústria brasileira.',{"total":106+111+970+266,"by_unit":{"trilhas":106,"perfis_cnct":111,"empresas":970,"normas":266}},fb='industriaedu/texto/',lv='2026-07-22',ds=['ds-industriaedu-v226']),
 blk('caderno','Caderno','caderno/','Módulos de cálculo de processo e hidráulica, offline e didáticos.',{"total":61,"by_unit":{"modulos":61}},pwa=True),
 blk('editor-fluxograma','Editor de fluxograma','editor-fluxograma/','Editor visual de fluxogramas de processo (ativos, equipamentos e conexões).',{"total":None},aliases=['Fluxograma','Editor de Fluxograma — Planta Virtual']),
 blk('planta-virtual-site','Planta Virtual','planta-virtual-site/','Planta petroquímica virtual simulada: unidades, equipamentos e cenários de falha.',{"total":None},status_='active'),
 blk('id-polimero','ID Polímero','id-polimero/','Identificação de polímeros comuns por espectros FT-IR, localmente no navegador.',{"total":51,"by_unit":{"espectros":51}},ds=['ds-mpx-specdb','ds-fastex','ds-figshare-24593022','ds-zenodo-15969268']),
 blk('bancada-rolamentos','Bancada de Rolamentos','bancada-rolamentos/','Simulador didático de rolamentos: som, vibração e diagnóstico assistido (dados sintéticos).',{"total":None},status_='experimental',pwa=True),
 blk('playbooks-de-ativo','Playbooks de Ativo','playbooks-de-ativo/','Guia por equipamento: falhas típicas, diagnóstico, dados abertos e lacunas.',{"total":seq['playbooks-de-ativo'],"by_unit":{"playbooks":seq['playbooks-de-ativo'],**{k.replace(' ','_'):v for k,v in cov.items()}}},lv='2026-11-22',status_='experimental',items_url=None),
 blk('eventos-industriais','Eventos Industriais','eventos-industriais/','Agenda e fontes de palestras, webinars e treinamentos para a indústria brasileira.',{"total":0,"by_unit":{"eventos":0,"fontes":106}},status_='experimental'),
]
for b in blocks:
    if b['counts'].get('total') is None: b['counts'].pop('total'); b['counts']['total']=None
ds=lambda id,name,pub,url,lic,ra,meth=None,notes=None,lurl=None:{"id":id,"name":name,"publisher":pub,"url":url,"license":lic,"license_url":lurl,"retrieved_at":ra,"methodology":meth,"notes":notes}
datasets=[
 ds('ds-recursos-v17','Catálogo Recursos O&G v17','Projeto Industrial',f'{BASE}/recursos/','unknown','2026-10-18','Curadoria; links não verificados automaticamente.'),
 ds('ds-vagas-2026-10','Leitura de vagas petroquímica/química/O&G','Projeto Industrial',f'{BASE}/vagas/','unknown','2026-10-14','Leitura de páginas oficiais das empresas em 13 e 14/10/2026.','Nível e área são estimativas por palavras do título.'),
 ds('ds-manutencao-2026-10','Fontes de dado para manutenção preditiva','Projeto Industrial',f'{BASE}/manutencao/','mixed','2026-10-18','Verificação graduada; risco legal classificado.','Licença por item (ver items.jsonl).'),
 ds('ds-umi-2026-11','Bancada Industrial','Projeto Industrial',f'{BASE}/umi/','mixed','2026-11-06','Triagem; 62 itens com licença verificada na fonte.','Licença por item.'),
 ds('ds-fontes-industriais','Fontes de dados industriais','Projeto Industrial',f'{BASE}/fontes-industriais/','mixed',None,'Resumo de licença por fonte; pode estar desatualizado.'),
 ds('ds-censo-pnp-2023','Censo PNP 2023 (MEC/SETEC)','MEC/SETEC (Plataforma Nova Plataforma Nilo Peçanha)',f'{BASE}/portal-rede-federal/sobre-os-numeros.html','unknown',None,'8.587 linhas de oferta usadas por Catálogo e Portal Rede Federal.','URL aponta a página do projeto que descreve a fonte; URL oficial do dado a preencher pelo mantenedor.'),
 ds('ds-rede-federal-cursos-2026','Catálogo de cursos dos Institutos Federais (2026)','Projeto Industrial',f'{BASE}/portal-rede-federal/','unknown','2026-01-01',None,'retrieved_at aproximado ("pesquisado em 2026"); preencher data exata.'),
 ds('ds-catalogo-ofertas-2026','Ofertas atuais de cursos gratuitos','Projeto Industrial',f'{BASE}/catalogo-cursos-gratuitos/','unknown',None,'4.808 ofertas atuais em 6 blocos.'),
 ds('ds-mpx-specdb','MPX_specDB','Lenz R, Fischer F, Arnold M, et al. (2023)','https://doi.org/10.5281/zenodo.8314801','cc-by-sa-4.0',None,None,'Registro Zenodo 10149551. Atribuição obrigatória; os autores originais não endossam o aplicativo. Fonte: página do ID Polímero.',lurl='https://creativecommons.org/licenses/by-sa/4.0/'),
 ds('ds-fastex','FasTEX — fibras têxteis ATR-FTIR','Mendeley Data',f'{BASE}/id-polimero/','cc-by-4.0',None,None,'Identificador citado na página: Mendeley Data rx3fjgz96x.3. URL aponta a página do projeto que traz o crédito.',lurl='https://creativecommons.org/licenses/by/4.0/'),
 ds('ds-figshare-24593022','Figshare 24593022 (espectros)','Figshare','https://doi.org/10.6084/m9.figshare.24593022','cc-by-4.0',None,None,None,lurl='https://creativecommons.org/licenses/by/4.0/'),
 ds('ds-zenodo-15969268','Zenodo 15969268','Papadopoulou K, Ainali NM, Mašek O, Bikiaris DN (Polymers 16(21):3080, 2024)','https://doi.org/10.5281/zenodo.15969268','cc-by-4.0',None,None,'URL por convenção de DOI do Zenodo, a partir do número citado na página (conferir).',lurl='https://creativecommons.org/licenses/by/4.0/'),
 ds('ds-industriaedu-v226','Banco do IndústriaEDU v226','Projeto Industrial',f'{BASE}/industriaedu/','unknown','2026-07-22','Exportação v226; texto gerado em 2026-11-10.'),
]
datasets[6]['retrieved_at']=None; datasets[6]['notes']='Pesquisado em 2026 (data exata não consta no llms.txt).'
cat={"schema_version":"1.2","generated_at":HOJE+"T00:00:00Z","blocks":blocks,"datasets":datasets}
json.dump(cat,open('catalog.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
with open('items.jsonl','w',encoding='utf-8') as f:
    for it in items: f.write(json.dumps(it,ensure_ascii=False)+'\n')
for b in ['manutencao','fontes-industriais','umi','recursos']:
    print(b,len(cnt(b,'id')),'| licença:',cnt(b,'license'),'| status:',cnt(b,'license_status'))
