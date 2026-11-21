// game.js — the state machine. Owns the campaign: which scene is up, which
// differences are found, the score / streak / mistake bookkeeping, the
// countdown, hints, and every phase change (menu -> playing -> scene
// complete -> ... -> campaign won). It draws both panels each animation
// frame and keeps the HUD in step. Input events arrive through the methods
// at the bottom (input.js wires the DOM to them).

import { SCENES } from './scenes.js';
import { drawScene, drawFoundMarker, drawHintPulse, drawMistakeMark } from './render.js';
import {
  playFind, playMistake, playHint, playSceneComplete, playCampaignWin, playTimeWarning,
} from './audio.js';

const BEST_KEY = 'double-vision-best-score';
const HINTS_PER_SCENE = 3;
const HINT_COST = 40;
const MISTAKE_COST = 15;
const MISTAKE_TIME = 3;

export class SpotGame {
  constructor(els) {
    this.els = els;
    this.leftCtx = els.leftCanvas.getContext('2d');
    this.rightCtx = els.rightCanvas.getContext('2d');
    this.phase = 'menu';
    this.sceneIndex = 0;
    this.score = 0;
    this.best = 0;
    try { this.best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0; } catch { this.best = 0; }
    this.resetSceneState();
    this.lastTick = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  get scene() {
    return SCENES[this.sceneIndex];
  }

  get allAltIds() {
    return new Set(this.scene.differences.map((d) => d.id));
  }

  resetSceneState() {
    this.found = new Set();
    this.foundAt = new Map();
    this.mistakes = [];
    this.streak = 0;
    this.bestStreak = 0;
    this.hintsLeft = HINTS_PER_SCENE;
    this.hintTargetId = null;
    this.hintUntil = 0;
    this.timeLeft = this.scene ? this.scene.timeLimit : 0;
    this.elapsed = 0;
    this.warned = false;
    this.sceneEarned = 0; // points won inside the current scene attempt
    this.sceneFinds = 0;
    this.sceneMistakes = 0;
  }

  // ----- phase changes -----

  startCampaign() {
    this.score = 0;
    this.sceneIndex = 0;
    this.resetSceneState();
    this.phase = 'playing';
    this.syncOverlays();
    this.syncHud();
  }

  startScene(index) {
    this.sceneIndex = index;
    this.resetSceneState();
    this.phase = 'playing';
    this.syncOverlays();
    this.syncHud();
  }

  restartScene() {
    // Roll back whatever this attempt earned, then go again.
    this.score = Math.max(0, this.score - this.sceneEarned);
    this.resetSceneState();
    this.phase = 'playing';
    this.syncOverlays();
    this.syncHud();
  }

  nextScene() {
    if (this.sceneIndex + 1 < SCENES.length) this.startScene(this.sceneIndex + 1);
  }

  togglePause() {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
    this.syncOverlays();
  }

  completeScene() {
    const timeBonus = Math.ceil(this.timeLeft) * 2;
    const parBonus = this.elapsed <= this.scene.par ? 150 : 0;
    this.lastBreakdown = {
      finds: this.sceneFinds,
      findPoints: this.sceneEarned,
      timeBonus,
      parBonus,
      mistakes: this.sceneMistakes,
      total: this.sceneEarned + timeBonus + parBonus,
    };
    this.score += timeBonus + parBonus;
    this.sceneEarned += timeBonus + parBonus;
    if (this.sceneIndex + 1 >= SCENES.length) {
      this.phase = 'campaignWin';
      playCampaignWin();
      if (this.score > this.best) {
        this.best = this.score;
        try { localStorage.setItem(BEST_KEY, String(this.best)); } catch { /* private mode */ }
      }
    } else {
      this.phase = 'sceneComplete';
      playSceneComplete();
    }
    this.syncOverlays();
    this.syncHud();
  }

  timeUp() {
    this.phase = 'timeUp';
    playMistake();
    this.syncOverlays();
  }

  // ----- demo / screenshot states -----
  // ?scene=N&found=K starts scene N with its first K differences already
  // found; &complete=1 shows that scene's complete overlay; &win=1 shows the
  // campaign-win screen. An attract state for screenshots and for players
  // who want to peek at a later scene.

  applyDemo(params) {
    const sceneNo = Math.min(Math.max(Number(params.get('scene') ?? 1), 1), SCENES.length);
    this.sceneIndex = sceneNo - 1;
    this.resetSceneState();
    this.score = this.sceneIndex * 640;
    const k = Math.min(Math.max(Number(params.get('found') ?? 0), 0), 8);
    const now = performance.now();
    this.scene.differences.slice(0, k).forEach((d, i) => {
      this.found.add(d.id);
      this.foundAt.set(d.id, now - 5000 - i * 800); // settled rings, no pulse
      this.sceneEarned += 115;
      this.sceneFinds += 1;
    });
    this.score += this.sceneEarned;
    this.streak = Math.min(k, 4);
    this.timeLeft = Math.round(this.scene.timeLimit * 0.55);
    this.elapsed = this.scene.timeLimit - this.timeLeft;
    this.phase = 'playing';
    if (params.get('win') === '1') {
      this.score = 4150;
      this.phase = 'campaignWin';
      this.lastBreakdown = { finds: 8, findPoints: this.sceneEarned, timeBonus: 96, parBonus: 150, mistakes: 1, total: this.sceneEarned + 246 };
    } else if (params.get('complete') === '1') {
      this.lastBreakdown = {
        finds: this.sceneFinds,
        findPoints: this.sceneEarned,
        timeBonus: Math.ceil(this.timeLeft) * 2,
        parBonus: 150,
        mistakes: 1,
        total: this.sceneEarned + Math.ceil(this.timeLeft) * 2 + 150,
      };
      this.phase = 'sceneComplete';
    }
    this.syncOverlays();
    this.syncHud();
  }

  // ----- play actions (called by input.js) -----

  clickPanel(panel, sx, sy) {
    if (this.phase !== 'playing') return;
    const hit = this.scene.differences.find(
      (d) => !this.found.has(d.id) && Math.hypot(d.x - sx, d.y - sy) <= Math.max(d.r, 26),
    );
    if (hit) {
      const streakBonus = Math.min(this.streak, 10) * 10;
      const speedBonus = Math.round((this.timeLeft / this.scene.timeLimit) * 40);
      const points = 100 + streakBonus + speedBonus;
      this.found.add(hit.id);
      this.foundAt.set(hit.id, performance.now());
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      this.sceneFinds += 1;
      this.sceneEarned += points;
      this.score += points;
      if (this.hintTargetId === hit.id) this.hintTargetId = null;
      playFind();
      if (this.found.size >= this.scene.differences.length) this.completeScene();
    } else {
      this.streak = 0;
      this.sceneMistakes += 1;
      this.score = Math.max(0, this.score - MISTAKE_COST);
      this.sceneEarned = Math.max(0, this.sceneEarned - MISTAKE_COST);
      this.timeLeft = Math.max(0, this.timeLeft - MISTAKE_TIME);
      this.mistakes.push({ x: sx, y: sy, panel, at: performance.now() });
      playMistake();
    }
    this.syncHud();
  }

  useHint() {
    if (this.phase !== 'playing' || this.hintsLeft <= 0) return;
    const remaining = this.scene.differences.filter((d) => !this.found.has(d.id));
    if (remaining.length === 0) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score - HINT_COST);
    this.hintTargetId = pick.id;
    this.hintUntil = performance.now() + 1400;
    playHint();
    this.syncHud();
  }

