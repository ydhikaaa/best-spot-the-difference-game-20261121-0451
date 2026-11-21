// render.js — the painters. Every scene is drawn twice from the same code:
// once with an empty alteration set (the original, left panel) and once with
// every difference id in the set (the altered, right panel), so the two
// panels can only ever differ at the eight documented spots. All art is flat
// vector shapes on a 2D canvas in an 800 x 600 scene space — no images, no
// fonts, nothing fetched. Marker and pulse drawing for finds, hints and
// mistakes lives at the bottom.

import { SCENE_W, SCENE_H } from './scenes.js';

// ---------- small drawing helpers ----------

function circle(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
}

function ellipse(c, x, y, rx, ry, fill) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) { c.fillStyle = fill; c.fill(); }
}

function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

function rrect(c, x, y, w, h, r, fill) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
}

function poly(c, points, fill) {
  c.beginPath();
  c.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) c.lineTo(points[i][0], points[i][1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
}

function line(c, x1, y1, x2, y2, stroke, width) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.strokeStyle = stroke;
  c.lineWidth = width;
  c.stroke();
}

// Four-point sparkle star (for night skies).
function sparkle(c, x, y, r, fill) {
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fillStyle = fill;
  c.fill();
}

// Deterministic pseudo-random scatter so both panels get identical stars,
// bubbles, gravel and so on. (LCG with a fixed seed per call site.)
function scatter(seed, count) {
  const out = [];
  let s = seed >>> 0;
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out.push(s / 4294967296);
  }
  return out;
}

function skyGradient(c, stops) {
  const g = c.createLinearGradient(0, 0, 0, SCENE_H);
  for (const [at, col] of stops) g.addColorStop(at, col);
  c.fillStyle = g;
  c.fillRect(0, 0, SCENE_W, SCENE_H);
}

function gear(c, x, y, r, teeth, fill, holeFill) {
  c.beginPath();
  const inner = r * 0.78;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.38) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.88) / teeth) * Math.PI * 2;
    if (i === 0) c.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
    else c.lineTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
    c.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
    c.lineTo(x + Math.cos(a2) * inner, y + Math.sin(a2) * inner);
    c.lineTo(x + Math.cos(a3) * inner, y + Math.sin(a3) * inner);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  circle(c, x, y, r * 0.34, holeFill);
}

// ---------- Scene 1: Moonlight Night Market ----------

function paintNightMarket(c, alt) {
  skyGradient(c, [[0, '#141f45'], [0.55, '#27386b'], [1, '#3c4a75']]);
  const stars = scatter(11, 60);
  for (let i = 0; i < 30; i++) {
    const x = stars[i * 2] * 800, y = stars[i * 2 + 1] * 210;
    circle(c, x, y, 1.6, 'rgba(255,255,255,0.75)');
  }
  if (!alt.has('star')) sparkle(c, 702, 68, 17, '#ffe9a3');
  sparkle(c, 320, 60, 10, 'rgba(255,233,163,0.8)');
  sparkle(c, 560, 150, 8, 'rgba(255,233,163,0.6)');

  // Moon: full in the original, crescent in the altered panel.
  circle(c, 118, 88, 46, '#f6eed4');
  circle(c, 100, 74, 9, '#e3d5ae');
  circle(c, 134, 104, 6, '#e3d5ae');
  if (alt.has('moon')) {
    circle(c, 146, 72, 40, '#182449');
  }

  // String lights across the top.
  c.beginPath();
  c.moveTo(30, 84);
  c.quadraticCurveTo(400, 168, 770, 96);
  c.strokeStyle = 'rgba(20,16,8,0.8)';
  c.lineWidth = 3;
  c.stroke();
  const bulbCols = ['#ffd166', '#ff8fa3', '#7bdff2', '#b2f7a5', '#ffd166', '#ff8fa3', '#7bdff2'];
  for (let i = 0; i < 7; i++) {
    const t = (i + 1) / 8;
    const x = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 400 + t * t * 770;
    const y = (1 - t) * (1 - t) * 84 + 2 * (1 - t) * t * 168 + t * t * 96;
    let col = bulbCols[i];
    if (i === 4 && alt.has('bulb')) col = '#5f7cff'; // the bulb at ~(482,118)
    circle(c, x, y + 8, 11, col === '#ffd166' ? 'rgba(255,209,102,0.25)' : 'rgba(255,255,255,0.14)');
    circle(c, x, y + 8, 5.5, col);
  }

  // Ground.
  rect(c, 0, 428, 800, 172, '#43301f');
  rect(c, 0, 428, 800, 10, '#59452c');

  // Hanging lanterns on a wire.
  line(c, 240, 132, 730, 132, 'rgba(20,16,8,0.7)', 2);
  const lantern = (x, y) => {
    line(c, x, 132, x, y - 18, '#0e0c06', 2);
    rrect(c, x - 13, y - 18, 26, 34, 9, '#e4572e');
    rect(c, x - 13, y - 6, 26, 3, '#ffb35c');
    rect(c, x - 13, y + 6, 26, 3, '#ffb35c');
    circle(c, x, y, 22, 'rgba(255,160,60,0.16)');
  };
  lantern(300, 168);
  lantern(520, 168);
  if (!alt.has('lantern')) lantern(662, 178);

  // Three stalls.
  const stall = (cx, awnA, awnB) => {
    rect(c, cx - 86, 300, 12, 150, '#5d4028'); // posts
    rect(c, cx + 74, 300, 12, 150, '#5d4028');
    rect(c, cx - 92, 428, 184, 58, '#6e4b2c'); // counter
    rect(c, cx - 92, 428, 184, 8, '#86603a');
    // striped awning
    for (let i = 0; i < 6; i++) {
      poly(c, [
        [cx - 104 + i * 35, 262], [cx - 69 + i * 35, 262],
        [cx - 78 + i * 35, 214], [cx - 104 + i * 35, 214],
      ], i % 2 === 0 ? awnA : awnB);
    }
    rect(c, cx - 104, 256, 208, 7, '#3d2a17');
  };
  stall(150, '#2a9d8f', '#e9f5ec');
  stall(400, alt.has('awning') ? '#7b4ba8' : '#d64545', '#f7ead9');
  stall(650, '#e07b39', '#fdf3d8');

  // Banner hanging on the left stall's front post.
  if (!alt.has('flag')) {
    rect(c, 82, 268, 13, 62, '#ffd166');
    poly(c, [[82, 330], [95, 330], [88.5, 342]], '#ffd166');
  }

  // Vendor behind the middle stall.
  circle(c, 400, 292, 17, '#c98d64');
  poly(c, [[378, 330], [422, 330], [414, 300], [386, 300]], '#38618c');
  rrect(c, 376, 268, 48, 10, 5, '#f2c14e');

  // Crates of produce in front of the stalls.
  const crate = (x, y, fruitCol) => {
    rect(c, x - 34, y - 16, 68, 34, '#7d5a33');
    rect(c, x - 34, y - 16, 68, 6, '#96703f');
    for (let i = 0; i < 4; i++) circle(c, x - 22 + i * 15, y - 20, 8.5, fruitCol);
  };
  crate(150, 500, '#7fb069');
  crate(650, 500, '#ffd166');

  // The fruit crate whose contents change (apples -> oranges).
  crate(560, 488, alt.has('fruit') ? '#ff9f1c' : '#e63946');

  // The cat, asleep on a crate by the left stall.
  rect(c, 168, 478, 84, 26, '#7d5a33');
  ellipse(c, 208, 472, 30, 16, '#23232e');
  circle(c, 238, 458, 13, '#23232e');
  poly(c, [[229, 449], [233, 437], [239, 448]], '#23232e');
  poly(c, [[241, 448], [247, 437], [249, 449]], '#23232e');
  c.beginPath(); // tail curling up the crate side
  c.arc(180, 470, 12, Math.PI * 0.4, Math.PI * 1.15);
  c.strokeStyle = '#23232e';
  c.lineWidth = 6;
  c.stroke();
  if (alt.has('cat')) { // a tiny hat appears on the cat
    poly(c, [[226, 446], [250, 446], [238, 428]], '#e63946');
    rect(c, 222, 444, 32, 5, '#e63946');
    circle(c, 238, 427, 4, '#ffd166');
  }
}

