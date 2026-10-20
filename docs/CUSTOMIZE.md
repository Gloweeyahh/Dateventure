# Changing things

| I want to change... | Edit this | How |
|---|---|---|
| Colours | `web/css/styles.css` | Change the values at the top, inside `:root { ... }` (`--accent` is the crimson) |
| Fonts | `web/index.html` and `styles.css` | Swap the Google Fonts link, then `--heading` (Playfair Display), `--sans` (Plus Jakarta Sans), `--mono` (IBM Plex Mono) |
| The dark banner picture and the little step pictures | `web/config.js` | Change or empty the web addresses in `PHOTOS`. Empty means the app draws its own illustrations. They are mood pictures, labelled as such, never presented as the venue |
| The big headline in the banner | `web/js/screens-a.js` | Function `hero` |
| The interests people can pick | `web/core/interests.js` | Add a line to the list. Then add map rules for it in `api/src/osm.js` (FILTERS and RULES) |
| Price levels (what "low" or "moderate" means) | `web/data/regions.js` | Edit `genericBandsUSD`, or add a region with your own currency |
| How pricey a country is | `web/core/currencies.js` | Edit the `PPP` table |
| A currency's rough exchange rate | `web/core/currencies.js` | Edit the number in the `T` table |
| Ideas that work anywhere | `web/data/venues.js` | Add to the `ideas` list (keep the same fields) |
| Wording of "why it fits" | `web/core/engine.js` | Function `why` |
| The invitation text | `web/js/screens-c.js` | Function `paintInvite` |
| Limits (invites per hour etc.) | `api/src/app.js` | The `limits` block |

After any change run `npm test` (if you have Node) and commit. Netlify and Render redeploy by themselves.
