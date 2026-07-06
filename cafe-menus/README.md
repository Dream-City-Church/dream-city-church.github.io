# Phoenix Cafe — Digital Menu Board Platform

A self-contained, web-based digital menu board system (in the spirit of
[ScreenCloud's menu board app](https://screencloud.com/apps/digital-menu-board))
that runs entirely on this GitHub Pages site. No build step, no accounts,
no tokens — sync between the admin and the TVs is automatic.

| Page | Purpose |
|---|---|
| `index.html` | Landing page — links to the admin and every screen/menu display URL |
| `admin.html` | Manage menus, locations, schedules, styling, and sync |
| `display.html?location=<slug>&sync=<id>` | A physical screen — shows whatever menu is scheduled right now |
| `display.html?menu=<slug>&sync=<id>` | A screen locked to one specific menu |

## Features

- **Multiple menus** — create, duplicate, rename, delete; each fully independent.
- **Locations (physical screens)** — define each real TV as a location (Cafe Counter, Drive-Thru…) so many menu boards run from this one instance. Each location has a default menu plus a schedule.
- **Scheduling (Outlook-style week calendar)** — click an empty slot to schedule a menu (e.g. *Breakfast, Mon–Fri 6:00–11:00*); click a block to edit or delete. Weekly repeating events and single-date events (which override weekly ones that day) are both supported. Outside scheduled times the location's default menu shows.
- **Sections & items** — items have a title, description, any number of size/price pairs (blank size = single price; `Market Price` style text works too).
- **Sold out** — one checkbox per item; boards show a badge, strike through, or hide it (per-menu choice).
- **Featured items** — one checkbox per item; the board draws it in a rounded box with an accent border and a ★ (highlight color in Design → Items).
- **Rounded item boxes** — Design → Items can put every item in a rounded box (color + corner radius).
- **Per-screen design** — a location's Design tab can override the design of every menu that screen shows (portrait TVs, screens that need bigger text…). Off by default: each menu's own design is used.
- **Shared themes** — save any design as a named theme and point menus (and screens) at it. Edits on a themed menu become per-menu **overrides**: "Apply to theme" folds them into the theme (updating everything that uses it), "Undo changes" drops them. Deleting a theme leaves every user with its current look as a custom design.
- **Full visual control (Design tab)** — columns (1–4), left/centered alignment, base size, spacing, background color/image + overlay, heading & body fonts (Bebas Neue, Google Sans, Montserrat, Playfair…), per-element sizes, **font weights (100–900)**, **line heights**, and colors, dividers, currency, sold-out treatment. Controls live in five flat sections (Layout, Background, Text, Colors, Items) switched with pills — one compact panel at a time. Prices always stack on the right, pinned to the top of each item, so long titles can never push them around.
- **Global board title** — Design tab → *Global*: one title shown on every menu's board (leave blank to use each menu's own name).
- **Auto-fit** — boards size text automatically: shrinking so nothing ever scrolls, and growing (up to 3× the base size) so the content fills the full screen instead of breaking columns early.
- **Live preview** — rendered by the same engine as the TVs; toggle between **16:9 and 9:16** to match landscape or portrait screens.
- **Automatic updates everywhere** — no publish button needed (a Sync Now button exists for impatience).
- **Import/Export** — back up or move everything as a JSON file.

## How sync works (zero setup)

Edits save instantly in the admin browser and appear live in the preview.
A few seconds after you stop typing, the admin pushes the data to a free,
anonymous JSON channel on [jsonblob.com](https://jsonblob.com) (created
automatically the first time the admin runs — no account, no key). Every
display polls that channel every 20 seconds, so boards everywhere update
within about half a minute of any change.

- The channel id is embedded in the display URLs the admin gives you
  (`...&sync=<id>`), so TVs need nothing but their URL.
- To edit from a second computer, copy the **admin link** from
  *Sync Info* (it carries the same channel id) and bookmark it there.
- `data/menus.json` in this folder is only the built-in starter data used
  before a sync channel exists.

Practical notes:

- The channel is kept alive by the TVs polling it; if it ever disappears,
  the admin automatically creates a new one and tells you to re-copy the
  display URLs.
- The channel id is unguessable but not secret — anyone who has a display
  URL could technically read (or with effort, write) the menu data. It's a
  cafe menu; if that trade-off ever bothers you, use *Sync Info → Start new
  channel* to rotate it.

## Setting up a TV

1. In the admin, create a **location** for the screen (or select a menu for
   an unscheduled screen).
2. Click **Copy** next to its Display URL.
3. Point the TV's browser / ScreenCloud / signage player at that URL.

The display page is completely non-interactive (no controls, hidden cursor),
auto-fits 16:9 or 9:16 screens, and reloads itself every 12 hours as basic
kiosk hygiene. Opening `display.html` with no parameters shows a setup page
listing every available screen and menu URL.

Renaming a menu or location changes its slug (and so its URL) — displays
keep working via id-based URLs, but re-copy the link after renaming if the
TV used the slug URL.

## Troubleshooting a screen (shows the setup page / "no menu to show")

The setup page now prints the diagnosis: the player's clock, the schedule
time zone, and whether it could reach the menu data. Check in this order:

1. **Player clock / time zone** — schedules are wall-clock times. Signage
   players (Yodeck, BrightSign…) often run **UTC**, so "6:00–11:00" never
   matches. Set **Schedule time zone** (on any location's editor, applies to
   every screen, e.g. `America/Chicago`) so schedules ignore player clocks.
2. **No default menu** — outside scheduled times a location falls back to
   its default menu; without one the screen shows the setup page. The admin
   warns about this on the location editor.
3. **Stale URL** — renaming a menu/location changes its slug URL. Re-copy
   the display URL from the admin onto the player.
4. **Missing `&sync=` id / unreachable channel** — without it the player can
   only see `data/menus.json`. If the sync channel is unreachable, displays
   now automatically fall back to the published data file and say so on the
   setup page.

## Data & files

```
phoenix-cafe/
├── index.html        landing page
├── admin.html/.css   admin app
├── admin.js
├── display.html/.css TV display
├── display.js
├── shared.js         data model, sync, schedule resolver, render engine
└── data/menus.json   starter data (used before a sync channel exists)
```

All data is plain JSON — the Export button gives you the full picture, and
the app fills in any missing fields on import.

### Updating the app files never resets your menus or settings

`data/menus.json` is marked `"seed": true`, and seed data can **never**
override real (user-edited) data, regardless of timestamps. Redeploying the
app files — even with a freshly regenerated starter file — leaves every
admin's and every board's data alone.

Optional but recommended: after your menus are set up, use **Export** and
commit the file as `data/menus.json` (replacing the starter). A real export
carries your sync channel id, so any brand-new browser or TV that opens the
app immediately joins the live channel instead of starting from sample data.
