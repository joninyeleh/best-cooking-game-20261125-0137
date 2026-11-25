// recipes.js — every dish, ingredient and cooking step of Sizzle & Serve.
// A recipe is a list of finished components; each component is a raw
// ingredient transformed by one station (chop, fry/boil on the stove, grill).
// Sauce is served straight from the bottle: no station needed.

const INGREDIENTS = {
  rice:    { name: 'Rice',     color: '#f5f0dc', chop: false, cook: 'stove',  cookName: 'Fried Rice',     cookSecs: 3 },
  noodles: { name: 'Noodles',  color: '#f2c14e', chop: false, cook: 'stove',  cookName: 'Cooked Noodles',  cookSecs: 3 },
  egg:     { name: 'Egg',      color: '#fdf3d0', chop: false, cook: 'stove',  cookName: 'Fried Egg',      cookSecs: 2 },
  chicken: { name: 'Chicken',  color: '#e8a87c', chop: true,  cook: 'grill',  cookName: 'Grilled Chicken', cookSecs: 4 },
  veggies: { name: 'Veggies',  color: '#7bc96f', chop: true,  cook: null,     cookName: 'Chopped Veggies', cookSecs: 0 },
  sauce:   { name: 'Peanut Sauce', color: '#a9713f', chop: false, cook: null,  cookName: 'Peanut Sauce',   cookSecs: 0 },
};

// A finished component is named by its cooked form. Chopping a choppable
// ingredient turns it into its "chopped" intermediate, which the grill or
// the plate then wants. Components the plate accepts:
const COMPONENTS = {
  'fried-rice':       { name: 'Fried Rice',      color: '#f5f0dc', icon: 'rice' },
  'cooked-noodles':   { name: 'Cooked Noodles',  color: '#f2c14e', icon: 'noodles' },
  'fried-egg':        { name: 'Fried Egg',       color: '#fdf3d0', icon: 'egg' },
  'chopped-chicken':  { name: 'Chopped Chicken', color: '#f2b8a0', icon: 'chicken' },
  'grilled-chicken':  { name: 'Grilled Chicken', color: '#e8a87c', icon: 'chicken' },
  'chopped-veggies':  { name: 'Chopped Veggies', color: '#7bc96f', icon: 'veggies' },
  'peanut-sauce':     { name: 'Peanut Sauce',    color: '#a9713f', icon: 'sauce' },
};

// What each station does to a held raw ingredient, step by step.
function chopResult(kind) {
  if (kind === 'chicken') return 'chopped-chicken';
  if (kind === 'veggies') return 'chopped-veggies';
  return null;
}
function cookResult(kind) {
  if (kind === 'rice') return 'fried-rice';
  if (kind === 'noodles') return 'cooked-noodles';
  if (kind === 'egg') return 'fried-egg';
  if (kind === 'chopped-chicken') return 'grilled-chicken';
  return null;
}
function stationFor(kind) {
  const ing = INGREDIENTS[kind];
  if (!ing) return null;
  if (ing.chop) return 'board';
  if (ing.cook === 'stove') return 'stove';
  if (ing.cook === 'grill') return 'grill';
  return 'plate';
}
function needsChop(kind) { return !!(INGREDIENTS[kind] && INGREDIENTS[kind].chop); }
function needsCook(kind) { return !!(INGREDIENTS[kind] && INGREDIENTS[kind].cook); }

const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 12,
    needs: ['fried-rice', 'fried-egg'],
    blurb: 'Wok-fried rice with a sunny egg',
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', price: 14,
    needs: ['cooked-noodles', 'grilled-chicken'],
    blurb: 'Noodles topped with grilled chicken',
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', price: 13,
    needs: ['grilled-chicken', 'peanut-sauce'],
    blurb: 'Grilled chicken skewer, peanut sauce',
  },
  {
    id: 'gado-gado', name: 'Gado-Gado', price: 10,
    needs: ['chopped-veggies', 'peanut-sauce'],
    blurb: 'Crisp chopped veggies, peanut sauce',
  },
  {
    id: 'soto-ayam', name: 'Soto Ayam', price: 15,
    needs: ['cooked-noodles', 'fried-egg', 'peanut-sauce'],
    blurb: 'Hearty noodle soup bowl, egg and sauce',
  },
];

function recipeById(id) { return RECIPES.find((r) => r.id === id) || null; }

// True when a plate holds exactly the components a recipe needs.
function plateMatchesRecipe(plate, recipe) {
  if (!plate || plate.components.length !== recipe.needs.length) return false;
  const have = plate.components.slice().sort().join('|');
  const want = recipe.needs.slice().sort().join('|');
  return have === want;
}

// A component may go on a plate only if some recipe wants it there
// together with everything already on the plate.
function componentFitsPlate(plate, component) {
  if (plate.components.includes(component)) return false;
  return RECIPES.some((r) => {
    if (!r.needs.includes(component)) return false;
    return plate.components.every((c) => r.needs.includes(c));
  });
}
