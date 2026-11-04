/* Dados documentais Fox ESS verificados; estados e relações de revisão são fixture. */
(function () {
  const SEA = (window.SEA = window.SEA || {}), raw = window.__FIXTURE__, PAGES = window.__FIXTURE_PAGES__;
  const kinds = {
    group:{icon:'layers',label:'Grupo'}, supplier:{icon:'building',label:'Fornecedor'}, family:{icon:'boxes',label:'Família'},
    model:{icon:'cpu',label:'Modelo'}, document:{icon:'file-text',label:'Documento'}, section:{icon:'list',label:'Seção'},
    parameter:{icon:'sliders',label:'Parâmetro'}, observation:{icon:'eye',label:'Observação'}, candidate:{icon:'flag',label:'Candidato'},
  };
  const states = {
    obs:{label:'Observado',tone:'info',icon:'eye'}, cand:{label:'Candidato',tone:'primary',icon:'dashed'},
    acc:{label:'Aceito',tone:'positive',icon:'check'}, rev:{label:'Revisar',tone:'warning',icon:'flag'},
    rej:{label:'Rejeitado',tone:'negative',icon:'x'}, none:{label:'Sem estado',tone:'muted',icon:'dot',filter:false},
  };
  const documents = Object.fromEntries(raw.documents.map(d=>[d.key,d]));
  const E=[], REL=[], add=e=>(E.push(e),e), DOC='doc:h3';
  const pval=p=>[p.typ,p.unit].filter(Boolean).join(' ');
  add({id:'grp:cat',kind:'group',label:'Equipamentos',meta:'fixture'});
  add({id:'sup:fox',kind:'supplier',label:'Fox ESS',parent:'grp:cat',state:'cand'});
  for(const d of raw.documents) {
    const family='fam:'+d.key, document='doc:'+d.key;
    add({id:family,kind:'family',label:d.key==='h3'?'Inversor H3 Plus':'Sistema de baterias CQ16',parent:'sup:fox',state:'cand',docKey:d.key});
    for(const model of d.models) add({id:'mod:'+model,kind:'model',label:model,parent:family,state:'cand',docKey:d.key,meta:'Fox ESS'});
    add({id:document,kind:'document',label:d.label,parent:family,state:'cand',docKey:d.key,meta:'v'+d.source.revision.split(' · ')[0],src:d.source});
    const sections=[...new Set(d.params.map(p=>p.section))];
    for(const section of sections) {
      const sid='sec:'+d.key+':'+section;
      add({id:sid,kind:'section',label:section,parent:document,docKey:d.key,meta:String(d.params.filter(p=>p.section===section).length)});
      for(const p of d.params.filter(p=>p.section===section)) add({id:'par:'+p.id,kind:'parameter',label:p.name,parent:sid,docKey:d.key,state:'obs',meta:pval(p),data:p,search:[p.name,p.condition,p.applies.join(' '),p.typ,p.unit].join(' ')});
    }
    add({id:'obs:'+d.key,kind:'observation',label:'Identificação do datasheet',parent:document,docKey:d.key,tree:false,state:'obs',data:{role:'document-id',text:d.source.title}});
    add({id:'cand:'+d.key,kind:'candidate',label:'Tipo: datasheet',parent:document,docKey:d.key,tree:false,state:'cand',data:{role:'document-type',text:'datasheet'}});
    REL.push(['obs:'+d.key,'cand:'+d.key,'evidência'],['cand:'+d.key,document,'classifica']);
  }
  const byId=Object.fromEntries(E.map(e=>[e.id,e]));
  function scopeOf(store,id) { const e=store.get(id); return e && e.docKey ? store.get('doc:'+e.docKey) : null; }
  SEA.fixture={kinds,states,entities:E,scopeOf,DOC,REL,documents,PAGES,pval,byId,MODELS:raw.documents.flatMap(d=>d.models)};
})();
