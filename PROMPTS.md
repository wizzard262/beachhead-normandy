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

## Sessions

| # | Date | Length | What we did |
|---|------|--------|-------------|
| 1 | 2026-10-29 | about 60 min (Steve asleep) | Prompt 1: the first attempt, copied from Railhead and turned into Normandy 1944: map, beaches and ports, storms, bombed track, the West Wall, Allied names, levels, history on the result screen |
