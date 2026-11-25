// game.js — Sizzle & Serve: state machine, input, timers and the main
// loop. The chef carries one thing at a time; every station is clicked,
// every timed job can burn if it is forgotten.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptySlot() { return { item: null, state: 'idle', t: 0, dur: 0, result: null, burnIn: 0, burnT: 0 }; }
function emptyPlate() { return { components: [] }; }

function newGame(rng) {
  return {
    screen: 'title',
    rng: rng || Math.random,
    coins: 0, combo: 0, bestCombo: 0, served: 0, lost: 0,
    shiftSecs: 180, timeLeft: 180, elapsed: 0,
    difficulty: 0, spawnTimer: 6,
    orders: [],
    held: null,
    board: emptySlot(),
    stove: [emptySlot(), emptySlot()],
    grill: emptySlot(),
    plates: [emptyPlate(), emptyPlate()],
    chef: { x: 640, targetX: 640 },
    floats: [],
    bellT: 0,
    hint: 'Welcome to Dapur Kilat! Click START to open the kitchen.',
    endStats: null,
    shake: 0,
    lastTickSecond: -1,
  };
}

const game = newGame(Math.random);
let canvas, ctx;
let lastNow = 0;

function addFloat(x, y, textStr, color, size) {
  game.floats.push({ x: x, y: y, text: textStr, color: color || '#2e9e43', size: size || 18, life: 1.4, maxLife: 1.4 });
}

function setHint(str) { game.hint = str; }

function startShift() {
  const rng = game.rng;
  const fresh = newGame(rng);
  Object.keys(fresh).forEach((k) => { game[k] = fresh[k]; });
  game.screen = 'playing';
  game.spawnTimer = 2;
  SoundEngine.ensure();
  SoundEngine.start();
  SoundEngine.startMusic();
  setHint('New shift! Grab an ingredient from the pantry to begin.');
}

function endShift() {
  game.screen = 'over';
  const stars = game.coins >= 140 ? 3 : game.coins >= 100 ? 2 : game.coins >= 60 ? 1 : 0;
  game.endStats = { coins: game.coins, served: game.served, lost: game.lost, bestCombo: game.bestCombo, stars: stars };
  SoundEngine.gameOver();
  SoundEngine.stopMusic();
}

function togglePause() {
  if (game.screen === 'playing') {
    game.screen = 'paused';
    setHint('Paused. Press P to keep cooking.');
  } else if (game.screen === 'paused') {
    game.screen = 'playing';
    setHint('Back to the rush!');
  }
}

// ---- station work -----------------------------------------------------

function slotStart(slot, kind, dur, result, burnIn) {
  slot.item = kind;
  slot.state = 'working';
  slot.t = 0;
  slot.dur = dur;
  slot.result = result;
  slot.burnIn = burnIn || 0;
  slot.burnT = 0;
}

function slotTick(slot, dt) {
  if (!slot.item) return;
  if (slot.state === 'working') {
    slot.t += dt;
    if (slot.t >= slot.dur) {
      slot.state = 'ready';
      slot.t = 0;
      SoundEngine.ready();
    }
  } else if (slot.state === 'ready' && slot.burnIn > 0) {
    slot.burnT += dt;
    if (slot.burnT >= slot.burnIn) {
      slot.state = 'burnt';
      SoundEngine.burnt();
    }
  }
}

function slotTake(slot) {
  if (!slot.item || slot.state !== 'ready') return null;
  const result = slot.result;
  const s = emptySlot();
  Object.keys(s).forEach((k) => { slot[k] = s[k]; });
  return result;
}

// ---- clicks -----------------------------------------------------------

function hitRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
function hitCircle(x, y, cx, cy, rad) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= rad * rad;
}

function clickPantry(bin) {
  if (game.held) { SoundEngine.error(); setHint('Hands full! Serve or trash what you are holding first.'); return; }
  game.held = { type: 'ingredient', kind: bin.kind };
  game.chef.targetX = bin.x;
  SoundEngine.pickup();
  const ing = INGREDIENTS[bin.kind];
  if (ing.cook === null && !ing.chop) setHint(ing.name + ' is ready to plate — click a plate to add it.');
  else setHint(ing.name + ' picked up. Take it to the ' + stationFor(bin.kind) + '.');
}