// ---------- Scene 2: Coral Reef Post Office ----------

function paintReefPost(c, alt) {
  skyGradient(c, [[0, '#0a3a5f'], [0.6, '#0f639e'], [1, '#1783b8']]);
  // Light rays from the surface.
  for (const x of [120, 330, 560]) {
    poly(c, [[x, 0], [x + 60, 0], [x + 130, 300], [x + 40, 300]], 'rgba(255,255,255,0.06)');
  }
  // Sand and scattered shells.
  rect(c, 0, 500, 800, 100, '#d9c08a');
  const shells = scatter(23, 24);
  for (let i = 0; i < 12; i++) circle(c, shells[i * 2] * 800, 520 + shells[i * 2 + 1] * 60, 4, '#b89a62');

  // Corals and seaweed at the edges.
  const coral = (x, base, col) => {
    c.strokeStyle = col;
    c.lineWidth = 7;
    c.lineCap = 'round';
    for (const [dx, h] of [[0, 74], [-16, 52], [16, 58], [-28, 34], [28, 38]]) {
      c.beginPath();
      c.moveTo(x, base);
      c.quadraticCurveTo(x + dx * 0.4, base - h * 0.6, x + dx, base - h);
      c.stroke();
    }
    c.lineCap = 'butt';
  };
  coral(52, 520, '#ff7b9c');
  coral(748, 530, '#ff9f1c');
  coral(452, 540, '#c77dff');
  for (const x of [700, 722, 96]) {
    c.beginPath();
    c.moveTo(x, 540);
    c.quadraticCurveTo(x + 8, 480, x - 4, 440);
    c.strokeStyle = '#2a9d5f';
    c.lineWidth = 6;
    c.stroke();
  }

  // The post office: a hut built into a giant shell, left of centre.
  rrect(c, 110, 268, 300, 232, 18, '#e8b04b'); // shell wall
  for (let i = 0; i < 5; i++) rect(c, 110, 300 + i * 42, 300, 5, '#d19a35');
  poly(c, [[92, 272], [428, 272], [380, 196], [140, 196]], '#b5541f'); // roof
  for (let i = 0; i < 6; i++) { // roof shell ridges
    line(c, 150 + i * 44, 262, 168 + i * 40, 204, '#93450f', 5);
  }
  rrect(c, 236, 392, 56, 108, 8, '#7a4a21'); // door
  circle(c, 280, 448, 4, '#ffd166');
  // Round window: empty glass, or a fish face looking out.
  circle(c, 380, 278, 30, '#0d2f47');
  circle(c, 380, 278, 30, 'none');
  c.beginPath(); c.arc(380, 278, 30, 0, Math.PI * 2); c.strokeStyle = '#8a5a1d'; c.lineWidth = 6; c.stroke();
  if (alt.has('windowfish')) {
    ellipse(c, 380, 280, 17, 12, '#ffb703');
    poly(c, [[364, 280], [352, 270], [352, 290]], '#fb8500');
    circle(c, 386, 276, 3, '#10222e');
  } else {
    ellipse(c, 368, 266, 12, 6, 'rgba(255,255,255,0.25)');
  }
  // Sign over the door.
  rrect(c, 196, 316, 136, 30, 6, '#fff3d6');
  c.fillStyle = '#7a4a21';
  c.font = 'bold 17px Georgia, serif';
  c.textAlign = 'center';
  c.fillText('REEF POST', 264, 338);

  // Mailbox on a post, flag up or down.
  rect(c, 168, 348, 10, 60, '#5d4028');
  rrect(c, 128, 300, 84, 50, 10, '#2a9d8f');
  rect(c, 128, 322, 84, 5, '#1f7a6e');
  if (alt.has('mailflag')) {
    rect(c, 196, 316, 8, 30, '#e63946');
    rect(c, 188, 316, 16, 10, '#e63946');
  } else {
    rect(c, 196, 272, 8, 30, '#e63946');
    rect(c, 188, 272, 16, 10, '#e63946');
  }

  // The octopus postman, holding a letter — or a key.
  circle(c, 298, 408, 34, '#9b5de5');
  circle(c, 286, 402, 5, '#1d1030');
  circle(c, 310, 402, 5, '#1d1030');
  c.beginPath(); c.arc(298, 414, 10, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = '#1d1030'; c.lineWidth = 3; c.stroke();
  for (let i = 0; i < 4; i++) { // tentacles
    c.beginPath();
    c.moveTo(272 + i * 17, 434);
    c.quadraticCurveTo(266 + i * 17, 462, 278 + i * 17, 470);
    c.strokeStyle = '#9b5de5';
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.stroke();
  }
  c.lineCap = 'butt';
  rrect(c, 252, 424, 26, 34, 6, '#7a4a21'); // mail satchel
  if (alt.has('octopus')) { // a brass key
    circle(c, 340, 424, 10, '#e8b04b');
    rect(c, 346, 421, 22, 6, '#e8b04b');
    rect(c, 360, 427, 5, 9, '#e8b04b');
    rect(c, 366, 427, 5, 7, '#e8b04b');
  } else { // a letter
    rrect(c, 326, 408, 34, 24, 2, '#ffffff');
    poly(c, [[326, 408], [360, 408], [343, 422]], '#d9d9d9');
  }
  rrect(c, 272, 366, 52, 14, 6, '#f15bb5'); // postman's cap
  rect(c, 264, 378, 68, 5, '#f15bb5');

  // A school of fish — five, or four.
  const fish = (x, y, col, flip) => {
    ellipse(c, x, y, 16, 9, col);
    poly(c, flip ? [[x + 14, y], [x + 26, y - 8], [x + 26, y + 8]] : [[x - 14, y], [x - 26, y - 8], [x - 26, y + 8]], col);
    circle(c, x + (flip ? -8 : 8), y - 2, 2.2, '#10222e');
  };
  fish(440, 128, '#ffd166', false);
  fish(482, 148, '#ffd166', false);
  fish(520, 124, '#ffd166', false);
  fish(500, 178, '#ffb703', false);
  if (!alt.has('fish')) fish(452, 176, '#ffb703', false);

  // The turtle: spotted shell, or striped.
  ellipse(c, 618, 428, 74, 46, '#5a9367');
  if (alt.has('turtle')) {
    c.save();
    c.beginPath(); c.ellipse(618, 428, 74, 46, 0, 0, Math.PI * 2); c.clip();
    for (let i = 0; i < 5; i++) rect(c, 556 + i * 26, 380, 11, 96, '#3f6d49');
    c.restore();
  } else {
    for (const [dx, dy] of [[-38, -14], [0, -20], [36, -12], [-16, 8], [22, 10], [-44, 12]]) {
      circle(c, 618 + dx, 428 + dy, 10, '#3f6d49');
    }
  }
  circle(c, 700, 408, 17, '#6fae7c'); // head
  circle(c, 706, 404, 2.6, '#10222e');
  ellipse(c, 566, 470, 20, 10, '#6fae7c');
  ellipse(c, 668, 472, 20, 10, '#6fae7c');

  // A clam with a bubble cluster rising from it.
  poly(c, [[92, 500], [144, 500], [136, 478], [100, 478]], '#c77dff');
  poly(c, [[92, 500], [144, 500], [130, 522], [106, 522]], '#9d4edd');
  if (!alt.has('bubbles')) {
    for (const [x, y, r] of [[112, 452, 7], [126, 428, 5], [106, 404, 6], [122, 380, 4], [114, 478, 5]]) {
      circle(c, x, y, r, 'rgba(255,255,255,0.35)');
    }
  }

  // The anchor resting on the sand.
  if (!alt.has('anchor')) {
    line(c, 520, 478, 520, 540, '#5b6b7a', 7);
    circle(c, 520, 472, 9, 'none');
    c.beginPath(); c.arc(520, 472, 9, 0, Math.PI * 2); c.strokeStyle = '#5b6b7a'; c.lineWidth = 5; c.stroke();
    line(c, 494, 502, 546, 502, '#5b6b7a', 6);
    c.beginPath(); c.arc(496, 528, 16, Math.PI * 1.05, Math.PI * 1.7); c.strokeStyle = '#5b6b7a'; c.lineWidth = 6; c.stroke();
    c.beginPath(); c.arc(544, 528, 16, Math.PI * 1.3, Math.PI * 1.95); c.stroke();
  }

  // The starfish: orange, or pink.
  const sc = alt.has('starfish') ? '#ff6fa5' : '#ff9440';
  c.save();
  c.translate(700, 518);
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const a2 = a + Math.PI / 5;
    c.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
    c.lineTo(Math.cos(a2) * 11, Math.sin(a2) * 11);
  }
  c.closePath();
  c.fillStyle = sc;
  c.fill();
  c.restore();
  circle(c, 700, 518, 4, 'rgba(255,255,255,0.5)');
}