  // ----- the frame loop -----

  loop(now) {
    const dt = Math.min((now - this.lastTick) / 1000, 0.1);
    this.lastTick = now;
    if (this.phase === 'playing') {
      this.timeLeft -= dt;
      this.elapsed += dt;
      if (this.timeLeft <= 10.5 && !this.warned && this.timeLeft > 0) {
        this.warned = true;
        playTimeWarning();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.timeUp();
      }
      this.syncHud();
    }
    this.draw(now);
    requestAnimationFrame(this.loop);
  }

  draw(now) {
    const scene = this.scene;
    drawScene(this.leftCtx, scene, new Set());
    drawScene(this.rightCtx, scene, this.allAltIds);
    for (const ctx of [this.leftCtx, this.rightCtx]) {
      for (const d of scene.differences) {
        if (this.found.has(d.id)) {
          drawFoundMarker(ctx, d.x, d.y, now - (this.foundAt.get(d.id) ?? now));
        }
      }
      if (this.hintTargetId && now < this.hintUntil) {
        const d = scene.differences.find((x) => x.id === this.hintTargetId);
        if (d) drawHintPulse(ctx, d.x, d.y, now);
      }
    }
    this.mistakes = this.mistakes.filter((m) => now - m.at < 450);
    for (const m of this.mistakes) {
      drawMistakeMark(m.panel === 'left' ? this.leftCtx : this.rightCtx, m.x, m.y, now - m.at);
    }
  }

  // ----- HUD + overlays -----

  fmtTime(s) {
    const t = Math.max(0, Math.ceil(s));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  syncHud() {
    const e = this.els;
    const scene = this.scene;
    e.sceneName.textContent = `Scene ${this.sceneIndex + 1} of ${SCENES.length} — ${scene.name}`;
    e.score.textContent = String(this.score);
    e.streak.textContent = this.streak > 1 ? `x${this.streak}` : '—';
    e.remaining.textContent = `${scene.differences.length - this.found.size} to find`;
    e.foundCount.textContent = `${this.found.size}/${scene.differences.length}`;
    e.timer.textContent = this.fmtTime(this.timeLeft);
    e.timer.classList.toggle('low', this.timeLeft <= 15 && this.phase === 'playing');
    e.par.textContent = `par ${this.fmtTime(scene.par)}`;
    e.hints.textContent = `Hint (${this.hintsLeft})`;
    e.best.textContent = this.best > 0 ? `Best ${this.best}` : '';
  }

  syncOverlays() {
    const e = this.els;
    const show = (el, on) => el.classList.toggle('hidden', !on);
    show(e.startOverlay, this.phase === 'menu');
    show(e.pauseOverlay, this.phase === 'paused');
    show(e.completeOverlay, this.phase === 'sceneComplete');
    show(e.winOverlay, this.phase === 'campaignWin');
    show(e.timeupOverlay, this.phase === 'timeUp');
    if (this.phase === 'sceneComplete' && this.lastBreakdown) {
      const b = this.lastBreakdown;
      e.completeTitle.textContent = `${this.scene.name} — complete!`;
      e.completeBody.innerHTML =
        `Finds: ${b.finds} for ${b.findPoints} pts<br>` +
        `Time bonus: +${b.timeBonus} &nbsp; Par bonus: +${b.parBonus}<br>` +
        `Mistakes: ${b.mistakes} &nbsp; Scene total: <strong>${b.total} pts</strong>`;
    }
    if (this.phase === 'campaignWin') {
      e.winBody.innerHTML =
        `Campaign score: <strong>${this.score} pts</strong><br>` +
        `Best score: ${this.best} pts<br>All six scenes cleared — every last difference found.`;
    }
    if (this.phase === 'timeUp') {
      e.timeupBody.textContent =
        `Out of time on ${this.scene.name} with ${this.scene.differences.length - this.found.size} still hiding. Retry the scene?`;
    }
  }
}
