// kitchen.js — every pixel of Sizzle & Serve is drawn here with canvas
// vector shapes: the kitchen, the stations, the chef, the customers, the
// food icons and the title / pause / game-over screens. No image files.

const LAYOUT = {
  w: 1280, h: 720,
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 16, y: 64, w: 1248, h: 104 },
  pantry: { x: 16, y: 196, w: 224, h: 360 },
  chopBoard: { x: 272, y: 196, w: 208, h: 124 },
  stove: { x: 512, y: 196, w: 248, h: 124 },
  grill: { x: 792, y: 196, w: 208, h: 124 },
  trash: { x: 1032, y: 196, w: 96, h: 76 },
  serve: { x: 1032, y: 288, w: 232, h: 184 },
  plates: { x: 272, y: 400, w: 728, h: 160 },
  hint: { x: 16, y: 664, w: 1248, h: 44 },
  plateSlots: [
    { x: 352, y: 480 }, { x: 640, y: 480 },
  ],
  pantryBins: [
    { kind: 'rice', x: 68, y: 252 }, { kind: 'noodles', x: 180, y: 252 },
    { kind: 'egg', x: 68, y: 372 }, { kind: 'chicken', x: 180, y: 372 },
    { kind: 'veggies', x: 68, y: 492 }, { kind: 'sauce', x: 180, y: 492 },
  ],
  stoveBurners: [{ x: 576, y: 258 }, { x: 696, y: 258 }],
  grillSlot: { x: 896, y: 258 },
  chefY: 622,
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.fillStyle = color || '#3d2b1f';
  ctx.font = (weight || '700') + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// ---- food icons -------------------------------------------------------
