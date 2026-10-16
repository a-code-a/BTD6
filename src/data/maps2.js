// Interactive maps: each one has map features the player can click (or that
// act on their own). Features are run by game/mapfx.js and drawn by
// art/maps3.js. Same coordinate system as data/maps.js (1020x720 field).
(function () {
  // points every `step` px along a smoothed control polyline (for blockers)
  function along(ctrl, step, r) {
    const p = new MT.Path(ctrl);
    const out = [];
    for (let d = 0; d <= p.length; d += step) {
      const q = p.at(d);
      out.push([q.x, q.y, r]);
    }
    return out;
  }

  // Super Silly Fun Land: the "Space Killer" rollercoaster loops through the track
  const COASTER = [[372, 262], [520, 214], [674, 252], [742, 378], [690, 506], [540, 548], [392, 508], [328, 382]];
  // Vector's Fortress: the two routes split at the fork and meet again behind the fortress
  const FORK = [[-40, 360], [90, 360], [170, 360]];
  const MERGE = [[860, 360], [930, 390], [990, 330], [1070, 318]];

  const MAPS = [
    {
      id: 'funland',
      name: 'Super Silly Fun Land',
      difficulty: 'Beginner',
      theme: 'funpark',
      tag: 'ROLLERCOASTER',
      hint: 'Press the red GO! button to launch the rollercoaster through the mutants!',
      seed: 1111,
      pathWidth: 44,
      interactive: true,
      paths: [[
        [-40, 118], [130, 118], [250, 150], [370, 128], [456, 176], [478, 300], [452, 430], [474, 560], [560, 640],
        [656, 600], [668, 470], [624, 350], [640, 200], [730, 118], [860, 100], [946, 160], [960, 290], [920, 410],
        [956, 520], [930, 630], [820, 676], [740, 760],
      ]],
      features: [
        { type: 'coaster', loop: COASTER, cd: 22, x: 286, y: 300, name: 'Space Killer Coaster',
          desc: 'Click to launch the coaster! It races round its loop and flattens every mutant on the crossings.' },
        { type: 'spinner', key: 'mf_ferris', x: 840, y: 330, speed: 0.35, depth: 'top' },
        { type: 'spinner', key: 'mf_carousel', x: 150, y: 420, speed: -0.6 },
      ],
      decor: [
        { type: 'coasterrails', x: 540, y: 380, loop: COASTER, r: 0, block: along(COASTER.concat([COASTER[0]]), 26, 12) },
        { type: 'coasterstation', x: 286, y: 340, r: 30 },
        { type: 'ferrisbase', x: 840, y: 330, r: 0, block: [[840, 330, 66], [840, 410, 30]] },
        { type: 'carouselbase', x: 150, y: 420, r: 56 },
        { type: 'prizebooth', x: 160, y: 610, r: 40 },
        { type: 'cottoncandy', x: 330, y: 650, r: 24 },
        { type: 'ticketbooth', x: 62, y: 230, r: 26 },
        { type: 'balloons', x: 560, y: 380, r: 18 },
        { type: 'popcorn', x: 980, y: 40, r: 18 },
      ],
      scatter: { fairlight: 8, bush: 6, flowers: 14 },
    },
    {
      id: 'fortress',
      name: "Vector's Fortress",
      difficulty: 'Intermediate',
      theme: 'fortress',
      tag: 'DRAWBRIDGES',
      hint: 'Pull the lever to switch routes, and click the fish to feed the shark!',
      seed: 1212,
      pathWidth: 42,
      interactive: true,
      paths: [
        FORK.concat([[230, 300], [290, 196], [396, 126], [520, 106], [644, 124], [742, 196], [800, 290]], MERGE),
        FORK.concat([[226, 440], [222, 540], [300, 620], [420, 606], [520, 626], [626, 650], [724, 612], [764, 532], [810, 440]], MERGE),
      ],
      water: [
        { type: 'moat', x: 520, y: 360, r: 112, width: 40 },
        { type: 'river', width: 40, pts: [[520, 250], [512, 180], [524, 110], [516, 40], [520, -30]] },
        { type: 'river', width: 40, pts: [[520, 470], [528, 540], [516, 626], [524, 690], [520, 760]] },
      ],
      features: [
        { type: 'drawbridge', x: 112, y: 450, name: 'Drawbridge Lever',
          desc: 'Click to raise one drawbridge and lower the other. Mutants that have not reached the fork take the open route.',
          bridges: [{ path: 0, x: 520, y: 106 }, { path: 1, x: 520, y: 626 }], fork: 200 },
        { type: 'shark', x: 520, y: 360, r: 112, cd: 25, name: "Vector's Shark",
          desc: 'Click to feed the shark! It leaps out of the moat and gulps the biggest mutant near the fortress.' },
      ],
      decor: [
        { type: 'vectorfortress', x: 520, y: 360, r: 86 },
        { type: 'palm', x: 70, y: 70, r: 26 },
        { type: 'palm', x: 960, y: 640, r: 26 },
        { type: 'squidlauncher', x: 900, y: 140, r: 26 },
        { type: 'pyramidstatue', x: 120, y: 620, r: 28 },
      ],
      scatter: { palm: 3, beachrock: 6, shell: 12, starfish: 6 },
    },
    {
      id: 'avl',
      name: 'AVL Undersea Base',
      difficulty: 'Advanced',
      theme: 'undersea',
      tag: 'RECALL TUBE',
      hint: 'Click the glass ring on the track to suck mutants back to the start! Subs work anywhere here.',
      seed: 1313,
      pathWidth: 42,
      interactive: true,
      allWater: true,
      paths: [[
        [-40, 196], [140, 196], [246, 120], [392, 104], [492, 176], [476, 314], [360, 378], [262, 470], [298, 600],
        [456, 640], [598, 566], [622, 430], [714, 336], [856, 330], [938, 420], [914, 548], [962, 640], [1070, 662],
      ]],
      features: [
        { type: 'tube', at: 0.8, cd: 40, dur: 5, name: 'AVL Recall Tube',
          desc: 'Click to switch on the tube for 5s. Small mutants that pass are sucked in and shot back to the start! Giants are too big and only get slowed.' },
        { type: 'vent', at: 0.28, every: 7, dur: 2.5, name: 'Bubble Vent', desc: 'Erupts every few seconds. The bubbles wash the Camo off mutants and slow them down.' },
        { type: 'vent', at: 0.56, every: 7, dur: 2.5, offset: 3.5, name: 'Bubble Vent', desc: 'Erupts every few seconds. The bubbles wash the Camo off mutants and slow them down.' },
      ],
      decor: [
        { type: 'avldome', x: 668, y: 170, r: 66 },
        { type: 'avldome', x: 140, y: 380, r: 46, small: true },
        { type: 'avldome', x: 770, y: 628, r: 40, small: true },
        { type: 'treasure', x: 470, y: 470, r: 20 },
        { type: 'anchor', x: 920, y: 120, r: 22 },
        { type: 'clam', x: 60, y: 640, r: 18 },
      ],
      scatter: { kelp: 9, coral: 8, seastone: 6 },
    },
    {
      id: 'bank',
      name: 'Bank of Evil',
      difficulty: 'Expert',
      theme: 'bank',
      tag: 'LASERS + LOANS',
      hint: 'Click the security panel for lasers, or the LOANS sign for quick bananas!',
      seed: 1414,
      pathWidth: 40,
      interactive: true,
      paths: [[
        [-40, 610], [130, 610], [214, 532], [196, 406], [254, 300], [376, 262], [466, 330], [478, 462], [560, 542],
        [690, 524], [738, 404], [698, 284], [752, 176], [868, 150], [938, 116],
      ]],
      features: [
        { type: 'lasergrid', x: 590, y: 668, cd: 30, dur: 7, gates: [0.3, 0.55, 0.78], name: 'Laser Security',
          desc: 'Click to switch on the laser grid for 7s. Every laser gate zaps the mutants that cross it and strips their Camo.' },
        { type: 'loan', x: 100, y: 236, name: 'Loan Desk',
          desc: 'Need bananas now? Take a loan! You pay it back (+25% interest) out of the bananas you earn at the end of each round.' },
      ],
      decor: [
        { type: 'vault', x: 946, y: 112, r: 70 },
        { type: 'bankdesk', x: 100, y: 250, r: 40 },
        { type: 'column', x: 330, y: 140, r: 24 },
        { type: 'column', x: 330, y: 450, r: 24 },
        { type: 'column', x: 600, y: 140, r: 24 },
        { type: 'column', x: 600, y: 410, r: 24 },
        { type: 'column', x: 860, y: 330, r: 24 },
        { type: 'column', x: 860, y: 560, r: 24 },
        { type: 'goldstack', x: 960, y: 440, r: 26 },
        { type: 'goldstack', x: 400, y: 640, r: 24 },
        { type: 'moneybags', x: 940, y: 250, r: 22 },
        { type: 'moneybags', x: 66, y: 420, r: 22 },
        { type: 'banksign', x: 470, y: 60, r: 0 },
      ],
      scatter: { plantpot: 6, moneybag: 3 },
    },
  ];
  MT.MAPS.push(...MAPS);
})();
