# Minion Tower Defense

**Gru vs. the Evil Purple Minions**: a fan-made tower defense in the style of *Bloons TD 6*, built with
[Phaser 3](https://phaser.io). Gru's yellow minions defend his house against waves of mutated
purple minions.

Every graphic in the game is drawn procedurally in code with the Canvas 2D API: the minions, Gru,
the purple mutants, all five maps, projectiles, effects, icons and UI. The game uses no image files.
Sound effects and the music loop are synthesized live with the Web Audio API.

## Play

The game is plain HTML + JavaScript with no build step.

- **Easiest:** open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
- **Or serve it locally** (recommended if your browser blocks local files):
  ```bash
  npx http-server . -p 8080    # or: python3 -m http.server 8080
  ```
  Then open <http://localhost:8080>.
- **GitHub Pages:** enable Pages for the repository root and it runs as is.

Phaser and the fonts (Luckiest Guy and Fredoka) are vendored in `lib/` and `fonts/`, so the game also works offline.

## How to play

1. Pick a map, a hero and a difficulty (Easy: 40 rounds, Medium: 60, Hard: 80).
2. Choose a tower in the right-hand shop and click the map to place it. The range circle turns red
   where you can't build.
3. Press **PLAY** to send the next round. Press it again to toggle **3x speed**.
4. Popping a mutant earns bananas ($). Bigger mutants split into smaller ones, like bloon layers.
5. Click a tower to upgrade it. Each tower has **3 paths × 4 tiers**. As in BTD6, one path can go to
   tier 4 and a second path to tier 2.
6. **Super Fusion:** once you own three towers of the same kind that each have a tier-4 upgrade, select
   one and press **FUSE**. The other two fly into it and it becomes a far stronger super tower with its
   own ability.
7. Beat the final round to earn a medal for that map and difficulty, then keep going in freeplay.

Towers turn to face whatever they are shooting at. Screen shake is gentle by default; switch it
between ON, LOW and OFF in the pause menu.

### Hotkeys

| Key | Action |
| --- | --- |
| `Q W E R T Y U I O A S D` | Select a tower to place |
| `H` | Place your hero |
| `Space` | Start round / toggle 3x speed |
| `,` `.` `/` | Buy upgrade on path 1 / 2 / 3 of the selected tower |
| `F` | Super Fusion for the selected tower |
| `Tab` | Cycle targeting (First, Last, Close, Strong) |
| `Backspace` / `Delete` | Sell selected tower |
| `Esc` | Cancel placement, deselect, or pause |
| Hold `Shift` while placing | Place several of the same tower |

## Towers

| Tower | Role | Signature upgrades |
| --- | --- | --- |
| Banana Thrower | Cheap all-rounder | Banana Boulder → Juggernaut, Triple Toss, Crossbow & Sharpshooter |
| Fart Blaster | Short-range burst in all directions | Gas Cloud ring, Fart Storm, Flame Fart → Inferno Ring |
| Rocket Minion | Explosive splash that breaks armor | Moon Buster, Cluster Rockets, Giant Eliminator (Mega Missile) |
| Freeze Ray Minion | Freezes groups | Arctic Wind, Brittle Ice, Cryo Cannon, Snowstorm ability |
| Jelly Gunner | Slows mutants | Acid Jelly, Jelly Hose, Jelly Trap, Jelly Storm ability |
| Laser Sniper | Infinite range, hits armor | Giant Cripple, Bouncing Laser, Full Auto, Supply Drop ability |
| Tesla Minion | Chain lightning | Arc Reactor, Triple Coil, EMP Overload, Lightning Storm ability |
| Minion Pilot | Planes circle and strafe | Rocket Pods, Gunship, Squadron of 3, Bombing Run ability |
| Rock Star Minion | Piercing sound waves | Heavy Metal → Rock God, Minion Band buff, Disco Ball stuns, Papoy Song ability |
| Banana Farm | Income | Plantations, Golden Bananas, Banana Bank, auto-collect |
| Gru's Lab | Support buffs | Range/speed/pierce buffs, camo & armor detection, discounts, Lab Turret |
| Super Minion | Late-game powerhouse | Laser → Plasma → Sun Minion, Robo Minion, Dark Legend |

### Super Fusions

| Three maxed… | Become | Fusion ability |
| --- | --- | --- |
| Banana Throwers | Banana Overlord | Banana Apocalypse (golden meteor shower) |
| Fart Blasters | Fartnado | Nuclear Toot |
| Rocket Minions | Doomsday Launcher | Armageddon (10 mega missiles) |
| Freeze Ray Minions | Absolute Zero | Ice Age (freezes even giants) |
| Jelly Gunners | Jelly Kraken | Jelly Tsunami (washes mutants back) |
| Laser Snipers | Orbital Laser | Orbital Strike |
| Tesla Minions | Thunder God | Wrath of Zeus |
| Minion Pilots | Minion Air Force | Carpet Bomb |
| Rock Star Minions | Rock Legend | Encore! |
| Banana Farms | Banana Republic | Banana Rain |
| Gru's Labs | Nefario's Doomsday Lab | Lab Overload (every tower 2x speed) |
| Super Minions | Banana Galaxy God | Supernova |

### Heroes

| Hero | Style | Abilities |
| --- | --- | --- |
| **Gru** | Freeze ray that slows | Shrink Ray, Moon Heist |
| **Lucy Wilde** | Fast lipstick-taser shots that stun | Lipstick Taser, AVL Airstrike |
| **Dr. Nefario** | Goo bombs that splash and slow | Fart Gun, Antidote Serum |
| **Kevin** | Banana blaster, buffs nearby towers | Minion Stampede, GIANT KEVIN |
| **Vector** | Sticky squid launcher | Piranha Frenzy, Pyramid Heist |

## Enemies

Pip → Grumble → Chomper → Dasher → Zoomer, then the splitting types: Rascal, Jailbird, Hulk and the
10-hit Barrel Brute. Special mutants are **Camo** (needs detection) and the armored **Tin Can**
(bananas and ice bounce off). The giants are the Mega Mutant, the Purple Titan and the PX-41 Zeppelin.
Giants can also be **Fortified** (double health).

The endgame (late Hard rounds and freeplay) adds monsters with their own powers:

- **Phantom Mutant**: always Camo, blinks forward along the track.
- **Mecha Mutant**: armored battle mech whose EMP pulse shuts down nearby towers.
- **Goo Behemoth**: regenerates health and ignores jelly.
- **Mutant El Macho**: the final boss of round 80 (and every 10th freeplay round). He gets angrier and
  calls in reinforcements as his health drops.

Every new giant gets a warning banner when it first appears, and giants explode in a multi-stage
burst when they go down.

## Maps

- **Gru's Backyard** (Beginner)
- **Banana Jungle** (Intermediate)
- **The Moon** (Intermediate)
- **Gru's Secret Lab** (Advanced, two lanes)
- **Volcano Lair** (Expert)

## Project layout

```
index.html            entry page (loads scripts in order)
lib/phaser.min.js     Phaser 3.90 (MIT)
fonts/                Luckiest Guy (Apache 2.0), Fredoka (OFL)
src/core/             config, save data, Web Audio synth
src/art/              procedural painters: minions, towers, heroes, enemies, bosses, maps, effects/icons
src/data/             towers & upgrades & fusions, heroes, enemies, rounds, maps
src/game/             path, entities (enemy/projectile/tower), effects layer, abilities, bosses, fusion
src/ui/               widgets (buttons/panels) and the in-game HUD
src/scenes/           boot, menu, map select, game
```

Progress (medals, settings) is stored in the browser's `localStorage`.

---

This is an unofficial fan project and is not affiliated with Illumination, Universal Pictures or Ninja Kiwi.
