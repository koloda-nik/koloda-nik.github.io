const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'cases/opportunity.html', 'cases/neural.html', 'cases/museum.html'];

for (const page of pages) {
  test(`${page}: local assets and navigation targets exist`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.match(html, /lang="ru"/);
    assert.match(html, /name="viewport"/);
    assert.match(html, /rel="icon" type="image\/png" href="(?:\.\.\/|\.\/)pictures\/profile\.png"/);
    assert.match(html, /<footer class="site-footer"><span>v\. 0\.2<\/span><span>© 2026<\/span><\/footer>/);
    assert.doesNotMatch(html, /cursor-glow|href="#"|href="mailto:"/);
    for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(?:https?:|mailto:)/.test(url)) continue;
      const localPath = url.split('?')[0];
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(page), localPath)), `${page}: missing ${url}`);
    }
    for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(img, /alt="[^"]+"/);
      assert.match(img, /width="\d+" height="\d+"/);
      const src = img.match(/src="([^"]+)"/)[1];
      if (src.endsWith('.png')) {
        const png = fs.readFileSync(path.resolve(root, path.dirname(page), src));
        const width = Number(img.match(/width="(\d+)"/)[1]);
        const height = Number(img.match(/height="(\d+)"/)[1]);
        assert.equal(width, png.readUInt32BE(16), `${src}: width`);
        assert.equal(height, png.readUInt32BE(20), `${src}: height`);
      }
    }
  });
}

test('contact links and requested HR illustration are preserved', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(home, /href="https:\/\/t.me\/PanKoloda"/);
  assert.match(home, /href="mailto:kolodeznev.n@gmail.com"/);
  assert.match(home, /aria-disabled="true"/);
  const opportunity = fs.readFileSync(path.join(root, 'cases/opportunity.html'), 'utf8');
  assert.match(opportunity, /Ситуация[\s\S]*?svmos6-in-page.png/);
});

test('browser titles match the portfolio naming', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /<title>Kolodeznev\.Portfolio<\/title>/);
  assert.match(fs.readFileSync(path.join(root, 'cases/opportunity.html'), 'utf8'), /<title>Среда возможностей<\/title>/);
  assert.match(fs.readFileSync(path.join(root, 'cases/neural.html'), 'utf8'), /<title>Нейросети<\/title>/);
  assert.match(fs.readFileSync(path.join(root, 'cases/museum.html'), 'utf8'), /<title>Музей МХАТ<\/title>/);
});

test('hero frame improves readability without changing the release version', () => {
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(home, /<div class="hero-frame">/);
  assert.match(css, /\.hero-frame \{[^}]*width: 624px;[^}]*padding: 32px;[^}]*border-radius: 24px;/);
  assert.match(css, /\.hero-frame:hover[^}]*background: #fff;[^}]*box-shadow:/);
  assert.match(css, /\.hero-frame:hover[^}]*\.contact-links a[^}]*background: var\(--ink\); color: #fff;/);
  assert.match(home, /<span>v\. 0\.2<\/span>/);
  assert.doesNotMatch(home, /v\. 0\.3/);
});

test('all CSS dependencies are local and present', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const [, url] of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok(fs.existsSync(path.resolve(root, url)), `missing ${url}`);
  }
  assert.doesNotMatch(css, /cursor:\s*none/);
  assert.doesNotMatch(css, /preview\):hover[^}]*scale/);
  assert.match(css, /prefers-reduced-motion/);
});

test('dot animation uses a circular pulse without directional waves', () => {
  const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
  assert.match(script, /circularEnvelope/);
  assert.match(script, /const pulse/);
  assert.doesNotMatch(script, /const wave/);
});