// ---------- Scene 3: Sky Train Station ----------

function paintSkyTrain(c, alt) {
  skyGradient(c, [[0, '#2e4a7d'], [0.55, '#7d6a9e'], [0.8, '#e8906a'], [1, '#f2a56b']]);
  // Clouds.
  const cloud = (x, y, s, col) => {
    ellipse(c, x, y, 52 * s, 17 * s, col);
    ellipse(c, x - 30 * s, y + 5 * s, 34 * s, 13 * s, col);
    ellipse(c, x + 32 * s, y + 5 * s, 36 * s, 14 * s, col);
  };
  cloud(180, 90, 1, 'rgba(255,235,220,0.85)');
  cloud(620, 60, 0.8, 'rgba(255,235,220,0.7)');
  cloud(430, 130, 0.65, 'rgba(255,235,220,0.55)');

  // Birds: four, or three.
  const bird = (x, y) => {
    c.beginPath();
    c.arc(x - 9, y, 9, Math.PI * 1.15, Math.PI * 1.85);
    c.arc(x + 9, y, 9, Math.PI * 1.15, Math.PI * 1.85);
    c.strokeStyle = '#26324a';
    c.lineWidth = 2.6;
    c.stroke();
  };
  bird(520, 78);
  bird(560, 92);
  bird(600, 74);
  if (!alt.has('bird')) bird(560, 118);

  // Hot-air balloon: red stripes, or blue.
  const stripe = alt.has('balloon') ? '#3a6ea5' : '#d64545';
  c.save();
  c.beginPath(); c.ellipse(108, 112, 44, 52, 0, 0, Math.PI * 2); c.clip();
  for (let i = 0; i < 5; i++) rect(c, 64 + i * 18, 56, 9, 116, i % 2 === 0 ? stripe : '#fdf3d8');
  c.restore();
  c.beginPath(); c.ellipse(108, 112, 44, 52, 0, 0, Math.PI * 2); c.strokeStyle = 'rgba(60,40,20,0.5)'; c.lineWidth = 2; c.stroke();
  line(c, 84, 158, 96, 184, '#5d4028', 2);
  line(c, 132, 158, 120, 184, '#5d4028', 2);
  rect(c, 94, 184, 28, 20, '#8a5a2b');

  // The floating island platform.
  poly(c, [[40, 436], [760, 436], [700, 540], [430, 596], [180, 560], [70, 500]], '#6b4a35');
  poly(c, [[40, 436], [760, 436], [720, 486], [400, 520], [120, 492]], '#7d5a3d');
  rect(c, 30, 424, 740, 14, '#4e8d6c'); // grassy deck edge
  rect(c, 30, 420, 740, 5, '#63a87f');

  // Elevated track on posts.
  for (const x of [120, 300, 480, 660]) rect(c, x, 306, 10, 118, '#54423a');
  rect(c, 20, 300, 760, 7, '#3d2f28');
  rect(c, 20, 288, 760, 5, '#8a7364');

  // Locomotive.
  rrect(c, 118, 216, 150, 74, 8, '#38618c');
  rrect(c, 216, 182, 52, 108, 8, '#2c4e73'); // cab
  rect(c, 226, 196, 32, 30, '#bfe3f2'); // cab window
  rect(c, 150, 176, 18, 44, '#22364f'); // chimney
  rect(c, 142, 168, 34, 10, '#22364f');
  circle(c, 138, 262, 20, '#1d2c40');
  circle(c, 196, 262, 20, '#1d2c40');
  circle(c, 246, 262, 20, '#1d2c40');
  circle(c, 138, 262, 7, '#8fa6bd');
  circle(c, 196, 262, 7, '#8fa6bd');
  circle(c, 246, 262, 7, '#8fa6bd');
  rect(c, 118, 236, 150, 8, '#f2c14e');
  // Smoke puffs: three, or two.
  circle(c, 226, 148, 15, 'rgba(255,255,255,0.85)');
  circle(c, 254, 128, 19, 'rgba(255,255,255,0.75)');
  if (!alt.has('smoke')) circle(c, 288, 112, 23, 'rgba(255,255,255,0.6)');

  // Two passenger cars.
  const car = (x0, withPassenger) => {
    rrect(c, x0, 210, 190, 80, 8, '#7fb069');
    rect(c, x0, 232, 190, 7, '#5d8a4c');
    for (let i = 0; i < 3; i++) {
      const wx = x0 + 20 + i * 60;
      rrect(c, wx, 226, 44, 36, 5, '#dff3fa');
      if (withPassenger && i === 0) { /* handled by caller via flag below */ }
    }
    circle(c, x0 + 34, 290, 15, '#1d2c40');
    circle(c, x0 + 156, 290, 15, '#1d2c40');
  };
  car(310, false);
  car(520, false);
  // The passenger in car 1's first window (scene coords ~(330,248) area):
  // window occupies x 330..374, y 226..262; draw the traveller unless altered.
  if (!alt.has('passenger')) {
    circle(c, 352, 244, 9, '#5b3a29');
    poly(c, [[338, 262], [366, 262], [362, 250], [342, 250]], '#a44a3f');
  }

  // Station sign.
  rect(c, 330, 330, 8, 94, '#54423a');
  rect(c, 462, 330, 8, 94, '#54423a');
  rrect(c, 318, 330, 164, 36, 6, '#22364f');
  c.fillStyle = '#f7ead9';
  c.font = 'bold 19px Georgia, serif';
  c.textAlign = 'center';
  c.fillText('SKY TERMINAL', 400, 355);

  // Clock tower on the right.
  rect(c, 646, 168, 64, 256, '#8a7364');
  poly(c, [[638, 170], [718, 170], [678, 118]], '#5d4a3a');
  circle(c, 678, 208, 34, '#fdf6e3');
  c.beginPath(); c.arc(678, 208, 34, 0, Math.PI * 2); c.strokeStyle = '#3d2f28'; c.lineWidth = 4; c.stroke();
  // Clock hands: 3:00 sharp, or 5:00. (Face centre sits at the difference point
  // scaled into the tower; the hit circle in scenes.js is generous.)
  const hourAngle = alt.has('clock') ? (5 / 12) * Math.PI * 2 : (3 / 12) * Math.PI * 2;
  line(c, 678, 208, 678 + Math.cos(hourAngle - Math.PI / 2) * 19, 208 + Math.sin(hourAngle - Math.PI / 2) * 19, '#26324a', 4.6);
  line(c, 678, 208, 678, 208 - 27, '#26324a', 3.4);
  circle(c, 678, 208, 4, '#26324a');

  // Signal post at the deck's right end: green, or red.
  rect(c, 736, 344, 7, 80, '#3d2f28');
  rrect(c, 726, 306, 26, 44, 6, '#26324a');
  circle(c, 739, 328, 10, alt.has('signal') ? '#e63946' : '#51cf66');
  if (!alt.has('signal')) circle(c, 739, 328, 18, 'rgba(81,207,102,0.25)');
  else circle(c, 739, 328, 18, 'rgba(230,57,70,0.22)');

  // Platform lamp: lit, or dark.
  rect(c, 447, 386, 6, 38, '#3d2f28');
  if (alt.has('lamp')) {
    circle(c, 450, 378, 10, '#6b7686');
  } else {
    circle(c, 450, 378, 20, 'rgba(255,209,102,0.3)');
    circle(c, 450, 378, 10, '#ffd166');
  }

  // The luggage pile: three cases, or two.
  rrect(c, 108, 478, 84, 34, 6, '#a44a3f');
  rrect(c, 118, 448, 68, 32, 6, '#38618c');
  if (!alt.has('luggage')) rrect(c, 128, 420, 48, 30, 6, '#e0a458');
  rect(c, 146, 420, 6, 92, '#5d4028');
}

