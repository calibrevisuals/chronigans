// After videos.json is refreshed: give every sources page its video's live YouTube title,
// so a title changed on YouTube shows on the page (and in the sources list) by the next run.
// A page is matched to its video by data-yt (its YouTube id); pages with no id are left alone.
import fs from 'node:fs';

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const videos = JSON.parse(fs.readFileSync('videos.json', 'utf8'));
const byId = new Map(videos.map((v) => [v.id, v.title]));

let changed = 0;
for (const slug of fs.readdirSync('sources')) {
  const file = `sources/${slug}/index.html`;
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const id = (html.match(/data-yt="([^"]*)"/) || [])[1];
  const live = id && byId.get(id);
  const old = (html.match(/<h1>([^<]*)<\/h1>/) || [])[1];
  if (!live || !old || old === esc(live)) continue;
  // The old title appears in <title>, the meta description and <h1>; swap every copy.
  html = html.split(old).join(esc(live));
  fs.writeFileSync(file, html);
  // The sources list and the home page name the episode too.
  for (const other of ['sources/index.html', 'index.html']) {
    if (fs.existsSync(other)) fs.writeFileSync(other, fs.readFileSync(other, 'utf8').split(old).join(esc(live)));
  }
  console.log(`${slug}: "${old}" -> "${esc(live)}"`);
  changed++;
}
console.log(changed, 'titles updated');