// kind is a raw ingredient key or a finished component id.
function drawIngredientIcon(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 2;
  if (kind === 'rice' || kind === 'fried-rice') {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath(); ctx.ellipse(0, u * 0.25, u, u * 0.55, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f5f0dc';
    ctx.beginPath(); ctx.ellipse(0, -u * 0.1, u * 0.85, u * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = kind === 'fried-rice' ? '#e8873a' : '#d9cfae';
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * u * 0.4, -u * 0.25, u * 0.12, 0, Math.PI * 2); ctx.fill(); }
  } else if (kind === 'noodles' || kind === 'cooked-noodles') {
    ctx.strokeStyle = '#f2c14e'; ctx.lineWidth = u * 0.22; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-u * 0.8, i * u * 0.45);
      ctx.bezierCurveTo(-u * 0.3, i * u * 0.45 - u * 0.5, u * 0.3, i * u * 0.45 + u * 0.5, u * 0.8, i * u * 0.45);
      ctx.stroke();
    }
  } else if (kind === 'egg' || kind === 'fried-egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(0, 0, u * 0.95, u * 0.75, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6a821';
    ctx.beginPath(); ctx.arc(u * 0.1, 0, u * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath(); ctx.arc(u * 0.02, -u * 0.08, u * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'chicken' || kind === 'chopped-chicken') {
    ctx.fillStyle = kind === 'chopped-chicken' ? '#f2b8a0' : '#e8a87c';
    ctx.beginPath(); ctx.ellipse(-u * 0.1, u * 0.1, u * 0.7, u * 0.55, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = u * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(u * 0.45, -u * 0.35); ctx.lineTo(u * 0.85, -u * 0.75); ctx.stroke();
    ctx.fillStyle = '#f5f0dc';
    ctx.beginPath(); ctx.arc(u * 0.9, -u * 0.8, u * 0.2, 0, Math.PI * 2); ctx.fill();
    if (kind === 'chicken') {
      ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = u * 0.12;
      ctx.beginPath(); ctx.moveTo(-u * 0.5, -u * 0.1); ctx.lineTo(u * 0.2, u * 0.3); ctx.stroke();
    }
  } else if (kind === 'grilled-chicken') {
    ctx.fillStyle = '#b06a35';
    ctx.beginPath(); ctx.ellipse(-u * 0.1, u * 0.1, u * 0.7, u * 0.55, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a3f16'; ctx.lineWidth = u * 0.14;
    ctx.beginPath(); ctx.moveTo(-u * 0.55, -u * 0.15); ctx.lineTo(u * 0.15, u * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-u * 0.35, -u * 0.35); ctx.lineTo(u * 0.35, u * 0.15); ctx.stroke();
    ctx.strokeStyle = '#f5f0dc'; ctx.lineWidth = u * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(u * 0.45, -u * 0.35); ctx.lineTo(u * 0.85, -u * 0.75); ctx.stroke();
    ctx.fillStyle = '#f5f0dc';
    ctx.beginPath(); ctx.arc(u * 0.9, -u * 0.8, u * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'veggies' || kind === 'chopped-veggies') {
    ctx.fillStyle = '#5da24a';
    ctx.beginPath(); ctx.arc(-u * 0.35, -u * 0.15, u * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.35, -u * 0.2, u * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, u * 0.25, u * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7bc96f';
    ctx.beginPath(); ctx.arc(-u * 0.35, -u * 0.25, u * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(u * 0.3, -u * 0.3, u * 0.2, 0, Math.PI * 2); ctx.fill();
    if (kind === 'chopped-veggies') {
      ctx.fillStyle = '#e8873a';
      ctx.fillRect(-u * 0.6, u * 0.45, u * 0.35, u * 0.35);
      ctx.fillRect(u * 0.3, u * 0.5, u * 0.35, u * 0.35);
    }
  } else if (kind === 'sauce' || kind === 'peanut-sauce') {
    ctx.fillStyle = '#a9713f';
    roundRect(ctx, -u * 0.45, -u * 0.3, u * 0.9, u * 1.1, u * 0.25); ctx.fill();
    ctx.fillStyle = '#7a4a22';
    ctx.fillRect(-u * 0.25, -u * 0.75, u * 0.5, u * 0.5);
    ctx.fillStyle = '#e8c98a';
    ctx.fillRect(-u * 0.45, -u * 0.05, u * 0.9, u * 0.4);
  }
  ctx.restore();
}

function drawPlateIcon(ctx, plate, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9cfae'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.72, s * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
  if (plate && plate.components.length) {
    const n = plate.components.length;
    plate.components.forEach((c, i) => {
      const ox = n === 1 ? 0 : (i === 0 ? -s * 0.32 : s * 0.32);
      drawIngredientIcon(ctx, c, ox, -s * 0.05, s * 0.85);
    });
  }
  ctx.restore();
}

function drawCustomerFace(ctx, color, x, y, r) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3d2b1f';
  ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d2b1f'; ctx.lineWidth = Math.max(2, r * 0.09); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y + r * 0.15, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
}

// ---- stations ---------------------------------------------------------

function progressRing(ctx, x, y, r, frac, color) {
  ctx.strokeStyle = 'rgba(61,43,31,0.25)'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color || '#e8873a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

function drawSmoke(ctx, x, y, t) {
  ctx.fillStyle = 'rgba(120,120,120,' + (0.55 - (t % 1) * 0.4) + ')';
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i / 3) % 1;
    ctx.beginPath();
    ctx.arc(x + Math.sin(p * 9 + i) * 8, y - p * 34, 5 + p * 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlotItem(ctx, slot, x, y, now) {
  if (!slot || !slot.item) return;
  if (slot.state === 'burnt') {
    ctx.fillStyle = '#3a3230';
    ctx.beginPath(); ctx.ellipse(x, y, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    drawSmoke(ctx, x, y - 8, now);
    text(ctx, 'BURNT!', x, y - 34, 13, '#c0392b', 'center');
    return;
  }
  const showKind = slot.state === 'ready' ? slot.result : slot.item;
  drawIngredientIcon(ctx, showKind, x, y, 52);
  if (slot.state === 'working') {
    progressRing(ctx, x, y, 34, Math.min(1, slot.t / slot.dur), '#e8873a');
  } else if (slot.state === 'ready') {
    const pulse = 0.6 + 0.4 * Math.sin(now * 6);
    ctx.strokeStyle = 'rgba(46,160,67,' + pulse + ')'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, 38, 0, Math.PI * 2); ctx.stroke();
    // one status line under the item: the burn countdown on hot stations
    // (the green ring already says ready), plain READY on the board.
    if (slot.burnIn) {
      const left = Math.max(0, slot.burnIn - slot.burnT);
      text(ctx, 'burns in ' + Math.ceil(left) + 's', x, y + 52, 12, '#c0392b', 'center');
    } else {
      text(ctx, 'READY', x, y + 52, 12, '#2e9e43', 'center');
    }
  }
}

// ---- scene ------------------------------------------------------------

function drawTopBar(ctx, g) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, 'SIZZLE & SERVE', 20, 29, 24, '#ffd97a', 'left', '900');
  text(ctx, 'Dapur Kilat', 218, 30, 13, '#f7ead7', 'left', '400');
  // coins
  ctx.fillStyle = '#f6a821';
  ctx.beginPath(); ctx.arc(400, 28, 13, 0, Math.PI * 2); ctx.fill();
  text(ctx, '$', 400, 29, 15, '#3d2b1f', 'center', '900');
  text(ctx, String(g.coins), 420, 29, 22, '#ffffff', 'left', '900');
  text(ctx, 'served ' + g.served, 500, 29, 14, '#f7ead7', 'left');
  // shift timer
  const tw = 300, tx = 640;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, tx, 18, tw, 20, 10); ctx.fill();
  const frac = Math.max(0, g.timeLeft / g.shiftSecs);
  ctx.fillStyle = frac < 0.25 ? '#e74c3c' : '#7bc96f';
  roundRect(ctx, tx, 18, tw * frac, 20, 10); ctx.fill();
  const mm = Math.floor(g.timeLeft / 60), ss = Math.floor(g.timeLeft % 60);
  text(ctx, 'SHIFT ' + mm + ':' + String(ss).padStart(2, '0'), tx + tw / 2, 29, 13, '#ffffff', 'center', '900');
  // combo and rush hour share the right side of the top bar: stack them
  // when both are live so they never print on top of each other.
  const twoLines = g.combo >= 2 && g.difficulty >= 2;
  if (g.combo >= 2) {
    text(ctx, 'COMBO x' + g.combo, 990, twoLines ? 20 : 29, 18, '#ff9f43', 'left', '900');
  }
  if (g.difficulty >= 2) {
    text(ctx, 'RUSH HOUR!', 990, twoLines ? 42 : 29, 16, '#ff6b6b', 'left', '900');
  }
  // pause + mute buttons
  ctx.fillStyle = '#5a4232';
  roundRect(ctx, 1150, 12, 52, 32, 8); ctx.fill();
  text(ctx, g.screen === 'paused' ? '▶' : 'II', 1176, 29, 15, '#ffffff', 'center');
  ctx.fillStyle = '#5a4232';
  roundRect(ctx, 1210, 12, 52, 32, 8); ctx.fill();
  text(ctx, SoundEngine.muted ? 'MUTE' : 'SOUND', 1236, 29, 11, '#ffffff', 'center');
}

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const urgent = order.patience / order.patienceMax < 0.3;
  ctx.fillStyle = order.state === 'angry' ? '#e8c9c0' : '#fff8e7';
  roundRect(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = urgent ? '#c0392b' : '#d9cfae'; ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 12); ctx.stroke();
  drawCustomerFace(ctx, order.face, x + 34, y + 30, 22);
  text(ctx, order.name, x + 62, y + 20, 14, '#3d2b1f', 'left', '900');
  text(ctx, recipe.name + '  ·  $' + recipe.price, x + 62, y + 42, 15, '#3d2b1f', 'left', '900');
  // component chips: what the dish needs
  let cx = x + 62;
  recipe.needs.forEach((c) => {
    ctx.fillStyle = '#f7ead7';
    roundRect(ctx, cx, y + 58, 118, 26, 8); ctx.fill();
    drawIngredientIcon(ctx, c, cx + 16, y + 71, 20);
    text(ctx, COMPONENTS[c].name, cx + 30, y + 72, 11, '#3d2b1f', 'left');
    cx += 124;
  });
  // patience bar
  const bw = w - 24, bx = x + 12, by = y + h - 12;
  ctx.fillStyle = 'rgba(61,43,31,0.2)';
  roundRect(ctx, bx, by, bw, 7, 3); ctx.fill();
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.fillStyle = urgent ? '#c0392b' : (frac < 0.6 ? '#e8873a' : '#2e9e43');
  roundRect(ctx, bx, by, bw * frac, 7, 3); ctx.fill();
}

function drawOrderBoard(ctx, g) {
  const b = LAYOUT.board;
  const orders = g.orders;
  for (let i = 0; i < ORDER_BOARD.maxOrders; i++) {
    const x = b.x + i * 424, y = b.y, w = 400, h = 104;
    const order = orders[i];
    if (!order) {
      ctx.fillStyle = 'rgba(61,43,31,0.08)';
      roundRect(ctx, x, y, w, h, 12); ctx.fill();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(61,43,31,0.25)'; ctx.lineWidth = 2;
      roundRect(ctx, x, y, w, h, 12); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for a customer…', x + w / 2, y + h / 2, 14, 'rgba(61,43,31,0.45)', 'center', '400');
    } else if (order.state === 'angry') {
      ctx.fillStyle = '#e8c9c0';
      roundRect(ctx, x, y, w, h, 12); ctx.fill();
      drawCustomerFace(ctx, order.face, x + 34, y + 30, 22);
      text(ctx, order.name + ' walked out!', x + 62, y + 40, 16, '#7a2a1a', 'left', '900');
      text(ctx, 'too slow — combo lost', x + 62, y + 64, 13, '#7a2a1a', 'left');
    } else {
      drawOrderTicket(ctx, order, x, y, w, h);
    }
  }
}

function drawPantry(ctx, g) {
  const p = LAYOUT.pantry;
  ctx.fillStyle = '#8a5a33';
  roundRect(ctx, p.x, p.y, p.w, p.h, 14); ctx.fill();
  text(ctx, 'PANTRY', p.x + 14, p.y + 18, 14, '#ffd97a', 'left', '900');
  LAYOUT.pantryBins.forEach((bin) => {
    const ing = INGREDIENTS[bin.kind];
    const held = g.held && g.held.type === 'ingredient' && g.held.kind === bin.kind;
    ctx.fillStyle = held ? '#ffe9b0' : '#f7ead7';
    roundRect(ctx, bin.x - 52, bin.y - 46, 104, 100, 10); ctx.fill();
    ctx.strokeStyle = held ? '#e8873a' : '#d9cfae'; ctx.lineWidth = held ? 4 : 2;
    roundRect(ctx, bin.x - 52, bin.y - 46, 104, 100, 10); ctx.stroke();
    drawIngredientIcon(ctx, bin.kind, bin.x, bin.y - 12, 52);
    text(ctx, ing.name, bin.x, bin.y + 30, 13, '#3d2b1f', 'center', '900');
    text(ctx, stationFor(bin.kind) === 'plate' ? 'ready to plate' : '→ ' + stationFor(bin.kind), bin.x, bin.y + 46, 10, '#8a6d4b', 'center');
  });
}

function drawChopBoard(ctx, g, now) {
  const b = LAYOUT.chopBoard;
  ctx.fillStyle = '#c89b6a';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'CHOPPING BOARD', b.x + 12, b.y + 16, 13, '#fff8e7', 'left', '900');
  // knife
  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.x + 168, b.y + 30); ctx.lineTo(b.x + 196, b.y + 58); ctx.stroke();
  ctx.strokeStyle = '#5a4232'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(b.x + 196, b.y + 58); ctx.lineTo(b.x + 206, b.y + 68); ctx.stroke();
  drawSlotItem(ctx, g.board, b.x + b.w / 2 - 20, b.y + 76, now);
  if (!g.board.item) text(ctx, 'click a veggie or chicken, then here', b.x + b.w / 2, b.y + 96, 11, 'rgba(61,43,31,0.55)', 'center', '400');
}

function drawStove(ctx, g, now) {
  const b = LAYOUT.stove;
  ctx.fillStyle = '#5a4232';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'STOVE', b.x + 12, b.y + 16, 13, '#ffd97a', 'left', '900');
  LAYOUT.stoveBurners.forEach((burner, i) => {
    const slot = g.stove[i];
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath(); ctx.ellipse(burner.x, burner.y, 46, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4a2f';
    ctx.beginPath(); ctx.ellipse(burner.x, burner.y, 36, 22, 0, 0, Math.PI * 2); ctx.fill();
    if (slot.state === 'working') {
      ctx.fillStyle = 'rgba(255,140,40,' + (0.35 + 0.25 * Math.sin(now * 10)) + ')';
      ctx.beginPath(); ctx.ellipse(burner.x, burner.y + 6, 30, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawSlotItem(ctx, slot, burner.x, burner.y - 6, now);
  });
  if (!g.stove[0].item && !g.stove[1].item) text(ctx, 'fry rice, noodles & egg', b.x + b.w / 2, b.y + 106, 11, 'rgba(255,255,255,0.5)', 'center', '400');
}

function drawGrill(ctx, g, now) {
  const b = LAYOUT.grill;
  ctx.fillStyle = '#4a4a52';
  roundRect(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
  text(ctx, 'GRILL', b.x + 12, b.y + 16, 13, '#ffd97a', 'left', '900');
  const s = LAYOUT.grillSlot;
  ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(s.x - 44, s.y + i * 10); ctx.lineTo(s.x + 44, s.y + i * 10); ctx.stroke();
  }
  if (g.grill.state === 'working') {
    ctx.fillStyle = 'rgba(255,120,40,' + (0.3 + 0.25 * Math.sin(now * 9)) + ')';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 14, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawSlotItem(ctx, g.grill, s.x, s.y - 4, now);
  if (!g.grill.item) text(ctx, 'grill chopped chicken', b.x + b.w / 2, b.y + 106, 11, 'rgba(255,255,255,0.5)', 'center', '400');
}

function drawTrash(ctx, g) {
  const t = LAYOUT.trash;
  ctx.fillStyle = '#6b7280';
  roundRect(ctx, t.x, t.y, t.w, t.h, 10); ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.fillRect(t.x + 14, t.y + 10, t.w - 28, 8);
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + 40, 13, '#ffffff', 'center', '900');
  text(ctx, 'click to toss', t.x + t.w / 2, t.y + 58, 10, '#e5e7eb', 'center', '400');
}

function drawServeWindow(ctx, g, now) {
  const s = LAYOUT.serve;
  ctx.fillStyle = '#8a5a33';
  roundRect(ctx, s.x, s.y, s.w, s.h, 12); ctx.fill();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, s.x + 10, s.y + 10, s.w - 20, s.h - 20, 8); ctx.fill();
  text(ctx, 'SERVE WINDOW', s.x + s.w / 2, s.y + 28, 14, '#3d2b1f', 'center', '900');
  // bell
  const ring = g.bellT > 0 ? Math.sin(g.bellT * 30) * 3 : 0;
  ctx.save();
  ctx.translate(s.x + s.w / 2 + ring, s.y + 78);
  ctx.fillStyle = '#f6a821';
  ctx.beginPath(); ctx.arc(0, 0, 26, Math.PI, 0); ctx.fill();
  ctx.fillRect(-26, 0, 52, 6);
  ctx.fillStyle = '#3d2b1f';
  ctx.beginPath(); ctx.arc(0, 12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text(ctx, 'bring a finished plate here', s.x + s.w / 2, s.y + 128, 12, '#8a6d4b', 'center', '400');
  text(ctx, 'oldest matching order is served first', s.x + s.w / 2, s.y + 150, 11, '#8a6d4b', 'center', '400');
}

function drawPlating(ctx, g) {
  const p = LAYOUT.plates;
  ctx.fillStyle = '#b07d4f';
  roundRect(ctx, p.x, p.y, p.w, p.h, 14); ctx.fill();
  text(ctx, 'PLATING COUNTER', p.x + 14, p.y + 18, 14, '#ffd97a', 'left', '900');
  LAYOUT.plateSlots.forEach((slot, i) => {
    const plate = g.plates[i];
    const done = plate.components.length > 0 && RECIPES.some((r) => plateMatchesRecipe(plate, r));
    ctx.fillStyle = done ? '#e8f5d8' : '#f7ead7';
    ctx.beginPath(); ctx.ellipse(slot.x, slot.y, 92, 52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = done ? '#2e9e43' : '#d9cfae'; ctx.lineWidth = done ? 4 : 2;
    ctx.beginPath(); ctx.ellipse(slot.x, slot.y, 92, 52, 0, 0, Math.PI * 2); ctx.stroke();
    drawPlateIcon(ctx, plate, slot.x, slot.y, 62);
    if (done) {
      const recipe = RECIPES.find((r) => plateMatchesRecipe(plate, r));
      text(ctx, recipe.name + ' — READY!', slot.x, slot.y + 68, 13, '#2e7d32', 'center', '900');
    } else if (plate.components.length === 0) {
      text(ctx, 'empty plate', slot.x, slot.y + 68, 11, '#3d2b1f', 'center', '400');
    } else {
      // show what this plate still needs for the closest recipe
      let best = null;
      RECIPES.forEach((r) => {
        if (plate.components.every((c) => r.needs.includes(c))) {
          const missing = r.needs.filter((c) => !plate.components.includes(c));
          if (!best || missing.length < best.missing.length) best = { recipe: r, missing: missing };
        }
      });
      const label = best && best.missing.length
        ? 'needs: ' + best.missing.map((c) => COMPONENTS[c].name).join(' + ')
        : 'not a recipe — trash it';
      text(ctx, label, slot.x, slot.y + 68, 11, '#3d2b1f', 'center', '400');
    }
  });
}

function drawChef(ctx, g, now) {
  const x = g.chef.x, y = LAYOUT.chefY;
  const bob = Math.abs(Math.sin(now * 6)) * (Math.abs(g.chef.targetX - x) > 4 ? 3 : 0);
  ctx.save();
  ctx.translate(x, y - bob);
  // body / apron
  ctx.fillStyle = '#2e9e43';
  roundRect(ctx, -22, -34, 44, 44, 10); ctx.fill();
  ctx.fillStyle = '#f7ead7';
  roundRect(ctx, -14, -30, 28, 30, 6); ctx.fill();
  // head
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath(); ctx.arc(0, -48, 18, 0, Math.PI * 2); ctx.fill();
  // chef hat
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-10, -62, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -66, 12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -62, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-16, -64, 32, 8);
  // face
  ctx.fillStyle = '#3d2b1f';
  ctx.beginPath(); ctx.arc(-6, -50, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -50, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3d2b1f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, -44, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // held item above head
  if (g.held) {
    if (g.held.type === 'plate') {
      drawPlateIcon(ctx, g.held.plate, 0, -96, 40);
    } else if (g.held.type === 'burnt') {
      ctx.fillStyle = '#3a3230';
      ctx.beginPath(); ctx.ellipse(0, -96, 18, 12, 0, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'burnt', 0, -122, 11, '#c0392b', 'center');
    } else {
      drawIngredientIcon(ctx, g.held.kind, 0, -96, 44);
    }
  }
  ctx.restore();
}

function drawFloats(ctx, g) {
  g.floats.forEach((f) => {
    const alpha = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y - (1 - alpha) * 30, f.size || 18, f.color || '#2e9e43', 'center', '900');
    ctx.globalAlpha = 1;
  });
}

function drawHintBar(ctx, g) {
  const h = LAYOUT.hint;
  ctx.fillStyle = 'rgba(61,43,31,0.85)';
  roundRect(ctx, h.x, h.y, h.w, h.h, 10); ctx.fill();
  text(ctx, g.hint, h.x + 16, h.y + 22, 14, '#f7ead7', 'left', '400');
  text(ctx, 'click stations to cook  ·  1-6 pantry  ·  T trash  ·  P pause  ·  M sound', h.x + h.w - 16, h.y + 22, 12, '#ffd97a', 'right', '400');
}

// ---- screens ----------------------------------------------------------

function drawTitleScreen(ctx, g, now) {
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(0, 0, LAYOUT.w, LAYOUT.h);
  // warm kitchen backdrop: tiles + counter
  ctx.fillStyle = '#e8cfa8';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(i * 80, 0, 78, 180);
    ctx.fillStyle = i % 2 ? '#e8cfa8' : '#efd9b4';
  }
  ctx.fillStyle = '#b07d4f';
  ctx.fillRect(0, 520, LAYOUT.w, 200);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 520, LAYOUT.w, 14);
  // dishes on the counter, clear of the how-to box and the start button
  drawPlateIcon(ctx, { components: ['fried-rice', 'fried-egg'] }, 280, 500, 70);
  drawPlateIcon(ctx, { components: ['chopped-veggies', 'peanut-sauce'] }, 1000, 500, 70);
  text(ctx, 'SIZZLE & SERVE', 640, 150, 72, '#3d2b1f', 'center', '900');
  text(ctx, 'DAPUR KILAT', 640, 205, 26, '#c0392b', 'center', '900');
  text(ctx, 'A tiny kitchen. A big rush. Cook every order before patience runs out!', 640, 260, 20, '#5a4232', 'center', '400');
  // how to play
  const steps = [
    '1  Grab ingredients from the pantry',
    '2  Chop, fry and grill them at the stations',
    '3  Build each dish on a plate, exactly as ordered',
    '4  Serve at the window — fast service earns tips!',
  ];
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 290, 600, 150, 14); ctx.fill();
  steps.forEach((s, i) => text(ctx, s, 640, 316 + i * 32, 17, '#3d2b1f', 'center', '400'));
  // start button
  const pulse = 1 + 0.03 * Math.sin(now * 4);
  ctx.save();
  ctx.translate(640, 500);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#2e9e43';
  roundRect(ctx, -130, -34, 260, 68, 16); ctx.fill();
  ctx.strokeStyle = '#1d6b2d'; ctx.lineWidth = 3;
  roundRect(ctx, -130, -34, 260, 68, 16); ctx.stroke();
  text(ctx, '▶  START SHIFT', 0, 2, 26, '#ffffff', 'center', '900');
  ctx.restore();
  text(ctx, '3-minute shift  ·  5 dishes  ·  mouse + keys 1-6', 640, 580, 14, '#8a6d4b', 'center', '400');
}

