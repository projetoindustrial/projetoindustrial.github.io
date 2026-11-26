#!/usr/bin/env python3
"""Valida catalog.json + items.jsonl contra catalog.schema.json e roda as checagens que JSON Schema não faz. Uso: python3 validar_catalogo.py [pasta_dados_fonte | pasta_com_repositorios_clonados]"""
import json,sys,os,collections,csv
from jsonschema import Draft202012Validator
csv.field_size_limit(10**9)
S=json.load(open('catalog.schema.json',encoding='utf-8')); C=json.load(open('catalog.json',encoding='utf-8'))
I=[json.loads(l) for l in open('items.jsonl',encoding='utf-8')]
err=0
def bad(m):
    global err; err+=1; print('ERRO',m)
for e in Draft202012Validator(S).iter_errors(C): bad(f"catalog.json {list(e.path)}: {e.message[:140]}")
iv=Draft202012Validator({"$ref":"#/$defs/item","$defs":S["$defs"]})
n=0
for i,it in enumerate(I,1):
    for e in iv.iter_errors(it):
        n+=1
        if n<=10: bad(f"items.jsonl linha {i} {it['id']}: {e.message[:140]}")
if n>10: bad(f"... {n} erros de item no total")
ids=[x['id'] for x in I]; 
if len(ids)!=len(set(ids)): bad('ids de item duplicados')
B={b['id']:b for b in C['blocks']}; DS={d['id'] for d in C['datasets']}
if len(B)!=len(C['blocks']): bad('ids de bloco duplicados')
for b in C['blocks']:
    for d in b.get('datasets',[]):
        if d not in DS: bad(f"{b['id']}: dataset inexistente {d}")
    for o in b.get('shares_dataset_with',[]):
        if o not in B or b['id'] not in B[o].get('shares_dataset_with',[]): bad(f"{b['id']}: shares_dataset_with não simétrico com {o}")
    bv=b['counts'].get('by_verification')
    if bv and sum(bv.values())!=b['counts']['total']: bad(f"{b['id']}: by_verification soma {sum(bv.values())} ≠ total {b['counts']['total']}")
for it in I:
    if it['block'] not in B: bad(f"item {it['id']}: bloco inexistente")
    if it['dataset_id'] and it['dataset_id'] not in DS: bad(f"item {it['id']}: dataset inexistente")
bc=collections.Counter(x['block'] for x in I)
for b,c in bc.items():
    if B[b]['counts']['total']!=c: bad(f"{b}: counts.total {B[b]['counts']['total']} ≠ itens {c}")
if len(sys.argv)>1:
    # Aceita dois layouts: pasta plana (manutencao.csv, fontes.csv, umi.csv, recursos.csv)
    # ou a pasta com os repositórios clonados (<repo>/dados/catalogo.csv etc.).
    D=sys.argv[1]
    cand={'manutencao':['manutencao.csv','manutencao/dados/catalogo.csv'],
          'fontes-industriais':['fontes.csv','fontes-industriais/dados/catalogo.csv'],
          'umi':['umi.csv','umi/dados/catalogo.csv'],
          'recursos':['recursos.csv','projetoindustrial.github.io/recursos/dados/recursos.csv']}
    for b,opts in cand.items():
        f=next((os.path.join(D,o) for o in opts if os.path.exists(os.path.join(D,o))),None)
        if not f: bad(f"{b}: fonte não encontrada em {D} (tentei {opts})"); continue
        n=len(list(csv.reader(open(f,encoding='utf-8-sig',newline=''))))-1
        if n!=bc[b]: bad(f"{b}: {bc[b]} itens ≠ {n} linhas na fonte ({os.path.relpath(f,D)})")
print(f"blocos={len(B)} datasets={len(DS)} itens={len(I)} | ERROS={err}")
sys.exit(1 if err else 0)
