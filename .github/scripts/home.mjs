// After videos.json is refreshed: rebuild the home page's episodes section and the sources list,
// so every published video shows on chronigans.com without anyone touching the pages.
// - Home: newest video as "Latest episode" (YouTube thumbnail, link, sources link) + every other episode below it.
// - /sources/: every sources page, newest episode first, with its live title.
// Episode numbers follow publish order in videos.json (Shorts are already left out by videos.mjs).
// One-line blurbs come from episodes.json (slug -> blurb); a video without one uses its sources page's topic line.
import fs from 'node:fs';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s = '') => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&middot;/g, '·').replace(/&amp;/g, '&');
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');

const videos = JSON.parse(read('videos.json') || '[]');
const blurbs = JSON.parse(read('episodes.json') || '{}');

// Sources pages: slug, episode number, title, topic, YouTube id.
const pages = fs.readdirSync('sources').filter((s) => fs.existsSync(`sources/${s}/index.html`)).map((slug) => {
  const h = read(`sources/${slug}/index.html`);
  return {
    slug,
    n: Number((h.match(/<p class="ep">Episode (\d+)/) || [])[1] || 0),
    title: unesc((h.match(/<h1>([^<]*)<\/h1>/) || [])[1] || slug),
    topic: unesc((h.match(/<p class="topic">([^<]*)<\/p>/) || [])[1] || ''),
    yt: (h.match(/data-yt="([^"]*)"/) || [])[1] || '',
  };
});
const pageFor = (v) => pages.find((p) => (v.id && p.yt === v.id) || (v.slug && p.slug === v.slug));

// Oldest first gives the episode numbers; the home page shows newest first.
const eps = [...videos].sort((a, b) => a.published.localeCompare(b.published)).map((v, i) => {
  const p = pageFor(v);
  return { ...v, n: i + 1, slug: p ? p.slug : v.slug, blurb: (p && blurbs[p.slug]) || blurbs[v.id] || (p && p.topic) || '' };
}).reverse();

const watch = (id) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
const thumb = (id, size) => `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${size}.jpg`;
const sourcesLink = (e, cls) => (e.slug && fs.existsSync(`sources/${e.slug}/index.html`) ? `<a class="${cls}" href="/sources/${esc(e.slug)}/">Sources</a>` : '');

const CSS = `/* episodes:css:start */
.ep .links { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; }
.ep .links .src { color: var(--muted); }
.all { margin-top: clamp(48px, 7vw, 80px); }
.all h2 { margin-bottom: 18px; }
.all .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px 18px; }
.all .card { display: block; text-decoration: none; }
.all .card img { width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 10px; border: 3px solid var(--ink); outline: 1px solid var(--paper-2); display: block; transition: transform .3s ease; }
.all .card:hover img { transform: translateY(-3px); }
.all .n { display: block; margin-top: 10px; font: 400 .85rem var(--f-pop); letter-spacing: .06em; color: var(--accent); }
.all .card b { display: block; font: 800 1rem/1.35 var(--f-body); color: var(--paper); text-wrap: balance; }
.all .card:hover b { color: var(--accent-2); }
.all .src { display: inline-block; margin-top: 4px; font-size: .9rem; color: var(--muted); }
.all .src:hover { color: var(--accent-2); }
@media (max-width: 820px) { .all .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .all .grid { grid-template-columns: 1fr; } }
/* episodes:css:end */`;

let home = read('index.html');
if (home && eps.length) {
  const [latest, ...rest] = eps;
  const section = `<section id="latest"><div class="wrap">
<div class="ep">
  <a class="thumb" href="${watch(latest.id)}" target="_blank" rel="noopener" aria-label="Watch ${esc(latest.title)} on YouTube">
    <img src="${thumb(latest.id, 'maxresdefault')}" onerror="this.onerror=null;this.src='${thumb(latest.id, 'hqdefault')}'" alt="" width="1280" height="720"><span class="play"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3.5v17L21 12z"/></svg></span>
  </a>
  <div>
    <p class="eyebrow">Latest episode</p>
    <span class="ep-label">Episode ${latest.n}</span>
    <h3>${esc(latest.title)}</h3>
    ${latest.blurb ? `<p>${esc(latest.blurb)}</p>` : ''}
    <div class="links"><a class="ghost" href="${watch(latest.id)}" target="_blank" rel="noopener">Watch it on YouTube</a>${sourcesLink(latest, 'ghost src')}</div>
  </div>
</div>
${rest.length ? `<div class="all">
  <p class="eyebrow">All episodes</p>
  <h2>Catch up</h2>
  <div class="grid">${rest.map((e) => `
    <div><a class="card" href="${watch(e.id)}" target="_blank" rel="noopener"><img src="${thumb(e.id, 'mqdefault')}" alt="" loading="lazy" width="320" height="180"><span class="n">Episode ${e.n}</span><b>${esc(e.title)}</b></a>${sourcesLink(e, 'src')}</div>`).join('')}
  </div>
</div>` : ''}
</div></section>`;
  home = home.replace(/<section id="latest">[\s\S]*?<\/div><\/section>(?=\s*<section id="about")/, section);
  home = home.includes('/* episodes:css:start */')
    ? home.replace(/\/\* episodes:css:start \*\/[\s\S]*?\/\* episodes:css:end \*\//, CSS)
    : home.replace('</style>', `${CSS}\n</style>`);
  fs.writeFileSync('index.html', home);
  console.log(`home: latest is episode ${latest.n}, ${rest.length} more listed`);
}

// Sources list: newest episode first, live titles.
let list = read('sources/index.html');
if (list) {
  const live = (p) => (videos.find((v) => (p.yt && v.id === p.yt) || v.slug === p.slug) || {}).title || p.title;
  const items = [...pages].sort((a, b) => b.n - a.n || a.slug.localeCompare(b.slug)).map((p) =>
    `<li><span class="t none">${p.n ? `#${p.n}` : '&mdash;'}</span><p><a href="/sources/${esc(p.slug)}/">${esc(live(p))}</a><small>${esc(p.topic)}</small></p></li>`).join('');
  list = list.replace(/(<h1>Every episode's sources<\/h1><\/header>\s*)<ul>[\s\S]*?<\/ul>/, `$1<ul>${items}</ul>`);
  fs.writeFileSync('sources/index.html', list);
  console.log(`sources list: ${pages.length} pages`);
}
