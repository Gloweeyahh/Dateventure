# When something is not working

Start here: open `https://YOUR-API.onrender.com/api/health` in a browser.
You want to see `"ok":true`, `"store":"mongo"` and `"signingSecretSet":true`.

| What you see | What it means | What to do |
|---|---|---|
| Yellow banner "Test mode" on the site | The site does not know your API address | Put it in `web/config.js` as `API_BASE`, commit, wait 30 seconds |
| "We could not reach the server" | API asleep, wrong address, or blocked | Wait a minute and retry. Check `API_BASE` has no slash at the end. Open `/api/health` |
| Browser console (F12) says "CORS" | The API does not trust your website address | Render > Environment > `ALLOWED_ORIGINS` = your exact site address (https, no slash). Save |
| `"store":"memory"` in /api/health | No database connected: invitations vanish on sleep | Set `MONGODB_URI` on Render |
| Mongo error in the Render logs | Wrong password, or Atlas blocks Render | Atlas > Network Access > allow 0.0.0.0/0. Re-copy the connection string, replace `<password>` |
| "We could not confirm that venue" | `SIGNING_SECRET` changed or is missing | Set a fixed `SIGNING_SECRET` on Render and do not change it |
| "The venue search is busy" | The free OpenStreetMap service is slow | Wait a minute. The API already tries two servers |
| Few or no real venues for a city | OpenStreetMap is thin there | The app falls back to ideas. Other cities may be richer. Add venues to OpenStreetMap to help everyone |
| No photos on venues, and `"googlePhotos":false` | No Google key set | Add `GOOGLE_PLACES_API_KEY` on Render (DEPLOY.md, Part 8) |
| `"googlePhotos":true` but no photos at all | Google refused the request | Render logs show `google_search_failed` with a number. 403: billing is not on, or "Places API (New)" is not enabled, or the key is restricted to the wrong API. 400/401: the key is wrong |
| Photos on some venues but not others | Normal. We only show a photo when Google finds the same place by name, within about 350 metres | Nothing to fix. Small places often have no photo |
| Photos on the venue page but not the result cards | Cards are limited to half the photo allowance, or `GOOGLE_CARD_PHOTOS` is false | Check `googleUsage` on /api/health. Raise `GOOGLE_CARD_PHOTO_SHARE` or the caps if you are comfortable |
| Photos vanished mid-month | The monthly cap was reached | `googleUsage` shows it. The site falls back to drawn scenes, and the counter resets next month |
| First request is very slow | Render free tier was asleep | Set up the free keep-awake pinger (see DEPLOY.md, part 6) |
| "Save as video" does nothing | The browser cannot record video | Use Chrome or Safari, or screen-record the preview |

Still stuck? Add `?debug=1` to the site address, repeat the problem, and copy what the console (F12) shows,
plus the page's "Copy debug info" text and the last lines of the Render logs.
