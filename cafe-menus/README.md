# Phoenix Cafe — Digital Menu Board Platform

A self-contained, web-based digital menu board system (in the spirit of
[ScreenCloud's menu board app](https://screencloud.com/apps/digital-menu-board))
that runs entirely on this GitHub Pages site. No build step, no external
services — just open the pages.

| Page | Purpose |
|---|---|
| `index.html` | Landing page — links to the admin and every menu's display URL |
| `admin.html` | Manage menus, sections, items, styling, and publishing |
| `display.html?menu=<slug>` | The menu board itself — chromeless, non-interactive, auto-updating. Point a TV / ScreenCloud / any digital-signage browser at it |

## Features

- **Multiple menus** — create, duplicate, rename, and delete as many menus as you need; each has its own display URL.
- **Sections** — group items (e.g. *Espresso Drinks*, *Pastries*), reorder with ▲/▼.
- **Items** — title, description, and any number of size/price pairs (leave size blank for a single price). Non-numeric prices like `Market Price` work too.
- **Sold out** — one checkbox per item; the board shows a badge, strikes it through, or hides it (your choice, per menu, in Design → Options).
- **Full visual control (Design tab)** — columns (1–4), alignment, base text size, spacing, background color/image + overlay, heading & body fonts (Google Fonts), per-element sizes and colors, dividers, dot leaders, currency symbol, sold-out treatment.
- **Auto-fit** — the board automatically shrinks text so the whole menu fits the screen with no scrolling.
- **Live preview** — the admin shows a real 16:9 preview rendered by the exact same engine as the TV display.
- **Automatic updates** — displays update instantly on the same device, and within ~1 minute everywhere else after a publish (see below).
- **Import/Export** — back up or move all menu data as a JSON file.

## How updates reach the TVs

Edits save instantly to the browser you're working in (localStorage) and the
live preview updates in real time. To update every screen everywhere, the
admin **publishes** `phoenix-cafe/data/menus.json` to this repository through
the GitHub API; every display polls that file every 20 seconds and repaints
when it changes. (GitHub Pages takes roughly 30–60 s to serve a new commit,
so end-to-end it's about a minute.)

### One-time publish setup

1. Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)
   scoped to **only this repository** with **Contents: Read and write** permission.
2. In the admin, open **Publish Settings**, paste the token, and check the
   pre-filled owner/repo/branch/path values (`Dream-City-Church` /
   `dream-city-church.github.io` / `master` / `phoenix-cafe/data/menus.json`).
3. Click **Test connection**, then **Save Settings**.

With **Auto-publish** enabled (the default), every change is pushed a few
seconds after you stop typing. You can also click **Publish Now** at any time.

The token is stored only in that browser's localStorage — it is never
published or committed. Each computer that edits menus needs its own token
entered once.

## Setting up a TV

1. In the admin, select the menu and click **Copy** next to the Display URL
   (looks like `https://dream-city-church.github.io/phoenix-cafe/display.html?menu=phoenix-cafe`).
2. Point the TV's browser / ScreenCloud / signage player at that URL.

Notes:

- Opening `display.html` with no `?menu=` shows a setup page listing every
  menu's URL.
- Renaming a menu changes its slug (and therefore its URL). Displays keep
  working through the id-based URL, but if a TV uses the slug URL, re-copy
  the link after renaming.
- The display reloads itself every 12 hours as basic kiosk hygiene.

## Data & files

```
phoenix-cafe/
├── index.html        landing page
├── admin.html/.css   admin app
├── admin.js
├── display.html/.css TV display
├── display.js
├── shared.js         data model + render engine (shared by admin preview & display)
└── data/menus.json   the published menu data (written by the admin via the GitHub API)
```

`data/menus.json` is plain JSON — safe to hand-edit in a pinch; the app
fills in any missing fields.
