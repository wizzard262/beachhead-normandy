# Beachhead: Normandy 1944: the prompts

> **Note for Claude:** every time a prompt is given to work on this game, add a short summary of it here (spelling and typos fixed), newest at the bottom. Include any decisions made in reply to your questions, and every assumption made without asking. This file is the history of how the game was made, and the game links to it (top right, **prompts**).

## 1. First attempt (2026-10-29)

- Start a first attempt at the Normandy game, with a screen layout very like Railhead and the same repo model
- Steve was going to sleep: make assumptions for about 70 minutes and he'll confirm them later
- The design came from the earlier chat (also in [docs](docs/)): supply comes ashore, French railways bombed and repaired, trucks are king, three Allied armies racing for Germany

### Assumptions made (please confirm or change)

| # | Assumption | Why |
|---|---|---|
| 1 | **Separate game and repo**: `railhead-normandy`, a copy of Railhead's code changed for 1944 (not a campaign inside Railhead) | "Same repo model": its own repo, like Railhead. Merging both into one game with a campaign picker can come later |
| 2 | **Starts 1 August 1944**, just after the Cobra breakout; Caen and Saint-Lô already taken | The supply race is the interesting part; the bocage fighting in June and July is a different game |
| 3 | **Three sectors**: British & Canadian (Caen → Rouen → Amiens → Brussels → Antwerp), US First Army (Saint-Lô → Alençon → Paris → Sedan → Aachen), US Third Army (Saint-Lô → Avranches → Le Mans → Chartres → Reims → Verdun → Metz) | Matches the real armies and the earlier sketch |
| 4 | **Objectives**: Paris, Antwerp, Aachen and Metz | From the design chat |
| 5 | **Supply comes ashore** instead of starting at Warsaw: the beaches land 13 trainloads a day, **Channel storms** cut them to a quarter for 2–4 days (more often as September comes), **Cherbourg** adds 4 a day from day 9, **Antwerp** adds 8 a day but only after it's taken and the Scheldt cleared (18 days) | The core new idea; kept simple for a first try |
| 6 | **Bombed track instead of broad gauge**: engineers repair it a bit faster than Russian track was converted (3 km a battalion a day, was 1.9) | French track exists; the bridges are the problem |
| 7 | **The German border (West Wall)**: resistance builds up a little each day once a front is within 160 km of its objective | The September stall at the border |
| 8 | **Fighter-bombers** (8 groups, fewer losses) and **rarer German air raids** | Allied air superiority |
| 9 | **Units**: infantry, **armoured divisions** (were panzers), artillery groups; same strengths, a little more fuel | Same game, Allied names |
| 10 | **Levels**: Easy 25 September, Normal 19 September, Hard 11 September | Balance below |
| 11 | **Map**: board layout (not true geography): the Channel and Cotentin top-left, the beaches as the base, bocage, the Ardennes, rivers Seine, Loire, Somme, Marne, Meuse, Moselle and Scheldt, the German border on the right | Same style as Railhead |
| 12 | **Result screen** compares with the real dates: Paris 25 August, Antwerp 4 September (port open 28 November), Aachen 21 October, Metz 22 November | Puts the player's game against history |
| 13 | **Not published** on harriercarrier.com yet; private GitHub repo only | Publishing waits for Steve to see it |
| 14 | **Not built yet**: truck wear, rations, the broad-front-or-thrust choice as its own control, a Mulberry wrecked by a storm, a fuel pipeline | Kept the first attempt small |

### Balance (150 computer-played games per strategy)

| Level | Leave everything | Hold when short, push with 4 days in hand |
|---|---|---|
| Easy | 55% | 100% |
| Normal | 35% | 99% |
| Hard | 24% | 97% |

Bombing the reported build-ups doesn't help yet (it wins less than leaving things alone): something to look at.

## 2. Ports and blown bridges

