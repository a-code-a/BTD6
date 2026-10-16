# Minion Tower Defense

**Gru vs. the Evil Purple Minions**: a fan-made tower defense in the style of *Bloons TD 6*, built with
[Phaser 3](https://phaser.io). Gru's yellow minions defend his house against waves of mutated
purple minions.

Every graphic in the game is drawn procedurally in code with the Canvas 2D API: the minions, Gru,
the purple mutants, the villains, all fourteen maps, the menus, projectiles, effects, icons and UI. The game
uses no image files. Sound effects, the minion voices and all ten songs are synthesized live with the
Web Audio API.

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

1. Pick a map, a hero and a difficulty (Easy: 40 rounds, Medium: 60, Hard: 80), or **Sandbox**.
2. Choose a tower in the right-hand shop and click the map to place it. The range circle turns red
   where you can't build.
3. Press **PLAY** to send the next round. Press it again to toggle **3x speed**.
4. Popping a mutant earns bananas ($). Bigger mutants split into smaller ones, like bloon layers.
5. Click a tower to upgrade it. Each tower has **3 paths × 4 tiers**. As in BTD6, one path can go to
   tier 4 and a second path to tier 2.
6. **Super Fusion:** once you own three towers of the same kind that each have a tier-4 upgrade, select
   one and press **FUSE**. The other two fly into it and it becomes a far stronger super tower with its
   own ability.
7. **Giant fusions** (a trinity of trinities): select a super tower and press
   - **ULTIMATE** with three super towers of the *same* kind: a brand-new giant with its own extra
     attack (see the table below), 2.5x damage and a stronger ability, or
   - **OMEGA** with three super towers of *different* kinds: a giant **Omega Mech** built from them.
     The selected tower becomes its back, the other two its arm weapons, and every combination
     looks different. Its core fires the **Omega Beam**, which mixes the powers of all three parts.
8. Click **MOVE** (or press `M`) to pick up any placed tower and put it somewhere else for a small fee.
9. Beat the final round to earn a medal for that map and difficulty, then keep going in freeplay.
10. The panel in the top-left corner previews the **next round** (click it to fold it away), so you
    can get Camo detection or anti-air ready in time. Hover an icon for details.
11. After a game (or any time from the pause menu, **STATS**) you get a report: rounds, time, pops,
    lives lost, the Gru Coins you earned, and a table of your towers with pops, damage dealt, cost and
    bananas earned, plus the MVP.
12. **Saved games:** a classic game is saved after every round. **CONTINUE** in the main menu picks up
    the newest one, and the difficulty picker shows a CONTINUE button for every saved map + difficulty.
    Leaving in the middle of a round takes you back to the start of that round. A won or lost game is
    removed (FREEPLAY saves it again after its first round).
13. **Targeting:** most towers cycle First, Last, Close and Strong. Some have their own modes:
    - Laser Sniper: also **Camo** (Camo mutants first) and **Giants** (biggest giant first).
    - Minion Pilot: flight patterns **Circle**, **Figure 8**, **Wide** and **Hunt** (the whole patrol
      follows the leading mutant across the map).
    - Catapult Minion: also **Spot**: click the map and every boulder lands there, like a mortar.
    - Nail Minion: **Spread**, **Close** (near the tower) and **Far** (far end of the range); Smart
      Spikes add **Smart** (right in front of the leading mutant).
14. **Powers** (button top right, hotkey `P`): one-use items you buy with Gru Coins, see below.

### Game modes

- **Classic**: 14 maps × 3 difficulties = 42 medals.
- **Boss Battles** (main menu): fight one of five villains in their own arena. You start with a big
  budget, then summon the boss with PLAY. Escort waves keep coming every few seconds (each pays out like a
  round) until you defeat the boss, or it reaches the end of the track. Each boss has three phases and its
  own attacks against your towers. **Normal** and **Elite** difficulty; your best time is saved.
- **Boss Rush**: all five villains one after another in Villain-Con City, with bonus bananas after
  each one. Normal and Elite, best time saved.
- **Sandbox**: unlimited bananas, lives and powers, no medals, coins or achievements. The sandbox panel
  lets you play any round, send any mutant (also Camo / Fortified / Regrow and the bosses), clear the
  map, reset ability cooldowns and max out your hero. Perfect for testing fusion, Ultimate and Omega combos.

### Gru's Lab: Gru Coins, research, powers and achievements

Every game pays **Gru Coins**: 2 / 3 / 4 per round survived on Easy / Medium / Hard (4 in freeplay),
40 / 70 / 110 for a win (double the first time you win a medal), 1-2 per Boss Battle wave, 60 / 120 for
a beaten villain (250 / 500 for the Boss Rush, also double the first time), plus the reward of every
achievement. New players (and existing saves) start with 200 coins, plus 30 for every medal and 50 for
every beaten boss tier that was already won. Using the **+$** cheat switches coins and achievements
off for that game.

Spend them in **GRU'S LAB** (main menu):

- **Research**: 14 permanent upgrades with 1-3 levels each (36 in total): starting bananas, round
  bonus, farm value, sell price, cheaper towers, attack speed, range, +1 pierce, damage against giants,
  extra lives, a life back every round, heroes arriving at a higher level, more hero XP, shorter cooldowns.
- **Powers**: Banana Peels (pile on the track, 40 pierce), Camo Sprinkler (washes the Camo off the next
  300 mutants), Freeze Bomb, Cash Drop ($1,000), Minion Boost (every tower 2x faster for 15s) and Healthy
  Bananas (+25 lives). Buy 1, or 5 for the price of 4. Traps on the track stay until they are used up
  (and are part of the saved game).
- **Heroes**: Dru (200), Agnes (300) and El Macho (400) are unlocked with coins in HEROES or right in
  the hero picker.

**TROPHIES** (main menu) lists 32 achievements with their progress: pop counts, medals, fusions, hero
stars, boss wins, freeplay rounds, Flawless / Minimalist / no-hero wins, farm income, powers, research,
heroes and more. Each pays Gru Coins when it pops up.

The main menu also has a **Heroes** gallery (level perks, abilities, unlocking), the **Almanac** (every
tower, upgrade path, fusion, anti-air source and mutant) and **Settings** (music / sound volume, screen
shake, auto-start, reset progress).

Every tower has a signature mechanic (★ in its panel, full text on hover), towers turn to face what they
shoot at, and screen shake is gentle by default (ON, LOW or OFF in the pause menu). The game renders at
your screen's real pixel density, so text stays sharp, and it re-adapts when you resize the window.

### Hotkeys

| Key | Action |
| --- | --- |
| `Q W E R T Y A S D G J Z X C V B U I O` | Select a tower to place |
| `H` | Place your hero |
| `Space` | Start round / toggle 3x speed |
| `,` `.` `/` | Buy upgrade on path 1 / 2 / 3 of the selected tower |
| `F` | Super Fusion for the selected tower |
| `M` | Move the selected tower |
| `Tab` | Cycle the targeting mode of the selected tower |
| `P` | Open / close the powers panel |
| `Backspace` / `Delete` | Sell selected tower |
| `1` – `9` | Use the abilities in the ability bar |
| `Esc` | Cancel placement, spot picking or a power, deselect, or pause |
| Hold `Shift` while placing | Place several of the same tower |

## Towers

| Tower | Signature mechanic | Signature upgrades |
| --- | --- | --- |
| Banana Thrower | Boomerang bananas that hit again on the way back | Banana Boulder → Juggernaut, Triple Toss, Crossbow & Sharpshooter |
| Fart Blaster | Puffs leave lingering gas clouds | Gas Cloud ring, Fart Storm, Flame Fart → Inferno Ring |
| Rocket Minion | Armor shred: no armor and +1 damage taken for 3s | Moon Buster, Cluster Rockets, Giant Eliminator (Mega Missile) |
| Freeze Ray Minion | Freezes everything around it | Arctic Wind, Brittle Ice, Cryo Cannon, Snowstorm ability |
| Jelly Gunner | Slows, always aims at un-slowed mutants | Acid Jelly, Jelly Hose, Jelly Trap, Jelly Storm ability |
| Laser Sniper | Focus fire: repeated hits on one mutant stack damage | Giant Cripple, Bouncing Laser, Full Auto, Supply Drop ability |
| Tesla Minion | Chain lightning | Arc Reactor, Triple Coil, EMP Overload, Lightning Storm ability |
| Minion Pilot | Planes circle and strafe | Rocket Pods, Gunship, Squadron of 3, Bombing Run ability |
| Rock Star Minion | Rhythm: every 4th note is a power chord | Heavy Metal → Rock God, Minion Band buff, Disco Ball stuns, Papoy Song ability |
| Nail Minion | Nail traps on the track, hit Camo too | Spike Mines, Smart Spikes, Banana Peels, Spike Storm ability |
| Submarine Minion | Water only, homing torpedoes, sonar strips Camo | Ballistic Missile, Torpedo Barrage, Nuclear Launch & Kraken abilities |
| Ninja Minion | Sees Camo from the start, seeking shurikens | Banana-jitsu, Smoke Puff, Flash Bomb, Caltrops, Shadow Strike ability |
| Catapult Minion | Siege: boulders crush whole groups, armor too (no anti-air) | Watermelon Bombs, Iron Wrecking Ball, Greek Fire, Meteor Shower ability |
| Alchemist Minion | Acid splash that keeps eating mutants | Acid Pools, Berserker Brew buffs, Lead to Gold, Golden Touch ability |
| Fireman Minion | Water jet pushes mutants back | Water Cannon, Tsunami Cannon, Bee-Do Siren, Flood |
| Vampire Minion | Life drain: bats heal lives | Bat Colony, Count Dracula, Fear, Creature of Darkness, Blood Moon ability |
| Banana Farm | Income | Plantations, Golden Bananas, Banana Bank, auto-collect |
| Gru's Lab | Support buffs | Range/speed/pierce buffs, camo & armor detection, discounts, Lab Turret |
| Super Minion | Momentum: fires up to 2x faster the longer it shoots | Laser → Plasma → Sun Minion, Robo Minion, Dark Legend |

Submarines float on water, lava and the purple goo pools (every map has at least one).

**Anti-air** (needed for flying mutants): heroes, every fusion tier, the Laser Sniper, Tesla Minion,
Minion Pilot and Super Minion always hit flyers. The Banana Crossbow, Homing Rockets and Ballistic
Missile upgrades add it, and a Lab with **Radar Scanner** gives anti-air to every tower in its ring.
Nail traps and gas or fire clouds stay on the ground.

Abilities show a cut-in banner and a charge-up beam when used; the ability bar shows countdowns and
flashes when an ability is ready again.

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
| Nail Minions | Nailinator | Iron Rain |
| Submarine Minions | Leviathan | Leviathan Strike |
| Super Minions | Banana Galaxy God | Supernova |
| Ninja Minions | Shadow Shogun | Thousand Cuts |
| Catapult Minions | Royal Trebuchet | Meteor Storm |
| Alchemist Minions | Grand Alchemist | Potion Rain |
| Fireman Minions | Bee-Do Brigade | Mega Siren |
| Vampire Minions | Count Minionula | Eternal Night |

### Ultimate forms

| Three... | Become | Extra attack |
| --- | --- | --- |
| Banana Overlords | Banana Singularity | Gravity Well: a golden black hole that traps and crushes mutants |
| Fartnados | Fart Hurricane | Roaming Tornado that blows mutants back down the track |
| Doomsday Launchers | Doomsday Armada | Artillery Barrage of 8 shells from a missile tank |
| Absolute Zeros | Eternal Winter | Hailstorm of giant icicles |
| Jelly Krakens | Jelly Abyss | Acid Pools that slow and dissolve |
| Orbital Lasers | Orbital Fortress | Railgun that pierces a line across the whole map |
| Thunder Gods | Storm Titan | Living Storm: constant lightning from the sky |
| Minion Air Forces | Sky Carrier | Strafing Runs by bombers |
| Rock Legends | Minionstock Festival | Bass Drop: every beat hits, every 4th stuns and knocks back |
| Nailinators | Spike Colossus | Spike Walls and a nail-shooting Ground Slam |
| Leviathans | Kraken King | Tentacle Grabs that hold and crush |
| Banana Republics | Banana Planet | Orbiting Banana Moons + 3% interest per round |
| Doomsday Labs | Nefario's Moon Base | Clone Troopers charging down the track |
| Banana Galaxy Gods | Banana Multiverse | Portal Strikes anywhere on the map |
| Shadow Shoguns | Shadow Dojo | Shuriken Storm rolling back down the track |
| Royal Trebuchets | Banana Castle | Boulder Barrage of 6 flaming boulders |
| Grand Alchemists | Great Cauldron | Acid Geysers under the mutants |
| Bee-Do Brigades | Bee-Do HQ | Flood Waves that wash everything back |
| Count Minionulas | Dracula's Castle | Bat Cloud that bites and heals you |

### Heroes

| Hero | Style | Abilities |
| --- | --- | --- |
| **Gru** | Freeze ray that slows | Shrink Ray, Moon Heist |
| **Lucy Wilde** | Fast lipstick-taser shots that stun | Lipstick Taser, AVL Airstrike |
| **Dr. Nefario** | Goo bombs that splash and slow | Fart Gun, Antidote Serum |
| **Kevin** | Banana blaster, buffs nearby towers | Minion Stampede, GIANT KEVIN |
| **Vector** | Sticky squid launcher | Piranha Frenzy, Pyramid Heist |
| **Dru** (200 coins) | Economy: golden coins, bananas every round, +15-25% bananas per pop and cheaper towers nearby | Family Fortune, Golden Supercar |
| **Agnes** (300 coins) | Support: homing rainbow stars, range / speed / pierce / Camo buffs, heals lives every round | It's So Fluffy!, Unicorn Parade |
| **El Macho** (400 coins) | Tank: short-range punches that hit crowds, slows mutants nearby, immune to boss attacks from level 7 | Pollito!, Shark Rocket |

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
- **Enemy heroes**: the Boss Battle villains invade classic games: Mutant Vector in rounds 45, 66 and 78,
  Scarlet Overkill in 52 and 72, Balthazar Bratt in 60 and 72, and every third freeplay round (more of
  them the further you get). They ink, gum or melt your strongest towers and call in minions. One that
  escapes steals half of your starting lives.

From round 41 on, giants and Barrel Brutes get 5% more health every round (twice as much by round 60,
three times by round 80), and from round 61 everything moves up to 20% faster. In freeplay both keep
climbing much faster, so even a defense full of super towers falls eventually.

Every new giant gets a warning banner when it first appears, and giants explode in a multi-stage
burst when they go down.

Tactical mutants that need a plan:

- **Glider** and **Jetpack Mutant**: they fly a shortcut over the scenery, and only anti-air towers can
  hit them. A Jetpack pops into three Gliders.
- **Mole Mutant**: digs under the track for long stretches, where nothing can hit it. Submarine sonar
  pings drag it back to the surface, dazed.
- **Shield Carrier**: projects a bubble that soaks up every hit on the mutants around it. The bubble
  doesn't protect the carrier itself, so pop it first (Snipers, "Strong" targeting).
- **Rubber Mutant**: energy (lasers, plasma, lightning) bounces off.
- **Magma Mutant**: fire and ice do nothing, and it can never be frozen.
- **Medic Mutant**: every few seconds it heals the giants, Barrel Brutes and shield bubbles around it.
- **Rage Mutant**: every hit makes it faster, up to 2.6x speed, so a few big hits beat many small ones.
- **Regrow** (any non-giant mutant, shown by a green heart): left alone for 2.5 seconds it grows back
  into the mutant it popped out of, but never past the one it started as. Steady damage stops it.

Super towers (every fusion tier) break through the immunities.

## Boss Battles

| Villain | Arena | Attacks |
| --- | --- | --- |
| **Mutant Vector** | Pyramid Desert | Squid launcher inks towers for a few seconds; phase 2: double squids and a shield bubble; phase 3: rocket-boot dashes |
| **Balthazar Bratt** | Banana Beach | Bubblegum bombs trap clusters of towers; phase 2: gum shield and keytar solos that stun nearby towers; phase 3: faster, calls jetpacks and brutes |
| **Scarlet Overkill** | Villain-Con City | Flies (anti-air only!); lava-lamp bombs melt towers; calls Gliders, Shield Carriers and Moles; phase 3: rocket-dress dashes |
| **Mutant El Macho** | Volcano Lair | Throws Pollito, who pecks towers out; phase 2: shield and ground slams that stun towers nearby; phase 3: rage, calls Mega Mutants and brutes |
| **Maxime Le Mal** | Minion Factory | Roach Ray turns towers into cockroaches; phase 2: shield and roach eggs that hit groups; phase 3: dashes, calls Rubber and Magma Mutants (also an enemy hero in freeplay) |
| **Boss Rush** | Villain-Con City | All five in a row, each at 75% health, bonus bananas after every villain |

All of them summon escorts, and stunning or freezing a boss slows its attacks down. A tower that just
recovered from an attack is immune for a few seconds, so it can't be locked down forever.

## Maps

- **Gru's Backyard** and **Banana Beach** (Beginner)
- **Banana Jungle**, **The Moon** and **Pyramid Desert** (Intermediate)
- **Gru's Secret Lab** (two lanes), **Arctic Base** (two lanes) and **Villain-Con City** (Advanced)
- **Volcano Lair** and **Minion Factory** (Expert)

Interactive maps, with things to click on:

- **Super Silly Fun Land** (Beginner): a rollercoaster that runs mutants over
- **Vector's Fortress** (Intermediate): a drawbridge lever that switches the route, and a shark to feed
- **AVL Undersea Base** (Advanced): all water, a recall tube and bubble vents
- **Bank of Evil** (Expert): laser security gates and a loan desk

## Music

| Song | Plays |
| --- | --- |
| Banana Lounge | Menus |
| Backyard Brigade (march) | Battles on Gru's Backyard and Villain-Con City |
| Banana Island (calypso) | Battles on Banana Jungle and Banana Beach |
| Lab Rat Funk | Battles in Gru's Secret Lab and the Minion Factory |
| Moonwalk (synth-pop) | Battles on the Moon and the Arctic Base |
| Banana Gulch (western) | Battles in the Pyramid Desert and the Volcano Lair |
| Giant Alert | While a big endgame giant is on the field |
| Villain Showdown | Boss Battles |
| Banana Party / Sad Banana | After a win / after a loss |

Each map opens with its own battle song, and in a long game the five battle songs take turns. The music
is muffled while the game is paused.

## Project layout

```
index.html            entry page (loads scripts in order)
lib/phaser.min.js     Phaser 3.90 (MIT)
fonts/                Luckiest Guy (Apache 2.0), Fredoka (OFL)
src/core/             config, save data (progress, meta progression, saved games), Web Audio synth, the songs
src/art/              procedural painters: minions, towers, heroes, enemies, villains, maps, menu, effects/icons
src/data/             towers & upgrades & fusions, heroes, enemies, rounds, maps
src/game/             path, entities (enemy/projectile/tower), effects layer, abilities, giants, bosses,
                      boss battles, fusion, progress (coins, research, achievements), powers, saved games
src/ui/               widgets (buttons/sliders/panels) and the in-game HUD
src/scenes/           boot, main menu, map select, heroes, almanac, settings, boss select, Gru's Lab,
                      achievements, game
```

Progress (medals, boss best times, stats, settings, Gru Coins, research, powers, unlocked heroes,
achievements) and the saved games are stored in the browser's `localStorage`.

---

This is an unofficial fan project and is not affiliated with Illumination, Universal Pictures or Ninja Kiwi.
