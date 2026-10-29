# Plan: ports and blown bridges

Steve's feedback on the first attempt: it plays the same as 1941 on a different map; where are the ports and the broken bridges? This plan makes them real choices. **Done 2026-10-29 (v3):** built, drawn on the map, checked on screen, balanced. The numbers below were the first try; the final ones are in `js/data.js` and PROMPTS.md.

## Ports

- **Ports panel** in the side column: Beaches & Mulberry, Cherbourg, Le Havre, Antwerp. Each shows trainloads landed today against its size, a cleared-% bar and its state
- **Port companies** (8 to share): + and − on each port. Each clears 1% of a harbour a day
- **Wrecked on capture:** Cherbourg starts at 15%, Le Havre arrives at 5% (falls with Rouen), Antwerp's docks at 70%
- **Forward ports** join the railway near the front, so their trains skip the long haul from the beaches:
  - Le Havre: at Rouen (British & Canadian), and across to Paris (US First)
  - Antwerp: at Antwerp, and across to Liège (US First), up to 8 trains a day on each cross route
- **The Scheldt:** Antwerp lands nothing until the estuary is cleared: port companies (1.2% each a day) plus the British & Canadians holding at Antwerp with a day of ammo in hand (5% a day)
- **Beaches:** storms cut them to a quarter for 2–4 days and damage the Mulberry; from day 35 (early September) autumn weather wears them down 2.5% a day
- The supply line's first box names the port(s) the sector's trains came from

## Blown bridges

- Nine river crossings on the lines: Seine (×3), Somme, Rupel, Marne, Meuse (×2), Moselle
- The Germans blow each one as the front crosses it, unless the advance is fast (15% chance it's taken intact, 30% if the sector moved 20 km+ that day)
- The railhead stops at a blown bridge; engineers lay track up to it, then rebuild it (16–44 battalion-days), then carry on
- Plain track repairs faster (4 km a battalion a day), so bridges become the bottleneck
- Engineer note and adviser name the bridge and the days of work left

## Map changes

- Add **Liège** to US First Army's line (Paris → Sedan → Liège → Aachen) so Antwerp can feed the drive on Aachen
- Still to do: draw the bridges on the map (grey ahead of the front, red and broken when blown, black when rebuilt), Le Havre and port capacity marks

## Balance with these rules (150 games per strategy)

| Level | Leave everything | Hold when short, push with 4 days in hand |
|---|---|---|
| Easy | 61% | 100% |
| Normal | 47% | 100% |
| Hard | 29% | 97% |

Leaving everything alone still wins too often on Normal: tune once the ports and bridges are playable.

## Still to do

1. Draw bridges and ports on the map
2. Check it all on screen; screenshots
3. Tune the balance (aim: leave everything about 30% on Normal)
4. Then the other ideas: truck wear, rations, broad front or one thrust, a storm wrecking a Mulberry
