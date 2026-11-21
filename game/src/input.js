// input.js — wires the player to the game: clicks on either panel (converted
// from page pixels into the 800 x 600 scene space the differences live in),
// the magnifier loupe that follows the cursor over a panel, and the keyboard
// shortcuts. It owns no game state; everything funnels into SpotGame methods.

import { SCENE_W, SCENE_H } from './scenes.js';
import { unlockAudio } from './audio.js';

export class Input {
  constructor(game, els) {
    this.game = game;
    this.els = els;
    this.loupeOn = false;
    this.loupePanel = null; // 'left' | 'right' | null
    this.loupeScene = { x: 0, y: 0 };
    this.loupePinned = false;

    for (const [panel, canvas] of [['left', els.leftCanvas], ['right', els.rightCanvas]]) {
      canvas.addEventListener('pointermove', (ev) => this.onMove(panel, canvas, ev));
      canvas.addEventListener('pointerleave', () => {
        if (!this.loupePinned) this.loupePanel = null;
      });
      canvas.addEventListener('click', (ev) => {
        unlockAudio();
        const { sx, sy } = this.toScene(canvas, ev);
        this.game.clickPanel(panel, sx, sy);
      });
    }

    window.addEventListener('keydown', (ev) => this.onKey(ev));
    this.tickLoupe = this.tickLoupe.bind(this);
    requestAnimationFrame(this.tickLoupe);
  }

  toScene(canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      sx: ((ev.clientX - rect.left) / rect.width) * SCENE_W,
      sy: ((ev.clientY - rect.top) / rect.height) * SCENE_H,
    };
  }

  onMove(panel, canvas, ev) {
    const { sx, sy } = this.toScene(canvas, ev);
    this.loupePanel = panel;
    this.loupeScene = { x: sx, y: sy };
    // Position the loupe div over the cursor, in page coordinates.
    this.loupeClient = { x: ev.clientX, y: ev.clientY };
  }

  toggleLoupe() {
    this.loupeOn = !this.loupeOn;
    if (!this.loupeOn) this.els.loupe.classList.add('hidden');
    return this.loupeOn;
  }

  // Demo/screenshot support: pin the loupe over a panel at a scene position.
  pinLoupe(panel, sx, sy) {
    this.loupeOn = true;
    this.loupePinned = true;
    this.loupePanel = panel;
    this.loupeScene = { x: sx, y: sy };
    this.loupeClient = null; // positioned from the canvas rect each frame
  }

  tickLoupe() {
    const { loupe, loupeCanvas, leftCanvas, rightCanvas } = this.els;
    const show = this.loupeOn && this.loupePanel !== null;
    loupe.classList.toggle('hidden', !show);
    if (show) {
      const src = this.loupePanel === 'left' ? leftCanvas : rightCanvas;
      const rect = src.getBoundingClientRect();
      const SIZE = loupeCanvas.width; // 176 css px loupe
      // Scene span visible in the loupe at 2x the panel's display scale.
      const span = (SIZE / 2) * (SCENE_W / rect.width);
      const ctx = loupeCanvas.getContext('2d');
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.drawImage(
        src,
        this.loupeScene.x - span / 2, this.loupeScene.y - (span * (SIZE / SIZE)) / 2,
        span, span,
        0, 0, SIZE, SIZE,
      );
      // Crosshair at the loupe's centre.
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(SIZE / 2 - 9, SIZE / 2); ctx.lineTo(SIZE / 2 + 9, SIZE / 2);
      ctx.moveTo(SIZE / 2, SIZE / 2 - 9); ctx.lineTo(SIZE / 2, SIZE / 2 + 9);
      ctx.stroke();
      // Place the loupe: over the cursor, or over the pinned scene point.
      let cx, cy;
      if (this.loupePinned || !this.loupeClient) {
        cx = rect.left + (this.loupeScene.x / SCENE_W) * rect.width;
        cy = rect.top + (this.loupeScene.y / SCENE_H) * rect.height;
      } else {
        cx = this.loupeClient.x;
        cy = this.loupeClient.y;
      }
      loupe.style.left = `${cx - SIZE / 2}px`;
      loupe.style.top = `${cy - SIZE / 2}px`;
    }
    requestAnimationFrame(this.tickLoupe);
  }

  onKey(ev) {
    if (ev.repeat) return;
    const k = ev.key.toLowerCase();
    unlockAudio();
    if (k === 'h') this.game.useHint();
    else if (k === 'm') this.toggleLoupe();
    else if (k === 'p') this.game.togglePause();
    else if (k === 'r') {
      if (['playing', 'paused', 'timeUp'].includes(this.game.phase)) this.game.restartScene();
    } else if (k === 'enter' || k === 'n') {
      if (this.game.phase === 'menu') this.game.startCampaign();
      else if (this.game.phase === 'sceneComplete') this.game.nextScene();
      else if (this.game.phase === 'campaignWin') this.game.startCampaign();
      else if (this.game.phase === 'timeUp') this.game.restartScene();
    }
  }
}
