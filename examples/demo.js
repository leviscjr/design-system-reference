// Apenas para os exemplos: liga/desliga o perfil LC Hub para comparar com o universal.
document.addEventListener('click', function (event) {
  var button = event.target.closest('[data-uds-profile-toggle]');
  if (!button) { return; }
  var root = document.documentElement;
  var on = root.getAttribute('data-uds-profile') !== 'lc-hub';
  if (on) { root.setAttribute('data-uds-profile', 'lc-hub'); } else { root.removeAttribute('data-uds-profile'); }
  button.setAttribute('aria-pressed', String(on));
});
