# Mini-loco Maker

Make your own digital **mini-loco** games: upload a labelled picture, type the labels and answers (Dutch and/or English), and play.
Checking flips the tiles to the real mini-loco back sides, so a correct answer shows the same pattern as the physical box.

- **Import** tiles by pasting cells from Excel / Google Sheets, a CSV/TSV/TXT list (`label;NL;EN` or `1. answer`), or JSON. Drop or paste (Ctrl+V) an image straight onto the editor.
- **Play** in the browser (mouse or touch), NL/EN switch, image zoom.
- **Export** the worksheet as PDF (vector), SVG, PNG, JPG or WebP, the game as a standalone offline HTML file, or the project as JSON (re-open it later).
- **Publish** to a public gallery (optional, Supabase free tier).

## Develop

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # checks every deal is a valid mini-loco solution
npm run build   # static site in dist/
```

Stack: Vite + Svelte 5. The game board is one self-contained SVG engine (`src/lib/engine.js`) used for play, every export, and the offline HTML.

## Public gallery (Supabase, free)

1. Create a free project at [supabase.com](https://supabase.com).
2. SQL Editor → run [`supabase/schema.sql`](supabase/schema.sql).
3. Project Settings → API: copy the project URL and publishable key.
4. Local: copy `.env.example` to `.env.local` and fill both in.
5. GitHub: Settings → Secrets and variables → Actions → **Variables**: add `SUPABASE_URL` and `SUPABASE_KEY`.

Games are published immediately. Remove unwanted ones in Supabase → Table Editor → `games` (and the image in Storage → `images`).
The `keepalive` workflow pings the database every 3 days so the free project isn't paused for inactivity.

## Deploy (GitHub Pages, free)

Settings → Pages → Source: **GitHub Actions**. Every push to `main` tests, builds and deploys.

## Credits

Game mechanics, tile back sides and solution patterns follow the mini-loco applets by Henk Reuling ([henkreuling.nl](https://henkreuling.nl)), published under CC BY-NC-SA.
