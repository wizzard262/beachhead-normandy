# Beachhead: Normandy 1944

Repo: public GitHub `wizzard262/railhead-normandy`, live on GitHub Pages at https://wizzard262.github.io/railhead-normandy/. Beachhead (was Railhead: Normandy 1944), a browser logistics game: August 1944, you run Allied supply for three armies racing from the Normandy beaches to the German border. Built from a copy of its sister game [Railhead](../railhead) (same layout and engine), changed for 1944.

- After every prompt about the game, add a short summary of it to [PROMPTS.md](PROMPTS.md), with any assumptions made, as its note says
- At the end of each session, record its length in the **Sessions** table at the bottom of PROMPTS.md (keep that table last)
- After each change to the game, save a numbered screenshot in `screenshots/` (`03-short-name.png`, …), taken in a visible browser, then add it to `screenshots/list.json`
  - `node tools/shot.js <name> [days to play] [width] [height]` with the game served at http://localhost:8767/ (`python -m http.server 8767`). It borrows Playwright from `..\harrier-carrier-playwright-tests`
- Run `node tools/test.js` before every commit (headless checks of the rules: same seed same game, nothing negative or out of range, deadlines, sending units). Its fingerprint of 60 games changes only when the rules or numbers change: after a deliberate rules change, paste in the new value it prints
- After a rules change, run `node tools/sweep.js "" "LEVEL=easy" "LEVEL=hard"` (150 headless games per strategy) and check leaving everything alone mostly loses while holding and pushing well wins
- Plain JavaScript, 2D canvas, classic scripts loaded in order (no modules, no `fetch` in the game), so it also runs straight from the file
  - `js/data.js` the map and every number to tune (PORTS, STORM, BRIDGES: beaches, ports, storms, blown bridges); `js/sim.js` the rules (no DOM); `js/draw.js` the staff map; `js/ui.js` the rows, report and pop-ups; `js/main.js` start-up, animation and input
  - Inside the code the enemy's numbers still use Railhead's names (`SOVIET_GROWTH`, `st.soviet`): they mean the Germans here
- The version number (`#ver` in `index.html`) goes up by 1 with every commit to the game: `git rev-list --count HEAD` + 1. Put the same number on every script link (`js/ui.js?v=2`)
- Published by GitHub Pages from `main`: every push goes live at https://wizzard262.github.io/railhead-normandy/ in about a minute
  - harriercarrier.com holds no game code, only a banner panel on the home page (under Railhead's) and portfolio links that point to the GitHub Pages address
  - Banner: `node tools/banner.js <folder>` (game served on port 8767) makes `beachhead_banner.webp` and `_1440.webp` for the website's `assets/`
- Tone: about trucks, trains, ports and weather