// ---------- Scene 4: Desert Caravan Camp ----------

function paintDesertCaravan(c, alt) {
  skyGradient(c, [[0, '#e2703a'], [0.45, '#f2a56b'], [0.75, '#f7c873'], [1, '#f9dc9a']]);
  // The sun, low and huge — with a halo ring in the altered panel.
  if (alt.has('sunhalo')) {
    circle(c, 128, 88, 58, 'none');
    c.beginPath(); c.arc(128, 88, 58, 0, Math.PI * 2); c.strokeStyle = 'rgba(255,244,200,0.85)'; c.lineWidth = 5; c.stroke();
    circle(c, 128, 88, 66, 'rgba(255,244,200,0.18)');
  }
  circle(c, 128, 88, 42, '#ffdf8a');
  circle(c, 128, 88, 50, 'rgba(255,223,138,0.25)');

  // Vultures circling: two, or one.
  const vulture = (x, y, s) => {
    c.beginPath();
    c.moveTo(x - 26 * s, y);
    c.quadraticCurveTo(x - 8 * s, y - 12 * s, x, y);
    c.quadraticCurveTo(x + 8 * s, y - 12 * s, x + 26 * s, y);
    c.strokeStyle = '#4a2c1a';
    c.lineWidth = 3.4 * s;
    c.stroke();
  };
  vulture(688, 76, 1);
  if (!alt.has('vulture')) vulture(620, 108, 0.85);

  // Dunes.
  c.beginPath();
  c.moveTo(0, 330);
  c.quadraticCurveTo(220, 260, 470, 330);
  c.quadraticCurveTo(650, 380, 800, 320);
  c.lineTo(800, 600); c.lineTo(0, 600); c.closePath();
  c.fillStyle = '#e8b06a'; c.fill();
  c.beginPath();
  c.moveTo(0, 420);
  c.quadraticCurveTo(300, 350, 560, 420);
  c.quadraticCurveTo(700, 460, 800, 430);
  c.lineTo(800, 600); c.lineTo(0, 600); c.closePath();
  c.fillStyle = '#d99a4e'; c.fill();
  rect(c, 0, 520, 800, 80, '#c9853f');

  // Palm tree at the oasis, with a cluster of dates — or without.
  c.beginPath();
  c.moveTo(88, 470);
  c.quadraticCurveTo(96, 360, 116, 268);
  c.strokeStyle = '#8a5a2b';
  c.lineWidth = 13;
  c.stroke();
  for (const a of [-0.15, 0.35, 0.85, 1.35, 1.85, 2.4]) {
    c.beginPath();
    c.moveTo(116, 262);
    c.quadraticCurveTo(116 + Math.cos(a) * 52, 262 + Math.sin(a) * 30 - 16, 116 + Math.cos(a) * 92, 262 + Math.sin(a) * 52 + 14);
    c.strokeStyle = '#3e7d44';
    c.lineWidth = 7;
    c.stroke();
  }
  if (!alt.has('dates')) {
    for (const [dx, dy] of [[-8, 16], [6, 20], [-1, 30], [12, 10]]) circle(c, 108 + dx, 258 + dy, 7, '#e07b39');
  }

  // Three tents.
  const tent = (cx, base, w, h, colA, colB) => {
    poly(c, [[cx - w / 2, base], [cx + w / 2, base], [cx, base - h]], colA);
    poly(c, [[cx, base - h], [cx + w / 2, base], [cx + w * 0.16, base]], colB);
    poly(c, [[cx - 20, base], [cx + 20, base], [cx, base - h * 0.45]], '#3d2a17');
  };
  tent(190, 452, 190, 120, '#b5522f', '#cf6a3d');
  tent(610, 446, 210, 128, '#38618c', '#48739f');
  tent(400, 458, 230, 150, '#e9c46a', '#dcb254');
  // The middle tent's little flag.
  if (!alt.has('tentflag')) {
    line(c, 400, 310, 400, 196, '#5d4028', 3.4);
    poly(c, [[400, 196], [400, 220], [426, 208]], '#e63946');
  }

  // Clay jars by the left tent: three, or two.
  const jar = (x, y, s) => {
    ellipse(c, x, y, 15 * s, 19 * s, '#a85f32');
    rect(c, x - 6 * s, y - 24 * s, 12 * s, 7 * s, '#8a4a24');
  };
  jar(152, 472, 1);
  jar(180, 478, 0.85);
  if (!alt.has('jars')) jar(204, 470, 0.95);

  // Campfire with a hanging pot — or no pot.
  line(c, 262, 508, 306, 478, '#5d4028', 7);
  line(c, 334, 508, 290, 478, '#5d4028', 7);
  line(c, 298, 428, 298, 458, '#3d2a17', 3);
  poly(c, [[298, 486], [282, 516], [298, 504], [306, 522], [316, 500]], '#e2703a');
  poly(c, [[298, 494], [290, 514], [298, 506], [304, 516], [308, 502]], '#ffd166');
  if (!alt.has('pot')) {
    rrect(c, 276, 452, 44, 26, 6, '#37404d');
    rect(c, 272, 450, 52, 6, '#232a33');
  }

  // The near camel, with its saddle blanket: teal, or red.
  ellipse(c, 520, 392, 78, 40, '#c98d4e');
  c.beginPath(); // neck and head
  c.moveTo(578, 372);
  c.quadraticCurveTo(616, 330, 622, 296);
  c.lineTo(648, 300);
  c.quadraticCurveTo(646, 336, 612, 380);
  c.closePath();
  c.fillStyle = '#c98d4e'; c.fill();
  ellipse(c, 640, 298, 17, 11, '#c98d4e');
  circle(c, 646, 295, 2.6, '#2b1a0c');
  poly(c, [[618, 282], [624, 266], [632, 282]], '#c98d4e'); // ear
  ellipse(c, 486, 356, 26, 17, '#d9a05e'); // humps
  ellipse(c, 540, 354, 24, 16, '#d9a05e');
  rrect(c, 486, 362, 72, 34, 6, alt.has('blanket') ? '#d64545' : '#2a9d8f');
  rect(c, 486, 388, 72, 5, '#f2c14e');
  for (const lx of [468, 500, 548, 580]) { // legs
    rect(c, lx, 424, 11, 66, '#bd8145');
    rect(c, lx - 2, 486, 15, 6, '#a06a35');
  }
  // A second camel resting in the back (never differs).
  ellipse(c, 250, 356, 46, 22, '#bd8145');
  circle(c, 300, 336, 13, '#bd8145');
  rect(c, 214, 372, 66, 8, '#a06a35');

  // The cactus, flowering — or not.
  rrect(c, 686, 404, 28, 100, 13, '#3e7d44');
  rrect(c, 656, 436, 16, 44, 8, '#3e7d44');
  rect(c, 656, 470, 44, 12, '#3e7d44');
  rrect(c, 726, 424, 16, 52, 8, '#3e7d44');
  rect(c, 700, 464, 42, 12, '#3e7d44');
  if (!alt.has('cactusflower')) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      circle(c, 700 + Math.cos(a) * 8, 398 + Math.sin(a) * 8, 6, '#ff6fa5');
    }
    circle(c, 700, 398, 5, '#ffd166');
  }

  // A patterned rug in the foreground.
  poly(c, [[330, 560], [520, 560], [548, 592], [306, 592]], '#a44a3f');
  poly(c, [[352, 568], [498, 568], [516, 588], [336, 588]], '#e9c46a');
}

