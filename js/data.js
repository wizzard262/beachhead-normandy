// Beachhead: Normandy 1944. The map and the world numbers for the Allied breakout

const START_DATE = new Date(1944, 7, 1);    // day 1 = Tuesday 1 August 1944, a week after the Cobra breakout began

// Difficulty: the same campaign, a different deadline
const DIFFICULTY = {
  easy:   { name: 'Easy',   lastDay: 53, hint: 'Deadline 22 September. Forgiving: pausing to stock up when supply runs short is usually enough' },
  normal: { name: 'Normal', lastDay: 50, hint: 'Deadline 19 September. Pause to stock up, rest worn trucks, watch the fuel' },
  hard:   { name: 'Hard',   lastDay: 46, hint: 'Deadline 15 September. Rest trucks, run the Red Ball, clear ports and bridges early: every day counts' },
};

// What you have each day. Supply comes ashore over the beaches and through captured ports (see PORTS)
const TRUCK_COLUMNS = 20;
const ENGINEERS = 18;           // railway engineer battalions (track, bridges, stations)
const BOMBER_GROUPS = 8;

const TRAIN_TONS = 450;         // one supply train
const TRUCK_TONS = 300;         // one truck column, one trip
const TRUCK_KM_PER_DAY = 250;   // there and back counts double
const TRUCK_FUEL = 0.0006;      // tons of fuel burnt per ton carried per km

// Trucks wear out. A column carries its full load only when in good order
const TRUCK_START_COND = 85;    // condition of the truck columns on day 1 (%)
const TRUCK_WEAR = 1.5;           // condition lost per day by columns driving flat out (%)
const TRUCK_REST = 12;          // condition regained per day by columns resting (unassigned) (%)
const TRUCK_MIN_LOAD = 0.4;     // a worn-out column still carries this share
// The Red Ball Express: one army's trucks on one-way roads, driving day and night
const RED_BALL_SPEED = 2.5;       // its trucks cover this many times the distance
const RED_BALL_WEAR = 1.3;      // ... and wear this much faster
const RED_BALL_DRAIN = 0.9;     // the other armies' trucks carry this share (roads and drivers taken)

// Fuel is the crisis: the ports land plenty of ammunition but only so much petrol
const FUEL_SHARE = 0.55;        // most of the landed tonnage that can be fuel; the rest is ammo and everything else
const CONVERT_KM = 2.6;           // bombed track repaired per engineer battalion per day (the bridges take longer: see BRIDGES)
const REPAIR = 6;               // station condition repaired per battalion per day
const BOMBER_FUEL = 25;         // tons per bomber group per day, from the sector's depot
const BOMBER_LOSS = 0.02;       // chance a group is lost on each day's sorties

// Getting supplies ashore. Each port lands up to `trains` trainloads a day, times its condition %.
// node = where its trains join the railway: a forward port's trains skip the long haul from the beaches
const PORTS = {
  beaches:   { name: 'Beaches & Mulberry', node: 'beaches', trains: 9, cond: 100, beach: true,
               hint: 'Open beaches and the Mulberry harbour. Channel storms cut them to a quarter; they wear out in autumn' },
  cherbourg: { name: 'Cherbourg', node: 'beaches', trains: 6, cond: 15,
               hint: 'Taken in June, but the Germans wrecked the harbour. Port companies clear it' },
  lehavre:   { name: 'Le Havre', node: 'rouen', trains: 7, cond: 5, takenWith: 'rouen',
               hint: 'Falls when Rouen does; badly wrecked. Its trains join the line at Rouen' },
  antwerp:   { name: 'Antwerp', node: 'antwerp', trains: 14, cond: 70, takenWith: 'antwerp', scheldt: true,
               hint: 'Docks taken almost intact, but useless until the Scheldt estuary is cleared. Its trains join the line at Antwerp, right at the front' },
};
const PORT_COMPANIES = 8;        // port clearance companies to share between the ports
const PORT_CLEAR = 0.6;            // port condition cleared per company per day (%)
const SCHELDT_CLEAR = 1.2;       // Scheldt cleared per company per day (%)
const SCHELDT_HOLD = 5;          // ... plus this much a day while the British & Canadians hold at Antwerp with ammo in hand
const STORM = { chance: 0.04, more: 0.002, cut: 0.25 };   // chance a Channel storm blows up each day (rising), and what the beaches keep
const BEACH_WEAR_DAY = 35;       // from this day the autumn weather wears the beaches down...
const BEACH_WEAR = 0.025;        // ... by this share of their capacity a day