function clickBoard() {
  const b = LAYOUT.chopBoard;
  const slot = game.board;
  game.chef.targetX = b.x + b.w / 2;
  if (slot.state === 'burnt') return;
  if (!slot.item) {
    if (game.held && game.held.type === 'ingredient' && needsChop(game.held.kind)) {
      slotStart(slot, game.held.kind, 2, chopResult(game.held.kind), 0);
      game.held = null;
      SoundEngine.chop();
      setHint('Chopping… watch the ring, then pick it up.');
    } else if (game.held) {
      SoundEngine.error();
      setHint('That does not need chopping. The board takes veggies and chicken.');
    }
    return;
  }
  if (slot.state === 'ready') {
    if (game.held) { SoundEngine.error(); setHint('Hands full!'); return; }
    const got = slotTake(slot);
    game.held = { type: 'component', kind: got };
    SoundEngine.pickup();
    setHint(COMPONENTS[got].name + ' ready. Plate it or grill it onward.');
  }
}

function clickStoveBurner(i) {
  const burner = LAYOUT.stoveBurners[i];
  const slot = game.stove[i];
  game.chef.targetX = burner.x;
  if (slot.state === 'burnt') {
    game.stove[i] = emptySlot();
    SoundEngine.drop();
    addFloat(burner.x, burner.y - 40, 'tossed', '#c0392b', 14);
    setHint('Burnt food tossed. Keep an eye on the stove!');
    return;
  }
  if (!slot.item) {
    if (game.held && game.held.type === 'ingredient' && INGREDIENTS[game.held.kind].cook === 'stove') {
      const ing = INGREDIENTS[game.held.kind];
      slotStart(slot, game.held.kind, ing.cookSecs, cookResult(game.held.kind), 6);
      game.held = null;
      SoundEngine.sizzle();
      setHint('Cooking on the stove — grab it before it burns!');
    } else if (game.held) {
      SoundEngine.error();
      setHint('The stove fries rice, noodles and egg.');
    }
    return;
  }
  if (slot.state === 'ready') {
    if (game.held) { SoundEngine.error(); setHint('Hands full!'); return; }
    const got = slotTake(slot);
    game.held = { type: 'component', kind: got };
    SoundEngine.pickup();
    setHint(COMPONENTS[got].name + ' ready. Build it onto a plate.');
  }
}

function clickGrill() {
  const g = LAYOUT.grillSlot;
  const slot = game.grill;
  game.chef.targetX = g.x;
  if (slot.state === 'burnt') {
    game.grill = emptySlot();
    SoundEngine.drop();
    addFloat(g.x, g.y - 40, 'tossed', '#c0392b', 14);
    setHint('Burnt food tossed. The grill forgives no one.');
    return;
  }
  if (!slot.item) {
    if (game.held && game.held.type === 'component' && game.held.kind === 'chopped-chicken') {
      slotStart(slot, 'chopped-chicken', 4, 'grilled-chicken', 7);
      game.held = null;
      SoundEngine.sizzle();
      setHint('Grilling the chicken — 4 seconds to golden.');
    } else if (game.held) {
      SoundEngine.error();
      setHint('The grill only takes chopped chicken.');
    }
    return;
  }
  if (slot.state === 'ready') {
    if (game.held) { SoundEngine.error(); setHint('Hands full!'); return; }
    const got = slotTake(slot);
    game.held = { type: 'component', kind: got };
    SoundEngine.pickup();
    setHint('Grilled Chicken ready. Plate it!');
  }
}

function clickPlate(i) {
  const slot = LAYOUT.plateSlots[i];
  const plate = game.plates[i];
  game.chef.targetX = slot.x;
  if (game.held && game.held.type === 'plate') return;
  if (game.held && (game.held.type === 'ingredient' || game.held.type === 'component')) {
    const kind = game.held.kind;
    let comp = null;
    if (game.held.type === 'component') comp = kind;
    else if (kind === 'sauce') comp = 'peanut-sauce';
    else {
      SoundEngine.error();
      setHint('That needs cooking first — chop it, fry it or grill it.');
      return;
    }
    if (plate.components.length >= 3) { SoundEngine.error(); setHint('This plate is full.'); return; }
    if (!componentFitsPlate(plate, comp)) {
      SoundEngine.error();
      setHint(COMPONENTS[comp].name + ' does not belong on this plate.');
      return;
    }
    plate.components.push(comp);
    game.held = null;
    SoundEngine.drop();
    const done = RECIPES.find((r) => plateMatchesRecipe(plate, r));
    if (done) {
      setHint(done.name + ' is complete! Carry the plate to the serve window.');
      SoundEngine.ready();
    } else {
      setHint(COMPONENTS[comp].name + ' added. Keep building the dish.');
    }
    return;
  }
  if (!game.held && plate.components.length > 0) {
    game.held = { type: 'plate', plate: plate };
    game.plates[i] = emptyPlate();
    SoundEngine.pickup();
    setHint('Plate picked up. Serve it at the window — or trash it to start over.');
  }
}

