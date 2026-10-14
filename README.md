# chronigans.com

The Chronigans website, served by GitHub Pages. These are built files: the source (site.json, build.mjs, sources.mjs, sources/*.json) lives in the channel's project folder. Rebuild there, then copy dist/ here (without preview.html).

Daily job (.github/workflows/videos.yml): `videos.mjs` refreshes videos.json from the channel's YouTube feed (the "More episodes" row reads it), then `titles.mjs` gives each sources page its video's live YouTube title (matched by data-yt). After copying a rebuilt page here, run `node .github/scripts/titles.mjs` before pushing.
