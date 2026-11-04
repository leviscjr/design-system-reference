/* Caso de uso Remora (fixture) — dados do shell.
 * REAL: valores, unidades, nomes e posições de evidência vêm do datasheet SLFS022K (TI), via tools/prepare_fixture.py.
 * FIXTURE (simulado): estados de classificação/revisão, histórico de revisão e a existência dos candidatos.
 * Nada aqui é uma validação executada pelo Remora. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const FX = window.__FIXTURE__;            // injetado pelo build: JSON gerado do PDF
  const PAGES = window.__FIXTURE_PAGES__;   // { n: dataURI } páginas renderizadas

  const kinds = {
    group: { icon: 'layers', label: 'Grupo' }, supplier: { icon: 'building', label: 'Fornecedor' }, family: { icon: 'boxes', label: 'Família' },
    model: { icon: 'cpu', label: 'Modelo' }, document: { icon: 'file-text', label: 'Documento' }, section: { icon: 'list', label: 'Seção' },
    parameter: { icon: 'sliders', label: 'Parâmetro' }, observation: { icon: 'eye', label: 'Observação' }, candidate: { icon: 'flag', label: 'Candidato' },
  };
  const states = {
    obs: { label: 'Observado', tone: 'info', icon: 'eye' }, cand: { label: 'Candidato', tone: 'primary', icon: 'dashed' },
    acc: { label: 'Aceito', tone: 'positive', icon: 'check' }, rev: { label: 'Revisar', tone: 'warning', icon: 'flag' },
    rej: { label: 'Rejeitado', tone: 'negative', icon: 'x' }, none: { label: 'Sem estado', tone: 'muted', icon: 'dot', filter: false },
  };

  const MODELS = ['NA555', 'NE555', 'SA555', 'SE555'];
  const modelState = { NA555: 'cand', NE555: 'acc', SA555: 'cand', SE555: 'rev' };           // fixture
  const paramState = { 'abs.vcc': 'cand', 'rec.vcc': 'cand', 'rec.ta.ne': 'acc', 'el.thres15': 'rev' }; // fixture
  const E = [];
  const add = (e) => { E.push(e); return e; };
  const pval = (p) => { const v = p.typ || p.max || p.min; return v ? v + ' ' + p.unit : ''; };
  const plabel = (p) => {
    const q = [p.symbol, p.name].filter(Boolean).join(' · ');
    const esd = /\((HBM|CDM)\)/.exec(p.condition);
    const cond = esd ? esd[1] : p.condition && p.condition.length <= 12 ? p.condition : '';
    const who = p.applies.length === 1 ? p.applies[0].split(' · ')[0] : '';
    return [q, cond, who].filter(Boolean).join(' · ');
  };

  add({ id: 'grp:cat', kind: 'group', label: 'Catálogo', meta: 'fixture' });
  add({ id: 'sup:ti', kind: 'supplier', label: FX.source.manufacturer, parent: 'grp:cat', state: 'cand', search: 'fornecedor Texas Instruments TI' });
  add({ id: 'grp:timing', kind: 'group', label: 'Temporizadores', parent: 'sup:ti', search: 'timers' });
  add({ id: 'fam:xx555', kind: 'family', label: 'xx555 Precision Timers', parent: 'grp:timing', state: 'cand', meta: '4 modelos' });
  MODELS.forEach((m) => add({ id: 'mod:' + m, kind: 'model', label: m, parent: 'fam:xx555', state: modelState[m], search: 'modelo part number' }));
  const DOC = 'doc:slfs022k';
  add({ id: DOC, kind: 'document', label: FX.source.docId + ' · datasheet', parent: 'fam:xx555', state: 'cand', meta: 'Rev. K', search: FX.source.title, src: FX.source });
  const secs = [];
  FX.params.forEach((p) => { if (!secs.includes(p.section)) secs.push(p.section); });
  secs.forEach((s) => add({ id: 'sec:' + s.split(' ')[0], kind: 'section', label: s, parent: DOC, meta: String(FX.params.filter((p) => p.section === s).length) }));
  FX.params.forEach((p) => add({ id: 'par:' + p.id, kind: 'parameter', label: plabel(p), parent: 'sec:' + p.section.split(' ')[0], state: paramState[p.id] || 'obs', meta: pval(p), search: [p.name, p.symbol, p.condition, p.applies.join(' ')].join(' '), data: p }));
  add({ id: 'grp:amp', kind: 'group', label: 'Amplificadores operacionais', parent: 'sup:ti' });
  const LM = { docId: 'SLOS068AB', title: 'Industry-Standard Dual Operational Amplifiers datasheet (Rev. AB)', pages: 68, url: 'https://www.ti.com/lit/ds/symlink/lm358.pdf', sha256: '8277dff7b89138c63b3582d37f378065a1dea3cae5ed1e2926ddc2779eb7e3a2', bytes: 4150801, manufacturer: 'Texas Instruments', renderedPages: [] };
  add({ id: 'doc:slos068ab', kind: 'document', label: LM.docId + ' · datasheet', parent: 'grp:amp', state: 'none', meta: 'Rev. AB', src: LM, search: LM.title });

  /* nós fora da árvore (evidências e candidatos) — pertencem ao documento */
  const OBS = {}; FX.observations.forEach((o) => { OBS[o.id] = o; });
  const oLabel = { 'obs.family': 'Título da família', 'obs.models': 'Códigos de modelo', 'obs.docid': 'Identificador do documento', 'obs.maker': 'Fabricante (copyright)' };
  FX.observations.forEach((o) => add({ id: 'obs:' + o.id.split('.')[1], kind: 'observation', label: oLabel[o.id], parent: DOC, tree: false, state: 'obs', meta: 'p. ' + o.evidence.page, data: o, search: o.text }));
  add({ id: 'obs:subject', kind: 'observation', label: 'Metadado PDF: Subject', parent: DOC, tree: false, state: 'obs', meta: 'metadado', data: { id: 'obs.subject', role: 'pdf-subject', text: 'Data Sheet', evidence: null }, search: 'Data Sheet subject' });
  add({ id: 'cand:type', kind: 'candidate', label: 'Tipo: datasheet', parent: DOC, tree: false, state: 'cand', data: { role: 'document-type', text: 'datasheet' }, search: 'tipo de documento' });

  /* relações de evidência → candidato (não são hierarquia) */
  const REL = [
    ['obs:subject', 'cand:type', 'evidência'], ['obs:family', 'fam:xx555', 'evidência'], ['obs:maker', 'sup:ti', 'evidência'], ['obs:docid', DOC, 'evidência'],
  ].concat(MODELS.map((m) => ['obs:models', 'mod:' + m, 'evidência']));
  REL.push(['cand:type', DOC, 'classifica']);

  const byId = {}; E.forEach((e) => { byId[e.id] = e; });
  [DOC].concat(['doc:slos068ab']).forEach((id) => { byId[id].review = []; });
  Object.keys(paramState).forEach((k) => { byId['par:' + k].review = [{ from: 'obs', to: paramState[k], note: 'fixture' }]; });
  MODELS.forEach((m) => { if (modelState[m] !== 'cand') byId['mod:' + m].review = [{ from: 'cand', to: modelState[m], note: 'fixture' }]; });

  function scopeOf(store, id) {
    let e = store.get(id);
    if (e.kind === 'document') return e;
    for (const a of store.ancestors(id).slice().reverse()) if (store.get(a).kind === 'document') return store.get(a);
    const fam = e.kind === 'family' ? e : store.ancestors(id).map((x) => store.get(x)).find((x) => x.kind === 'family');
    if (fam) return store.children(fam.id).map((c) => store.get(c)).find((c) => c.kind === 'document') || null;
    return null;
  }

  SEA.fixture = { kinds, states, entities: E, scopeOf, DOC, MODELS, REL, FX, PAGES, pval, byId };
})();
