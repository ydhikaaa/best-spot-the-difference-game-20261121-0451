// scenes.js — the campaign as data. Six original scenes, each painted twice
// (original panel + altered panel) by the painter named in `painter` over in
// render.js. The altered panel applies exactly the eight differences listed
// here; each difference carries the scene-space position (800 x 600) and hit
// radius the input layer tests clicks against, plus a label the scene-complete
// breakdown can name. Difficulty rises down the list: differences shrink,
// colours get closer, and the hiding spots move toward the edges.

export const SCENE_W = 800;
export const SCENE_H = 600;

export const SCENES = [
  {
    id: 'night-market',
    name: 'Moonlight Night Market',
    painter: 'paintNightMarket',
    tagline: 'Lanterns, fruit stalls and one very calm cat.',
    par: 60,
    timeLimit: 150,
    differences: [
      { id: 'moon', label: 'The moon changes phase', x: 118, y: 88, r: 56 },
      { id: 'awning', label: 'The middle awning changes colour', x: 400, y: 238, r: 62 },
      { id: 'lantern', label: 'A hanging lantern is gone', x: 662, y: 178, r: 36 },
      { id: 'cat', label: 'The cat gains a tiny hat', x: 208, y: 468, r: 42 },
      { id: 'fruit', label: 'Apples become oranges', x: 560, y: 470, r: 46 },
      { id: 'star', label: 'The biggest star is missing', x: 702, y: 68, r: 30 },
      { id: 'flag', label: 'The left stall loses its flag', x: 88, y: 302, r: 36 },
      { id: 'bulb', label: 'One string-light bulb changes colour', x: 482, y: 118, r: 28 },
    ],
  },
  {
    id: 'reef-post',
    name: 'Coral Reef Post Office',
    painter: 'paintReefPost',
    tagline: 'Undersea mail, delivered by an eight-armed postman.',
    par: 70,
    timeLimit: 160,
    differences: [
      { id: 'turtle', label: "The turtle's shell pattern changes", x: 618, y: 418, r: 56 },
      { id: 'mailflag', label: 'The mailbox flag drops', x: 178, y: 298, r: 30 },
      { id: 'fish', label: 'One fish leaves the school', x: 482, y: 148, r: 46 },
      { id: 'octopus', label: 'The postman swaps his letter for a key', x: 298, y: 428, r: 46 },
      { id: 'starfish', label: 'The starfish changes colour', x: 700, y: 518, r: 30 },
      { id: 'bubbles', label: 'A cluster of bubbles is gone', x: 118, y: 478, r: 36 },
      { id: 'anchor', label: 'The anchor vanishes from the sand', x: 520, y: 520, r: 40 },
      { id: 'windowfish', label: 'A face appears in the round window', x: 380, y: 278, r: 32 },
    ],
  },
  {
    id: 'sky-train',
    name: 'Sky Train Station',
    painter: 'paintSkyTrain',
    tagline: 'The 5 o\'clock to the clouds is now boarding.',
    par: 80,
    timeLimit: 170,
    differences: [
      { id: 'clock', label: 'The station clock tells a different time', x: 678, y: 208, r: 46 },
      { id: 'passenger', label: 'A passenger disappears from the train', x: 330, y: 248, r: 30 },
      { id: 'balloon', label: 'The balloon changes its stripes', x: 108, y: 118, r: 46 },
      { id: 'signal', label: 'The signal light turns red', x: 740, y: 330, r: 22 },
      { id: 'luggage', label: 'One suitcase leaves the pile', x: 148, y: 468, r: 40 },
      { id: 'smoke', label: 'One smoke puff is missing', x: 248, y: 148, r: 36 },
      { id: 'bird', label: 'One bird leaves the flock', x: 560, y: 88, r: 36 },
      { id: 'lamp', label: 'The platform lamp goes out', x: 450, y: 378, r: 28 },
    ],
  },
  {
    id: 'desert-caravan',
    name: 'Desert Caravan Camp',
    painter: 'paintDesertCaravan',
    tagline: 'Tea at sunset, somewhere past the last dune.',
    par: 90,
    timeLimit: 180,
    differences: [
      { id: 'blanket', label: "The camel's saddle blanket changes colour", x: 520, y: 378, r: 50 },
      { id: 'tentflag', label: 'The middle tent loses its flag', x: 404, y: 216, r: 28 },
      { id: 'pot', label: 'The pot over the fire is gone', x: 298, y: 478, r: 36 },
      { id: 'dates', label: 'The palm loses its dates', x: 108, y: 258, r: 30 },
      { id: 'cactusflower', label: 'The cactus flower disappears', x: 700, y: 398, r: 26 },
      { id: 'vulture', label: 'One vulture leaves the sky', x: 620, y: 108, r: 36 },
      { id: 'jars', label: 'One jar is missing by the tent', x: 178, y: 468, r: 36 },
      { id: 'sunhalo', label: 'The sun gains a halo ring', x: 128, y: 88, r: 46 },
    ],
  },
  {
    id: 'winter-owl',
    name: 'Winter Owl Cabin',
    painter: 'paintWinterOwl',
    tagline: 'A warm window, a cold night, a watchful owl.',
    par: 100,
    timeLimit: 190,
    differences: [
      { id: 'owleyes', label: 'The owl falls asleep', x: 610, y: 198, r: 30 },
      { id: 'smoke', label: 'One chimney smoke curl is missing', x: 330, y: 128, r: 36 },
      { id: 'scarf', label: "The snowman's scarf changes colour", x: 178, y: 428, r: 36 },
      { id: 'curtain', label: 'A cabin curtain is drawn', x: 420, y: 328, r: 28 },
      { id: 'logpile', label: 'One log leaves the wood pile', x: 560, y: 468, r: 36 },
      { id: 'footprints', label: 'An extra pair of footprints appears', x: 380, y: 528, r: 26 },
      { id: 'lanternpost', label: 'The lantern post goes dark', x: 88, y: 378, r: 26 },
      { id: 'icicles', label: 'One icicle melts off the roof', x: 480, y: 248, r: 30 },
    ],
  },
  {
    id: 'clockwork-garden',
    name: 'Clockwork Garden',
    painter: 'paintClockworkGarden',
    tagline: 'Everything here blooms on gears — mind the teeth.',
    par: 110,
    timeLimit: 200,
    differences: [
      { id: 'gearteeth', label: 'The great gear loses a tooth', x: 400, y: 218, r: 46 },
      { id: 'butterfly', label: 'The butterfly loses a wing spot', x: 178, y: 148, r: 26 },
      { id: 'valve', label: 'The pipe valve changes colour', x: 660, y: 418, r: 22 },
      { id: 'robothat', label: "The gardener's hat loses its gear badge", x: 580, y: 298, r: 26 },
      { id: 'smallgear', label: 'A small gear vanishes from the path', x: 238, y: 498, r: 22 },
      { id: 'gateclock', label: 'The gate clock gains fifteen minutes', x: 88, y: 318, r: 28 },
      { id: 'canstripe', label: 'The watering can loses its stripe', x: 330, y: 468, r: 28 },
      { id: 'windkey', label: "The right tree's wind-up key is gone", x: 726, y: 178, r: 26 },
    ],
  },
];