// Bridges the Germans blew on the way out. Track repair stops at a blown bridge until engineers rebuild it.
// at = how far along the link (0 to 1); work = battalion-days to rebuild
const BRIDGES = [
  { link: 'caen|rouen',        at: 0.86, river: 'Seine',   work: 44 },
  { link: 'rouen|amiens',      at: 0.88, river: 'Somme',   work: 24 },
  { link: 'brussels|antwerp',  at: 0.45, river: 'Rupel',   work: 16 },
  { link: 'alencon|paris',     at: 0.90, river: 'Seine',   work: 36 },
  { link: 'paris|sedan',       at: 0.25, river: 'Marne',   work: 24 },
  { link: 'sedan|liege',       at: 0.92, river: 'Meuse',   work: 40 },
  { link: 'chartres|reims',    at: 0.30, river: 'Seine',   work: 36 },
  { link: 'reims|verdun',      at: 0.88, river: 'Meuse',   work: 40 },
  { link: 'verdun|metz',       at: 0.92, river: 'Moselle', work: 40 },
];
const JUNCTION_CAP = 8;          // trains a day a forward port can send across to another army's line (Antwerp → Liège, Le Havre → Paris)
const BRIDGE_INTACT = 0.15;      // chance the Germans fail to blow a bridge when the front crosses it fast

// What engineers do first: repair stations up to repairFirst %, then repair track, then repair the rest
const ENGINEER_FOCUS = {
  track:    { name: '🛤️ Track',   repairFirst: 25,  hint: 'Push the railhead forward; only fix stations that barely work' },
  balanced: { name: 'Balanced',   repairFirst: 70,  hint: 'Fix badly damaged stations, then repair track' },
  station:  { name: 'Station 🚉', repairFirst: 100, hint: 'Get every station back to full before repairing track' },
};

// Fuel share of the supply trains, as fuel:ammo buttons from all-fuel to all-ammo
const MIXES = [
  { fuel: 80, label: '⛽ 4:1' }, { fuel: 67, label: '2:1' }, { fuel: 50, label: '1:1' },
  { fuel: 33, label: '1:2' }, { fuel: 20, label: '1:4 💥' },
];

// Stations. cap = trains a day it can pass or unload when undamaged
const NODES = {
  beaches:   { name: 'Normandy beaches', lon: -0.85, lat: 49.33, cap: 99 },
  caen:      { name: 'Caen',      lon: -0.36, lat: 49.18, cap: 8 },
  rouen:     { name: 'Rouen',     lon: 1.10,  lat: 49.44, cap: 8 },
  amiens:    { name: 'Amiens',    lon: 2.30,  lat: 49.89, cap: 7 },
  brussels:  { name: 'Brussels',  lon: 4.35,  lat: 50.85, cap: 10 },
  antwerp:   { name: 'Antwerp',   lon: 4.40,  lat: 51.22, cap: 10 },
  stlo:      { name: 'Saint-Lô',  lon: -1.09, lat: 49.12, cap: 8 },
  alencon:   { name: 'Alençon',   lon: 0.09,  lat: 48.43, cap: 6 },
  paris:     { name: 'Paris',     lon: 2.35,  lat: 48.86, cap: 12 },
  sedan:     { name: 'Sedan',     lon: 4.94,  lat: 49.70, cap: 6 },
  liege:     { name: 'Liège',     lon: 5.57,  lat: 50.63, cap: 9 },
  aachen:    { name: 'Aachen',    lon: 6.08,  lat: 50.78, cap: 8 },
  avranches: { name: 'Avranches', lon: -1.36, lat: 48.68, cap: 5 },
  lemans:    { name: 'Le Mans',   lon: 0.20,  lat: 48.00, cap: 9 },
  chartres:  { name: 'Chartres',  lon: 1.49,  lat: 48.45, cap: 7 },
  reims:     { name: 'Reims',     lon: 4.03,  lat: 49.26, cap: 9 },
  verdun:    { name: 'Verdun',    lon: 5.38,  lat: 49.16, cap: 6 },
  metz:      { name: 'Metz',      lon: 6.18,  lat: 49.12, cap: 9 },
};

// Repaired track: trains a day. Anything not listed carries 5
const LINK_CAP = {
  'beaches|caen': 6, 'beaches|stlo': 9,
  'caen|rouen': 6, 'rouen|amiens': 6, 'amiens|brussels': 6, 'brussels|antwerp': 8,
  'stlo|alencon': 6, 'alencon|paris': 7, 'paris|sedan': 6,
  'stlo|avranches': 6, 'lemans|chartres': 6, 'chartres|reims': 6,
};
const LINK_CAP_DEFAULT = 5;

// Track already working on day 1, and the towns already taken (Caen and Saint-Lô fell in July)
const START_CONVERTED = ['beaches|caen', 'beaches|stlo'];
const START_CAPTURED = { caen: 35, stlo: 25 };

