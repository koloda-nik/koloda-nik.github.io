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
    assert.doesNotMatch(html, /cursor-glow|href="#"|href="mailto:"/);
    for (const [, url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if (/^(?:https?:|mailto:)/.test(url)) continue;
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(page), url)), `${page}: missing ${url}`);
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

test('all CSS dependencies are local and present', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  for (const [, url] of css.matchAll(/url\("([^"]+)"\)/g)) {
    assert.ok(fs.existsSync(path.resolve(root, url)), `missing ${url}`);
  }
  assert.doesNotMatch(css, /cursor:\s*none/);
  assert.match(css, /prefers-reduced-motion/);
});
