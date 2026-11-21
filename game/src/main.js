// main.js — bootstrap. Grabs the page's elements, creates the game and the
// input layer, wires the control buttons, and applies any demo parameters
// (?scene=N&found=K[&complete=1|&win=1][&loupe=1]) used for screenshots and
// scene previews. Everything else lives in game.js / input.js / render.js.

import { SpotGame } from './game.js';
import { Input } from './input.js';
import { unlockAudio, toggleMuted } from './audio.js';

const $ = (id) => document.getElementById(id);

const els = {
  leftCanvas: $('leftCanvas'),
  rightCanvas: $('rightCanvas'),
  sceneName: $('sceneName'),
  score: $('score'),
  streak: $('streak'),
  remaining: $('remaining'),
  foundCount: $('foundCount'),
  timer: $('timer'),
  par: $('par'),
  best: $('best'),
  hints: $('btnHint'),
  loupe: $('loupe'),
  loupeCanvas: $('loupeCanvas'),
  startOverlay: $('startOverlay'),
  pauseOverlay: $('pauseOverlay'),
  completeOverlay: $('completeOverlay'),
  winOverlay: $('winOverlay'),
  timeupOverlay: $('timeupOverlay'),
  completeTitle: $('completeTitle'),
  completeBody: $('completeBody'),
  winBody: $('winBody'),
  timeupBody: $('timeupBody'),
};

const game = new SpotGame(els);
const input = new Input(game, els);

$('btnStart').addEventListener('click', () => { unlockAudio(); game.startCampaign(); });
$('btnResume').addEventListener('click', () => game.togglePause());
$('btnNext').addEventListener('click', () => game.nextScene());
$('btnAgain').addEventListener('click', () => game.startCampaign());
$('btnRetry').addEventListener('click', () => game.restartScene());
$('btnHint').addEventListener('click', () => { unlockAudio(); game.useHint(); });
$('btnPause').addEventListener('click', () => game.togglePause());
$('btnRestart').addEventListener('click', () => {
  if (['playing', 'paused', 'timeUp'].includes(game.phase)) game.restartScene();
});
$('btnLoupe').addEventListener('click', () => input.toggleLoupe());
$('btnSound').addEventListener('click', (ev) => {
  const muted = toggleMuted();
  ev.currentTarget.textContent = muted ? 'Sound: off' : 'Sound: on';
});

// Demo / screenshot states: any of scene, found, complete, win or loupe in
// the query string puts the game straight into the matching mid-play state.
const params = new URLSearchParams(location.search);
if (['scene', 'found', 'complete', 'win'].some((k) => params.has(k))) {
  game.applyDemo(params);
}
if (params.has('loupe')) {
  const [lx, ly] = (params.get('loupe') || '400,300').split(',').map(Number);
  input.pinLoupe('right', Number.isFinite(lx) ? lx : 400, Number.isFinite(ly) ? ly : 300);
}

game.syncHud();
game.syncOverlays();
