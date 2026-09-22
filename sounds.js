/**
 * CallMee – Profesyonel & Zarif Ses Motoru (Web Audio API)
 * Harici dosya yükleme gecikmesi olmadan, tamamen stüdyo kalitesinde akustik sentezleme.
 */

const AudioManager = (() => {
  let audioCtx = null;
  let isPlaying = false;
  let stopFn = null;

  // Odaların varsayılan sesleri
  const DEFAULT_ROOM_SOUNDS = {
    'vip': 1,          // Lüks Resepsiyon Çanı
    'ana-oda': 2,      // Zarif Ding-Dong
    'akademi': 3,      // Marimba Akoru
    'kis-bahcesi': 4,  // Arp Esintisi
    'max': 5,          // Rhodes Piyano
    'seecolor': 6      // Kristal Chime
  };

  // Oda ses haritası (localStorage'dan yüklenir)
  let roomSounds = { ...DEFAULT_ROOM_SOUNDS };

  function getCtx() {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // ─── SES SENTEZLEYİCİLER ──────────────────────────────────────────

  // 1. 🛎️ Lüks Resepsiyon Çanı (Concierge Desk Bell)
  function playConciergeBell(ctx) {
    let running = true;
    async function loop() {
      while (running) {
        const now = ctx.currentTime;
        const f0 = 1396.91; // F6 kristal çan

        // Çan harmonikleri (fundamental + inharmonic overtones)
        const partials = [
          { mult: 1.0,  gain: 0.45, decay: 1.8 },
          { mult: 2.76, gain: 0.20, decay: 0.9 },
          { mult: 5.40, gain: 0.08, decay: 0.4 }
        ];

        partials.forEach(p => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f0 * p.mult, now);

          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(p.gain, now + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + p.decay);
        });

        // Çekiç vuruşu "tık" etkisi
        const strikeOsc = ctx.createOscillator();
        const strikeGain = ctx.createGain();
        strikeOsc.type = 'triangle';
        strikeOsc.frequency.setValueAtTime(3200, now);
        strikeGain.gain.setValueAtTime(0.15, now);
        strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        strikeOsc.connect(strikeGain);
        strikeGain.connect(ctx.destination);
        strikeOsc.start(now);
        strikeOsc.stop(now + 0.03);

        await new Promise(r => setTimeout(r, 2600));
      }
    }
    loop();
    return () => { running = false; };
  }

  // 2. 🔔 Zarif Ding-Dong (Two-tone Chime)
  function playTwoToneChime(ctx) {
    let running = true;
    async function loop() {
      while (running) {
        const now = ctx.currentTime;
        
        // "Ding" (G5 - 783.99 Hz)
        playChimeNote(ctx, 783.99, now, 0.4, 1.2);
        
        // "Dong" (E5 - 659.25 Hz) 380ms sonra
        playChimeNote(ctx, 659.25, now + 0.38, 0.45, 1.6);

        await new Promise(r => setTimeout(r, 2800));
      }
    }

    function playChimeNote(ctx, freq, startTime, maxGain, decay) {
      [1.0, 2.0].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * mult, startTime);

        g.gain.setValueAtTime(0, startTime);
        g.gain.linearRampToValueAtTime(maxGain / (i + 1), startTime + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + decay);
      });
    }

    loop();
    return () => { running = false; };
  }

  // 3. 🎶 Marimba Akoru (Wooden Mallet Melodi)
  function playMarimbaMelody(ctx) {
    let running = true;
    async function loop() {
      while (running) {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const step = 0.11;

        notes.forEach((freq, idx) => {
          const startTime = ctx.currentTime + (idx * step);
          
          // Ahşap tokmak vuruşu ve gövde tınısı
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const g = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, startTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(freq * 3, startTime);
          filter.frequency.exponentialRampToValueAtTime(freq * 0.8, startTime + 0.35);

          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.35, startTime + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

          osc.connect(filter);
          filter.connect(g);
          g.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.45);
        });

        await new Promise(r => setTimeout(r, 2600));
      }
    }
    loop();
    return () => { running = false; };
  }

  // 4. 🌟 Arp Esintisi (Harp Glissando)
  function playHarpGlissando(ctx) {
    let running = true;
    async function loop() {
      while (running) {
        // Pentatonik / Majör 9 akıcı arp: D5, F#5, A5, C#6, E6
        const notes = [587.33, 739.99, 880.00, 1108.73, 1318.51];
        const step = 0.08;

        notes.forEach((freq, idx) => {
          const startTime = ctx.currentTime + (idx * step);
          const osc = ctx.createOscillator();
          const g = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          g.gain.setValueAtTime(0, startTime);
          g.gain.linearRampToValueAtTime(0.28, startTime + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

          osc.connect(g);
          g.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.8);
        });

        await new Promise(r => setTimeout(r, 2700));
      }
    }
    loop();
    return () => { running = false; };
  }

  // 5. 🎹 Rhodes Elektrik Piyano (Lush Executive Chord)
  function playRhodesChord(ctx) {
    let running = true;
    async function loop() {
      while (running) {
        const chord = [349.23, 440.00, 523.25, 659.25]; // F4, A4, C5, E5 (Fmaj7)
        const now = ctx.currentTime;

        chord.forEach(freq => {
          // Çift osilatör ile analog chorus sıcaklığı
          [-1.5, 1.5].forEach(detune => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.detune.setValueAtTime(detune, now);

            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.12, now + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

            osc.connect(g);
            g.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 1.8);
          });
        });

        await new Promise(r => setTimeout(r, 3000));
      }
    }
    loop();
    return () => { running = false; };
  }

  // 6. ✨ Kristal Chime (Windchime Sparkle)
  function playCrystalChime(ctx) {
    let running = true;
    async function loop() {
      while (running) {
        const notes = [880.00, 1108.73, 1318.51]; // A5, C#6, E6
        const step = 0.12;

        notes.forEach((freq, idx) => {
          const startTime = ctx.currentTime + (idx * step);

          [1.0, 2.76].forEach((mult, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * mult, startTime);

            g.gain.setValueAtTime(0, startTime);
            g.gain.linearRampToValueAtTime(0.3 / (i * 2 + 1), startTime + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.3);

            osc.connect(g);
            g.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 1.3);
          });
        });

        await new Promise(r => setTimeout(r, 2800));
      }
    }
    loop();
    return () => { running = false; };
  }

  // ─── SES TANIMLARI ────────────────────────────────────────────────
  const SOUNDS = {
    1: { id: 1, name: 'Lüks Resepsiyon Çanı', icon: '🛎️', desc: 'Zarif kristal resepsiyon zili', fn: playConciergeBell },
    2: { id: 2, name: 'Zarif Ding-Dong',      icon: '🔔', desc: 'Sıcak iki tonlu ofis melodisi', fn: playTwoToneChime },
    3: { id: 3, name: 'Marimba Melodisi',     icon: '🎶', desc: 'Akustik ahşap tokmak tınısı', fn: playMarimbaMelody },
    4: { id: 4, name: 'Arp Esintisi',         icon: '🌟', desc: 'Akıcı 5 notalı zarif arp', fn: playHarpGlissando },
    5: { id: 5, name: 'Rhodes Piyano',        icon: '🎹', desc: 'Sıcak ve modern caz akoru', fn: playRhodesChord },
    6: { id: 6, name: 'Kristal Chime',        icon: '✨', desc: 'Parıldayan berrak rüzgar çanı', fn: playCrystalChime }
  };

  // ─── ODA BAZLI YÖNETİM METOTLARI ─────────────────────────────────

  function loadRoomSounds() {
    try {
      const saved = localStorage.getItem('callmee_room_sounds');
      if (saved) {
        const parsed = JSON.parse(saved);
        roomSounds = { ...DEFAULT_ROOM_SOUNDS, ...parsed };
      }
    } catch (e) {
      roomSounds = { ...DEFAULT_ROOM_SOUNDS };
    }
    return roomSounds;
  }

  function setRoomSound(roomKey, soundId) {
    roomSounds[roomKey] = parseInt(soundId);
    try {
      localStorage.setItem('callmee_room_sounds', JSON.stringify(roomSounds));
    } catch (e) {}
  }

  function getRoomSound(roomKey) {
    return roomSounds[roomKey] || 1;
  }

  function resetToDefaults() {
    roomSounds = { ...DEFAULT_ROOM_SOUNDS };
    try {
      localStorage.setItem('callmee_room_sounds', JSON.stringify(roomSounds));
    } catch (e) {}
    return roomSounds;
  }

  // Tek seferlik veya döngülü oynatma
  function playForRoom(roomKey) {
    if (isPlaying) stop();
    const ctx = getCtx();
    const soundId = getRoomSound(roomKey);
    const sound = SOUNDS[soundId] || SOUNDS[1];
    isPlaying = true;
    stopFn = sound.fn(ctx);
  }

  function previewSound(soundId) {
    const ctx = getCtx();
    const sound = SOUNDS[parseInt(soundId)];
    if (!sound) return;
    
    // Geçici oynatma (tek döngü)
    const tempStop = sound.fn(ctx);
    setTimeout(() => {
      if (tempStop) tempStop();
    }, 2400);
  }

  function stop() {
    if (stopFn) {
      stopFn();
      stopFn = null;
    }
    isPlaying = false;
  }

  // İlk yüklemede hafızayı tazele
  loadRoomSounds();

  return {
    getSounds: () => SOUNDS,
    getRoomSounds: () => roomSounds,
    getRoomSound,
    setRoomSound,
    resetToDefaults,
    loadRoomSounds,
    playForRoom,
    play: (roomKey) => playForRoom(roomKey),
    previewSound,
    stop
  };
})();