function clickServeWindow() {
  const s = LAYOUT.serve;
  game.chef.targetX = s.x + s.w / 2;
  if (!game.held || game.held.type !== 'plate') {
    if (game.held) { SoundEngine.error(); setHint('Only a finished plate goes out the window.'); }
    return;
  }
  const plate = game.held.plate;
  const order = findMatchingOrder(game.orders, plate);
  if (!order) {
    SoundEngine.error();
    game.combo = 0;
    game.shake = 6;
    setHint('No order wants this dish. Check the order board!');
    return;
  }
  const pay = servePayout(order);
  order.state = 'served';
  game.orders = game.orders.filter((o) => o !== order);
  game.coins += pay.coins;
  game.served += 1;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.bellT = 0.6;
  game.held = null;
  SoundEngine.serve();
  SoundEngine.coin();
  addFloat(s.x + s.w / 2, s.y - 10, '+$' + pay.coins + (pay.tip > 0 ? ' (tip $' + pay.tip + ')' : ''), '#2e9e43', 20);
  setHint(order.name + ' loved the ' + recipeById(order.recipeId).name + '! +$' + pay.coins + '.');
}

function clickTrash() {
  const t = LAYOUT.trash;
  game.chef.targetX = t.x + t.w / 2;
  if (!game.held) return;
  if (game.held.type === 'plate') {
    game.held.plate.components = [];
    SoundEngine.drop();
    setHint('Plate cleared. Build it again.');
  } else {
    game.held = null;
    SoundEngine.drop();
    setHint('Tossed. Grab something fresh.');
  }
}

function clickTopBar(x, y) {
  if (x >= 1150 && x <= 1202 && y >= 12 && y <= 44) { togglePause(); return true; }
  if (x >= 1210 && x <= 1262 && y >= 12 && y <= 44) {
    SoundEngine.ensure();
    const muted = SoundEngine.toggleMute();
    setHint(muted ? 'Sound off.' : 'Sound on.');
    return true;
  }
  return false;
}

function handleClick(x, y) {
  if (game.screen === 'title') {
    if (x >= 510 && x <= 770 && y >= 466 && y <= 534) startShift();
    return;
  }
  if (game.screen === 'over') {
    if (x >= 510 && x <= 770 && y >= 540 && y <= 584) startShift();
    return;
  }
  if (game.screen === 'paused') {
    togglePause();
    return;
  }
  if (clickTopBar(x, y)) return;
  // pantry bins
  for (const bin of LAYOUT.pantryBins) {
    if (hitRect(x, y, { x: bin.x - 52, y: bin.y - 46, w: 104, h: 100 })) { clickPantry(bin); return; }
  }
  if (hitRect(x, y, LAYOUT.chopBoard)) { clickBoard(); return; }
  for (let i = 0; i < 2; i++) {
    const b = LAYOUT.stoveBurners[i];
    if (hitCircle(x, y, b.x, b.y, 52)) { clickStoveBurner(i); return; }
  }
  if (hitRect(x, y, LAYOUT.grill)) { clickGrill(); return; }
  for (let i = 0; i < 2; i++) {
    const s = LAYOUT.plateSlots[i];
    if (hitCircle(x, y, s.x, s.y, 92)) { clickPlate(i); return; }
  }
  if (hitRect(x, y, LAYOUT.serve)) { clickServeWindow(); return; }
  if (hitRect(x, y, LAYOUT.trash)) { clickTrash(); return; }
}

function handleKey(key) {
  if (key === 'Enter') {
    if (game.screen === 'title' || game.screen === 'over') startShift();
    return;
  }
  if (key === 'm' || key === 'M') {
    SoundEngine.ensure();
    SoundEngine.toggleMute();
    return;
  }
  if (key === 'p' || key === 'P') {
    if (game.screen === 'playing' || game.screen === 'paused') togglePause();
    return;
  }
  if (game.screen !== 'playing') return;
  const pantryKeys = ['1', '2', '3', '4', '5', '6'];
  const idx = pantryKeys.indexOf(key);
  if (idx !== -1) { clickPantry(LAYOUT.pantryBins[idx]); return; }
  if (key === 't' || key === 'T') clickTrash();
}

// ---- main loop ----------------------------------------------------------