function drawPauseScreen(ctx, g) {
  ctx.fillStyle = 'rgba(30,20,12,0.55)';
  ctx.fillRect(0, 0, LAYOUT.w, LAYOUT.h);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 440, 260, 400, 180, 16); ctx.fill();
  text(ctx, 'PAUSED', 640, 310, 36, '#3d2b1f', 'center', '900');
  text(ctx, 'The stove is off. The orders wait.', 640, 350, 15, '#5a4232', 'center', '400');
  text(ctx, 'Press P or click II to keep cooking', 640, 385, 14, '#8a6d4b', 'center', '400');
}

function drawGameOverScreen(ctx, g) {
  ctx.fillStyle = 'rgba(30,20,12,0.6)';
  ctx.fillRect(0, 0, LAYOUT.w, LAYOUT.h);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 130, 600, 460, 18); ctx.fill();
  text(ctx, 'SHIFT OVER!', 640, 185, 44, '#3d2b1f', 'center', '900');
  text(ctx, 'The kitchen closes. Here is how you did:', 640, 225, 16, '#5a4232', 'center', '400');
  const s = g.endStats;
  text(ctx, 'Coins earned', 420, 290, 18, '#8a6d4b', 'left', '400');
  text(ctx, '$' + s.coins, 860, 290, 26, '#3d2b1f', 'right', '900');
  text(ctx, 'Orders served', 420, 330, 18, '#8a6d4b', 'left', '400');
  text(ctx, String(s.served), 860, 330, 26, '#3d2b1f', 'right', '900');
  text(ctx, 'Customers lost', 420, 370, 18, '#8a6d4b', 'left', '400');
  text(ctx, String(s.lost), 860, 370, 26, '#3d2b1f', 'right', '900');
  text(ctx, 'Best combo', 420, 410, 18, '#8a6d4b', 'left', '400');
  text(ctx, 'x' + s.bestCombo, 860, 410, 26, '#3d2b1f', 'right', '900');
  // stars
  const stars = s.stars;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#f6a821' : '#d9cfae';
    const sx = 560 + i * 80, sy = 470;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? 26 : 11;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const px = sx + Math.cos(a) * r, py = sy + Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }
  text(ctx, stars === 3 ? 'Head Chef! The crowd wants more.' : stars === 2 ? 'Solid shift, chef!' : stars === 1 ? 'A decent shift — keep practicing!' : 'A tough shift. The kitchen forgives.', 640, 520, 15, '#5a4232', 'center', '400');
  ctx.fillStyle = '#2e9e43';
  roundRect(ctx, 510, 540, 260, 44, 12); ctx.fill();
  text(ctx, '↻  PLAY AGAIN', 640, 563, 20, '#ffffff', 'center', '900');
}

