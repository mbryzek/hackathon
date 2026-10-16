# Visual parity harness

The harness ships with the devops release and runs as `dev visual`; this repo carries only
`app.ts`, which says what is this app's own: its `APP_MARKER`, theme key, themes, viewports, the
url paths each capture set covers (`pages`) and how a theme reaches a page (`themedPath`).

Two sets, both derived from `src/routes`: `static` (the default) is every route that renders with
no backend, which is every route this site has; `live` fills `[param]` routes from `VISUAL_SEEDS`
and today captures the same pages.

The server is this repo's other half. The site shuffles its photo and video galleries during SSR,
so a plain `npm run dev` serves a different document to every request; start BOTH sides of an A/B
with `server-determinism.mjs` preloaded, or neither:

```sh
PORT=$((20000 + RANDOM % 20000))
NODE_OPTIONS="--import $PWD/playwright/visual/server-determinism.mjs" \
  dev agent serve --label visual --url http://127.0.0.1:$PORT -- npm run dev -- --host 127.0.0.1 --port $PORT --strictPort

dev visual capture    # VISUAL_SET, VISUAL_BASE_URL, VISUAL_OUT, VISUAL_PAGES as the harness README says
dev visual compare <dir-a> <dir-b>
dev visual test       # the harness's units, against this repo's app.ts
dev visual path       # where the materialized harness, and its README, are
```

The harness README is the procedure — the A/A gate first, a cold server, a url from
`dev agent serve`: `$(dev visual path)/README.md`, or `templates/visual/README.md` in devops.
