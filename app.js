(function() {
  'use strict';

  // ============ CONSTANTS ============
  var TILE = 50, GRID = 9;
  var ARENA_W = GRID * TILE;
  var ARENA_X = 75, ARENA_Y = 65;
  var BULLET_SPEED = 4.2;
  var WAVE_DUR = 22;
  var INVINCE_DUR = 2;
  var INPUT_CD = 150;
  var FIRE_RATES = [500, 400, 300, 200];
  var POWERUP_DUR = 15;
  var COIN_DROP = 0.3, POWER_DROP = 0.12;

  var STAGE_COLORS = [
    null,
    { floor: '#1e1a0e', grid: '#2a2618', border: '#6B4F12', name: 'Prairie' },
    { floor: '#0e1a0e', grid: '#182a18', border: '#2E7D32', name: 'Forest' },
    { floor: '#14141e', grid: '#1e1e2a', border: '#505060', name: 'Graveyard' },
  ];

  var ENEMY_DEFS = {
    orc:       { hp: 1, mi: 1.6, fly: false, clr: '#2E8B57', clr2: '#1B5E36' },
    spikeball: { hp: 2, mi: 0.85, fly: false, clr: '#909090', clr2: '#606060', deployHP: 5 },
    ogre:      { hp: 3, mi: 2.1, fly: false, clr: '#8B6914', clr2: '#5C4510' },
    mushroom:  { hp: 2, mi: 0.85, fly: false, clr: '#FF4C3B', clr2: '#CC2222' },
    butterfly: { hp: 1, mi: 1.2, fly: true,  clr: '#DA70D6', clr2: '#9B30FF' },
    mummy:     { hp: 6, mi: 5.5, fly: false, clr: '#DAA520', clr2: '#B8860B' },
    imp:       { hp: 3, mi: 0.85, fly: true,  clr: '#DC143C', clr2: '#8B0000' },
  };

  var LAYOUTS = {
    '1-1': '000000000 000000000 000000000 000000000 000000000 000000000 000000000 000000000 000000000',
    '1-2': '000000000 000000000 001000100 000000000 000000000 000000000 001000100 000000000 000000000',
    '1-3': '000100100 000000000 000000000 100000001 000000000 100000001 000000000 000000000 001001000',
    '1-4': '000101000 000000000 010000010 000000000 000000000 000000000 010000010 000000000 000101000',
    '2-1': '000000000 002000200 000000000 000200200 000000000 002002000 000000000 002000200 000000000',
    '2-2': '002000200 000000000 000200200 444454444 000000000 000000000 002000200 000000000 000000000',
    '2-3': '000000000 020202020 000000000 020000020 000000000 020000020 000000000 020202020 000000000',
    '3-1': '000000000 030030030 000000000 003000300 000000000 003000300 000000000 030030030 000000000',
    '3-2': '000000000 030303030 000000000 030000030 000000000 030000030 000000000 030303030 000000000',
    '3-3': '030303030 000000000 300000003 000300300 000000000 003003000 300000003 000000000 030303030',
    'b1':  '000000000 000111000 000000000 000000000 000000000 000000000 000110000 000000000 000000000',
    'b2':  '000000000 000010000 000000000 000000000 000000000 000000000 000000000 000000000 000000000',
    'b3':  '000000000 000000000 000000000 000000000 000000000 000000000 000000000 000000000 000000000',
  };

  var AREA_ENEMIES = {
    '1-1': [{t:'orc',w:1}],
    '1-2': [{t:'orc',w:5},{t:'spikeball',w:1}],
    '1-3': [{t:'orc',w:4},{t:'spikeball',w:2},{t:'ogre',w:1}],
    '1-4': [{t:'orc',w:4},{t:'spikeball',w:1},{t:'ogre',w:2}],
    '2-1': [{t:'orc',w:1},{t:'mushroom',w:2},{t:'butterfly',w:1}],
    '2-2': [{t:'mushroom',w:2},{t:'butterfly',w:2},{t:'ogre',w:1}],
    '2-3': [{t:'mushroom',w:2},{t:'butterfly',w:2},{t:'ogre',w:2}],
    '3-1': [{t:'mummy',w:2},{t:'imp',w:1}],
    '3-2': [{t:'mummy',w:1},{t:'imp',w:2},{t:'ogre',w:1}],
    '3-3': [{t:'mummy',w:1},{t:'imp',w:2},{t:'ogre',w:1}],
  };

  var PROGRESSION = [
    { type:'area', stage:1, area:1 },
    { type:'area', stage:1, area:2 },
    { type:'shop' },
    { type:'area', stage:1, area:3 },
    { type:'area', stage:1, area:4 },
    { type:'shop' },
    { type:'boss', stage:1 },
    { type:'area', stage:2, area:1 },
    { type:'shop' },
    { type:'area', stage:2, area:2 },
    { type:'area', stage:2, area:3 },
    { type:'shop' },
    { type:'boss', stage:2 },
    { type:'area', stage:3, area:1 },
    { type:'shop' },
    { type:'area', stage:3, area:2 },
    { type:'area', stage:3, area:3 },
    { type:'shop' },
    { type:'boss', stage:3 },
  ];

  var SHOP_DEFS = [
    { id:'gun',   name:'Gun',       icon:'✦', desc:'Shoot faster',           prices:[10,20,30], max:3 },
    { id:'ammo',  name:'Ammo',      icon:'◆', desc:'+1 bullet damage',       prices:[10,20,30], max:3 },
    { id:'life',  name:'1-Up',      icon:'♥', desc:'+1 heart',              prices:[20],       max:99 },
    { id:'super', name:'Super Gun', icon:'★', desc:'Permanent 3-way shot',  prices:[99],       max:1 },
  ];

  var POWERUP_POOL = ['shotgun','machinegun','wagon','sheriff','smoke','nuke'];
  var MAX_LIVES = 3;
  var DIFF = {
    easy:   { spawnMult: 1.4, bossHpMult: 0.8 },
    normal: { spawnMult: 1.0, bossHpMult: 1.0 },
    hard:   { spawnMult: 0.7, bossHpMult: 1.2 }
  };

  var BOSS_NAMES = {
    1: 'Bandit Tex',
    2: 'Sheriff Duke',
    3: 'Ringleader Savannah'
  };

  // ============ STATE ============
  var game = {};
  var canvas, ctx;
  var screens = {};
  var currentScreen = 'title';
  var animFrameId = null;
  var lastTime = 0;
  var lastInputTime = 0;
  var audioCtx = null;
  var musicMuted = false;
  var sfxMuted = false;
  var shopEnterTime = 0;

  // File-based audio
  var musicNormal = null;
  var musicBoss = null;
  var currentMusic = null;
  var sfxFiles = {};

  function resetGame() {
    game = {
      lives: 3,
      maxLives: MAX_LIVES,
      coins: 0,
      difficulty: 'normal',
      upgrades: { gun:0, ammo:0, super:0 },
      progIdx: 0,
      stage: 1,
      area: 1,
      player: { x:4, y:4, rx:4, ry:4, facing:'up' },
      enemies: [],
      bullets: [],
      items: [],
      effects: [],
      floaters: [],
      layout: null,
      waveTimer: 0,
      waveDone: false,
      spawnTimer: 0,
      spawnInterval: 3.0,
      fireTimer: 0.5,
      invincible: 0,
      activePower: null,
      powerTimer: 0,
      storedItem: null,
      boss: null,
      overlay: { text:'', timer:0 },
      clearing: false,
      clearTimer: 0,
      paused: false,
      pauseSel: 0,
      totalCoins: 0,
    };
  }

  // ============ AUDIO ============
  function loadMutePrefs() {
    try {
      musicMuted = localStorage.getItem('pk_music_muted') === '1';
      sfxMuted = localStorage.getItem('pk_sfx_muted') === '1';
    } catch(e) {}
  }

  function saveMutePrefs() {
    try {
      localStorage.setItem('pk_music_muted', musicMuted ? '1' : '0');
      localStorage.setItem('pk_sfx_muted', sfxMuted ? '1' : '0');
    } catch(e) {}
  }

  function initFileAudio() {
    musicNormal = new Audio('duel.mp3');
    musicNormal.loop = true;
    musicNormal.volume = 0;
    musicNormal.preload = 'auto';

    musicBoss = new Audio('spaghetti.mp3');
    musicBoss.loop = true;
    musicBoss.volume = 0;
    musicBoss.preload = 'auto';

    sfxFiles.complete = new Audio('complete.wav');
    sfxFiles.complete.volume = 0.25;
    sfxFiles.complete.preload = 'auto';
    sfxFiles.gameOver = new Audio('game_over.wav');
    sfxFiles.gameOver.volume = 0.2;
    sfxFiles.gameOver.preload = 'auto';
    sfxFiles.levelWin = new Audio('level_win.wav');
    sfxFiles.levelWin.volume = 0.2;
    sfxFiles.levelWin.preload = 'auto';
  }

  function playMusic() {
    if (musicMuted) return;
    currentMusic = musicNormal;
    if (musicNormal) { musicNormal.volume = 0.25; musicNormal.currentTime = 0; musicNormal.play().catch(function() {}); }
  }

  function playBossMusic() {
    if (musicNormal) musicNormal.pause();
    if (musicMuted) { currentMusic = musicBoss; return; }
    currentMusic = musicBoss;
    if (musicBoss) { musicBoss.volume = 0.25; musicBoss.currentTime = 0; musicBoss.play().catch(function() {}); }
  }

  function stopBossMusic() {
    if (musicBoss) { musicBoss.pause(); musicBoss.currentTime = 0; }
    currentMusic = musicNormal;
    if (!musicMuted && musicNormal) { musicNormal.volume = 0.25; musicNormal.play().catch(function() {}); }
  }

  function stopMusic() {
    if (musicNormal) { musicNormal.pause(); musicNormal.currentTime = 0; }
    if (musicBoss) { musicBoss.pause(); musicBoss.currentTime = 0; }
    currentMusic = null;
  }

  function pauseMusic() {
    if (currentMusic) currentMusic.pause();
  }

  function resumeMusic() {
    if (!musicMuted && currentMusic) currentMusic.play().catch(function() {});
  }

  function playSFXFile(name) {
    if (sfxMuted || !sfxFiles[name]) return;
    sfxFiles[name].currentTime = 0;
    sfxFiles[name].play().catch(function() {});
  }

  function toggleMusic() {
    musicMuted = !musicMuted;
    saveMutePrefs();
    if (musicMuted) { if (currentMusic) currentMusic.pause(); }
    else { if (currentMusic && currentScreen === 'game') currentMusic.play().catch(function(){}); }
    updateMuteButtons();
  }

  function toggleSFX() {
    sfxMuted = !sfxMuted;
    saveMutePrefs();
    updateMuteButtons();
  }

  function updateMuteButtons() {
    var mb = document.getElementById('title-music-btn');
    var sb = document.getElementById('title-sfx-btn');
    if (mb) { mb.textContent = 'MUSIC: ' + (musicMuted ? 'OFF' : 'ON'); mb.classList.toggle('off', musicMuted); }
    if (sb) { sb.textContent = 'SFX: ' + (sfxMuted ? 'OFF' : 'ON'); sb.classList.toggle('off', sfxMuted); }
  }

  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function tone(freq, dur, type, vol) {
    if (sfxMuted || !audioCtx) return;
    try {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.value = vol || 0.06;
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.start(audioCtx.currentTime);
      o.stop(audioCtx.currentTime + dur);
    } catch(e) {}
  }

  var SFX = {
    move:    function() { tone(220, 0.03, 'square', 0.04); },
    shoot:   function() { tone(880, 0.05, 'square', 0.05); },
    hit:     function() { tone(440, 0.06, 'square', 0.05); },
    kill:    function() { tone(660, 0.08, 'square', 0.05); setTimeout(function(){tone(330,0.08,'square',0.04);},40); },
    coin:    function() { tone(1320, 0.06, 'sine', 0.05); setTimeout(function(){tone(1760,0.06,'sine',0.05);},50); },
    powerup: function() { tone(880,0.07,'sine',0.05); setTimeout(function(){tone(1320,0.07,'sine',0.05);},60); setTimeout(function(){tone(1760,0.07,'sine',0.05);},120); },
    death:   function() { tone(440,0.12,'sawtooth',0.07); setTimeout(function(){tone(220,0.25,'sawtooth',0.06);},80); },
    boss:    function() { tone(165,0.25,'sawtooth',0.08); setTimeout(function(){tone(110,0.3,'sawtooth',0.08);},200); },
    buy:     function() { tone(550,0.04,'sine',0.05); setTimeout(function(){tone(770,0.04,'sine',0.05);},40); },
    nope:    function() { tone(200,0.1,'square',0.05); },
    clear:   function() { tone(660,0.08,'sine',0.06); setTimeout(function(){tone(880,0.08,'sine',0.06);},80); setTimeout(function(){tone(1100,0.12,'sine',0.06);},160); },
    victory: function() { [660,880,1100,1320,1760].forEach(function(f,i){ setTimeout(function(){tone(f,0.15,'sine',0.06);},i*100); }); },
  };

  // ============ HELPERS ============
  function parseLayout(key) {
    var rows = LAYOUTS[key].split(' ');
    var g = [];
    for (var r = 0; r < 9; r++) {
      g[r] = [];
      for (var c = 0; c < 9; c++) g[r][c] = parseInt(rows[r][c]);
    }
    return g;
  }

  function tileBlocks(tile, isEnemy) {
    if (tile === 1 || tile === 2 || tile === 3 || tile === 4) return true;
    return false;
  }

  function tileSolid(tile) { return tile === 1 || tile === 2 || tile === 3; }

  function weightedRandom(items) {
    var total = 0;
    for (var i = 0; i < items.length; i++) total += items[i].w;
    var r = Math.random() * total;
    for (var i = 0; i < items.length; i++) { r -= items[i].w; if (r <= 0) return items[i].t; }
    return items[items.length-1].t;
  }

  function getFireInterval() {
    var base = FIRE_RATES[Math.min(game.upgrades.gun, 3)];
    if (game.activePower === 'machinegun' || game.activePower === 'sheriff') base *= 0.5;
    return base / 1000;
  }

  function getMoveCooldown() { return INPUT_CD; }

  function getBulletDamage() { return 1 + game.upgrades.ammo; }

  function px(tx) { return ARENA_X + tx * TILE; }
  function py(ty) { return ARENA_Y + ty * TILE; }

  // ============ SPRITE DRAWING ============
  function drawPlayer(x, y, facing) {
    var cx = x + 25, cy = y + 25;
    // Body
    ctx.fillStyle = '#4169E1';
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fill();
    // Hat brim
    ctx.fillStyle = '#A0522D';
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI*2); ctx.fill();
    // Hat crown
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI*2); ctx.fill();
    // Gun indicator
    ctx.fillStyle = '#C0C0C0';
    var gx = cx, gy = cy;
    if (facing === 'up')    ctx.fillRect(cx-2, cy-22, 4, 12);
    else if (facing === 'down')  ctx.fillRect(cx-2, cy+10, 4, 12);
    else if (facing === 'left')  ctx.fillRect(cx-22, cy-2, 12, 4);
    else if (facing === 'right') ctx.fillRect(cx+10, cy-2, 12, 4);
    // Muzzle flash
    ctx.fillStyle = '#FFD700';
    if (facing === 'up')    ctx.fillRect(cx-3, cy-24, 6, 4);
    else if (facing === 'down')  ctx.fillRect(cx-3, cy+20, 6, 4);
    else if (facing === 'left')  ctx.fillRect(cx-24, cy-3, 4, 6);
    else if (facing === 'right') ctx.fillRect(cx+20, cy-3, 4, 6);
  }

  function drawEnemy(e) {
    var x = px(e.rx), y = py(e.ry);
    var cx = x + 25, cy = y + 25;
    var def = ENEMY_DEFS[e.type];

    if (e.type === 'orc') {
      // Snake — faces movement direction
      var wg = Math.sin(performance.now() / 300 + e.rx * 4) * 3;
      var ang = Math.atan2(e.ldx, -e.ldy);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      // Body
      ctx.strokeStyle = def.clr;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 14);
      ctx.quadraticCurveTo(14 + wg, 4, 2, 0);
      ctx.quadraticCurveTo(-12 - wg, -6, -2, -10);
      ctx.stroke();
      ctx.strokeStyle = def.clr2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 14);
      ctx.quadraticCurveTo(14 + wg, 4, 2, 0);
      ctx.quadraticCurveTo(-12 - wg, -6, -2, -10);
      ctx.stroke();
      // Head
      ctx.fillStyle = def.clr;
      ctx.beginPath();
      ctx.moveTo(-2, -16);
      ctx.lineTo(-7, -9);
      ctx.lineTo(3, -9);
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#FF0';
      ctx.fillRect(-5, -14, 2, 2);
      ctx.fillRect(0, -14, 2, 2);
      // Tongue
      ctx.strokeStyle = '#F44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -16);
      ctx.lineTo(-4, -21);
      ctx.moveTo(-2, -16);
      ctx.lineTo(0, -21);
      ctx.stroke();
      ctx.restore();
    } else if (e.type === 'spikeball') {
      // Cactus — green body with arms; deployed = rooted with thorns
      if (e.deployed) {
        // Rooted base — wider, darker ground mound
        ctx.fillStyle = '#3A2A10';
        ctx.beginPath(); ctx.ellipse(cx, cy+14, 14, 5, 0, 0, Math.PI*2); ctx.fill();
        // Main trunk — thicker when deployed
        ctx.fillStyle = '#1A6630';
        ctx.fillRect(cx-6, cy-14, 12, 28);
        ctx.beginPath(); ctx.arc(cx, cy-14, 6, Math.PI, 0); ctx.fill();
        // Left arm
        ctx.fillRect(cx-14, cy-6, 10, 6);
        ctx.fillRect(cx-14, cy-14, 6, 14);
        ctx.beginPath(); ctx.arc(cx-11, cy-14, 3, Math.PI, 0); ctx.fill();
        // Right arm
        ctx.fillRect(cx+4, cy-2, 10, 6);
        ctx.fillRect(cx+8, cy-10, 6, 14);
        ctx.beginPath(); ctx.arc(cx+11, cy-10, 3, Math.PI, 0); ctx.fill();
        // Thorns — red-tipped to show danger
        ctx.strokeStyle = '#CC3333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx-6, cy-8); ctx.lineTo(cx-10, cy-10);
        ctx.moveTo(cx+6, cy-4); ctx.lineTo(cx+10, cy-6);
        ctx.moveTo(cx-6, cy+2); ctx.lineTo(cx-10, cy+1);
        ctx.moveTo(cx+6, cy+6); ctx.lineTo(cx+10, cy+5);
        ctx.moveTo(cx, cy-14); ctx.lineTo(cx, cy-19);
        ctx.moveTo(cx-14, cy-14); ctx.lineTo(cx-14, cy-18);
        ctx.moveTo(cx+8, cy-10); ctx.lineTo(cx+8, cy-14);
        ctx.stroke();
      } else {
        // Moving cactus — smaller, simpler
        ctx.fillStyle = '#2E8B3A';
        ctx.fillRect(cx-4, cy-10, 8, 20);
        ctx.beginPath(); ctx.arc(cx, cy-10, 4, Math.PI, 0); ctx.fill();
        // Small arms
        ctx.fillRect(cx-10, cy-4, 7, 4);
        ctx.fillRect(cx-10, cy-8, 4, 8);
        ctx.fillRect(cx+3, cy, 7, 4);
        ctx.fillRect(cx+6, cy-4, 4, 8);
      }
    } else if (e.type === 'ogre') {
      // Tumbleweed — stick/wire ball, no fill
      var tw = performance.now() / 800 + e.rx * 3;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tw);
      ctx.strokeStyle = def.clr;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      // Outer spokes
      for (var s = 0; s < 8; s++) {
        var a = s * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*3, Math.sin(a)*3);
        ctx.lineTo(Math.cos(a)*14, Math.sin(a)*14);
        ctx.stroke();
      }
      // Cross sticks
      ctx.strokeStyle = def.clr2;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-12, -4); ctx.lineTo(10, 6); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, 10); ctx.lineTo(12, -8); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, -12); ctx.lineTo(-6, 11); ctx.stroke();
      // Outer ring of short sticks
      ctx.strokeStyle = def.clr;
      ctx.lineWidth = 1;
      for (var s = 0; s < 6; s++) {
        var a = s * Math.PI / 3 + 0.3;
        var r1 = 9, r2 = 14;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*r1, Math.sin(a)*r1);
        ctx.lineTo(Math.cos(a+0.4)*r2, Math.sin(a+0.4)*r2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (e.type === 'mushroom') {
      ctx.fillStyle = def.clr;
      ctx.beginPath(); ctx.arc(cx, cy-3, 14, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#EEE';
      ctx.fillRect(cx-5, cy-3, 10, 14);
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(cx-5, cy-8, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+6, cy-5, 2, 0, Math.PI*2); ctx.fill();
    } else if (e.type === 'butterfly') {
      // Bat — scalloped wings that flap
      var fl = Math.sin(performance.now() / 150 + e.rx * 5) * 4;
      ctx.fillStyle = def.clr;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx - 14, cy - 10 - fl);
      ctx.lineTo(cx - 10, cy - 4);
      ctx.lineTo(cx - 20, cy - 6 - fl);
      ctx.lineTo(cx - 14, cy + 4);
      ctx.lineTo(cx - 3, cy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy);
      ctx.lineTo(cx + 14, cy - 10 - fl);
      ctx.lineTo(cx + 10, cy - 4);
      ctx.lineTo(cx + 20, cy - 6 - fl);
      ctx.lineTo(cx + 14, cy + 4);
      ctx.lineTo(cx + 3, cy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.clr2;
      ctx.beginPath(); ctx.ellipse(cx, cy, 4, 6, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.fillRect(cx - 3, cy - 3, 2, 2);
      ctx.fillRect(cx + 1, cy - 3, 2, 2);
    } else if (e.type === 'mummy') {
      ctx.fillStyle = def.clr;
      ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = def.clr2;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#111';
      ctx.fillRect(cx-4, cy-2, 3, 3);
      ctx.fillRect(cx+1, cy-2, 3, 3);
    } else if (e.type === 'imp') {
      // Red bat — larger, faster flap, glowing eyes
      var fl = Math.sin(performance.now() / 120 + e.rx * 5) * 5;
      ctx.fillStyle = def.clr;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx - 16, cy - 12 - fl);
      ctx.lineTo(cx - 11, cy - 4);
      ctx.lineTo(cx - 22, cy - 7 - fl);
      ctx.lineTo(cx - 15, cy + 5);
      ctx.lineTo(cx - 3, cy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy);
      ctx.lineTo(cx + 16, cy - 12 - fl);
      ctx.lineTo(cx + 11, cy - 4);
      ctx.lineTo(cx + 22, cy - 7 - fl);
      ctx.lineTo(cx + 15, cy + 5);
      ctx.lineTo(cx + 3, cy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.clr2;
      ctx.beginPath(); ctx.ellipse(cx, cy, 5, 7, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FF0';
      ctx.fillRect(cx - 4, cy - 4, 3, 3);
      ctx.fillRect(cx + 1, cy - 4, 3, 3);
    }

    // HP bar for enemies with >1 current HP
    if (e.hp > 1) {
      var maxHP = e.deployed ? ENEMY_DEFS[e.type].deployHP : ENEMY_DEFS[e.type].hp;
      var bw = 30, bh = 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - bw/2, y + 2, bw, bh);
      ctx.fillStyle = '#4C4';
      ctx.fillRect(cx - bw/2, y + 2, bw * (e.hp / maxHP), bh);
    }
  }

  function drawBoss() {
    var b = game.boss;
    if (!b) return;
    var x = px(b.rx), y = py(b.ry);
    var cx = x + 25, cy = y + 25;

    // Glow
    ctx.fillStyle = 'rgba(255,50,50,0.15)';
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();

    if (b.type === 1) {
      // Cowboy boss - black hat, red body
      ctx.fillStyle = '#8B0000';
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#C00';
      ctx.fillRect(cx-3, cy-2, 6, 4);
    } else if (b.type === 2) {
      ctx.fillStyle = '#660066';
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#330033';
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(cx-4, cy-2, 3, 3);
      ctx.fillRect(cx+1, cy-2, 3, 3);
    } else {
      ctx.fillStyle = '#333';
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#F00';
      ctx.fillRect(cx-6, cy-3, 4, 4);
      ctx.fillRect(cx+2, cy-3, 4, 4);
      ctx.fillStyle = '#F00';
      ctx.beginPath(); ctx.arc(cx, cy+8, 3, 0, Math.PI*2); ctx.fill();
    }
  }

  function drawBullet(b) {
    var bx = ARENA_X + b.x * TILE;
    var by = ARENA_Y + b.y * TILE;
    var sz = b.owner === 'enemy' ? 6 : 5;
    ctx.fillStyle = b.owner === 'enemy' ? '#FF3333' : '#FFD700';
    ctx.fillRect(bx - sz/2, by - sz/2, sz, sz);
  }

  function drawItem(item) {
    var x = px(item.x) + 25, y = py(item.y) + 25;
    // Blink when about to expire
    if (item.timer < 3 && Math.floor(item.timer * 4) % 2 === 0) return;

    if (item.type === 'coin1' || item.type === 'coin5') {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(x, y, item.type === 'coin5' ? 10 : 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#B8860B';
      ctx.beginPath(); ctx.arc(x, y, item.type === 'coin5' ? 6 : 4, 0, Math.PI*2); ctx.fill();
      if (item.type === 'coin5') {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('5', x, y+1);
      }
    } else if (item.type === 'life') {
      ctx.fillStyle = '#FF2244';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('♥', x, y);
    } else {
      // Powerup diamond
      var colors = {
        shotgun:'#FF8C00', machinegun:'#FF4444', wagon:'#FFDD00',
        sheriff:'#FFD700', smoke:'#AAAAFF', nuke:'#FF0044'
      };
      var labels = {
        shotgun:'S', machinegun:'M', wagon:'W',
        sheriff:'★', smoke:'S', nuke:'N'
      };
      ctx.fillStyle = colors[item.type] || '#888';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI/4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(labels[item.type] || '?', x, y+1);
    }
  }

  function drawObstacle(tile, x, y) {
    var cx = x + 25, cy = y + 25;
    if (tile === 1) { // Stockade
      ctx.fillStyle = '#6B4F12';
      ctx.fillRect(x+4, y+4, 42, 42);
      ctx.fillStyle = '#4A3508';
      ctx.fillRect(x+10, y+10, 30, 30);
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x+4, y+25); ctx.lineTo(x+46, y+25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x+25, y+4); ctx.lineTo(x+25, y+46); ctx.stroke();
    } else if (tile === 2) { // Tree
      ctx.fillStyle = '#3D2B1F';
      ctx.fillRect(cx-4, cy-4, 8, 16);
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath(); ctx.arc(cx, cy-2, 16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1B5E20';
      ctx.beginPath(); ctx.arc(cx, cy-2, 10, 0, Math.PI*2); ctx.fill();
    } else if (tile === 3) { // Tombstone
      ctx.fillStyle = '#606068';
      ctx.fillRect(x+12, y+18, 26, 24);
      ctx.beginPath();
      ctx.arc(cx, y+18, 13, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#404048';
      ctx.fillRect(x+18, y+22, 14, 3);
      ctx.fillRect(x+22, y+18, 6, 14);
    } else if (tile === 4) { // River
      ctx.fillStyle = '#1A3D5C';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#2A5080';
      ctx.fillRect(x, y+15, TILE, 5);
      ctx.fillRect(x, y+32, TILE, 5);
    } else if (tile === 5) { // Bridge
      ctx.fillStyle = '#1A3D5C';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = '#6B4F12';
      ctx.fillRect(x+2, y+2, TILE-4, TILE-4);
      ctx.fillStyle = '#4A3508';
      ctx.fillRect(x+8, y+4, TILE-16, 4);
      ctx.fillRect(x+8, y+20, TILE-16, 4);
      ctx.fillRect(x+8, y+38, TILE-16, 4);
    }
  }

  // ============ RENDERING ============
  function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 600, 600);

    renderHUD();
    renderArena();
    renderEntities();
    renderBottomHUD();
    if (game.boss) renderBossHP();
    renderOverlay();
    if (game.paused) renderPause();
  }

  function renderHUD() {
    ctx.fillStyle = '#0D0D12';
    ctx.fillRect(0, 0, 600, 58);

    // Lives — filled hearts + outlines for missing
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (var i = 0; i < game.maxLives; i++) {
      if (i < game.lives) {
        ctx.fillStyle = '#FF2244';
        ctx.fillText('♥', 16 + i * 32, 30);
      } else {
        ctx.fillStyle = '#442233';
        ctx.fillText('♡', 16 + i * 32, 30);
      }
    }

    // Stage/Area
    ctx.fillStyle = game.boss ? '#FF4444' : '#FFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    var label = game.boss ? (BOSS_NAMES[game.boss.type] || 'BOSS') : STAGE_COLORS[game.stage].name.toUpperCase() + ' ' + game.stage + '-' + game.area;
    ctx.fillText(label, 300, 30);

    // Coins
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('◆ ' + game.coins, 584, 30);
  }

  function renderArena() {
    var sc = STAGE_COLORS[game.stage];

    // Arena background
    ctx.fillStyle = sc.floor;
    ctx.fillRect(ARENA_X, ARENA_Y, ARENA_W, ARENA_W);

    // Grid lines
    ctx.strokeStyle = sc.grid;
    ctx.lineWidth = 1;
    for (var i = 0; i <= GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(ARENA_X + i * TILE, ARENA_Y);
      ctx.lineTo(ARENA_X + i * TILE, ARENA_Y + ARENA_W);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ARENA_X, ARENA_Y + i * TILE);
      ctx.lineTo(ARENA_X + ARENA_W, ARENA_Y + i * TILE);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = sc.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(ARENA_X - 2, ARENA_Y - 2, ARENA_W + 4, ARENA_W + 4);

    // Obstacles
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        var t = game.layout[r][c];
        if (t > 0) drawObstacle(t, px(c), py(r));
      }
    }
  }

  function renderEntities() {
    // Items
    for (var i = 0; i < game.items.length; i++) drawItem(game.items[i]);

    // Enemies
    for (var i = 0; i < game.enemies.length; i++) drawEnemy(game.enemies[i]);

    // Boss
    if (game.boss) drawBoss();

    // Player
    if (game.invincible <= 0 || Math.floor(game.invincible * 10) % 2 === 0) {
      drawPlayer(px(game.player.rx), py(game.player.ry), game.player.facing);
    }

    // Bullets
    for (var i = 0; i < game.bullets.length; i++) drawBullet(game.bullets[i]);

    // Effects
    for (var i = 0; i < game.effects.length; i++) {
      var e = game.effects[i];
      var progress = 1 - e.timer / e.maxT;
      var alpha = 1 - progress;
      var radius = 5 + progress * 20;
      ctx.fillStyle = 'rgba(' + (e.clr || '255,200,50') + ',' + alpha.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(e.x, e.y, radius, 0, Math.PI*2); ctx.fill();
    }

    // Floaters
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < game.floaters.length; i++) {
      var f = game.floaters[i];
      var a = Math.min(1, f.timer);
      ctx.fillStyle = 'rgba(' + (f.clr || '255,215,0') + ',' + a.toFixed(2) + ')';
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function renderBottomHUD() {
    ctx.fillStyle = '#0D0D12';
    ctx.fillRect(0, 522, 600, 78);

    // Stored item
    ctx.fillStyle = '#555';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('ITEM:', 16, 542);
    if (game.storedItem) {
      var labels = { smoke: 'SMOKE', nuke: 'NUKE' };
      var colors = { smoke: '#AAAAFF', nuke: '#FF3344' };
      var blocked = !!game.boss;
      ctx.fillStyle = blocked ? '#444' : (colors[game.storedItem] || '#FFF');
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText((labels[game.storedItem] || game.storedItem) + (blocked ? ' (N/A)' : ''), 60, 542);
    } else {
      ctx.fillStyle = '#333';
      ctx.fillText('none', 60, 542);
    }

    // Active powerup
    if (game.activePower && game.powerTimer > 0) {
      var pwrNames = { shotgun:'SHOTGUN', machinegun:'RAPID', wagon:'WHEEL', sheriff:'SHERIFF' };
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pwrNames[game.activePower] || game.activePower.toUpperCase(), 300, 542);
      // Timer bar
      ctx.fillStyle = '#333';
      ctx.fillRect(230, 550, 140, 6);
      var maxDur = game.activePower === 'sheriff' ? 20 : POWERUP_DUR;
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(230, 550, 140 * (game.powerTimer / maxDur), 6);
    }

    // Wave progress
    if (!game.boss) {
      ctx.fillStyle = '#555';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('WAVE', 584, 542);
      ctx.fillStyle = '#222';
      ctx.fillRect(460, 550, 124, 6);
      var wp = Math.min(1, game.waveTimer / WAVE_DUR);
      ctx.fillStyle = game.waveDone ? '#4C4' : STAGE_COLORS[game.stage].border;
      ctx.fillRect(460, 550, 124 * wp, 6);
    }

    // Upgrade indicators
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'left';
    var ugText = '';
    if (game.upgrades.gun > 0) ugText += 'G' + game.upgrades.gun + ' ';
    if (game.upgrades.ammo > 0) ugText += 'A' + game.upgrades.ammo + ' ';
    if (game.upgrades.super > 0) ugText += '★ ';
    if (ugText) ctx.fillText(ugText, 16, 570);
  }

  function renderBossHP() {
    var b = game.boss;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(ARENA_X, ARENA_Y - 14, ARENA_W, 10);
    ctx.fillStyle = '#CC2222';
    ctx.fillRect(ARENA_X, ARENA_Y - 14, ARENA_W * (b.hp / b.maxHP), 10);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(ARENA_X, ARENA_Y - 14, ARENA_W, 10);
  }

  function renderOverlay() {
    if (game.overlay.timer <= 0) return;
    var alpha = Math.min(1, game.overlay.timer * 2);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.5 * alpha).toFixed(2) + ')';
    ctx.fillRect(ARENA_X, ARENA_Y, ARENA_W, ARENA_W);
    ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(2) + ')';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(game.overlay.text, 300, 290);
  }

  function renderPause() {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', 300, 200);

    var opts = ['RESUME', 'MUSIC: ' + (musicMuted ? 'OFF' : 'ON'), 'SFX: ' + (sfxMuted ? 'OFF' : 'ON'), 'QUIT'];
    for (var i = 0; i < opts.length; i++) {
      ctx.fillStyle = i === game.pauseSel ? '#D4A843' : '#666';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText((i === game.pauseSel ? '▶ ' : '  ') + opts[i], 300, 280 + i * 46);
    }
  }

  // ============ UPDATE ============
  function update(dt) {
    if (game.paused) return;

    if (game.overlay.timer > 0) {
      game.overlay.timer -= dt;
      return;
    }

    if (game.clearing) {
      game.clearTimer -= dt;
      if (game.clearTimer <= 0) {
        game.clearing = false;
        var step = PROGRESSION[game.progIdx];
        if (step && step.type === 'shop') {
          stopLoop();
        }
        advanceProgression();
      }
      return;
    }

    // Invincibility
    if (game.invincible > 0) game.invincible -= dt;

    // Smooth rendering positions
    game.player.rx += (game.player.x - game.player.rx) * Math.min(1, dt * 16);
    game.player.ry += (game.player.y - game.player.ry) * Math.min(1, dt * 16);

    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      e.rx += (e.x - e.rx) * Math.min(1, dt * 12);
      e.ry += (e.y - e.ry) * Math.min(1, dt * 12);
    }

    if (game.boss) {
      game.boss.rx += (game.boss.x - game.boss.rx) * Math.min(1, dt * 10);
      game.boss.ry += (game.boss.y - game.boss.ry) * Math.min(1, dt * 10);
    }

    // Auto-fire
    updateAutoFire(dt);

    // Bullets
    updateBullets(dt);

    // Enemies
    updateEnemies(dt);

    // Boss
    if (game.boss) updateBoss(dt);

    // Wave spawning
    if (!game.waveDone && !game.boss) updateWave(dt);

    // Powerup timer
    if (game.activePower && game.powerTimer > 0) {
      game.powerTimer -= dt;
      if (game.powerTimer <= 0) {
        game.activePower = null;
        game.powerTimer = 0;
      }
    }

    // Items expiry
    for (var i = game.items.length - 1; i >= 0; i--) {
      game.items[i].timer -= dt;
      if (game.items[i].timer <= 0) game.items.splice(i, 1);
    }

    // Effects
    for (var i = game.effects.length - 1; i >= 0; i--) {
      game.effects[i].timer -= dt;
      if (game.effects[i].timer <= 0) game.effects.splice(i, 1);
    }

    // Floaters
    for (var i = game.floaters.length - 1; i >= 0; i--) {
      game.floaters[i].y -= dt * 40;
      game.floaters[i].timer -= dt;
      if (game.floaters[i].timer <= 0) game.floaters.splice(i, 1);
    }

    // Check area complete
    if (game.waveDone && game.enemies.length === 0 && !game.boss && !game.clearing) {
      completeArea();
    }
  }

  function updateAutoFire(dt) {
    game.fireTimer -= dt;
    if (game.fireTimer <= 0) {
      fireBullets();
      game.fireTimer = getFireInterval();
    }
  }

  function fireBullets() {
    var f = game.player.facing;
    var dx = f === 'right' ? 1 : f === 'left' ? -1 : 0;
    var dy = f === 'down' ? 1 : f === 'up' ? -1 : 0;
    var dmg = getBulletDamage();
    var cx = game.player.x + 0.5;
    var cy = game.player.y + 0.5;

    var isShotgun = game.activePower === 'shotgun' || game.activePower === 'sheriff' || game.upgrades.super > 0;
    var isWagon = game.activePower === 'wagon';

    if (isWagon) {
      game.bullets.push({ x:cx, y:cy, dx:0,  dy:-1, owner:'player', dmg:dmg });
      game.bullets.push({ x:cx, y:cy, dx:0,  dy:1,  owner:'player', dmg:dmg });
      game.bullets.push({ x:cx, y:cy, dx:-1, dy:0,  owner:'player', dmg:dmg });
      game.bullets.push({ x:cx, y:cy, dx:1,  dy:0,  owner:'player', dmg:dmg });
    } else if (isShotgun) {
      game.bullets.push({ x:cx, y:cy, dx:dx, dy:dy, owner:'player', dmg:dmg });
      if (dx === 0) {
        game.bullets.push({ x:cx, y:cy, dx:-1, dy:dy, owner:'player', dmg:dmg });
        game.bullets.push({ x:cx, y:cy, dx:1,  dy:dy, owner:'player', dmg:dmg });
      } else {
        game.bullets.push({ x:cx, y:cy, dx:dx, dy:-1, owner:'player', dmg:dmg });
        game.bullets.push({ x:cx, y:cy, dx:dx, dy:1,  owner:'player', dmg:dmg });
      }
    } else {
      game.bullets.push({ x:cx, y:cy, dx:dx, dy:dy, owner:'player', dmg:dmg });
    }
    SFX.shoot();
  }

  function updateBullets(dt) {
    for (var i = game.bullets.length - 1; i >= 0; i--) {
      var b = game.bullets[i];
      b.x += b.dx * BULLET_SPEED * dt;
      b.y += b.dy * BULLET_SPEED * dt;

      var tx = Math.floor(b.x);
      var ty = Math.floor(b.y);

      // Out of bounds
      if (tx < 0 || tx >= GRID || ty < 0 || ty >= GRID) {
        game.bullets.splice(i, 1);
        continue;
      }

      // Hit obstacle
      if (tileSolid(game.layout[ty][tx])) {
        game.effects.push({ x: ARENA_X + b.x * TILE, y: ARENA_Y + b.y * TILE, timer: 0.15, maxT: 0.15, clr: '200,200,200' });
        game.bullets.splice(i, 1);
        continue;
      }

      if (b.owner === 'player') {
        // Hit enemy
        var hitIdx = -1;
        for (var j = 0; j < game.enemies.length; j++) {
          if (Math.floor(b.x) === game.enemies[j].x && Math.floor(b.y) === game.enemies[j].y) {
            hitIdx = j; break;
          }
        }
        if (hitIdx >= 0) {
          damageEnemy(hitIdx, b.dmg);
          game.bullets.splice(i, 1);
          continue;
        }
        // Hit boss
        if (game.boss && Math.floor(b.x) === game.boss.x && Math.floor(b.y) === game.boss.y) {
          damageBoss(b.dmg);
          game.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Enemy bullet hits player
        if (Math.floor(b.x) === game.player.x && Math.floor(b.y) === game.player.y) {
          game.bullets.splice(i, 1);
          playerHit();
          continue;
        }
      }
    }
  }

  function updateEnemies(dt) {
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e.deployed) continue;

      e.moveTimer -= dt;
      if (e.moveTimer <= 0) {
        e.moveTimer = ENEMY_DEFS[e.type].mi;

        if (e.type === 'spikeball' && e.target) {
          // If target tile already has a deployed cactus, pick a new target
          if (hasDeployedCactus(e.target.x, e.target.y)) {
            e.target = getRandomOpenTile(2);
          }
          moveEnemyToward(e, e.target.x, e.target.y);
          if (e.x === e.target.x && e.y === e.target.y) {
            e.deployed = true;
            e.hp = ENEMY_DEFS.spikeball.deployHP;
          }
        } else {
          moveEnemyToward(e, game.player.x, game.player.y);
        }

        // Check if enemy reached player
        if (e.x === game.player.x && e.y === game.player.y) {
          playerHit();
        }
      }
    }
  }

  function hasDeployedCactus(tx, ty) {
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e.deployed && e.x === tx && e.y === ty) return true;
    }
    return false;
  }

  function moveEnemyToward(e, targetX, targetY) {
    var dx = targetX - e.x;
    var dy = targetY - e.y;
    if (dx === 0 && dy === 0) return;

    var moves = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (dx !== 0) moves.push({ x: dx > 0 ? 1 : -1, y: 0 });
      if (dy !== 0) moves.push({ x: 0, y: dy > 0 ? 1 : -1 });
    } else {
      if (dy !== 0) moves.push({ x: 0, y: dy > 0 ? 1 : -1 });
      if (dx !== 0) moves.push({ x: dx > 0 ? 1 : -1, y: 0 });
    }

    for (var i = 0; i < moves.length; i++) {
      var nx = e.x + moves[i].x;
      var ny = e.y + moves[i].y;
      if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
      if (e.fly) {
        e.ldx = moves[i].x; e.ldy = moves[i].y;
        e.x = nx; e.y = ny; return;
      }
      if (!tileBlocks(game.layout[ny][nx], true) && !hasDeployedCactus(nx, ny)) {
        e.ldx = moves[i].x; e.ldy = moves[i].y;
        e.x = nx; e.y = ny; return;
      }
    }
  }

  function updateWave(dt) {
    game.waveTimer += dt;
    if (game.waveTimer >= WAVE_DUR) {
      game.waveDone = true;
      return;
    }

    var progress = game.waveTimer / WAVE_DUR;
    var dc = DIFF[game.difficulty] || DIFF.normal;
    game.spawnInterval = (2.6 - progress * 1.4) * dc.spawnMult;
    if (game.spawnInterval < 0.5) game.spawnInterval = 0.5;

    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      spawnEnemy();
      game.spawnTimer = game.spawnInterval;
    }
  }

  // ============ ENEMIES ============
  function spawnEnemy() {
    var key = game.stage + '-' + game.area;
    var pool = AREA_ENEMIES[key];
    if (!pool) return;

    var type = weightedRandom(pool);
    var def = ENEMY_DEFS[type];

    var count = (type === 'mummy') ? 1 + Math.floor(Math.random() * 2) : 1;
    for (var n = 0; n < count; n++) {
      var edge = getEdgeTile(def.fly);
      if (!edge) continue;

      var e = {
        type: type,
        x: edge.x, y: edge.y,
        rx: edge.x, ry: edge.y,
        hp: def.hp,
        fly: def.fly,
        moveTimer: def.mi * (0.5 + Math.random() * 0.5),
        deployed: false,
        target: null,
        ldx: 0, ldy: 1,
      };

      if (type === 'spikeball') {
        e.target = getRandomOpenTile(2);
      }

      game.enemies.push(e);
    }
  }

  function getEdgeTile(flying) {
    var edges = [];
    for (var i = 0; i < GRID; i++) {
      edges.push({x:i,y:0}); edges.push({x:i,y:GRID-1});
      if (i > 0 && i < GRID-1) { edges.push({x:0,y:i}); edges.push({x:GRID-1,y:i}); }
    }
    // Shuffle
    for (var i = edges.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = edges[i]; edges[i] = edges[j]; edges[j] = tmp;
    }
    for (var i = 0; i < edges.length; i++) {
      var t = edges[i];
      if (t.x === game.player.x && t.y === game.player.y) continue;
      if (flying || !tileBlocks(game.layout[t.y][t.x], true)) return t;
    }
    return null;
  }

  function getRandomOpenTile(margin) {
    margin = margin || 1;
    var tiles = [];
    for (var r = margin; r < GRID - margin; r++) {
      for (var c = margin; c < GRID - margin; c++) {
        if (game.layout[r][c] === 0) tiles.push({x:c, y:r});
      }
    }
    return tiles.length > 0 ? tiles[Math.floor(Math.random() * tiles.length)] : {x:4, y:4};
  }

  function damageEnemy(idx, dmg) {
    var e = game.enemies[idx];
    e.hp -= dmg;
    if (e.hp <= 0) {
      killEnemy(idx);
    } else {
      SFX.hit();
      game.effects.push({ x: px(e.x)+25, y: py(e.y)+25, timer:0.15, maxT:0.15, clr:'255,255,100' });
    }
  }

  function killEnemy(idx) {
    var e = game.enemies[idx];
    SFX.kill();
    game.effects.push({ x: px(e.x)+25, y: py(e.y)+25, timer:0.3, maxT:0.3, clr:'255,150,50' });
    dropItem(e.x, e.y);
    game.enemies.splice(idx, 1);
  }

  function dropItem(x, y) {
    if (Math.random() < COIN_DROP) {
      var type = Math.random() < 0.15 ? 'coin5' : 'coin1';
      game.items.push({ type: type, x: x, y: y, timer: 12 });
    }
    if (Math.random() < POWER_DROP) {
      var r = Math.random();
      var type;
      if (r < 0.08) type = 'life';
      else {
        var pool = POWERUP_POOL;
        type = pool[Math.floor(Math.random() * pool.length)];
      }
      game.items.push({ type: type, x: x, y: y, timer: 12 });
    }
  }

  // ============ BOSSES ============
  function initBoss(stage) {
    var dc = DIFF[game.difficulty] || DIFF.normal;
    var hp = Math.ceil([0, 15, 20, 30][stage] * dc.bossHpMult);
    game.boss = {
      type: stage,
      x: 4, y: 0,
      rx: 4, ry: 0,
      hp: hp, maxHP: hp,
      state: 'hide',
      stateTimer: 2.5,
      moveDir: -1,
      fireTimer: 0,
      phase: 1,
      moveTimer: 0,
      cycles: 0,
    };
    SFX.boss();
  }

  function updateBoss(dt) {
    var b = game.boss;
    if (!b) return;

    b.stateTimer -= dt;

    if (b.type === 1 || b.type === 2) updateBossCowboy(b, dt);
    else if (b.type === 3) updateBossFector(b, dt);
  }

  function updateBossCowboy(b, dt) {
    var speed = b.type === 1 ? 0.5 : 0.35;

    if (b.state === 'hide') {
      b.x = 4; b.y = 0;
      if (b.stateTimer <= 0) {
        b.state = 'emerge';
        b.x = 4; b.y = 2;
        b.stateTimer = 0.3;
      }
    } else if (b.state === 'emerge') {
      if (b.stateTimer <= 0) {
        b.state = 'strafe';
        b.stateTimer = 0;
        b.moveTimer = speed;
      }
    } else if (b.state === 'strafe') {
      b.fireTimer -= dt;
      if (b.fireTimer <= 0) {
        bossFireAtPlayer(b.x, b.y);
        if (b.type === 2) {
          setTimeout(function() { bossFireAtPlayer(b.x, b.y); }, 100);
        }
        b.fireTimer = b.type === 1 ? 0.85 : 0.56;
      }
      b.moveTimer -= dt;
      if (b.moveTimer <= 0) {
        b.x += b.moveDir;
        b.moveTimer = speed;
        if (b.x <= 1 || b.x >= 7) {
          b.state = 'expose';
          b.stateTimer = b.type === 1 ? 1.5 : 1.0;
        }
      }
    } else if (b.state === 'expose') {
      if (b.stateTimer <= 0) {
        b.moveDir = -b.moveDir;
        b.cycles++;
        if (b.cycles >= 2) {
          b.state = 'retreat';
          b.stateTimer = 0.5;
          b.cycles = 0;
        } else {
          b.state = 'strafe';
          b.moveTimer = speed;
          b.fireTimer = 0.3;
        }
      }
    } else if (b.state === 'retreat') {
      b.x = 4;
      if (b.stateTimer <= 0) {
        b.state = 'hide';
        b.y = 0;
        b.stateTimer = 2.0;
      }
    }
  }

  function updateBossFector(b, dt) {
    b.phase = b.hp > 20 ? 1 : (b.hp > 10 ? 2 : 3);

    b.fireTimer -= dt;
    if (b.fireTimer <= 0) {
      if (b.phase === 1) {
        bossFireCardinal(b.x, b.y);
        b.fireTimer = 1.5;
      } else {
        bossFireOcto(b.x, b.y);
        b.fireTimer = b.phase === 2 ? 2.0 : 1.5;
      }
    }

    // Move to random tile periodically
    if (b.phase >= 2) {
      b.moveTimer -= dt;
      if (b.moveTimer <= 0) {
        var t = getRandomOpenTile(1);
        b.x = t.x; b.y = Math.min(t.y, 5);
        b.moveTimer = b.phase === 2 ? 4.0 : 3.0;
      }
    }

    // Spawn imps in phase 3
    if (b.phase === 3 && b.stateTimer <= 0) {
      for (var i = 0; i < 2; i++) {
        var edge = getEdgeTile(true);
        if (edge) {
          game.enemies.push({
            type:'imp', x:edge.x, y:edge.y, rx:edge.x, ry:edge.y,
            hp:3, fly:true, moveTimer:0.4, deployed:false, target:null
          });
        }
      }
      b.stateTimer = 8;
    }
  }

  function bossFireAtPlayer(bx, by) {
    var dx = game.player.x - bx;
    var dy = game.player.y - by;
    var len = Math.sqrt(dx*dx + dy*dy);
    if (len < 0.1) return;
    game.bullets.push({ x:bx+0.5, y:by+0.5, dx:dx/len, dy:dy/len, owner:'enemy' });
  }

  function bossFireCardinal(bx, by) {
    var dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
    for (var i = 0; i < dirs.length; i++) {
      game.bullets.push({ x:bx+0.5, y:by+0.5, dx:dirs[i].dx, dy:dirs[i].dy, owner:'enemy' });
    }
  }

  function bossFireOcto(bx, by) {
    var dirs = [
      {dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0},
      {dx:0.7,dy:-0.7},{dx:0.7,dy:0.7},{dx:-0.7,dy:-0.7},{dx:-0.7,dy:0.7}
    ];
    for (var i = 0; i < dirs.length; i++) {
      game.bullets.push({ x:bx+0.5, y:by+0.5, dx:dirs[i].dx, dy:dirs[i].dy, owner:'enemy' });
    }
  }

  function damageBoss(dmg) {
    if (!game.boss) return;
    game.boss.hp -= dmg;
    SFX.hit();
    game.effects.push({ x: px(game.boss.x)+25, y: py(game.boss.y)+25, timer:0.2, maxT:0.2, clr:'255,100,100' });
    if (game.boss.hp <= 0) defeatBoss();
  }

  function defeatBoss() {
    SFX.clear();
    if (musicBoss) { musicBoss.pause(); musicBoss.currentTime = 0; }
    currentMusic = null;
    playSFXFile('complete');
    game.effects.push({ x: px(game.boss.x)+25, y: py(game.boss.y)+25, timer:0.6, maxT:0.6, clr:'255,200,50' });
    game.boss = null;
    game.enemies = [];
    game.bullets = [];
    setTimeout(function() {
      if (!musicMuted && musicNormal) {
        currentMusic = musicNormal;
        musicNormal.currentTime = 0;
        musicNormal.volume = 0.25;
        musicNormal.play().catch(function(){});
      }
    }, 2000);
    completeArea();
  }

  // ============ PLAYER ============
  function movePlayer(dx, dy) {
    var nx = game.player.x + dx;
    var ny = game.player.y + dy;

    if (dx === 1)  game.player.facing = 'right';
    if (dx === -1) game.player.facing = 'left';
    if (dy === -1) game.player.facing = 'up';
    if (dy === 1)  game.player.facing = 'down';

    if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) { SFX.move(); return; }
    if (tileBlocks(game.layout[ny][nx], false)) { SFX.move(); return; }

    game.player.x = nx;
    game.player.y = ny;
    SFX.move();

    // Check item pickup
    for (var i = game.items.length - 1; i >= 0; i--) {
      if (game.items[i].x === nx && game.items[i].y === ny) {
        collectItem(game.items[i]);
        game.items.splice(i, 1);
      }
    }

    // Check enemy collision
    for (var i = 0; i < game.enemies.length; i++) {
      if (game.enemies[i].x === nx && game.enemies[i].y === ny) {
        playerHit();
        return;
      }
    }

    // Check boss collision
    if (game.boss && game.boss.x === nx && game.boss.y === ny) {
      playerHit();
    }
  }

  function collectItem(item) {
    if (item.type === 'coin1') {
      game.coins += 1; game.totalCoins += 1;
      SFX.coin();
      addFloater(item.x, item.y, '+1', '255,215,0');
    } else if (item.type === 'coin5') {
      game.coins += 5; game.totalCoins += 5;
      SFX.coin();
      addFloater(item.x, item.y, '+5', '255,215,0');
    } else if (item.type === 'life') {
      if (game.lives >= game.maxLives) return;
      game.lives = Math.min(game.lives + 1, game.maxLives);
      SFX.powerup();
      addFloater(item.x, item.y, '+1 ♥', '255,34,68');
    } else if (item.type === 'smoke' || item.type === 'nuke') {
      game.storedItem = item.type;
      SFX.powerup();
      addFloater(item.x, item.y, 'STORED!', '170,170,255');
    } else {
      // Timed powerup
      game.activePower = item.type;
      if (item.type === 'sheriff') game.powerTimer = 20;
      else game.powerTimer = POWERUP_DUR;
      SFX.powerup();
      var names = { shotgun:'SHOTGUN!', machinegun:'RAPID!', wagon:'WHEEL!', sheriff:'SHERIFF!' };
      addFloater(item.x, item.y, names[item.type] || 'POWER!', '255,215,0');
    }
  }

  function addFloater(tx, ty, text, clr) {
    game.floaters.push({ x: px(tx)+25, y: py(ty)+10, text:text, clr:clr, timer:1.2 });
  }

  function playerHit() {
    if (game.invincible > 0) return;
    if (game.clearing) return;

    game.lives--;
    SFX.death();
    game.effects.push({ x: px(game.player.x)+25, y: py(game.player.y)+25, timer:0.4, maxT:0.4, clr:'255,50,50' });

    if (game.lives <= 0) {
      gameOver();
      return;
    }

    // Stay in place, just grant invincibility
    game.invincible = INVINCE_DUR;
    game.activePower = null;
    game.powerTimer = 0;
  }

  function useStoredItem() {
    if (!game.storedItem) { SFX.nope(); return; }
    if (game.boss) { SFX.nope(); return; }

    if (game.storedItem === 'nuke') {
      for (var i = game.enemies.length - 1; i >= 0; i--) {
        game.effects.push({ x: px(game.enemies[i].x)+25, y: py(game.enemies[i].y)+25, timer:0.3, maxT:0.3, clr:'255,100,50' });
      }
      game.enemies = [];
      SFX.kill();
      addFloater(game.player.x, game.player.y, 'NUKE!', '255,50,50');
    } else if (game.storedItem === 'smoke') {
      var t = getRandomOpenTile(1);
      game.player.x = t.x;
      game.player.y = t.y;
      game.player.rx = t.x;
      game.player.ry = t.y;
      // Freeze enemies for 3 seconds
      for (var i = 0; i < game.enemies.length; i++) {
        game.enemies[i].moveTimer += 3;
      }
      SFX.powerup();
      addFloater(t.x, t.y, 'SMOKE!', '170,170,255');
    }

    game.storedItem = null;
  }

  // ============ GAME FLOW ============
  function startGame(diff) {
    resetGame();
    game.difficulty = diff || 'normal';
    ensureAudio();
    playMusic();
    advanceProgression();
  }

  function advanceProgression() {
    if (game.progIdx >= PROGRESSION.length) {
      gameVictory();
      return;
    }

    var step = PROGRESSION[game.progIdx];
    game.progIdx++;

    if (step.type === 'area') startArea(step.stage, step.area);
    else if (step.type === 'shop') openShop();
    else if (step.type === 'boss') startBossFight(step.stage);
  }

  function startArea(stage, area) {
    game.stage = stage;
    game.area = area;
    game.enemies = [];
    game.bullets = [];
    game.items = [];
    game.effects = [];
    game.floaters = [];
    game.layout = parseLayout(stage + '-' + area);
    game.waveTimer = 0;
    game.waveDone = false;
    game.spawnTimer = 1.0;
    game.player.x = 4; game.player.y = 4;
    game.player.rx = 4; game.player.ry = 4;
    game.player.facing = 'up';
    game.fireTimer = getFireInterval();
    game.invincible = 1;
    game.boss = null;
    game.paused = false;
    game.clearing = false;
    game.overlay = { text: STAGE_COLORS[stage].name.toUpperCase() + ' ' + stage + '-' + area, timer: 2 };

    showScreen('game');
    resumeMusic();
    if (!loopRunning) startLoop();
  }

  function startBossFight(stage) {
    game.stage = stage;
    game.area = 'BOSS';
    game.enemies = [];
    game.bullets = [];
    game.items = [];
    game.effects = [];
    game.floaters = [];
    game.layout = parseLayout('b' + stage);
    game.waveTimer = WAVE_DUR;
    game.waveDone = true;
    game.player.x = 4; game.player.y = 7;
    game.player.rx = 4; game.player.ry = 7;
    game.player.facing = 'up';
    game.fireTimer = getFireInterval();
    game.invincible = 2;
    game.paused = false;
    game.clearing = false;
    game.overlay = { text: 'BOSS FIGHT!', timer: 2.5 };

    initBoss(stage);
    showScreen('game');
    playBossMusic();
    if (!loopRunning) startLoop();
  }

  function completeArea() {
    if (game.clearing) return;
    game.clearing = true;
    game.clearTimer = 2;
    game.overlay = { text: 'CLEARED!', timer: 1.8 };
    game.bullets = [];
    SFX.clear();
    playSFXFile('levelWin');
    saveProgress();
  }

  function gameOver() {
    stopLoop();
    pauseMusic();
    saveProgress();
    playSFXFile('gameOver');
    var stats = 'Reached: Stage ' + game.stage + (game.area === 'BOSS' ? ' Boss' : '-' + game.area);
    stats += '  |  Coins: ' + game.totalCoins;
    document.getElementById('go-stats').textContent = stats;
    showScreen('gameover');
  }

  function gameVictory() {
    stopLoop();
    pauseMusic();
    saveProgress();
    SFX.victory();
    playSFXFile('complete');
    document.getElementById('vic-stats').textContent = 'Total coins: ' + game.totalCoins;
    showScreen('victory');
  }

  function saveProgress() {
    try {
      var hiIdx = parseInt(localStorage.getItem('pk_hi_idx') || '0');
      if (game.progIdx > hiIdx) {
        localStorage.setItem('pk_hi_idx', '' + game.progIdx);
        var label = 'Stage ' + game.stage + (game.area === 'BOSS' ? ' Boss' : '-' + game.area);
        localStorage.setItem('pk_best', label);
      }
    } catch(e) {}
  }

  function updateTitleHiScore() {
    try {
      var best = localStorage.getItem('pk_best');
      var el = document.getElementById('high-score');
      var hiIdx = parseInt(localStorage.getItem('pk_hi_idx') || '0');
      if (hiIdx >= PROGRESSION.length) el.textContent = 'Best: VICTORY!';
      else if (best) el.textContent = 'Best: ' + best;
      else el.textContent = '';
    } catch(e) {}
  }

  // ============ SHOP ============
  function openShop() {
    stopLoop();
    shopEnterTime = performance.now();
    renderShopItems();
    showScreen('shop');
  }

  function renderShopItems() {
    var container = document.getElementById('shop-items');
    container.innerHTML = '';
    document.getElementById('shop-coins').textContent = '◆ ' + game.coins;
    // Show lives
    var livesStr = '';
    for (var h = 0; h < game.maxLives; h++) livesStr += h < game.lives ? '♥' : '♡';
    document.getElementById('shop-lives').textContent = livesStr;

    for (var i = 0; i < SHOP_DEFS.length; i++) {
      var def = SHOP_DEFS[i];
      var tier = game.upgrades[def.id] || 0;
      var maxed = tier >= def.max;
      // Life: maxed if at max lives
      var isLifeFull = def.id === 'life' && game.lives >= game.maxLives;
      if (isLifeFull) maxed = true;
      var price = maxed ? 0 : def.prices[Math.min(tier, def.prices.length - 1)];
      var canBuy = !maxed && game.coins >= price;

      var btn = document.createElement('button');
      btn.className = 'shop-item focusable' + (maxed ? ' sold-out' : '');
      btn.setAttribute('data-action', 'buy-' + def.id);
      if (maxed) btn.disabled = true;

      var tierLabel = '';
      if (def.id === 'life') tierLabel = isLifeFull ? ' (FULL)' : '';
      else if (maxed) tierLabel = ' (MAX)';
      else if (def.max > 1) tierLabel = ' (Tier ' + (tier + 1) + ')';

      btn.innerHTML =
        '<span class="shop-icon">' + def.icon + '</span>' +
        '<div class="shop-info">' +
          '<div class="shop-name">' + def.name + tierLabel + '</div>' +
          '<div class="shop-desc">' + def.desc + '</div>' +
        '</div>' +
        (maxed ? '<span class="shop-price" style="color:#4C4">' + (isLifeFull ? 'FULL' : 'MAX') + '</span>' :
        '<span class="shop-price' + (canBuy ? '' : ' cant-afford') + '">' + price + ' ◆</span>');

      container.appendChild(btn);
    }
  }

  function buyItem(id) {
    var def = null;
    for (var i = 0; i < SHOP_DEFS.length; i++) {
      if (SHOP_DEFS[i].id === id) { def = SHOP_DEFS[i]; break; }
    }
    if (!def) return;

    var tier = game.upgrades[id] || 0;
    if (tier >= def.max) { SFX.nope(); return; }

    var price = def.prices[Math.min(tier, def.prices.length - 1)];
    if (game.coins < price) { SFX.nope(); return; }

    if (id === 'life' && game.lives >= game.maxLives) { SFX.nope(); return; }
    game.coins -= price;
    if (id === 'life') {
      game.lives = Math.min(game.lives + 1, game.maxLives);
    } else {
      game.upgrades[id] = tier + 1;
    }

    SFX.buy();
    renderShopItems();
  }

  function exitShop() {
    if (performance.now() - shopEnterTime < 500) return;
    advanceProgression();
  }

  // ============ SCREEN MANAGEMENT ============
  function collectScreens() {
    document.querySelectorAll('.screen').forEach(function(s) {
      if (s.id) screens[s.id] = s;
    });
  }

  function showScreen(id) {
    Object.values(screens).forEach(function(s) { s.classList.add('hidden'); });
    if (screens[id]) {
      screens[id].classList.remove('hidden');
      currentScreen = id;
      var el = screens[id].querySelector('.focusable:not([disabled])');
      if (el) setTimeout(function() { el.focus(); }, 50);
    }
    if (id === 'title') updateTitleHiScore();
  }

  function focusFirst(container) {
    var el = container.querySelector('.focusable:not([disabled]):not(.hidden)');
    if (el) el.focus();
  }

  function moveFocus(dir) {
    var container = screens[currentScreen];
    if (!container) return;
    var items = Array.from(container.querySelectorAll('.focusable:not([disabled]):not(.hidden)'));
    if (items.length === 0) return;
    var idx = items.indexOf(document.activeElement);
    if (idx === -1) { focusFirst(container); return; }

    var next;
    if (dir === 'up' || dir === 'left') next = idx > 0 ? idx - 1 : items.length - 1;
    else next = idx < items.length - 1 ? idx + 1 : 0;
    items[next].focus();
    items[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ============ INPUT ============
  function setupInput() {
    document.addEventListener('keydown', function(e) {
      ensureAudio();

      if (currentScreen === 'game') {
        handleGameInput(e.key);
        e.preventDefault();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':   moveFocus('up');   e.preventDefault(); break;
        case 'ArrowDown': moveFocus('down'); e.preventDefault(); break;
        case 'ArrowLeft': moveFocus('left'); e.preventDefault(); break;
        case 'ArrowRight':moveFocus('right');e.preventDefault(); break;
        case 'Enter':
          if (document.activeElement && document.activeElement.classList.contains('focusable')) {
            document.activeElement.click();
          }
          e.preventDefault();
          break;
        case 'Escape':
          if (currentScreen === 'howto') showScreen('title');
          e.preventDefault();
          break;
      }
    });

    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      ensureAudio();
      var action = el.dataset.action;

      if (action === 'start-game') showScreen('difficulty');
      else if (action === 'how-to-play') showScreen('howto');
      else if (action === 'back') showScreen('title');
      else if (action === 'exit-shop') exitShop();
      else if (action === 'restart') showScreen('difficulty');
      else if (action === 'diff-easy') startGame('easy');
      else if (action === 'diff-normal') startGame('normal');
      else if (action === 'diff-hard') startGame('hard');
      else if (action === 'go-title') { stopLoop(); stopMusic(); showScreen('title'); }
      else if (action === 'toggle-music') toggleMusic();
      else if (action === 'toggle-sfx') toggleSFX();
      else if (action.indexOf('buy-') === 0) buyItem(action.substring(4));
    });
  }

  function handleGameInput(key) {
    if (key === 'Escape') {
      game.paused = !game.paused;
      if (game.paused) { game.pauseSel = 0; pauseMusic(); }
      else { resumeMusic(); }
      return;
    }

    if (game.paused) {
      if (key === 'ArrowUp') game.pauseSel = game.pauseSel > 0 ? game.pauseSel - 1 : 3;
      else if (key === 'ArrowDown') game.pauseSel = game.pauseSel < 3 ? game.pauseSel + 1 : 0;
      else if (key === 'Enter') {
        if (game.pauseSel === 0) { game.paused = false; resumeMusic(); }
        else if (game.pauseSel === 1) { toggleMusic(); }
        else if (game.pauseSel === 2) { toggleSFX(); }
        else if (game.pauseSel === 3) { stopLoop(); stopMusic(); showScreen('title'); }
      }
      return;
    }

    if (game.overlay.timer > 0 || game.clearing) return;

    var now = performance.now();
    var cd = getMoveCooldown();

    switch (key) {
      case 'ArrowUp':
        if (now - lastInputTime < cd) return;
        movePlayer(0, -1);
        lastInputTime = now;
        break;
      case 'ArrowDown':
        if (now - lastInputTime < cd) return;
        movePlayer(0, 1);
        lastInputTime = now;
        break;
      case 'ArrowLeft':
        if (now - lastInputTime < cd) return;
        movePlayer(-1, 0);
        lastInputTime = now;
        break;
      case 'ArrowRight':
        if (now - lastInputTime < cd) return;
        movePlayer(1, 0);
        lastInputTime = now;
        break;
      case 'Enter':
        useStoredItem();
        break;
    }
  }

  // ============ GAME LOOP ============
  var loopRunning = false;

  function gameLoop(ts) {
    if (!loopRunning) return;
    var dt = (ts - lastTime) / 1000;
    lastTime = ts;
    if (dt > 0.1) dt = 0.1;

    try {
      update(dt);
      render();
    } catch(e) { console.error('Game error:', e); }

    if (loopRunning) {
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function startLoop() {
    if (loopRunning) return;
    loopRunning = true;
    lastTime = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function stopLoop() {
    loopRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  // ============ INIT ============
  function init() {
    collectScreens();
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    loadMutePrefs();
    initFileAudio();
    setupInput();
    resetGame();
    updateTitleHiScore();
    updateMuteButtons();
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && loopRunning && !game.paused && currentScreen === 'game') {
        game.paused = true;
        game.pauseSel = 0;
        pauseMusic();
      }
    });
    window.addEventListener('blur', function() {
      if (loopRunning && !game.paused && currentScreen === 'game') {
        game.paused = true;
        game.pauseSel = 0;
        pauseMusic();
      }
    });
    showScreen('title');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