// ---------- Scene 5: Winter Owl Cabin ----------

function paintWinterOwl(c, alt) {
  skyGradient(c, [[0, '#0d1830'], [0.6, '#1d3357'], [1, '#2c4a75']]);
  // Aurora bands.
  for (const [y, col] of [[52, 'rgba(80,255,190,0.14)'], [86, 'rgba(120,160,255,0.10)'], [118, 'rgba(80,255,190,0.08)']]) {
    c.beginPath();
    c.moveTo(0, y);
    c.quadraticCurveTo(260, y - 34, 520, y + 6);
    c.quadraticCurveTo(680, y + 26, 800, y - 8);
    c.lineTo(800, y + 22);
    c.quadraticCurveTo(520, y + 36, 260, y - 4);
    c.quadraticCurveTo(120, y + 16, 0, y + 24);
    c.closePath();
    c.fillStyle = col; c.fill();
  }
  const stars = scatter(41, 70);
  for (let i = 0; i < 35; i++) circle(c, stars[i * 2] * 800, stars[i * 2 + 1] * 220, 1.5, 'rgba(255,255,255,0.7)');
  circle(c, 716, 66, 30, '#eef2df');
  circle(c, 704, 56, 7, '#d5dcc2');

  // Snowy pines.
  const pine = (x, base, h, col) => {
    rect(c, x - 6, base - h * 0.16, 12, h * 0.16, '#4a3423');
    for (let i = 0; i < 3; i++) {
      const w = (h * 0.62) * (1 - i * 0.24);
      const yb = base - h * 0.12 - i * h * 0.26;
      poly(c, [[x - w / 2, yb], [x + w / 2, yb], [x, yb - h * 0.34]], col);
      poly(c, [[x - w * 0.28, yb - h * 0.2], [x + w * 0.28, yb - h * 0.2], [x, yb - h * 0.34]], 'rgba(255,255,255,0.75)');
    }
  };
  pine(60, 430, 240, '#1e4034');
  pine(140, 420, 180, '#26503f');
  pine(730, 428, 250, '#1e4034');
  pine(668, 418, 170, '#26503f');

  // Snow ground.
  rect(c, 0, 408, 800, 192, '#e9eff8');
  ellipse(c, 180, 452, 210, 26, '#f4f8fd');
  ellipse(c, 620, 500, 240, 30, '#f4f8fd');

  // The cabin.
  rrect(c, 300, 268, 268, 172, 6, '#6e4b2c');
  for (let i = 0; i < 6; i++) {
    rect(c, 300, 292 + i * 26, 268, 4, '#54381f');
  }
  poly(c, [[282, 274], [586, 274], [520, 196], [348, 196]], '#54381f'); // roof
  poly(c, [[282, 274], [586, 274], [520, 196], [348, 196]], 'rgba(255,255,255,0)');
  poly(c, [[296, 262], [572, 262], [516, 198], [352, 198]], '#eef3fa'); // snow on roof
  rect(c, 318, 168, 30, 52, '#7a4a3a'); // chimney
  rect(c, 312, 160, 42, 10, '#5f382c');
  // Chimney smoke curls: three, or two.
  circle(c, 322, 138, 11, 'rgba(230,236,244,0.75)');
  circle(c, 340, 116, 14, 'rgba(230,236,244,0.6)');
  if (!alt.has('smoke')) circle(c, 330, 90, 17, 'rgba(230,236,244,0.45)');

  // Icicles under the roof's front edge: four, or three.
  const icicle = (x, len) => poly(c, [[x - 6, 268], [x + 6, 268], [x, 268 + len]], '#cfe6f5');
  icicle(440, 30);
  icicle(468, 40);
  if (!alt.has('icicles')) icicle(500, 26);
  icicle(528, 34);

  // Windows. Left window: curtain open, or drawn.
  rrect(c, 388, 300, 64, 58, 4, '#ffd166');
  rect(c, 418, 300, 4, 58, '#54381f');
  rect(c, 388, 326, 64, 4, '#54381f');
  if (alt.has('curtain')) {
    rect(c, 390, 302, 60, 40, '#a44a3f');
    for (let i = 0; i < 4; i++) rect(c, 396 + i * 15, 302, 3, 40, '#84392f');
  } else {
    poly(c, [[390, 302], [404, 302], [396, 330], [390, 330]], '#a44a3f');
    poly(c, [[450, 302], [436, 302], [444, 330], [450, 330]], '#a44a3f');
  }
  rrect(c, 486, 300, 52, 58, 4, '#ffd166');
  rect(c, 510, 300, 4, 58, '#54381f');
  rect(c, 486, 326, 52, 4, '#54381f');
  // Door.
  rrect(c, 316, 356, 46, 84, 4, '#4a3423');
  circle(c, 352, 400, 3.6, '#ffd166');
  // Warm light spilling from the door.
  poly(c, [[316, 440], [362, 440], [382, 486], [296, 486]], 'rgba(255,190,90,0.20)');

  // The owl on its branch: awake, or asleep.
  line(c, 556, 238, 668, 214, '#4a3423', 9);
  ellipse(c, 610, 196, 27, 32, '#8a7364');
  ellipse(c, 610, 206, 19, 22, '#cbb59c');
  circle(c, 610, 178, 20, '#9a8474');
  poly(c, [[592, 166], [598, 152], [604, 164]], '#8a7364');
  poly(c, [[616, 164], [622, 152], [628, 166]], '#8a7364');
  if (alt.has('owleyes')) { // asleep: two curved shut lids
    c.beginPath(); c.arc(602, 178, 6, 0.1 * Math.PI, 0.9 * Math.PI); c.strokeStyle = '#2b2018'; c.lineWidth = 2.6; c.stroke();
    c.beginPath(); c.arc(618, 178, 6, 0.1 * Math.PI, 0.9 * Math.PI); c.stroke();
  } else {
    circle(c, 602, 178, 6.4, '#ffd166');
    circle(c, 618, 178, 6.4, '#ffd166');
    circle(c, 602, 178, 3, '#14100c');
    circle(c, 618, 178, 3, '#14100c');
  }
  poly(c, [[606, 186], [614, 186], [610, 192]], '#e07b39'); // beak

  // The snowman: red scarf, or green.
  circle(c, 178, 452, 34, '#ffffff');
  circle(c, 178, 396, 25, '#ffffff');
  circle(c, 170, 392, 3, '#14100c');
  circle(c, 186, 392, 3, '#14100c');
  poly(c, [[178, 398], [204, 404], [178, 406]], '#e07b39');
  const scarfCol = alt.has('scarf') ? '#2a9d5f' : '#d64545';
  rect(c, 156, 414, 44, 11, scarfCol);
  rect(c, 188, 420, 11, 26, scarfCol);
  circle(c, 178, 442, 3.4, '#14100c');
  circle(c, 178, 462, 3.4, '#14100c');
  line(c, 150, 440, 116, 416, '#4a3423', 5);
  line(c, 206, 440, 238, 420, '#4a3423', 5);

  // The wood pile: a full stack, or one log short.
  const logEnd = (x, y) => { circle(c, x, y, 11, '#a97a4a'); circle(c, x, y, 6, '#c99a63'); };
  logEnd(528, 478); logEnd(552, 478); logEnd(576, 478); logEnd(600, 478);
  logEnd(540, 458); logEnd(564, 458); logEnd(588, 458);
  if (!alt.has('logpile')) logEnd(564, 438);

  // Footprints in the snow path: an extra pair appears in the altered panel.
  const print = (x, y) => ellipse(c, x, y, 5, 8, 'rgba(150,170,200,0.55)');
  print(360, 486); print(376, 494);
  print(352, 508); print(368, 516);
  if (alt.has('footprints')) { print(374, 530); print(390, 538); }

  // The lantern post: lit, or dark.
  rect(c, 84, 386, 7, 74, '#2b2f38');
  rect(c, 70, 372, 36, 8, '#2b2f38');
  if (alt.has('lanternpost')) {
    rrect(c, 76, 380, 24, 30, 4, '#3c4350');
  } else {
    circle(c, 88, 395, 30, 'rgba(255,200,90,0.28)');
    rrect(c, 76, 380, 24, 30, 4, '#ffd166');
  }
  ellipse(c, 88, 466, 40, 8, 'rgba(255,200,90,0.18)');
}

