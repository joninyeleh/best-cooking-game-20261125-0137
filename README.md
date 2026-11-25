# Sizzle & Serve — Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/joninyeleh/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/joninyeleh/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original cooking game built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## The game

You run **Dapur Kilat**, a tiny Indonesian kitchen with a big rush. Customers
arrive at the order board asking for Nasi Goreng, Mie Ayam, Sate Ayam,
Gado-Gado or Soto Ayam. Grab ingredients from the pantry, chop them on the
board, fry them on the stove, grill the chicken, build each dish on a plate
exactly as ordered, and serve it at the window before the customer's
patience runs out. Fast service earns tips and builds a combo; slow service
loses customers and the combo with them. One 3-minute shift, rising pressure,
stars at the end.

## How to play

- **Mouse** — click everything: pantry bins, stations, plates, serve window.
- **Keys 1–6** — grab a pantry ingredient. **T** — trash what you hold.
  **P** — pause. **M** — mute.
- Cook on time: food left on the stove or grill burns and must be tossed.
- A plate only takes components some recipe wants; a finished plate serves
  the oldest matching order first.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files. All art is drawn
in code and all sounds are synthesized with WebAudio.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` — page shell and canvas
- `game/css/style.css` — page chrome
- `game/js/recipes.js` — dishes, ingredients and cooking steps
- `game/js/audio.js` — synthesized sounds and kitchen tune (WebAudio)
- `game/js/kitchen.js` — all drawing: kitchen, stations, chef, customers
- `game/js/orders.js` — order board, patience, tips and scoring
- `game/js/game.js` — state machine, input, timers and main loop
- `main.ts` — the hand-in program (Node 22, standard library only)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