const SECTORS = [
  { id: 'north',  name: 'British & Canadian', short: 'Br & Can', colour: '#8a3a5a',
    line: ['beaches', 'caen', 'rouen', 'amiens', 'brussels', 'antwerp'],
    forces: { inf: 4, pz: 2, art: 2 }, resistance: 34 },
  { id: 'centre', name: 'US First Army', short: 'US First', colour: '#2f5d8a',
    line: ['beaches', 'stlo', 'alencon', 'paris', 'sedan', 'liege', 'aachen'],
    forces: { inf: 4, pz: 2, art: 2 }, resistance: 30 },
  { id: 'south',  name: 'US Third Army', short: 'US Third', colour: '#3f7a3a',
    line: ['beaches', 'stlo', 'avranches', 'lemans', 'chartres', 'reims', 'verdun', 'metz'],
    forces: { inf: 3, pz: 3, art: 1 }, resistance: 24 },
];

// need = tons a day by posture; attack/defend = combat power; speed = km a day added
const UNIT_TYPES = {
  inf: { name: 'Infantry division', short: 'Inf', trains: 2, march: 40,
         need: { advance: { fuel: 60, ammo: 50 }, hold: { fuel: 12, ammo: 25 } },
         attack: 1, defend: 1.5, speed: 0.5 },
  pz:  { name: 'Armoured division', short: 'Armd', trains: 3, march: 100,
         need: { advance: { fuel: 340, ammo: 50 }, hold: { fuel: 35, ammo: 20 } },
         attack: 2.5, defend: 1, speed: 3 },
  art: { name: 'Artillery group', short: 'Art', trains: 2, march: 40,
         need: { advance: { fuel: 40, ammo: 110 }, hold: { fuel: 8, ammo: 50 } },
         attack: 1.5, defend: 2.5, speed: 0 },
};
const UNIT_ORDER = ['inf', 'pz', 'art'];

const BASE_SPEED = 16;      // km a day the slowest force can move; units add their speed
const MAX_SPEED = 34;
const COMBAT_SPEED = 70;    // km a day = COMBAT_SPEED x attack power / German resistance
const SHORT_SUPPLY = 0.4;   // below this share of a day's needs a sector can't advance at all; above it, speed climbs to full
const WELL_SUPPLIED = 0.08; // speed bonus for each day of fuel and ammo still in hand after today (up to 4 days: +32%)
const HOLD_DEFENCE = 1.6;   // a sector on Hold is dug in: its defence counts this much more
// What a sector on Hold gets in return for the days it doesn't advance
const STOCK_DAYS = 3;       // days of advancing the trucks keep at the front while it advances
const HOLD_STOCK_DAYS = 5;  // ... and while it holds, so it can build up for a big push
const HOLD_ENGINEERS = 1.5; // its engineers repair this many times as fast (no front to keep up with)
const HOLD_SOFTEN = 1;      // its guns wear the Germans down: resistance falls this much a day (more with artillery)

// The German border (the West Wall): resistance builds up as a front gets within this many km of the end of its line
const WEST_WALL_KM = 160;
const WEST_WALL_RES = 0.5;  // extra resistance a day for a front inside that zone

// Divisions landing at the beaches for you to send forward
const REINFORCEMENTS = [
  { day: 1, type: 'inf' }, { day: 1, type: 'pz' },
  { day: 5, type: 'art' }, { day: 8, type: 'inf' },
  { day: 11, type: 'pz' }, { day: 15, type: 'inf' },
  { day: 19, type: 'art' }, { day: 23, type: 'inf' },
  { day: 27, type: 'pz' }, { day: 32, type: 'inf' },
];

const OBJECTIVES = ['paris', 'antwerp', 'aachen', 'metz'];
// The German side
const SOVIET_GROWTH = 10;        // German reserves a day, plus SOVIET_GROWTH_PER_DAY x the day
const SOVIET_GROWTH_PER_DAY = 0.3;
const BUILDUP_CHANCE = 0.6;      // chance each quiet day that a counterattack build-up starts once reserves are ready
const AIR_RAID = { chance: 0.12, minStock: 1500, loss: 0.25 };   // chance a day of a raid on the fullest depot, the tons it must hold, and the share burnt
const RECON_RIGHT = 0.75;        // chance air recon names the right sector for a build-up
const STATION_BLOWN = 0.12;      // chance the Germans blow a station up completely as they leave
const FAST_ADVANCE_KM = 20;      // a front moving this fast (km a day) doubles the chance of taking bridges intact
const DEPOT_MAGNET = 9000;       // tons in a depot at which the advice warns it draws German bombers
const STATION_FULL = 95;         // a station repaired this far counts as full: the advice stops asking for station repairs
const FUEL_SHORT = 0.95;         // below this share of the fuel asked for landing, the advice says petrol is the limit

// The real dates, for the result screen
const HISTORY = [
  { node: 'paris', day: 25, text: 'Paris was liberated on 25 August' },
  { node: 'antwerp', day: 35, text: 'Antwerp was taken on 4 September, but its port opened only on 28 November' },
  { node: 'aachen', day: 82, text: 'Aachen fell on 21 October' },
  { node: 'metz', day: 114, text: 'Metz held out until 22 November' },
];
