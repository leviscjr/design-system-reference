"""Universal Design System — build e verificação de tokens (stdlib, sem dependências).

Camadas, em ordem de precedência crescente:
  1. tokens.json              extração Shared_Arch (FATO; nunca reescrita aqui)
  2. tokens.vnext.json        extensão universal vNext (papéis semânticos)
  3. profiles/*.tokens.json   perfil de produto (escopo `[data-uds-profile]`)

Saídas versionadas:
  css/uds.tokens.css                         CSS do núcleo para desenvolvimento
  dist/uds-v0.1/                             pacote UDS independente

Uso:
  python tools/uds_tokens.py build     gera os arquivos CSS
  python tools/uds_tokens.py check     falha se o CSS versionado estiver desatualizado
  python tools/uds_tokens.py contrast  relatório WCAG dos pares declarados
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = re.compile(r'^\{(sa|uds)\.([A-Za-z0-9.-]+)\}$')
HEADER = ('/* GERADO por tools/uds_tokens.py a partir de {sources}. Não editar à mão. */\n')


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def var_name(prefix, key):
    return '--%s-%s' % (prefix, key.replace('.', '-'))


def extracted_colors(base):
    """Cores da extração por tema: {'light': {key: value}, 'dark': {...}}."""
    color = base['semantic']['color']
    return {theme: dict(color[theme]) for theme in ('light', 'dark')}


# --------------------------------------------------------------------------
# Resolução (para contraste) e emissão (para CSS)
# --------------------------------------------------------------------------

class Resolver:
    def __init__(self, base, vnext, profile=None):
        self.sa = extracted_colors(base)
        self.layers = [vnext] + ([profile] if profile else [])

    def roles(self, theme):
        merged = {}
        for layer in self.layers:
            merged.update(layer.get('themes', {}).get(theme, {}))
        return merged

    def value(self, theme, ref, seen=()):
        match = REF.match(ref) if isinstance(ref, str) else None
        if not match:
            return ref
        space, key = match.groups()
        if space == 'sa':
            if key not in self.sa[theme]:
                raise KeyError('referência inexistente na extração: %s (%s)' % (ref, theme))
            return self.sa[theme][key]
        if key in seen:
            raise ValueError('referência circular: %s' % ' -> '.join(seen + (key,)))
        roles = self.roles(theme)
        if key not in roles:
            raise KeyError('papel inexistente: %s (%s)' % (ref, theme))
        return self.value(theme, roles[key], seen + (key,))


def css_value(value):
    match = REF.match(value) if isinstance(value, str) else None
    if not match:
        return value
    space, key = match.groups()
    return 'var(%s)' % var_name(space, key)


def block(selector, declarations):
    body = ''.join('  %s: %s;\n' % (k, v) for k, v in declarations)
    return '%s {\n%s}\n' % (selector, body)


def scalars_css(layer):
    return [(var_name('uds', k), css_value(v)) for k, v in sorted(layer.get('scalars', {}).items())
            if not k.startswith('_')]


def theme_css(layer, theme):
    roles = layer.get('themes', {}).get(theme, {})
    return [(var_name('uds', k), css_value(v)) for k, v in roles.items() if not k.startswith('_')]


def build_base(base, vnext):
    sa = extracted_colors(base)
    light = [(var_name('sa', k), v) for k, v in sa['light'].items()]
    dark = [(var_name('sa', k), v) for k, v in sa['dark'].items()]
    typo = []
    for role, spec in base['semantic']['typography'].items():
        if role.startswith('_'):
            continue
        typo += [(var_name('uds', 'type.%s.size' % role), '%spx' % spec['size']),
                 (var_name('uds', 'type.%s.line' % role), '%spx' % spec['lineHeight']),
                 (var_name('uds', 'type.%s.weight' % role), str(spec['weight']))]
    prim = base['primitive']
    scale = [(var_name('uds', 'space.%s' % k), '%spx' % v) for k, v in prim['spacing'].items()]
    scale += [(var_name('uds', 'radius.%s' % k), '%spx' % v) for k, v in prim['radius'].items()]
    scale += [(var_name('uds', 'layout.header-height'), '%spx' % base['layout']['headerHeight'])]
    for size, spec in base['component']['button'].items():
        if size.startswith('_'):
            continue
        scale += [(var_name('uds', 'control.%s.height' % size), '%spx' % spec['height']),
                  (var_name('uds', 'control.%s.padding-x' % size), '%spx' % spec['paddingX']),
                  (var_name('uds', 'control.%s.font-size' % size), '%spx' % spec['fontSize']),
                  (var_name('uds', 'control.%s.icon-size' % size), '%spx' % spec['iconSize'])]
    out = [HEADER.format(sources='tokens.json + tokens.vnext.json'),
           '/* Extração (--sa-*), regra de nome preservada de tokens.json meta.cssVarNamingRule. */\n',
           block(':root', [('color-scheme', 'light')] + light + typo + scale + scalars_css(vnext)
                 + theme_css(vnext, 'light')),
           '\n',
           block(':root[data-theme="dark"]', [('color-scheme', 'dark')] + dark + theme_css(vnext, 'dark')),
           '\n@media (prefers-color-scheme: dark) {\n',
           re.sub(r'^', '  ', block(':root[data-theme="auto"]', [('color-scheme', 'dark')] + dark
                                    + theme_css(vnext, 'dark')), flags=re.M).rstrip(' '),
           '}\n']
    return ''.join(out)


def build_profile(name, profile, source, selector=None):
    # :root[...] vence o :root da base independentemente da ordem de carga; o seletor
    # simples permite aplicar o perfil a uma subárvore. Espelhos podem fixar outro escopo.
    selector = selector or ':root[data-uds-profile="%s"], [data-uds-profile="%s"]' % (name, name)
    out = [HEADER.format(sources=source),
           '/* Perfil de produto: valores escopados; não são defaults universais. */\n',
           block(selector, scalars_css(profile) + theme_css(profile, 'light'))]
    dark = theme_css(profile, 'dark')
    if dark:
        out += ['\n', block(':root[data-theme="dark"][data-uds-profile="%s"]' % name, dark)]
    return ''.join(out)


def _read(rel):
    return (ROOT / rel).read_text(encoding='utf-8').replace('\r\n', '\n')


def _manifest(files, package, version):
    entries = []
    for path, content in sorted(files.items(), key=lambda item: item[0].as_posix()):
        entries.append({
            'path': path.as_posix(),
            'sha256': hashlib.sha256(content.encode('utf-8')).hexdigest(),
        })
    return json.dumps({'package': package, 'version': version, 'files': entries}, indent=2) + '\n'


def outputs():
    base, vnext = load(ROOT / 'tokens.json'), load(ROOT / 'tokens.vnext.json')
    base_css = build_base(base, vnext)
    files = {ROOT / 'css' / 'uds.tokens.css': base_css}

    package_root = ROOT / 'dist' / 'uds-v0.1'
    package_files = {
        Path('css/uds.tokens.css'): base_css,
        Path('css/uds.components.css'): _read('css/uds.components.css'),
        Path('js/uds.js'): _read('js/uds.js'),
        Path('tokens.json'): _read('tokens.json'),
        Path('tokens.vnext.json'): _read('tokens.vnext.json'),
        Path('COMPONENTS.md'): _read('COMPONENTS.md'),
        Path('LICENSE'): _read('LICENSE'),
        Path('patterns/AUTHENTICATION.md'): _read('patterns/AUTHENTICATION.md'),
    }
    for rel, content in package_files.items():
        files[package_root / rel] = content
    files[package_root / 'manifest.json'] = _manifest(package_files, 'uds', vnext['meta']['version'])

    return files


# --------------------------------------------------------------------------
# Contraste WCAG 2.x
# --------------------------------------------------------------------------

def rgb(value):
    value = value.strip()
    match = re.fullmatch(r'#([0-9a-fA-F]{6})', value)
    if match:
        h = match.group(1)
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)), 1.0
    match = re.fullmatch(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)', value)
    if match:
        r, g, b, a = match.groups()
        return (int(r), int(g), int(b)), float(a) if a is not None else 1.0
    raise ValueError('cor não suportada para contraste: %s' % value)


def composite(fg, bg):
    (fr, alpha), (br, _) = rgb(fg), rgb(bg)
    return '#%02X%02X%02X' % tuple(round(f * alpha + b * (1 - alpha)) for f, b in zip(fr, br))


def luminance(value):
    def channel(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    (r, g, b), _ = rgb(value)
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


def ratio(fg, bg):
    if rgb(bg)[1] < 1:
        raise ValueError('fundo translúcido sem base: %s' % bg)
    if rgb(fg)[1] < 1:
        fg = composite(fg, bg)
    a, b = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (a + 0.05) / (b + 0.05)


def contrast_report():
    base, vnext = load(ROOT / 'tokens.json'), load(ROOT / 'tokens.vnext.json')
    layers = [('vnext', vnext, Resolver(base, vnext))]
    rows = []
    for name, layer, resolver in layers:
        for pair in layer.get('contrastPairs', []):
            for theme in pair.get('themes', ('light', 'dark')):
                bg = resolver.value(theme, '{uds.%s}' % pair['bg'])
                fg = resolver.value(theme, '{uds.%s}' % pair['fg'])
                if rgb(bg)[1] < 1:
                    bg = composite(bg, resolver.value(theme, '{uds.surface.page}'))
                value = ratio(fg, bg)
                rows.append({'layer': name, 'theme': theme, 'fg': pair['fg'], 'bg': pair['bg'],
                             'min': pair['min'], 'ratio': round(value, 2), 'pass': value >= pair['min'],
                             'use': pair.get('use', '')})
    return rows


def main(argv):
    command = argv[1] if len(argv) > 1 else 'build'
    if command == 'build':
        for path, text in outputs().items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(text.encode('utf-8'))
            print('gerado', path.relative_to(ROOT).as_posix())
        return 0
    if command == 'check':
        stale = [p for p, t in outputs().items()
                 if not p.exists() or p.read_bytes().decode('utf-8').replace('\r\n', '\n') != t]
        for path in stale:
            print('DESATUALIZADO', path.relative_to(ROOT).as_posix())
        return 1 if stale else 0
    if command == 'contrast':
        rows = contrast_report()
        for r in rows:
            print('%-4s %-6s %-5s %-24s on %-18s %5.2f >= %.1f  %s' % (
                'PASS' if r['pass'] else 'FAIL', r['layer'], r['theme'], r['fg'], r['bg'],
                r['ratio'], r['min'], r['use']))
        return 0 if all(r['pass'] for r in rows) else 1
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
