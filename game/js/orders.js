// orders.js — the order board: customers arrive, wait with a patience
// bar, and pay for the dish they asked for. Serving the oldest matching
// order first keeps the queue fair; tips reward fast service.

const ORDER_BOARD = {
  maxOrders: 3,
  basePatienceSecs: 48,
  baseSpawnSecs: 13,
  minSpawnSecs: 7,
};

let orderSeq = 0;
const CUSTOMER_FACES = ['#f2a65a', '#8ecae6', '#e07a5f', '#90be6d', '#f9c74f', '#b5838d', '#6d6875', '#e5989b'];
const CUSTOMER_NAMES = ['Maya', 'Budi', 'Sinta', 'Raka', 'Dewi', 'Agus', 'Laras', 'Tono'];

function makeOrder(rng, difficulty) {
  orderSeq += 1;
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  const patience = ORDER_BOARD.basePatienceSecs * Math.pow(0.92, difficulty);
  return {
    id: orderSeq,
    recipeId: recipe.id,
    name: CUSTOMER_NAMES[Math.floor(rng() * CUSTOMER_NAMES.length)],
    face: CUSTOMER_FACES[Math.floor(rng() * CUSTOMER_FACES.length)],
    patienceMax: patience,
    patience: patience,
    bornAt: 0,
    state: 'waiting', // waiting | served | angry
  };
}

function spawnIntervalSecs(difficulty) {
  return Math.max(ORDER_BOARD.minSpawnSecs, ORDER_BOARD.baseSpawnSecs * Math.pow(0.88, difficulty));
}

// Oldest waiting order whose recipe matches this plate exactly.
function findMatchingOrder(orders, plate) {
  for (const order of orders) {
    if (order.state !== 'waiting') continue;
    const recipe = recipeById(order.recipeId);
    if (recipe && plateMatchesRecipe(plate, recipe)) return order;
  }
  return null;
}

// Coins for a served dish: base price plus a tip from patience left.
function servePayout(order) {
  const recipe = recipeById(order.recipeId);
  const frac = Math.max(0, order.patience / order.patienceMax);
  const tip = Math.round(recipe.price * 0.5 * frac);
  return { coins: recipe.price + tip, tip: tip, price: recipe.price };
}

// Tick every order's patience down; returns orders that just walked out.
function tickOrders(orders, dtSecs) {
  const lost = [];
  for (const order of orders) {
    if (order.state !== 'waiting') continue;
    order.patience -= dtSecs;
    if (order.patience <= 0) {
      order.patience = 0;
      order.state = 'angry';
      lost.push(order);
    }
  }
  return lost;
}

function waitingOrders(orders) { return orders.filter((o) => o.state === 'waiting'); }
