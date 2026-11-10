# chronigans.com

The Chronigans website, served by GitHub Pages. These are built files: the source (site.json, build.mjs, sources.mjs, sources/*.json) lives in the channel's project folder. Rebuild there, then copy dist/ here (without preview.html).

Video job (.github/workflows/videos.yml, every 3 hours and on every push to main): `videos.mjs` refreshes videos.json from the channel's YouTube feed (Shorts left out, older videos kept), `titles.mjs` gives each sources page its video's live YouTube title (matched by data-yt, or by the chronigans.com/sources/<slug> link in the video's description when the page has no id yet), then `home.mjs` rebuilds the home page's "Latest episode" + "All episodes" section and the /sources/ list from videos.json. So a new upload shows on the site within about 3 hours with no page edits.

New episode: add its sources page as before and a one-line blurb to `episodes.json` (slug -> blurb; without one the home page uses the sources page's topic line). After copying a rebuilt page here, run `node .github/scripts/titles.mjs && node .github/scripts/home.mjs` before pushing.
