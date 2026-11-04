/* Boot do caso de uso: injeta modelo, viewers, inspetor e ações no WorkspaceShell. */
(function () {
  const SEA = (window.SEA = window.SEA || {});
  const F = SEA.fixture;
  function boot() {
    SEA.app = SEA.WorkspaceShell(document.getElementById('app'), {
      brand: { name: 'T2U', tip: 'T2U · SEA' },
      model: { entities: F.entities, kinds: F.kinds, states: F.states, scopeOf: F.scopeOf },
      viewers: [SEA.viewerPdf, SEA.viewerTable, SEA.viewerStructure, SEA.viewerRecord],
      inspect: SEA.demoInspect.inspect, actions: SEA.demoInspect.actions, commands: SEA.demoInspect.commands,
      atmosphere: SEA.SeaAtmosphere(),
      initialSelection: 'par:h3.ac',
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
