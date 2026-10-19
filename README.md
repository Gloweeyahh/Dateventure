# Dateventure

Find a date you'll both love. Pick real places and ideas for two people, preview the plan with a
15-second animated trailer, send a personal invitation link, and get a shareable "It's a date!" card
when they say yes.

## How the pieces fit

| Piece | Where it lives | What it does | Free host |
|---|---|---|---|
| Website | `web/` | The pages people see. No build step. | Netlify (or GitHub Pages / Vercel) |
| API | `api/` | Finds venues anywhere (OpenStreetMap), saves invitations, answers accept/decline | Render |
| Database | MongoDB Atlas | Keeps invitations so links keep working | Atlas M0 |
| Shared brain | `web/core/` | Money, budget rules, ranking, invitations. Used by BOTH website and API | n/a |

## Commands (need Node 20 or newer)

```
npm install          # once, installs the MongoDB driver
npm test             # runs all the automated tests (no internet needed)
npm run preview      # builds dist/dateventure-preview.html, a one-file demo
npm start            # starts the API locally on http://localhost:3000
npm run smoke -- https://YOUR-API.onrender.com https://YOUR-SITE.netlify.app   # checks a live deployment
```

Run the site locally: `cd web && python3 -m http.server 8080` then open http://localhost:8080
(with no API address in `web/config.js` it runs in test mode).

## What is real and what is an estimate

- Venues come from OpenStreetMap map data near the place chosen. Coverage varies by city.
- Photos: real photos appear only when they are properly sourced (Wikimedia Commons, credited) or when you
  switch on Google photos. Otherwise the app shows a hand-drawn scene labelled "Illustration, not a photo".
- Prices are ESTIMATES from a price level, never quotes. The app says so everywhere it shows one.
- The 15-second trailer is an animated illustration, not real footage, and it says so on screen.

## Debugging

- Add `?debug=1` to the website address to see detailed messages in the browser console (F12).
- If something breaks the page shows "Copy debug info". Paste that when you ask for help.
- API logs are one JSON line per event (Render > your service > Logs). Every error has a request id.
- `GET /api/health` shows whether the database and keys are set up. See `docs/TROUBLESHOOTING.md`.

## Folder map

```
web/index.html        the page
web/config.js         the ONE file you edit after deploying (API address)
web/css/styles.css    colours and layout (tokens at the top)
web/js/               screens, trailer, acceptance card, API client
web/core/             shared logic (also used by the API, and covered by tests)
web/data/             price levels, built-in cities, sample venues and anywhere-ideas
api/server.js         starts the API
api/src/              routes, map search, photos, limits, MongoDB store
api/test/             automated tests
api/scripts/smoke.js  checks a deployed API
tools/build-preview.js  makes the one-file demo
docs/                 guides
```