// ---------- Scene 6: Clockwork Garden ----------

function paintClockworkGarden(c, alt) {
  skyGradient(c, [[0, '#0f2e2a'], [0.6, '#175144'], [1, '#1f6a54']]);
  // Spark-like fireflies.
  const sparks = scatter(67, 30);
  for (let i = 0; i < 15; i++) circle(c, sparks[i * 2] * 800, 40 + sparks[i * 2 + 1] * 300, 2, 'rgba(255,214,120,0.7)');

  // Hedge rows.
  rrect(c, -10, 330, 250, 90, 40, '#14402f');
  rrect(c, 560, 330, 250, 90, 40, '#14402f');
  rrect(c, -10, 452, 190, 80, 36, '#175139');
  rrect(c, 620, 452, 190, 80, 36, '#175139');
  // Gravel path.
  poly(c, [[330, 600], [470, 600], [428, 430], [372, 430]], '#8d8577');
  const gravel = scatter(71, 26);
  for (let i = 0; i < 13; i++) circle(c, 350 + gravel[i * 2] * 100, 450 + gravel[i * 2 + 1] * 130, 2.4, '#6f675a');

  // Copper pipes running up the right side, with a valve wheel.
  rect(c, 648, 120, 16, 330, '#b87333');
  rect(c, 680, 120, 12, 330, '#a05f27');
  rect(c, 640, 200, 60, 12, '#8a4f1f');
  rect(c, 640, 330, 60, 12, '#8a4f1f');
  circle(c, 656, 126, 7, '#e0a458');
  circle(c, 686, 126, 6, '#e0a458');
  // The valve: red wheel, or plain brass.
  const valveCol = alt.has('valve') ? '#c9973f' : '#d64545';
  circle(c, 660, 418, 17, valveCol);
  circle(c, 660, 418, 6, '#5d4028');
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    line(c, 660 - Math.cos(a) * 15, 418 - Math.sin(a) * 15, 660 + Math.cos(a) * 15, 418 + Math.sin(a) * 15, valveCol, 5);
  }

  // The gate on the left, with its little clock: 12:00, or 12:15.
  rect(c, 66, 300, 12, 150, '#5d4028');
  rect(c, 130, 300, 12, 150, '#5d4028');
  for (let i = 0; i < 4; i++) rect(c, 74 + i * 18, 356, 7, 94, '#6e4b2c');
  rect(c, 60, 348, 92, 9, '#54381f');
  circle(c, 88, 318, 27, '#fdf6e3');
  c.beginPath(); c.arc(88, 318, 27, 0, Math.PI * 2); c.strokeStyle = '#8a5a1d'; c.lineWidth = 4; c.stroke();
  for (let m = 0; m < 12; m++) {
    const a = (m / 12) * Math.PI * 2;
    circle(c, 88 + Math.cos(a) * 21, 318 + Math.sin(a) * 21, 1.6, '#8a5a1d');
  }
  if (alt.has('gateclock')) { // 12:15 — minute hand points right
    line(c, 88, 318, 106, 318, '#26324a', 3.4);
    line(c, 88, 318, 88, 303, '#26324a', 4.2);
  } else { // 12:00 — both hands up
    line(c, 88, 318, 88, 300, '#26324a', 3.4);
    line(c, 88, 318, 88, 305, '#26324a', 4.2);
  }
  circle(c, 88, 318, 3.2, '#26324a');

  // Wind-up trees: round metal canopies on riveted trunks. The left tree is
  // plain scenery; the right tree (drawn separately below) carries the key.
  const windTree = (x) => {
    rect(c, x - 9, 236, 18, 120, '#7a5a34');
    for (const ry of [262, 292, 322]) circle(c, x, ry, 3, '#54381f');
    circle(c, x, 168, 74, '#2c7a4b');
    circle(c, x - 44, 196, 44, '#35945e');
    circle(c, x + 46, 198, 42, '#27703f');
    for (const [dx, dy] of [[-30, -24], [18, -38], [36, 8], [-14, 16], [4, -6]]) {
      circle(c, x + dx, 168 + dy, 7, '#e8b04b'); // brass fruit
    }
  };
  windTree(150);
  // Right tree, whose key (at 710,178 in scene space) may be gone.
  rect(c, 701, 236, 18, 120, '#7a5a34');
  for (const ry of [262, 292, 322]) circle(c, 710, ry, 3, '#54381f');
  circle(c, 710, 168, 74, '#2c7a4b');
  circle(c, 666, 196, 44, '#35945e');
  circle(c, 756, 198, 42, '#27703f');
  for (const [dx, dy] of [[-30, -24], [18, -38], [36, 8], [-14, 16], [4, -6]]) {
    circle(c, 710 + dx, 168 + dy, 7, '#e8b04b');
  }
  if (!alt.has('windkey')) { // key: stem + bow sticking out of the canopy side
    rect(c, 716, 174, 20, 7, '#c9973f');
    circle(c, 744, 170, 9, '#c9973f');
    circle(c, 744, 186, 9, '#c9973f');
    circle(c, 744, 178, 4, '#0f2e2a');
  }

  // The great gear-flower in the centre: eight teeth, or seven.
  rect(c, 394, 268, 12, 130, '#2c7a4b');
  poly(c, [[394, 340], [360, 372], [392, 380]], '#35945e');
  poly(c, [[406, 356], [440, 330], [408, 318]], '#35945e');
  for (let i = 0; i < 8; i++) { // petals behind the gear
    const a = (i / 8) * Math.PI * 2 + 0.4;
    ellipse(c, 400 + Math.cos(a) * 56, 218 + Math.sin(a) * 56, 17, 10, '#f15bb5');
  }
  gear(c, 400, 218, 46, alt.has('gearteeth') ? 7 : 8, '#c9973f', '#175144');
  circle(c, 400, 218, 8, '#e8b04b');
  // Two smaller gear-flowers.
  gear(c, 268, 330, 24, 8, '#a87c2e', '#175144');
  rect(c, 264, 352, 8, 60, '#2c7a4b');
  gear(c, 540, 344, 20, 8, '#a87c2e', '#175144');
  rect(c, 536, 362, 8, 52, '#2c7a4b');

  // A small gear lying on the path — present, or vanished.
  if (!alt.has('smallgear')) gear(c, 238, 498, 19, 8, '#8a6a2a', '#1f6a54');

  // The mechanical butterfly: both wing spots, or one missing.
  const bf = (x, y) => {
    ellipse(c, x - 16, y - 8, 17, 11, '#7bdff2');
    ellipse(c, x + 16, y - 8, 17, 11, '#7bdff2');
    ellipse(c, x - 13, y + 9, 13, 8, '#4fb3d9');
    ellipse(c, x + 13, y + 9, 13, 8, '#4fb3d9');
    ellipse(c, x, y, 4.6, 18, '#37404d');
    circle(c, x - 15, y - 9, 4.4, '#f15bb5');
    circle(c, x + 15, y - 9, 4.4, '#f15bb5');
  };
  bf(178, 148);
  if (alt.has('butterfly')) { // repaint the right upper wing without its spot
    ellipse(c, 194, 140, 17, 11, '#7bdff2');
  }
  bf(586, 120);

  // The robot gardener, with a gear badge on its hat — or without.
  rrect(c, 552, 356, 58, 74, 10, '#8fa6bd'); // body
  rrect(c, 562, 372, 38, 26, 5, '#5f7c96'); // chest panel
  circle(c, 574, 385, 4, '#ffd166');
  circle(c, 590, 385, 4, '#51cf66');
  rect(c, 540, 366, 12, 44, '#74889e'); // arms
  rect(c, 610, 366, 12, 44, '#74889e');
  rect(c, 560, 430, 13, 40, '#5f7c96'); // legs
  rect(c, 590, 430, 13, 40, '#5f7c96');
  circle(c, 581, 330, 27, '#aebfd2'); // head
  circle(c, 572, 328, 4.6, '#26324a');
  circle(c, 590, 328, 4.6, '#26324a');
  rect(c, 570, 342, 22, 3.4, '#26324a');
  rrect(c, 552, 292, 58, 16, 6, '#c9973f'); // hat brim
  rrect(c, 562, 268, 38, 26, 6, '#c9973f'); // hat crown
  if (!alt.has('robothat')) gear(c, 581, 298, 9, 8, '#8a5a1d', '#c9973f');

  // The watering can: striped, or plain.
  rrect(c, 296, 446, 66, 46, 8, '#4fb3d9');
  poly(c, [[296, 458], [262, 442], [266, 456], [296, 472]], '#4fb3d9');
  circle(c, 258, 448, 8, '#3a93bd');
  c.beginPath(); c.arc(330, 442, 20, Math.PI, Math.PI * 2); c.strokeStyle = '#3a93bd'; c.lineWidth = 6; c.stroke();
  if (!alt.has('canstripe')) rect(c, 296, 464, 66, 9, '#fdf3d8');
}

