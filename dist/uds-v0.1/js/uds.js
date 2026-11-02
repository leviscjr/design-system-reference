/*
 * Universal Design System — comportamento v0.1.
 * Vanilla, sem dependências, sem eval/inline: compatível com CSP `script-src 'self'`.
 * Ativado por atributos data-uds-*; HTML continua funcional sem JS (progressive enhancement).
 *
 *   data-uds-disclosure            botão com aria-controls -> alterna aria-expanded + [hidden]
 *   data-uds-drawer-open="<id>"    abre .uds-drawer / .uds-explorer como overlay com foco gerido
 *   data-uds-drawer-close          fecha o overlay que o contém
 *   data-uds-menu                  botão de menu (aria-controls -> [role=menu])
 *   data-uds-validate              <form>: validação acessível pela Constraint Validation API
 *   data-uds-theme-toggle          alterna data-theme light/dark em <html>
 */
(function () {
  'use strict';

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var active = null; // overlay aberto: um por vez (vNext §6)

  function byId(id) { return id ? document.getElementById(id) : null; }
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll(FOCUSABLE), visible);
  }

  // ---------- Disclosure ----------
  function toggleDisclosure(trigger, force) {
    var panel = byId(trigger.getAttribute('aria-controls'));
    if (!panel) { return; }
    var open = typeof force === 'boolean' ? force : trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  }

  // ---------- Drawer / explorer overlay ----------
  function isOverlay(panel) {
    // O explorer só é overlay quando o CSS o posiciona como fixed (larguras estreitas).
    return !panel.classList.contains('uds-explorer') || getComputedStyle(panel).position === 'fixed';
  }

  function backdrop() {
    var el = document.querySelector('.uds-backdrop[data-uds-backdrop]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'uds-backdrop';
      el.setAttribute('data-uds-backdrop', '');
      el.hidden = true;
      document.body.appendChild(el);
    }
    return el;
  }

  function openDrawer(panel, trigger) {
    if (!panel || !isOverlay(panel)) { return; }
    if (active && active.panel !== panel) { closeDrawer(); }
    var bd = backdrop();
    active = { panel: panel, trigger: trigger || document.activeElement };
    panel.classList.add('is-open');
    panel.setAttribute('role', panel.getAttribute('role') || 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (trigger) { trigger.setAttribute('aria-expanded', 'true'); }
    bd.hidden = false;
    requestAnimationFrame(function () { bd.classList.add('is-visible'); });
    document.documentElement.classList.add('uds-lock-scroll');
    var first = panel.querySelector('[data-uds-autofocus]') || focusables(panel)[0] || panel;
    if (first === panel) { panel.setAttribute('tabindex', '-1'); }
    first.focus();
  }

  function closeDrawer() {
    if (!active) { return; }
    var current = active;
    active = null;
    current.panel.classList.remove('is-open');
    current.panel.removeAttribute('aria-modal');
    if (current.panel.classList.contains('uds-explorer')) { current.panel.removeAttribute('role'); }
    var bd = backdrop();
    bd.classList.remove('is-visible');
    bd.hidden = true;
    document.documentElement.classList.remove('uds-lock-scroll');
    if (current.trigger && current.trigger.setAttribute) {
      current.trigger.setAttribute('aria-expanded', 'false');
      current.trigger.focus();
    }
  }

  function trapTab(event) {
    var items = focusables(active.panel);
    if (!items.length) { event.preventDefault(); return; }
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  // ---------- Menu ----------
  var openMenu = null;
  function menuItems(list) { return Array.prototype.slice.call(list.querySelectorAll('[role="menuitem"]')); }
  function setMenu(button, open, focusIndex) {
    var list = byId(button.getAttribute('aria-controls'));
    if (!list) { return; }
    if (open && openMenu && openMenu !== button) { setMenu(openMenu, false); }
    button.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    openMenu = open ? button : null;
    if (open) {
      var items = menuItems(list);
      if (items.length) { items[(focusIndex + items.length) % items.length].focus(); }
    }
  }
  function moveInMenu(list, delta) {
    var items = menuItems(list);
    var index = items.indexOf(document.activeElement);
    if (delta === 'first') { index = 0; } else if (delta === 'last') { index = items.length - 1; }
    else { index = (index + delta + items.length) % items.length; }
    if (items[index]) { items[index].focus(); }
  }

  // ---------- Validação ----------
  function errorFor(field) {
    return document.querySelector('[data-uds-error-for="' + field.id + '"]');
  }
  function message(field) {
    var v = field.validity;
    if (v.valueMissing) { return field.getAttribute('data-uds-msg-required') || 'Campo obrigatório.'; }
    if (v.typeMismatch && field.type === 'email') { return field.getAttribute('data-uds-msg-type') || 'Informe um e-mail válido.'; }
    if (v.tooShort) { return 'Use pelo menos ' + field.minLength + ' caracteres.'; }
    if (v.patternMismatch) { return field.getAttribute('data-uds-msg-pattern') || 'Formato inválido.'; }
    return field.validationMessage;
  }
  function validateField(field) {
    if (!field.willValidate || !field.id) { return true; }
    var ok = field.checkValidity();
    var slot = errorFor(field);
    if (ok) { field.removeAttribute('aria-invalid'); } else { field.setAttribute('aria-invalid', 'true'); }
    if (slot) { slot.textContent = ok ? '' : message(field); }
    return ok;
  }

  // ---------- Delegação ----------
  document.addEventListener('click', function (event) {
    var target = event.target;
    var el;
    if ((el = target.closest('[data-uds-disclosure]'))) { toggleDisclosure(el); return; }
    if ((el = target.closest('[data-uds-drawer-open]'))) {
      openDrawer(byId(el.getAttribute('data-uds-drawer-open')), el); return;
    }
    if (target.closest('[data-uds-drawer-close]') || target.closest('.uds-backdrop[data-uds-backdrop]')) {
      closeDrawer(); return;
    }
    if ((el = target.closest('[data-uds-menu]'))) {
      setMenu(el, el.getAttribute('aria-expanded') !== 'true', 0); return;
    }
    if (openMenu && !target.closest('[role="menu"]')) { setMenu(openMenu, false); }
    if (openMenu && target.closest('[role="menuitem"]')) { setMenu(openMenu, false); }
    if ((el = target.closest('[data-uds-theme-toggle]'))) {
      var root = document.documentElement;
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      el.setAttribute('aria-pressed', String(next === 'dark'));
    }
  });

  document.addEventListener('keydown', function (event) {
    if (active) {
      if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); return; }
      if (event.key === 'Tab') { trapTab(event); return; }
    }
    var button = event.target.closest && event.target.closest('[data-uds-menu]');
    if (button && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setMenu(button, true, event.key === 'ArrowDown' ? 0 : -1);
      return;
    }
    if (openMenu) {
      var list = byId(openMenu.getAttribute('aria-controls'));
      var keys = { ArrowDown: 1, ArrowUp: -1, Home: 'first', End: 'last' };
      if (event.key in keys) { event.preventDefault(); moveInMenu(list, keys[event.key]); }
      else if (event.key === 'Escape') { event.preventDefault(); var b = openMenu; setMenu(b, false); b.focus(); }
      else if (event.key === 'Tab') { setMenu(openMenu, false); }
    }
  });

  document.addEventListener('focusout', function (event) {
    var field = event.target;
    if (!field.form || !field.form.hasAttribute('data-uds-validate')) { return; }
    // Campo vazio só é acusado no envio: sair de um campo não é intenção de enviar.
    if (field.value !== '' || field.getAttribute('aria-invalid') === 'true') { validateField(field); }
  });
  document.addEventListener('input', function (event) {
    var form = event.target.form;
    if (form && form.hasAttribute('data-uds-validate') && event.target.getAttribute('aria-invalid') === 'true') {
      validateField(event.target);
    }
  });
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form.hasAttribute('data-uds-validate')) { return; }
    var invalid = Array.prototype.filter.call(form.elements, function (f) { return !validateField(f); });
    if (invalid.length) {
      event.preventDefault();
      invalid[0].focus();
      var summary = form.querySelector('[data-uds-error-summary]');
      if (summary) {
        summary.hidden = false;
        summary.textContent = invalid.length === 1 ? 'Corrija 1 campo destacado.' : 'Corrija ' + invalid.length + ' campos destacados.';
      }
    }
  }, true);

  // Fecha overlays do explorer ao alargar a janela (deixa de ser overlay).
  window.addEventListener('resize', function () {
    if (active && !isOverlay(active.panel)) { closeDrawer(); }
  });

  // Estado inicial coerente: painéis de disclosure seguem aria-expanded declarado no HTML.
  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-uds-disclosure]'), function (t) {
      toggleDisclosure(t, t.getAttribute('aria-expanded') === 'true');
    });
    document.documentElement.classList.add('uds-js');
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

  window.UDS = { openDrawer: openDrawer, closeDrawer: closeDrawer, validateField: validateField };
}());
