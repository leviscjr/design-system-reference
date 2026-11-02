"""Testes estáticos do UDS v0.1 (stdlib). Executar: python -m unittest discover -s tests

Cobrem o que é verificável sem navegador: tokens, contraste, coerência CSS<->tokens,
contrato CSP dos exemplos e ARIA declarativo. Comportamento visual/interativo exige
navegador (UNIVERSAL_DESIGN_VNEXT.md §8) e está registrado em CHANGELOG.md.
"""
import hashlib
import json
import re
import subprocess
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import uds_tokens  # noqa: E402

# Hash do tokens.json da extração (main 6865863): a extensão nunca pode reescrevê-lo.
TOKENS_JSON_SHA256 = '904fefc2ef47b30c84ff3a83c42c09b9efdb1189eb5bb1ef9ab4a3d163516984'


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


class Tokens(unittest.TestCase):
    def setUp(self):
        self.base = uds_tokens.load(ROOT / 'tokens.json')
        self.vnext = uds_tokens.load(ROOT / 'tokens.vnext.json')

    def test_extraction_untouched(self):
        data = (ROOT / 'tokens.json').read_bytes().replace(b'\r\n', b'\n')
        self.assertEqual(hashlib.sha256(data).hexdigest(), TOKENS_JSON_SHA256)

    def test_light_dark_parity(self):
        themes = self.vnext['themes']
        self.assertEqual(sorted(themes['light']), sorted(themes['dark']))

    def test_references_resolve(self):
        resolver = uds_tokens.Resolver(self.base, self.vnext)
        for theme in ('light', 'dark'):
            for role in self.vnext['themes'][theme]:
                resolver.value(theme, '{uds.%s}' % role)  # KeyError se referência quebrada

    def test_candidates_documented(self):
        """Todo valor literal (não-{sa.*}) precisa de proveniência declarada."""
        keys = self.vnext['provenance']['roles']
        def covered(role):
            for key in keys:
                if key == role or ('*' in key and re.fullmatch(re.escape(key).replace(r'\*', '.*'), role)):
                    return True
            return False
        for theme in ('light', 'dark'):
            for role, value in self.vnext['themes'][theme].items():
                if not str(value).startswith('{sa.'):
                    self.assertTrue(covered(role), 'valor literal sem proveniência: %s (%s)' % (role, theme))

    def test_contrast_all_pass(self):
        failures = [r for r in uds_tokens.contrast_report() if not r['pass']]
        self.assertEqual(failures, [])

    def test_generated_css_up_to_date(self):
        for path, text in uds_tokens.outputs().items():
            self.assertTrue(path.exists(), path)
            self.assertEqual(path.read_bytes().decode('utf-8').replace('\r\n', '\n'), text,
                             '%s desatualizado: rode tools/uds_tokens.py build' % path.name)


DEFINED = re.compile(r'(--[A-Za-z0-9_-]+)\s*:')
USED = re.compile(r'var\(\s*(--[A-Za-z0-9_-]+)\s*(,)?')


def defined_vars(*rels):
    names = set()
    for rel in rels:
        names |= set(DEFINED.findall(read(rel)))
    return names


class Css(unittest.TestCase):
    TOKENS = ('css/uds.tokens.css', 'css/uds.profile.lc-hub.css')

    def assert_vars_defined(self, rel, extra=()):
        defined = defined_vars(rel, *self.TOKENS, *extra)
        missing = sorted({name for name, fallback in USED.findall(read(rel))
                          if not fallback and name not in defined and not name.startswith('--pf-')})
        self.assertEqual(missing, [], '%s usa variáveis indefinidas' % rel)

    def test_components_vars(self):
        self.assert_vars_defined('css/uds.components.css')

    def test_bridge_vars(self):
        self.assert_vars_defined('adapters/lc-hub/lchub-bridge.css')

    def test_keycloak_vars(self):
        kc = 'adapters/keycloak/lc-hub/login/resources/css/'
        self.assert_vars_defined(kc + 'uds-login.css', extra=(kc + 'uds.tokens.css', kc + 'uds.profile.lc-hub.css'))

    def test_keycloak_theme_lists_generated_css(self):
        props = read('adapters/keycloak/lc-hub/login/theme.properties')
        self.assertIn('parent=keycloak.v2', props)
        styles = re.search(r'^styles=(.*)$', props, re.M).group(1).split()
        self.assertEqual(styles[0], 'css/styles.css')
        for css in styles[1:]:
            self.assertTrue((ROOT / 'adapters/keycloak/lc-hub/login/resources' / css).exists(), css)

    def test_reduced_motion_present(self):
        for rel in ('css/uds.components.css', 'adapters/keycloak/lc-hub/login/resources/css/uds-login.css'):
            self.assertIn('prefers-reduced-motion', read(rel))


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.inline = [], [], []
        self.controls_buttons = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        for key in ('aria-controls', 'aria-labelledby', 'aria-describedby', 'for', 'data-uds-drawer-open'):
            if a.get(key):
                self.refs += [(key, ref) for ref in a[key].split()]
        if tag == 'style' or 'style' in a or any(k.startswith('on') for k in a):
            self.inline.append((tag, a))
        if tag == 'script' and not a.get('src'):
            self.inline.append((tag, a))
        if 'data-uds-disclosure' in a or 'data-uds-menu' in a:
            self.controls_buttons.append((tag, a))


class Examples(unittest.TestCase):
    PAGES = ('examples/components.html',)

    def parse(self, rel):
        page = Page()
        page.feed(read(rel))
        return page

    def test_csp_no_inline(self):
        for rel in self.PAGES + ('examples/keycloak-login-preview.html',):
            self.assertEqual(self.parse(rel).inline, [], '%s tem estilo/script inline' % rel)

    def test_ids_unique_and_refs_valid(self):
        for rel in self.PAGES:
            page = self.parse(rel)
            dupes = {i for i in page.ids if page.ids.count(i) > 1}
            self.assertEqual(dupes, set(), rel)
            broken = [(k, r) for k, r in page.refs if r not in page.ids]
            self.assertEqual(broken, [], rel)

    def test_toggles_declare_state(self):
        for rel in self.PAGES:
            for tag, a in self.parse(rel).controls_buttons:
                self.assertEqual(tag, 'button')
                self.assertIn(a.get('aria-expanded'), ('true', 'false'))
                self.assertTrue(a.get('aria-controls'))

    def test_icon_buttons_have_names(self):
        for rel in self.PAGES:
            for match in re.finditer(r'<button[^>]*uds-btn--icon[^>]*>', read(rel)):
                self.assertIn('aria-label=', match.group(0))


class Script(unittest.TestCase):
    def test_no_eval_like(self):
        src = read('js/uds.js')
        for bad in ('eval(', 'new Function', 'innerHTML', "setTimeout('", 'setTimeout("'):
            self.assertNotIn(bad, src)

    def test_node_syntax(self):
        try:
            done = subprocess.run(['node', '--check', str(ROOT / 'js' / 'uds.js')], capture_output=True, text=True)
        except FileNotFoundError:
            self.skipTest('node indisponível')
        self.assertEqual(done.returncode, 0, done.stderr)


if __name__ == '__main__':
    unittest.main()
