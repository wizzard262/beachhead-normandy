// Railhead: Normandy 1944. The map and the world numbers for the Allied breakout

const START_DATE = new Date(1944, 7, 1);    // day 1 = Tuesday 1 August 1944, a week after the Cobra breakout began
const LAST_DAY = 50;                         // 19 September 1944 (Normal; the balance tools use this)

// Difficulty: the same campaign, a different deadline
const DIFFICULTY = {
  easy:   { name: 'Easy',   lastDay: 56, hint: 'Deadline 25 September. Leaving everything alone wins about half the time' },
  normal: { name: 'Normal', lastDay: 50, hint: 'Deadline 19 September. Leaving everything alone wins about a third of the time' },
  hard:   { name: 'Hard',   lastDay: 42, hint: 'Deadline 11 September. Leaving everything alone wins about a quarter of the time' },
};

// What you have each day. Supply comes ashore over the beaches and through captured ports (see LANDING)
const TRUCK_COLUMNS = 16;
const ENGINEERS = 18;           // railway engineer battalions
const BOMBER_GROUPS = 8;

const TRAIN_TONS = 450;         // one supply train
const TRUCK_TONS = 300;         // one truck column, one trip
const TRUCK_KM_PER_DAY = 250;   // there and back counts double
const TRUCK_FUEL = 0.0005;      // tons of fuel burnt per ton carried per km
const CONVERT_KM = 3.0;         // bombed track and bridges repaired per engineer battalion per day
const REPAIR = 6;               // station condition repaired per battalion per day
const BOMBER_FUEL = 25;         // tons per bomber group per day, from the sector's depot
const BOMBER_LOSS = 0.02;       // chance a group is lost on each day's sorties

// Getting supplies ashore: trains a day the beachhead can load from each source
const LANDING = {
  beaches: 13,                  // open beaches and the Mulberry harbour
  stormChance: 0.04,            // chance a Channel storm blows up on any day (more often in September)
  stormMore: 0.002,             // added to stormChance each day
  stormCut: 0.25,               // the beaches work at this share during a storm
  cherbourg: { trains: 4, day: 9 },          // the wrecked port is cleared and opens on this day
  antwerp: { trains: 8, clear: 18, node: 'antwerp' },  // once Antwerp is taken, the Scheldt takes this many days to clear
};

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
    line: ['beaches', 'stlo', 'alencon', 'paris', 'sedan', 'aachen'],
    forces: { inf: 4, pz: 2, art: 2 }, resistance: 30 },
  { id: 'south',  name: 'US Third Army', short: 'US Third', colour: '#3f7a3a',
    line: ['beaches', 'stlo', 'avranches', 'lemans', 'chartres', 'reims', 'verdun', 'metz'],
    forces: { inf: 3, pz: 3, art: 1 }, resistance: 24 },
];

// need = tons a day by posture; attack/defend = combat power; speed = km a day added
const UNIT_TYPES = {
  inf: { name: 'Infantry division', short: 'Inf', icon: '✕', trains: 2, march: 40,
         need: { advance: { fuel: 40, ammo: 70 }, hold: { fuel: 10, ammo: 30 } },
         attack: 1, defend: 1.5, speed: 0.5 },
  pz:  { name: 'Armoured division', short: 'Armd', icon: '⬭', trains: 3, march: 100,
         need: { advance: { fuel: 280, ammo: 70 }, hold: { fuel: 30, ammo: 25 } },
         attack: 2.5, defend: 1, speed: 3 },
  art: { name: 'Artillery group', short: 'Art', icon: '●', trains: 2, march: 40,
         need: { advance: { fuel: 25, ammo: 150 }, hold: { fuel: 6, ammo: 60 } },
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

// The real dates, for the result screen
const HISTORY = [
  { node: 'paris', day: 25, text: 'Paris was liberated on 25 August' },
  { node: 'antwerp', day: 35, text: 'Antwerp was taken on 4 September, but its port opened only on 28 November' },
  { node: 'aachen', day: 82, text: 'Aachen fell on 21 October' },
  { node: 'metz', day: 114, text: 'Metz held out until 22 November' },
];