function tick(dt) {
  if (game.screen !== 'playing') return;
  game.elapsed += dt;
  game.timeLeft = Math.max(0, game.shiftSecs - game.elapsed);
  game.difficulty = Math.floor(game.elapsed / 45);
  const sec = Math.floor(game.timeLeft);
  if (sec !== game.lastTickSecond) {
    game.lastTickSecond = sec;
    if (sec <= 10 && sec > 0) SoundEngine.tick();
  }
  // spawn orders
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    if (waitingOrders(game.orders).length < ORDER_BOARD.maxOrders) {
      const order = makeOrder(game.rng, game.difficulty);
      game.orders.push(order);
      setHint(order.name + ' ordered ' + recipeById(order.recipeId).name + '!');
    }
    game.spawnTimer = spawnIntervalSecs(game.difficulty);
  }
  const lost = tickOrders(game.orders, dt);
  lost.forEach((o) => {
    game.lost += 1;
    game.combo = 0;
    SoundEngine.error();
  });
  // angry orders fade off the board after a moment
  game.orders = game.orders.filter((o) => !(o.state === 'angry' && o.patience <= -3));
  game.orders.forEach((o) => { if (o.state === 'angry') o.patience -= dt; });
  slotTick(game.board, dt);
  game.stove.forEach((s) => slotTick(s, dt));
  slotTick(game.grill, dt);
  if (game.bellT > 0) game.bellT -= dt;
  // chef walks toward the target station
  const dx = game.chef.targetX - game.chef.x;
  if (Math.abs(dx) > 2) game.chef.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 520);
  game.floats.forEach((f) => { f.life -= dt; });
  game.floats = game.floats.filter((f) => f.life > 0);
  if (game.timeLeft <= 0) endShift();
}

function frame(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000 || 0);
  lastNow = now;
  tick(dt);
  ctx.clearRect(0, 0, LAYOUT.w, LAYOUT.h);
  drawScene(ctx, game, now / 1000);
  requestAnimationFrame(frame);
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / LAYOUT.w, window.innerHeight / LAYOUT.h);
  canvas.style.width = Math.floor(LAYOUT.w * scale) + 'px';
  canvas.style.height = Math.floor(LAYOUT.h * scale) + 'px';
}

function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (LAYOUT.w / rect.width),
    y: (evt.clientY - rect.top) * (LAYOUT.h / rect.height),
  };
}

// ---- staged screenshots -------------------------------------------------
// ?shot=start | play | rush | end builds a fixed, readable game state so
// the screenshots show the kitchen at its best. Same code, seeded state.

function seedShot(kind, seed) {
  const rng = mulberry32(seed || 1);
  startShift();
  game.rng = rng;
  if (kind === 'start') {
    game.screen = 'title';
    return;
  }
  if (kind === 'end') {
    game.screen = 'playing';
    game.coins = 128;
    game.served = 9;
    game.lost = 2;
    game.bestCombo = 6;
    game.combo = 6;
    game.timeLeft = 0;
    game.elapsed = game.shiftSecs;
    endShift();
    setHint('Shift over — see how you did!');
    return;
  }
  // playing shots: a busy kitchen, three orders, food mid-prep.
  game.screen = 'playing';
  game.timeLeft = kind === 'rush' ? 42 : 133;
  game.elapsed = game.shiftSecs - game.timeLeft;
  game.coins = kind === 'rush' ? 86 : 47;
  game.combo = kind === 'rush' ? 5 : 3;
  game.bestCombo = game.combo;
  game.served = kind === 'rush' ? 7 : 4;
  game.orders = [makeOrder(rng, 1), makeOrder(rng, 1), makeOrder(rng, 1)];
  game.orders[0].patience = kind === 'rush' ? 4 : game.orders[0].patienceMax * 0.6;
  game.orders[1].patience = game.orders[1].patienceMax * 0.45;
  game.orders[2].patience = game.orders[2].patienceMax * 0.8;
  // a dish mid-assembly on plate 1, a finished plate on plate 2
  game.plates[0].components = ['fried-rice'];
  const done = recipeById(game.orders[1].recipeId);
  game.plates[1].components = done.needs.slice();
  // stove frying, grill working, board chopping
  slotStart(game.stove[0], 'noodles', 3, 'cooked-noodles', 6);
  game.stove[0].t = 1.8;
  slotStart(game.grill, 'chopped-chicken', 4, 'grilled-chicken', 7);
  game.grill.t = 2.5;
  slotStart(game.board, 'veggies', 2, 'chopped-veggies', 0);
  game.board.t = 1.2;
  game.chef.x = 1050;
  game.chef.targetX = 1050;
  game.held = null;
  setHint(kind === 'rush' ? 'RUSH HOUR! Two orders are almost out of patience!' : 'Mid-shift: orders flowing, stove hot, plates filling.');
  SoundEngine.stopMusic();
}

function boot() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  canvas.width = LAYOUT.w;
  canvas.height = LAYOUT.h;
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  canvas.addEventListener('click', (evt) => {
    const p = canvasPos(evt);
    handleClick(p.x, p.y);
  });
  window.addEventListener('keydown', (evt) => handleKey(evt.key));
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) {
    seedShot(shot, Number(params.get('seed') || 1));
  } else {
    // first order arrives quickly so the board never looks empty
    game.orders.push(makeOrder(Math.random, 0));
  }
  window.__game = game;
  requestAnimationFrame(frame);
}

document.addEventListener('DOMContentLoaded', boot);