- It looked like the same gameplay on a different map: what about all the ports and the broken bridges?
- (Started without being asked, stopped, saved as a plan in [docs/PLAN-ports-and-bridges.md](docs/PLAN-ports-and-bridges.md), then: carry on with ports and bridges)
- **Ports panel** (right-hand column): Beaches & Mulberry, Cherbourg, Le Havre, Antwerp, each with trainloads landed against its size, a cleared bar and its state. **8 port companies** to move between them with + and −
  - Ports arrive wrecked: Cherbourg 15%, Le Havre 5% (falls with Rouen), Antwerp's docks 70%
  - Forward ports join the railway near the front: Le Havre at Rouen and across to Paris, Antwerp at Antwerp and across to **Liège** (new station on US First Army's line)
  - Antwerp lands nothing until the **Scheldt** is cleared: port companies, plus the British & Canadians holding at Antwerp with ammo
  - Channel storms cut the beaches to a quarter and damage the Mulberry; from early September the weather wears the beaches down
  - "N short" in red above the trains when fewer were landed than the sectors ask for
- **Blown bridges**: nine river crossings drawn on the map (grey ahead, red ✕ when blown with an orange ring as it's rebuilt, black when working). The Germans blow them as they retreat (sometimes taken intact if you move fast); the railhead stops there until engineers rebuild it (16–44 battalion-days). The engineer note and adviser name the bridge and the work left
- Hover a port or bridge on the map for its details
- Balance (150 games each, leaving everything alone / holding and pushing well): Easy (22 Sep) 55% / 100%, Normal (19 Sep) 27% / 95–97%, Hard (15 Sep) 5% / 67%

## 3. Publish it

- If it's ready, publish it on harriercarrier.com under Railhead, in the same format, and add it to the portfolio; Steve will play it and see how it goes
- Home page banner panel under Railhead's (the map with a RAILHEAD title card: "Normandy · Summer 1944 · Land it, clear the ports, rebuild the bridges", and a red PLAY stamp), the game in the website's `railhead-normandy/` folder, the portfolio list and pictures, the sitemap

## 4. A name of its own: Beachhead

- Normandy is really a new, different game: give it a different name and main badge, reflecting the beaches
- Options offered: Beachhead, Over the Beach, Mulberry, Red Ball. Chosen: **Beachhead** (mirrors Railhead; the foothold everything is supplied through)
- Renamed in the game, its pages and the home page banner (BEACHHEAD · Normandy · Summer 1944); the website address is now `/beachhead/`, and the old `/railhead-normandy/` forwards there. The repo keeps its name `railhead-normandy` for now
- The chosen level is now remembered separately from Railhead's

## 5. Badge and map looks

- Show other military map styles for the main logo: six badge mock-ups (staff map card, blueprint, supply crate, planning overlay, wartime poster, aerial recon). Planning overlay good, but just the centre badge; and different in-game map backgrounds (aged paper, printed army map, topographic, blueprint, aerial recon). The choice is also the background of the harriercarrier.com banner. Shown all on one page
- Chosen: **aerial recon photo** for the logo, **blueprint** for the map
  - The banner: the blueprint map with an aerial recon print in the centre (ships, beach, fields, film grain), BEACHHEAD in white chinagraph, "SORTIE 106G/4021 · NORMANDY · SUMMER 1944", a red PLAY ring
  - The in-game map is the blueprint, with towns, track, bridges, ports, flags, the front and the legend redrawn in light ink; other looks stay available with `?map=paper|printed|topo|recon` on the address

## 6. Trucks are the game, fuel is the crisis

- Are the mechanics just the same, with the same resources? (About two thirds the same; ideas offered.) Add these two:
- **Trucks wear out**: each army's columns lose condition as they drive (shown as a 🔧 bar in the Trucks column) and worn trucks carry less (down to 40% of a load). Columns taken off an army **rest** and recover 12% a day ("N resting" above the column); taking a worn one off and putting a rested one back swaps them. 20 truck columns, 6 per army and 2 resting at the start
- **🔴 Red Ball** button on one army at a time: its trucks go 2.5× as far but wear faster, and the other armies' trucks carry 10% less
- **Fuel is the scarce cargo**: the ports land at most 55% of their tonnage as petrol. If the armies' mixes ask for more, each gets a share and the rest of the train space carries ammo ("⛽ 93% of fuel" in red above the Train mix). Armies now need much more fuel and less ammo; the default mix is 2:1
- The adviser warns about worn trucks and suggests the Red Ball when the front is far beyond the railhead
- Balance (150 games each): leaving everything alone now almost always loses; pausing to stock up wins 97% on Easy, 77% on Normal, 20% on Hard; resting trucks well 99% / 97% / 53%; the Red Ball 94% / 82% / 52%

## 7. Tidy-ups

- The column counts overlapped ("2 resting" ran into Engineers): each column's count now sits under its name
- No scrolling in the two top-right boxes: the report shows its two most important lines with "+ N more" to open the rest; ports are one line each; each division type is one line with short send buttons (Br, 1st, 3rd); the boxes grow instead of scrolling

## 8. Legend

- The legend's 🌉 emoji didn't match the bridges on the map: it now shows small drawn bridges like the map's, "working bridge" and "blown bridge (rebuild to use)"; the same pictures replace 🌉 in the engineer notes, the advice and the hover text
- Removed "■ big station" from the legend: the town pictures on the map already show the big cities (also in Railhead)

## 9. Antwerp on the wrong side of the front

- Antwerp looked to be on my side of the front line, but the panel said it was still 76 km away on the other side
- The British line turned back west to reach Antwerp, so the drawn front line passed east of it. Antwerp now sits north-east of Brussels on the board (name to its left, clear of the End day button), so it stays on the German side until it's taken
- Also checked: every + and − button matches what's free (+ greys out when nothing is free to give; left as it is)

## 10. "3.5306122448979593 free"

- The trains count showed a long fraction: a division part-way through loading holds the rest of its trains. The free count now rounds down to whole trains (also in Railhead)

## 11. Port companies come back at 100%

- When a port reaches 100%, take its port companies off automatically: they go back to the free pool, and the report says so
- The game now starts with 2 companies free (the beaches start at 100%, so none are put there)

## 12. Days ahead or behind history

- On the result screen, show how each objective compares with the real campaign as days ahead or behind (e.g. "+9 days ahead", "−2 days behind", "the same day") instead of "you: day 34"
- Objectives not taken still show only the real date

## 13. The logistics quote

- Put the quote "Amateurs talk about tactics, but professionals study logistics." and its author (General Robert H. Barrow, US Marine Corps) in the gap left of the How to play button, in both games
- Don't let it wrap: it stays on one line and gets smaller to fit; when the gap is too small to read it (smaller laptops, phones) it is hidden, so the header never grows
- Chosen because it is reliably sourced (Barrow, about 1980); the three-part "tactics, strategy, logistics" version has no good source

## 14. Code review: tidy-up and tests

- Review the code for unnecessary expensive operations, duplication and good practice, then fix what was found
- **Speed**: nothing slow. A whole page update takes about 1.5 ms, drawing the map under 1 ms, a day's rules under 0.2 ms; placing the map badges (about 8 ms) is only redone when a front or railhead moves
- **Dead code removed**: an unused day limit, unit icons, front history and event lists nothing read, a label tweak for Polotsk (a Railhead town) and two empty comments
- **Repeated code made into one piece**: troop trains still to load (was in 3 places), the end of a line (4 places), the railhead flag position (2 places), the emoji font for the map, the condition colours for bars (5 places), the hover box position (2 places); the day's fuel plan reuses the train shares already worked out
- **Hidden numbers moved to `js/data.js`**: air raid chance, size and loss, how often recon is right, how often a station is blown up, the full-depot warning, how fast a front must move to catch bridges intact
- **Tests added**: `node tools/test.js`. The rules play exactly as before (the same 60 games give the same result before and after)

## 15. Own GitHub Pages

- Publish the game on its own GitHub Pages, and have the harriercarrier.com banner and portfolio links point only there (portfolio link moved to the GitHub hosted section). Remove all of the game's code from the website
- The repo was made public for this (free GitHub Pages needs a public repo); its whole history was checked first: no passwords or secrets
- Live at https://wizzard262.github.io/railhead-normandy/. The old harriercarrier.com address now shows the site's "not found" page

## 16. Repo and address renamed

- Rename the repo and its address from railhead to beachhead: GitHub repo `wizzard262/railhead-normandy` is now `wizzard262/beachhead-normandy`
- Live at https://wizzard262.github.io/beachhead-normandy/. The old address shows a GitHub 404 (Steve chose no forwarding; nothing is left under the old name)
- harriercarrier.com home page banner and portfolio links point to the new address

## 17. Advice that tells the truth about full lines and fuel

- Steve: "The line only takes 4.4 trains a day: the track through Saint-Lô is shared … Set engineers to Station 🚉" but the station is at 100%; lots of trucks, trains and the Red Ball don't fix a fuel crisis on max fuel; "⛽ 1,913 t spare" so why short; a front with no fuel and some ammo should get the all-fuel mix
- Steve chose: fix the advice only, rules unchanged (the 60-game fingerprint is the same)
- **Line full**: the advice now finds the real cause
  - The ports land too few trainloads for all the armies (storms, wrecked ports): send port companies or wait
  - A station still damaged (under 95%): set engineers to Station 🚉, as before
  - Track shared by two armies and every station repaired (Saint-Lô for US First and US Third): repairs can't add more; take trains off the other army or Hold
- **Petrol short everywhere** (under 95% of what the mixes ask lands): new advice that more trains, trucks or the Red Ball can't help; Hold, fewer bombers, port companies
- **"⛽ … t spare" is now "spare ashore"**, and its hover says spare petrol only helps an army whose line has room
- **Green mix** now refills what's short (front and depot against 3 days of use): a front with no fuel gets the most fuel (4:1). It used to match only what the army burns
- **Trucks**: "Add 1 truck (7 free)" read as "need 7"; now "(from the 7 resting)". The count uses what this army's columns really carry (wear, Red Ball), and "more engineers" is left out when the railhead is within 20 km
- Assumption: 4:1 stays the most fuel a train can carry (no all-fuel button)
- New browser checks: `node tools/advice.js` (game served on port 8767)

## 18. Trains cut twice on a full line (rules fix)

- Found while checking prompt 17: when a train's way had two full parts (the beaches–Saint-Lô track and Saint-Lô station), its trains were cut at each, so Saint-Lô passed 6 a day instead of 8
- Steve chose: fix it. Each flow is now cut once, by the tightest track or station on its way
- Balance sweep (150 games per strategy) before → after, normal level: pulse 73% → 69%, build4 58% → 56%, Red Ball only 81% → 83%, rest only 95% → 94%, idle 0% → 0%. Easy and hard much the same; leaving everything alone still loses
- New test fingerprint `5c0868a0`

## 19. Truck distance the same everywhere, legs drawn to scale

- Steve: the Trucks column said 20 km but the truck arrow said 8 km, and the arrow was far too long for 8 km
- The Trucks column and the truck advice now show the real distance (8 km), like the arrow. Rules unchanged: a truck trip still counts at least 20 km (loading and unloading)
- When trains run past a station to the end of the track, the train leg and the truck leg now share their space by distance, so an 8 km truck hop is short next to a 102 km train run
- Assumption: a leg never gets narrower than its label, so a very short hop still has a readable label

## 20. Petrol badge in tons both ways; why trains are short

- Steve: the badge above the mixes sometimes says "⛽ 84% of fuel" and sometimes "… t spare"; and why are we short of trains when we have a fixed number?
- The petrol badge is now tons both ways: "⛽ 320 t short" (red) or "⛽ 1,913 t spare ashore" (green). The petrol advice says tons too. It used to show "spare" with a minus number just under 100%
- Trains are not a fixed number: they are the trainloads the ports land each day. Storms cut the beaches to a quarter, the autumn weather wears them down from day 35, and cleared ports add more. When the armies ask for more than lands, the 🚂 Trains badge says "N short"
- Its hover now says this, with today's landings, what the armies ask for, and what is cutting the landings (storm, autumn weather)

## 21. Armies left behind catch up (flanking); Paris no longer an objective

- Steve: pushing one army works, but the others never go faster to catch up, so they can't make it in time. And why is Paris an objective when you have to go through it for the next one?
- Steve chose flanking: an army behind its neighbour finds the Germans in front pulling back so they aren't cut off. It moves 1% faster for each 1% of its line it is behind its furthest-on neighbour, up to +30%. Its status says "(Germans falling back)". How to play explains it
  - Neighbours are the armies next to it on the map: British & Canadian, US First, US Third. Behind is measured as a share of each line, as the lines differ in length
- **Paris dropped from the objectives**: US First Army takes it on the way to Aachen anyway. The objectives are Antwerp, Aachen and Metz; the result screen still gives the real Paris date
- Balance sweep (150 games per strategy), normal: pulse 69% → 84%, build4 56% → 67%, Red Ball only 83% → 89%, rest only 94% → 98%; leaving everything alone still loses (0%). Hard: pulse 19% → 33%. +60% flanking was tried first and was far too easy (normal pulse 95%)
- New test: an army behind its neighbour goes further on the same day. New fingerprint `1f471a43`

## 22. More trains, fewer through

- Steve (on the live v17): the line takes 1.2 trains when using 8, but 4 when some are removed
- That was the bug fixed in prompt 18 (trains cut at every full part of the line): the more trains sent, the more parts were full and the harder they were cut. Old rules, US Third on day 13: 4 trains → 3.5 through, 8 → 2.8, 10 → 2.3. Now: 4 or more → 3.5 (the narrowest station's limit)
- New test: across 10 games, adding trains to any army never gets fewer through

## 23. No more trains than the line takes

- Steve: don't allow more trains assigned than the track can take; at the start of each day remove any surplus; make the number it can take a whole number, rounded up
- **Line takes** = the trains a day that get through to that army, rounded up to a whole train (3.5 → 4). It is shown under 🚂 Trains when the line is full, in the advice, and the + button is off once one more train wouldn't get through
- **Start of each day** (and of the game): any army sending more than its line takes has trains sent back to the pool, one at a time from the army most over, as taking trains off one army gives others on the same track more room. The report says so ("🚂 US Third Army: 2 trains sent back to the pool; its line can't take them")
- Assumption: trains sent back wait in the pool; the player puts them back (the advice says "Add N trains" when a line has room again). They are not put back automatically
- Day 1 now starts with fewer trains on the US armies: Saint-Lô is at 25% and takes 2 a day
- The balance sweep's players now put free trains on lines with room each morning (as a person would). Normal: pulse 79%, build4 70%, Red Ball only 80%, rest only 95%; leaving everything alone still loses. New fingerprint `d670beb5`
- New tests: each day starts with no army over its line; line takes is a whole number rounded up; the + button is off on a full line

## 24. Spare petrol piles up in a beach dump

- Steve: how do I make sure the armies get the spare petrol ashore? Isn't it wasted, or does it wait?
- It used to be wasted: "spare" was only what the ports could have landed that day. Steve chose: let it pile up
- Petrol landed but not carried forward now goes into a **beach dump** (up to 15,000 t). On days the mixes ask for more fuel than lands (storms, fuel-heavy mixes), the trains draw on the dump first
- The badge above the mixes says "⛽ 2,429 t in the beach dump" (what is left after today's trains) or "⛽ 320 t short"; the shortage report and advice count the dump too
- It only helps armies whose lines have room for more trains: set their mix toward ⛽
- Balance sweep, normal: pulse 79% → 88%, build4 70% → 66%, Red Ball only 80% → 88%, rest only 95% → 93%; leaving everything alone still loses. A 5,000 t limit played the same. New fingerprint `4fb3ecea`
- Steve's tip: pushing the British & Canadians hard first opens the Channel ports (Le Havre, then Antwerp) sooner, and that works well
- New test: unused petrol fills the dump (never past its limit) and a storm draws it down

## 25. Port links drawn on the map

- Steve: "Le Havre's trains reach US First at Paris without going through Saint-Lô": how, when there's no track on the map?
- The rules always had two hidden links: Le Havre's trains up the Seine valley line (Rouen to Paris) and Antwerp's to Liège, up to 8 trains a day each, once US First's railhead reaches Paris or Liège. Nothing drew them
- Steve chose: draw them. They are now thin lines on the map: faint and dashed until they carry trains, solid once they do. Legend entry "Port link"; hovering Paris or Liège says whose trains join there and when; How to play mentions them. US First's supply line already shows "Le Havre" as its source when the link is in use
- The links are one list in `js/data.js` (PORT_LINKS), used by the rules, the map and the hover. Rules unchanged (same fingerprint)

## 26. Our strength against the Germans; clearer port links

- Steve: is there any way to see Allied vs German fighting strength at the front? And make the grey port-link lines more obvious, thicker and away from the rivers
- Steve chose: in each army row. Under its divisions: "⚔️ 12 vs 15", a green/red bar of the two, then the speed it can make with full supply and what holds it back (supply, Germans or road speed). Hover for the sums
  - German strength is shown as the attack power needed to go full speed through them (resistance × 34 ÷ 70), so the two numbers compare directly: over half the bar green and the Germans can't slow the army
  - The speed includes the catch-up bonus when the army is behind its neighbour
- Port links are now thicker (3 px dashed, 4 px solid once in use) and in the map ink, and bend round so they don't run along the Seine (Rouen to Paris) or the Meuse (Antwerp to Liège). Le Havre's own line to Rouen is drawn the same way
- New check: every army row shows the strength line

## Sessions

| # | Date | Length | What we did |
|---|------|--------|-------------|
| 1 | 2026-10-29 | about 60 min (Steve asleep) | Prompt 1: the first attempt, copied from Railhead and turned into Normandy 1944: map, beaches and ports, storms, bombed track, the West Wall, Allied names, levels, history on the result screen |
| 2 | 2026-10-29 | about 60 min | Prompt 2: ports, port companies, the Scheldt, forward ports, Liège, blown bridges on the map |
| 3 | 2026-10-29 | about 90 min | Prompts 4–6: renamed Beachhead, badge and map looks (recon badge, blueprint map), truck wear, the Red Ball, scarce fuel |
| 4 | 2026-10-30 | about 145 min | Prompts 17–26: advice for full lines, shared Saint-Lô, scarce petrol, the green mix and truck counts; trains no longer cut twice on a full line; truck distance the same everywhere, legs to scale; petrol badge in tons, why trains are short; flanking catch-up, Paris no longer an objective; no more trains than the line takes; beach fuel dump; port links drawn; strength vs the Germans |
