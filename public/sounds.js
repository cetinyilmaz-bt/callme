/**
 * CallMee – 5 Ses Tonu (Web Audio API)
 * Harici ses dosyasına gerek yok – tamamen programatik
 */

const AudioManager = (() => {
  let audioCtx = null;
  let currentSoundId = 1;
  let isPlaying = false;
  let stopFn = null;

  function getCtx() {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // ─── 1. KLASİK ZİL ─────────────────────────────────────────────
  function playClassicBell(ctx, loop) {
    let running = true;
    async function ring() {
      while (running) {
        const g = ctx.createGain();
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
        osc.connect(g);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);

        await new Promise(r => setTimeout(r, 1400));
        if (!running) break;

        // ikinci çalış
        const g2 = ctx.createGain();
        g2.connect(ctx.destination);
        g2.gain.setValueAtTime(0, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
        osc2.connect(g2);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 1.0);

        await new Promise(r => setTimeout(r, 2000));
      }
    }
    ring();
    return () => { running = false; };
  }

  // ─── 2. DİJİTAL BİP ────────────────────────────────────────────
  function playDigitalBeep(ctx) {
    let running = true;
    async function beep() {
      const freqs = [1200, 1200, 0, 1200, 1200, 0, 0];
      const durations = [80, 80, 60, 80, 80, 60, 600];
      while (running) {
        for (let i = 0; i < freqs.length; i++) {
          if (!running) break;
          if (freqs[i] > 0) {
            const g = ctx.createGain();
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.4, ctx.currentTime);
            g.gain.setValueAtTime(0, ctx.currentTime + durations[i] / 1000 - 0.01);
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freqs[i];
            osc.connect(g);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + durations[i] / 1000);
          }
          await new Promise(r => setTimeout(r, durations[i]));
        }
      }
    }
    beep();
    return () => { running = false; };
  }

  // ─── 3. YUMUŞAK MELODİ ─────────────────────────────────────────
  function playSoftMelody(ctx) {
    let running = true;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25]; // C5 E5 G5 C6 G5 E5
    async function melody() {
      while (running) {
        for (let i = 0; i < notes.length; i++) {
          if (!running) break;
          const g = ctx.createGain();
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0, ctx.currentTime);
          g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = notes[i];
          osc.connect(g);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.45);
          await new Promise(r => setTimeout(r, 200));
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    melody();
    return () => { running = false; };
  }

  // ─── 4. ACİL ALARM ─────────────────────────────────────────────
  function playUrgentAlarm(ctx) {
    let running = true;
    async function alarm() {
      while (running) {
        for (let cycle = 0; cycle < 3; cycle++) {
          if (!running) break;
          const g = ctx.createGain();
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.5, ctx.currentTime);
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.25);
          osc.connect(g);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.25);
          g.gain.setValueAtTime(0, ctx.currentTime + 0.25);
          await new Promise(r => setTimeout(r, 300));
        }
        await new Promise(r => setTimeout(r, 800));
      }
    }
    alarm();
    return () => { running = false; };
  }

  // ─── 5. MODERN BİLDİRİM ────────────────────────────────────────
  function playModernNotification(ctx) {
    let running = true;
    async function notify() {
      while (running) {
        // İki kısa yüksek ton
        [[900, 1200], [1200, 1500]].forEach(([f1, f2], idx) => {
          const delay = idx * 0.18;
          const g = ctx.createGain();
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0, ctx.currentTime + delay);
          g.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f1, ctx.currentTime + delay);
          osc.frequency.linearRampToValueAtTime(f2, ctx.currentTime + delay + 0.12);
          osc.connect(g);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.22);
        });
        await new Promise(r => setTimeout(r, 2200));
      }
    }
    notify();
    return () => { running = false; };
  }

  // ─── Dışa açık API ─────────────────────────────────────────────
  const SOUNDS = {
    1: { name: 'Klasik Zil', icon: '🔔', fn: playClassicBell },
    2: { name: 'Dijital Bip', icon: '📳', fn: playDigitalBeep },
    3: { name: 'Yumuşak Melodi', icon: '🎵', fn: playSoftMelody },
    4: { name: 'Acil Alarm', icon: '🚨', fn: playUrgentAlarm },
    5: { name: 'Modern Bildirim', icon: '💬', fn: playModernNotification }
  };

  return {
    getSounds: () => SOUNDS,
    setSound: (id) => {
      currentSoundId = parseInt(id);
      localStorage.setItem('callmee_sound', currentSoundId);
    },
    loadSavedSound: () => {
      const saved = localStorage.getItem('callmee_sound');
      if (saved) currentSoundId = parseInt(saved);
      return currentSoundId;
    },
    getCurrentSound: () => currentSoundId,
    play: () => {
      if (isPlaying) return;
      const ctx = getCtx();
      const sound = SOUNDS[currentSoundId];
      if (!sound) return;
      isPlaying = true;
      stopFn = sound.fn(ctx);
    },
    stop: () => {
      if (stopFn) stopFn();
      stopFn = null;
      isPlaying = false;
    },
    previewSound: (id) => {
      const ctx = getCtx();
      const sound = SOUNDS[parseInt(id)];
      if (!sound) return;
      const tempStop = sound.fn(ctx);
      setTimeout(() => tempStop && tempStop(), 2000);
    }
  };
})();
