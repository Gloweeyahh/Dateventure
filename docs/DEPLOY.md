# Deploying Dateventure, step by step

You are putting three things online. Think of it like a restaurant:

- **The website** (Netlify) is the dining room: what people see and tap.
- **The API** (Render) is the kitchen: it finds venues, saves invitations, records "yes" and "not this time".
- **The database** (MongoDB Atlas) is the notebook the kitchen writes in, so nothing is forgotten.
- **GitHub** is the cupboard where all the recipes (your files) are stored.

All four have free plans. Do the parts in order.

## Part 1. Put the files on GitHub

1. Go to github.com and log in. Tap the **+** at the top, then **New repository**.
2. **Repository name:** `dateventure`
3. **Description:** `Dateventure: a web app that helps couples find a date they'll both love, preview it, and send a personal invitation.`
4. Choose Public or Private (both work). Do NOT tick "Add a README". Tap **Create repository**.
5. On your computer, unzip `dateventure.zip`. You get a folder called `dateventure`.
6. On the new repo page tap **uploading an existing file**. Open the unzipped folder and drag everything INSIDE it
   (the folders `web`, `api`, `tools`, `docs`, and the files `package.json`, `netlify.toml`, `render.yaml`,
   `env.example`, `README.md`) into the browser. Wait for the uploads to finish. Tap **Commit changes**.
   (GitHub's website cannot upload folders from a phone. Use a computer, or the git commands at the very bottom.)
7. Add the hidden file: tap **Add file > Create new file**. In the name box type `.gitignore`. Paste the contents of
   the `.gitignore` file I sent you. Tap **Commit changes**.

## Part 2. Make the free database (MongoDB Atlas)

1. Go to mongodb.com/cloud/atlas/register and sign up (free).
2. Choose to create a cluster. Pick **M0 (Free)**. Provider **AWS**. Region: pick one in Europe, Frankfurt if offered
   (it is close to Render's Frankfurt). Name it `dateventure`. Tap **Create**.
3. It asks you to make a database user. Username: `dateventure`. Tap **Autogenerate Secure Password**, COPY it and
   keep it somewhere safe. Tap **Create user**.
4. Under **Network Access** tap **Add IP Address**, then **Allow access from anywhere** (0.0.0.0/0), then **Confirm**.
   (Render's free server has no fixed address. Your password protects the database.)
5. Tap **Connect**, then **Drivers**. Copy the text that starts `mongodb+srv://`. Replace `<password>` in it
   with the password you copied. Keep this text. It is your `MONGODB_URI`.

Atlas changes its wording sometimes. If a button has a slightly different name, pick the closest one.

## Part 3. Put the API on Render

1. Go to render.com and sign up with your GitHub account.
2. Tap **New +**, then **Blueprint**. Pick your `dateventure` repo. Render reads `render.yaml` and shows a service
   called `dateventure-api` on the **Free** plan.
3. It asks for a few settings:
   - `MONGODB_URI`: paste the text from Part 2.
   - `ALLOWED_ORIGINS`: type `https://example.com` for now. You will fix it in Part 5.
   - `CONTACT_EMAIL`: your email address.
   - `GOOGLE_PLACES_API_KEY`: leave empty.
4. Tap **Apply**. Wait until it says **Live** (a few minutes).
5. Copy your API address from the top of the page. It looks like `https://dateventure-api-abcd.onrender.com`.
6. Open `YOUR-API-ADDRESS/api/health` in a browser. You should see `"ok":true` and `"store":"mongo"`.
   If it says `"store":"memory"`, `MONGODB_URI` is missing or wrong.

(If Blueprint is not offered: **New + > Web Service**, pick the repo, Runtime **Node**, Build command
`npm install`, Start command `node api/server.js`, Plan **Free**, Health check path `/api/health`, then add the same
settings under **Environment**, plus `SIGNING_SECRET` set to a long random text of your own, and `TRUST_PROXY` = `true`.)

## Part 4. Put the website on Netlify

1. Go to netlify.com and sign up with GitHub.
2. Tap **Add new site > Import an existing project > GitHub** and choose `dateventure`.
3. Leave **Build command** empty. **Publish directory** should say `web` (it comes from `netlify.toml`). Tap **Deploy**.
4. Netlify gives you an address like `https://something-123.netlify.app`. Optional: **Site configuration > Change site
   name** to `dateventure`.

## Part 5. Connect the website and the API

1. In GitHub open `web/config.js`, tap the pencil (edit). Change `API_BASE: ""` to your Render address, in quotes, no
   slash at the end:  `API_BASE: "https://dateventure-api-abcd.onrender.com",`  Tap **Commit changes**.
   Netlify updates by itself in about 30 seconds.
2. In Render open `dateventure-api`, then **Environment**. Change `ALLOWED_ORIGINS` to your exact Netlify address,
   for example `https://dateventure.netlify.app` (https, no slash). Tap **Save**. The API restarts.
3. Open your Netlify address. The yellow "Test mode" box must be gone. Plan a date, choose a city, send yourself an
   invitation, open it in another browser, accept it, and check the status page.

## Part 6. Keep the API awake (free)

Render's free plan puts the API to sleep after about 15 minutes of nobody using it, and waking takes up to a minute.
A free "pinger" fixes that by visiting your API every few minutes.

1. Go to uptimerobot.com and sign up (free).
2. Tap **Add New Monitor**. Type: **HTTP(s)**. Name: `Dateventure API`.
3. URL: `YOUR-API-ADDRESS/api/health`. Interval: the shortest the free plan allows (about 5 minutes; it must be under 15).
4. Tap **Create Monitor**.

Good to know: Render's free plan gives about 750 running hours a month. One always-awake service uses about 720 to
744, so keep this as your only free Render service. Each ping also touches MongoDB, so the database stays awake too.
The website also warms the API the moment someone opens it, and waits politely if it is still waking.
If you prefer, cron-job.org does the same job.

## Part 7. Check everything (optional but recommended)

On a computer with Node 20+ installed, in the project folder:

```
npm install
npm run smoke -- https://YOUR-API.onrender.com https://YOUR-SITE.netlify.app
```

Every line should say PASS. A FAIL line tells you what to fix. Without Node, the `/api/health` page from Part 3 is the quick check.

## Part 8. Real Google photos (optional, recommended)

With a Google key, venues get real photos on three screens: a small photo on the first few result cards, up to two
on the venue page, and up to two on the partner's invitation. Every photo is credited, and nothing is saved on your
side. Without a key the site still works and shows drawn scenes instead.

**Is it free?** Google asks for a billing card, but only charges when you pass its free monthly allowance
(checked September 2026; confirm on Google's pricing page):
- 5,000 place searches a month, and 1,000 photo downloads a month. Each is counted separately.
- A result card uses 1 search and 1 download. A venue page or invitation uses 1 search and up to 2 downloads.
- The app stops calling Google at 4,500 searches and 900 downloads (`GOOGLE_SEARCH_MONTHLY_CAP`, `GOOGLE_PHOTO_MONTHLY_CAP`),
  before the free allowance runs out, then shows drawn scenes for the rest of the month.

**A. Make the Google project and add billing**
1. Go to console.cloud.google.com and log in with a Google account.
2. At the top left tap the project name, then **New project**. Name it `dateventure`, tap **Create**, and make sure it is the selected project.
3. Open the menu (three lines, top left), tap **Billing**, and link or create a billing account. Add your card.
   Use a card that works for international payments (a dollar card works best). New accounts often get free trial credit.

**B. Turn on the right service**
1. Menu, then **APIs & Services**, then **Library**.
2. Search `Places API (New)` and open it. It must say **(New)**, not the old "Places API". Tap **Enable**.

**C. Make the key and lock it down**
1. **APIs & Services**, then **Credentials**, then **Create credentials**, then **API key**. Copy the key into your Notes. Treat it like a password.
2. Tap the key's name to edit it. Under **API restrictions** choose **Restrict key**, tick **Places API (New)** only, and tap **Save**.
3. Leave **Application restrictions** on **None**. Render's free server changes address, so it cannot be locked to one. Only your server ever sees this key.

**D. Add safety nets in Google (belt and braces)**
1. **Billing**, then **Budgets & alerts**, then **Create budget**. Set it to a tiny amount, for example $1, with email alerts at 50% and 100%. This only warns you, it does not stop spending.
2. **APIs & Services**, then **Enabled APIs & services**, then **Places API (New)**, then **Quotas & system limits**. Find the lines for text search and photos, and set a daily limit
   (for example 150 a day). This one does stop usage. Google's wording for these lines changes, so pick the closest ones.

**E. Give the key to your API on Render**
1. render.com, open `dateventure-api`, then **Environment**.
2. Tap **Add environment variable**. Name: `GOOGLE_PLACES_API_KEY`. Value: paste the key. Tap **Save changes**. The server restarts (about a minute).
3. The other settings (`GOOGLE_SEARCH_MONTHLY_CAP`, `GOOGLE_PHOTO_MONTHLY_CAP`, `GOOGLE_CARD_PHOTOS`, `GOOGLE_CARD_PHOTO_SHARE`) already have good defaults. Change them only if you want to.

**F. Check that it works**
1. Open `YOUR-API-ADDRESS/api/health`. You should now see `"googlePhotos":true` and a `googleUsage` box with the counts for this month.
2. On your site, plan a date in a city with plenty of venues. Scroll the results: the first real venue cards should get a small photo with "via Google Maps". Open one: the venue page shows photos, and the invitation you send shows them too.
3. On a computer with Node, `npm run smoke -- YOUR-API YOUR-SITE` now includes a Google photo test.

**To turn photos off or save allowance:** set `GOOGLE_CARD_PHOTOS` to `false` (no photos on cards, still on venue pages and invitations), or remove the key (no Google photos at all).
**If the key leaks:** in Google Cloud, Credentials, delete that key and make a new one, then update Render.

**Optional small map on venue pages:** enable **Maps Embed API**, make a second key, restrict it to **Websites** with your Netlify address, and paste it as `MAPS_EMBED_KEY` in `web/config.js`.

## Part 9. Making changes later

Edit any file on GitHub (pencil icon), tap **Commit changes**. Netlify and Render redeploy by themselves.

## Appendix: uploading with git instead (computer or phone terminal)

```
cd dateventure
git init
git add .
git commit -m "First version of Dateventure"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/dateventure.git
git push -u origin main
```
