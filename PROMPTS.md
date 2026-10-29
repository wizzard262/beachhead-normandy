# Railhead: Normandy 1944: the prompts

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

## Sessions

| # | Date | Length | What we did |
|---|------|--------|-------------|
| 1 | 2026-10-29 | about 60 min (Steve asleep) | Prompt 1: the first attempt, copied from Railhead and turned into Normandy 1944: map, beaches and ports, storms, bombed track, the West Wall, Allied names, levels, history on the result screen |
| 2 | 2026-10-29 | about 60 min | Prompt 2: ports, port companies, the Scheldt, forward ports, Liège, blown bridges on the map |
