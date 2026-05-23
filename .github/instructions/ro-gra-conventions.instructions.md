---
description: "Use when editing any file in this project. Covers language split, vanilla JS constraints, QR card structure, README sync, and CSS cache-busting."
applyTo: "**"
---

# ro-gra Project Conventions

## Language Split

- Code identifiers, HTML attributes, CSS class names, JS variable and function names: **English**
- User-visible UI strings, HTML text content, in-code comments, and `README.md` documentation: **Polish**
- Never translate Polish content to English unless explicitly asked

## Vanilla JS Constraints

- No npm, no `package.json`, no build tools, no frameworks, no bundlers
- Deliver plain `.html`, `.css`, `.js` files runnable directly in a browser without a build step
- Do not introduce `import`/`export` module syntax — the project uses classic `<script>` loading
- Do not add external CDN libraries without explicit approval

## QR Card Data (`CARDS` array in `app.js`)

Each card object must contain exactly these fields:

| Field   | Type   | Rules |
|---------|--------|-------|
| `id`    | number | Sequential starting from 1 |
| `token` | string | Exactly 5 characters, uppercase, from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ2346789` (excludes I, O, 0, 1, 5) |
| `title` | string | Polish — short location or attraction name |
| `desc`  | string | Polish — fun fact or story shown on the card |
| `task`  | string | Polish — physical or observational challenge for the player |
| `image` | string | Relative path from `index.html`, e.g. `img/card-3.jpg` |

When adding a card, also add its token to the tokens table in `README.md`.

## README Sync

Update `README.md` (in Polish) whenever you change:

- Card data (tokens, titles, descriptions, tasks)
- QR URL format or base URL
- Game rules or `GAME_START` date/time
- Project structure or deployment instructions

## CSS Cache-Busting

Whenever you edit `style.css`, update the `?v=` query string in `index.html`:

```html
<link rel="stylesheet" href="style.css?v=YYYYMMDDHHII" />
```

Use the current date and time in `YYYYMMDDHHmm` format (24-hour, local time).
Example: `?v=202605231742`
