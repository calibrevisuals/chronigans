// Daily: read the channel's public YouTube feed and write videos.json (newest long-form videos first).
// The "More episodes" row on every sources page reads this file, so it updates itself after each upload.
import fs from 'node:fs';

const CHANNEL = 'UCML3MmhdwEpT72gX5OuqvSw';
const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL}`)).text();
const tag = (s, t) => (s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || '';
const unxml = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const out = [];
for (const e of xml.split('<entry>').slice(1)) {
  const id = tag(e, 'yt:videoId');
  if (!id) continue;
  // Shorts answer 200 on /shorts/<id>; long videos redirect. Only long-form goes on the pages.
  const r = await fetch(`https://www.youtube.com/shorts/${id}`, { method: 'HEAD', redirect: 'manual' }).catch(() => null);
  if (r && r.status === 200) continue;
  const desc = unxml(tag(e, 'media:description'));
  out.push({
    id,
    title: unxml(tag(e, 'title')),
    published: tag(e, 'published'),
    slug: (desc.match(/chronigans\.com\/sources\/([a-z0-9-]+)/) || [])[1] || null,
  });
}
out.sort((a, b) => b.published.localeCompare(a.published));
if (!out.length) { console.log('feed empty, keeping the old file'); process.exit(0); }
fs.writeFileSync('videos.json', JSON.stringify(out.slice(0, 10), null, 2) + '\n');
console.log(out.length, 'videos');