// ---- main scene --------------------------------------------------------

function drawKitchen(ctx, g, now) {
  // wall + floor
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(0, 0, LAYOUT.w, LAYOUT.h);
  ctx.fillStyle = '#e8cfa8';
  ctx.fillRect(0, 176, LAYOUT.w, 488);
  ctx.strokeStyle = 'rgba(61,43,31,0.08)'; ctx.lineWidth = 2;
  for (let y = 200; y < 720; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LAYOUT.w, y); ctx.stroke();
  }
  drawTopBar(ctx, g);
  drawOrderBoard(ctx, g);
  drawPantry(ctx, g);
  drawChopBoard(ctx, g, now);
  drawStove(ctx, g, now);
  drawGrill(ctx, g, now);
  drawTrash(ctx, g);
  drawServeWindow(ctx, g, now);
  drawPlating(ctx, g);
  drawChef(ctx, g, now);
  drawFloats(ctx, g);
  drawHintBar(ctx, g);
  if (g.screen === 'paused') drawPauseScreen(ctx, g);
}

function drawScene(ctx, g, now) {
  if (g.screen === 'title') drawTitleScreen(ctx, g, now);
  else if (g.screen === 'over') { drawKitchen(ctx, g, now); drawGameOverScreen(ctx, g); }
  else drawKitchen(ctx, g, now);
}