// ---------- dispatch + markers ----------

export const PAINTERS = {
  paintNightMarket,
  paintReefPost,
  paintSkyTrain,
  paintDesertCaravan,
  paintWinterOwl,
  paintClockworkGarden,
};

// Draw one panel of a scene. `altIds` is the set of difference ids applied
// to this panel (empty for the original, all of them for the altered panel).
export function drawScene(ctx, scene, altIds) {
  ctx.save();
  ctx.clearRect(0, 0, SCENE_W, SCENE_H);
  PAINTERS[scene.painter](ctx, altIds);
  ctx.restore();
}

// A found difference: a settled gold ring, with an expanding pulse while it
// is fresh (ageMs < 700). Drawn on both panels.
export function drawFoundMarker(ctx, x, y, ageMs) {
  ctx.save();
  if (ageMs < 700) {
    const t = ageMs / 700;
    ctx.beginPath();
    ctx.arc(x, y, 16 + t * 26, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 209, 102, ${0.75 * (1 - t)})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 4.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 12.4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();
}

// A hint being shown: two soft rings breathing outward around the spot.
export function drawHintPulse(ctx, x, y, nowMs) {
  ctx.save();
  for (const off of [0, 300]) {
    const t = ((nowMs + off) % 600) / 600;
    ctx.beginPath();
    ctx.arc(x, y, 12 + t * 30, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(123, 223, 242, ${0.85 * (1 - t)})`;
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }
  ctx.restore();
}

// A wrong click: a red X that fades over ~450 ms.
export function drawMistakeMark(ctx, x, y, ageMs) {
  const a = Math.max(0, 1 - ageMs / 450);
  ctx.save();
  ctx.strokeStyle = `rgba(230, 57, 70, ${a})`;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 11);
  ctx.lineTo(x + 11, y + 11);
  ctx.moveTo(x + 11, y - 11);
  ctx.lineTo(x - 11, y + 11);
  ctx.stroke();
  ctx.restore();
}
