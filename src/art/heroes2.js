// Artwork for Dru, Agnes and El Macho, in the same 96x110 box as the other
// heroes (body centre around y=64, feet at y=100, weapon on the right).
(function () {
  const D = MT.Draw;
  const OL = D.OL;
  const TA = MT.TowerArt;
  const { glowRing, cape } = TA.props;
  const { face, eye, boots } = MT.HeroArt.parts;

  Object.assign(MT.HeroArt.LOOK, {
    dru: { color: '#ffd740', head: [45, 4] },
    agnes: { color: '#ff9ce6', head: [44, 10] },
    elmacho: { color: '#ff5252', head: [45, 6] },
  });

  // ---------------------------------------------------------------- Dru
  function dru(ctx, stage) {
    const cx = 45;
    if (stage >= 10) cape(ctx, cx, 58, 34, 62, '#f5f5f5');
    // white trousers + golden shoes
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * 7 - 3.2, 80, 6.4, 18, 2);
      D.fs(ctx, '#eceff1', OL, 1.2);
      D.ellipsePath(ctx, cx + s * 9, 99, 7, 3.2);
      ctx.fillStyle = D.lin(ctx, 0, 96, 0, 102, [[0, '#fff3b0'], [1, '#c79100']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    // white suit jacket (the same build as his twin)
    ctx.beginPath();
    ctx.moveTo(cx - 20, 50);
    ctx.quadraticCurveTo(cx - 25, 70, cx - 18, 86);
    ctx.lineTo(cx + 18, 86);
    ctx.quadraticCurveTo(cx + 25, 70, cx + 20, 50);
    ctx.quadraticCurveTo(cx, 44, cx - 20, 50);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 25, 0, cx + 25, 0, [[0, '#ffffff'], [0.5, '#f1f1ee'], [1, '#bdbdb5']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // lapels + pale blue shirt
    ctx.beginPath();
    ctx.moveTo(cx - 6, 48);
    ctx.lineTo(cx + 2, 64);
    ctx.lineTo(cx + 9, 48);
    ctx.closePath();
    D.fs(ctx, '#b3e5fc', OL, 1);
    ctx.strokeStyle = 'rgba(120,120,110,0.7)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx - 6, 48);
    ctx.lineTo(cx + 2, 66);
    ctx.lineTo(cx + 9, 48);
    ctx.stroke();
    // gold buttons
    [70, 78].forEach((y) => {
      D.circlePath(ctx, cx + 3, y, 1.8);
      D.fs(ctx, '#ffd740', OL, 0.7);
    });
    // left arm
    D.limb(ctx, cx - 18, 54, cx - 22, 76, 7, '#f1f1ee', { lw: 1.4, gloveColor: '#f2d2b0' });
    if (stage >= 5) {
      // gold chain with a big "D" medallion
      ctx.strokeStyle = '#ffd740';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - 9, 49);
      ctx.quadraticCurveTo(cx - 6, 62, cx + 1, 63);
      ctx.quadraticCurveTo(cx + 8, 62, cx + 11, 49);
      ctx.stroke();
      D.circlePath(ctx, cx + 1, 64, 4.4);
      ctx.fillStyle = D.rad(ctx, cx, 63, 0.5, cx + 1, 64, 4.4, [[0, '#fffde7'], [0.5, '#ffd740'], [1, '#b8860b']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.fillStyle = '#7a5200';
      ctx.font = 'bold 6px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('D', cx + 1, 64.3);
    }
    // head: Gru's head, but with a mop of golden hair
    const skin = '#f2d2b0';
    D.ellipsePath(ctx, cx - 16.5, 27, 3, 4.5);
    D.fs(ctx, '#e7bf98', OL, 1.1);
    D.ellipsePath(ctx, cx + 16.5, 27, 3, 4.5);
    D.fs(ctx, '#e7bf98', OL, 1.1);
    ctx.beginPath();
    ctx.moveTo(cx - 16, 24);
    ctx.bezierCurveTo(cx - 18, 8, cx + 18, 8, cx + 16, 24);
    ctx.bezierCurveTo(cx + 16, 38, cx + 8, 45, cx, 45);
    ctx.bezierCurveTo(cx - 8, 45, cx - 16, 38, cx - 16, 24);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, cx - 6, 14, 2, cx, 26, 22, [[0, '#fff1e2'], [0.5, skin], [1, '#d9a982']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // the hair: a big swept wave of gold
    ctx.beginPath();
    ctx.moveTo(cx - 18, 24);
    ctx.bezierCurveTo(cx - 24, 4, cx - 6, -4, cx + 6, 2);
    ctx.bezierCurveTo(cx + 18, -2, cx + 26, 10, cx + 18, 22);
    ctx.quadraticCurveTo(cx + 14, 13, cx + 6, 14);
    ctx.quadraticCurveTo(cx - 2, 10, cx - 8, 16);
    ctx.quadraticCurveTo(cx - 14, 16, cx - 18, 24);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 20, 0, cx + 20, 12, [[0, '#fff59d'], [0.45, '#ffd54f'], [1, '#c79100']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(160,110,0,0.6)';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 12 + i * 8, 14 - i);
      ctx.quadraticCurveTo(cx - 6 + i * 8, 2, cx + 4 + i * 7, 4 + i);
      ctx.stroke();
    }
    D.ellipsePath(ctx, cx - 6, 5, 6, 2, -0.3);
    D.fs(ctx, 'rgba(255,255,255,0.6)');
    // wavy sides over the ears and a swooping forelock
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 13, 12);
      ctx.quadraticCurveTo(cx + s * 22, 14, cx + s * 20, 22);
      ctx.quadraticCurveTo(cx + s * 23, 26, cx + s * 18, 29);
      ctx.quadraticCurveTo(cx + s * 17, 22, cx + s * 14, 18);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 12, 0, 29, [[0, '#ffe082'], [1, '#c79100']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx + 8, 12);
    ctx.bezierCurveTo(cx + 2, 12, cx - 6, 14, cx - 9, 21);
    ctx.quadraticCurveTo(cx - 3, 17, cx + 4, 17);
    ctx.quadraticCurveTo(cx + 9, 16, cx + 8, 12);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 9, 12, cx + 8, 21, [[0, '#fff59d'], [1, '#e0a800']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // friendly eyes (no heavy lids, unlike Gru)
    for (const s of [-1, 1]) {
      const ex = cx + s * 6.5, ey = 25;
      D.ellipsePath(ctx, ex, ey, 3.6, 3);
      D.fs(ctx, '#ffffff', OL, 0.9);
      D.circlePath(ctx, ex + 0.8, ey + 0.3, 1.6);
      D.fs(ctx, '#3e2723');
      D.circlePath(ctx, ex + 0.3, ey - 0.5, 0.6);
      D.fs(ctx, '#ffffff');
      ctx.strokeStyle = '#c79100';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(ex - 3.4, ey - 4.6);
      ctx.quadraticCurveTo(ex, ey - 6.2, ex + 3.4, ey - 4.8);
      ctx.stroke();
    }
    // the family nose
    ctx.beginPath();
    ctx.moveTo(cx - 3, 24);
    ctx.quadraticCurveTo(cx - 5.5, 36, cx + 1, 42);
    ctx.quadraticCurveTo(cx + 5.5, 35, cx + 3, 24);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 5, 0, cx + 5, 0, [[0, '#f8dcc0'], [1, '#d39c74']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // a huge grin
    ctx.beginPath();
    ctx.moveTo(cx - 8, 38.5);
    ctx.quadraticCurveTo(cx + 1, 46, cx + 9, 38);
    ctx.quadraticCurveTo(cx + 1, 41, cx - 8, 38.5);
    ctx.closePath();
    D.fs(ctx, '#ffffff', OL, 1);
    // right arm with the golden blaster
    D.limb(ctx, cx + 18, 54, cx + 24, 66, 7, '#f1f1ee', { lw: 1.4, gloveColor: '#f2d2b0', bend: [cx + 26, 58] });
    const big = stage >= 5;
    ctx.save();
    ctx.translate(cx + 22, 64);
    D.rrPath(ctx, -4, -5, big ? 22 : 18, 10, 4);
    ctx.fillStyle = D.lin(ctx, 0, -5, 0, 5, [[0, '#fff8c4'], [0.5, '#ffd740'], [1, '#a77700']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // coin slot
    D.rrPath(ctx, 2, -3.5, 7, 2, 1);
    D.fs(ctx, '#5d4037');
    const ex = big ? 19 : 15;
    D.circlePath(ctx, ex + 3, 0, 5);
    ctx.fillStyle = D.rad(ctx, ex + 2, -1, 0.5, ex + 3, 0, 5, [[0, '#ffffff'], [0.4, '#fff176'], [1, '#c79100']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (big) {
      // ruby on top
      ctx.beginPath();
      ctx.moveTo(6, -5);
      ctx.lineTo(9, -10);
      ctx.lineTo(12, -5);
      ctx.closePath();
      D.fs(ctx, '#ff1744', OL, 0.9);
    }
    if (stage >= 10) glowRing(ctx, ex + 3, 0, 9, '#ffd740', 0.9);
    ctx.restore();
  }

  // ---------------------------------------------------------------- Agnes
  // the fluffy unicorn plush she never lets go of
  function unicornPlush(ctx, x, y, s, stage) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const rnd = D.rng(41);
    // body
    D.blobPath(ctx, 0, 2, 9, 12, 0.18, rnd);
    ctx.fillStyle = D.rad(ctx, -3, -2, 1, 0, 2, 11, [[0, '#ffffff'], [0.7, '#fbe9f5'], [1, '#e1bee7']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // head
    D.blobPath(ctx, 7, -7, 6.5, 10, 0.2, rnd);
    ctx.fillStyle = D.rad(ctx, 5, -9, 0.5, 7, -7, 7, [[0, '#ffffff'], [1, '#f3d9ef']]);
    ctx.fill();
    ctx.stroke();
    // golden horn
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.lineTo(13, -22);
    ctx.lineTo(11.5, -11);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 8, -12, 13, -22, [[0, '#ffb300'], [1, '#fff59d']]);
    ctx.fill();
    ctx.lineWidth = 0.9;
    ctx.stroke();
    // rainbow mane
    ['#ff5252', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff'].forEach((col, i) => {
      D.ellipsePath(ctx, 2 - i * 0.6, -11 + i * 2.6, 3.2, 1.8, -0.6);
      D.fs(ctx, col, OL, 0.6);
    });
    // eye + legs
    D.circlePath(ctx, 9.5, -7.5, 1.1);
    D.fs(ctx, '#222');
    for (let i = 0; i < 2; i++) {
      D.rrPath(ctx, -5 + i * 7, 9, 3.4, 4, 1.4);
      D.fs(ctx, '#f8bbd0', OL, 0.7);
    }
    if (stage >= 5) glowRing(ctx, 11, -18, 5, '#fff59d', 0.9);
    ctx.restore();
  }

  function agnes(ctx, stage) {
    const cx = 44;
    if (stage >= 10) {
      // glittery rainbow fairy wings
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(cx + s * 6, 62);
        ctx.scale(s, 1);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(14, -30, 34, -22, 26, -4);
        ctx.bezierCurveTo(34, 8, 18, 22, 0, 6);
        ctx.closePath();
        ctx.fillStyle = D.lin(ctx, 0, -26, 0, 20, [[0, 'rgba(255,128,171,0.85)'], [0.35, 'rgba(255,241,118,0.85)'], [0.65, 'rgba(105,240,174,0.85)'], [1, 'rgba(64,196,255,0.85)']]);
        ctx.fill();
        ctx.strokeStyle = OL;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.restore();
      }
    }
    // little shoes + socks
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * 5 - 2.4, 84, 4.8, 12, 2);
      D.fs(ctx, '#fff8e1', OL, 1);
      D.ellipsePath(ctx, cx + s * 5 + 1.5, 98.5, 5, 2.6);
      D.fs(ctx, '#5d4037', OL, 1);
    }
    // yellow shirt sleeves under blue overall dress
    ctx.beginPath();
    ctx.moveTo(cx - 11, 58);
    ctx.quadraticCurveTo(cx - 16, 76, cx - 17, 88);
    ctx.lineTo(cx + 17, 88);
    ctx.quadraticCurveTo(cx + 16, 76, cx + 11, 58);
    ctx.quadraticCurveTo(cx, 54, cx - 11, 58);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 17, 0, cx + 17, 0, [[0, '#90caf9'], [0.5, '#5c9ee8'], [1, '#2f6db5']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // bib + straps + pocket
    D.rrPath(ctx, cx - 7, 60, 14, 11, 3);
    D.fs(ctx, '#64a7f0', OL, 1);
    D.rrPath(ctx, cx - 3.5, 63, 7, 5, 1.5);
    D.fs(ctx, '#4a8bd6', 'rgba(20,40,80,0.6)', 0.8);
    for (const s of [-1, 1]) {
      D.circlePath(ctx, cx + s * 5.5, 61.5, 1.4);
      D.fs(ctx, '#ffd740', OL, 0.6);
    }
    D.limb(ctx, cx - 10, 61, cx - 15, 78, 5, '#ffcc40', { lw: 1.2, gloveColor: '#f9dcc4' });
    if (stage >= 5) {
      // heart patch
      ctx.beginPath();
      ctx.moveTo(cx - 9, 80);
      ctx.bezierCurveTo(cx - 13, 76, cx - 11, 72, cx - 9, 75);
      ctx.bezierCurveTo(cx - 7, 72, cx - 5, 76, cx - 9, 80);
      D.fs(ctx, '#ff80ab', OL, 0.7);
    }
    // hair at the back
    ctx.beginPath();
    ctx.moveTo(cx - 15, 40);
    ctx.bezierCurveTo(cx - 19, 22, cx - 6, 14, cx + 2, 15);
    ctx.bezierCurveTo(cx + 14, 15, cx + 20, 26, cx + 15, 42);
    ctx.closePath();
    D.fs(ctx, '#4e342e', OL, 1.3);
    // the famous ponytail sticking straight up
    ctx.beginPath();
    ctx.moveTo(cx - 2, 18);
    ctx.bezierCurveTo(cx - 9, 6, cx - 4, -2, cx + 2, 2);
    ctx.bezierCurveTo(cx + 8, -1, cx + 10, 8, cx + 4, 18);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 6, 0, cx + 8, 0, [[0, '#795548'], [1, '#3e2723']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    D.rrPath(ctx, cx - 3.5, 15, 8, 3.4, 1.5);
    D.fs(ctx, '#ff4081', OL, 0.8);
    // big round face
    face(ctx, cx + 1, 36, 13, 13.5, '#f9dcc4');
    // bangs
    ctx.beginPath();
    ctx.moveTo(cx - 12, 34);
    ctx.bezierCurveTo(cx - 13, 20, cx + 13, 18, cx + 14, 32);
    ctx.quadraticCurveTo(cx + 8, 26, cx + 3, 28);
    ctx.quadraticCurveTo(cx - 4, 24, cx - 12, 34);
    ctx.closePath();
    D.fs(ctx, '#5d4037', OL, 1.1);
    // huge sparkly eyes
    eye(ctx, cx - 4, 37, 3.6, 4.2, '#5d4037', false);
    eye(ctx, cx + 6, 37, 3.6, 4.2, '#5d4037', false);
    D.ellipsePath(ctx, cx - 8.5, 43, 2.4, 1.4);
    D.fs(ctx, 'rgba(255,120,150,0.45)');
    D.ellipsePath(ctx, cx + 10.5, 43, 2.4, 1.4);
    D.fs(ctx, 'rgba(255,120,150,0.45)');
    // happy open mouth
    ctx.beginPath();
    ctx.moveTo(cx - 2, 44);
    ctx.quadraticCurveTo(cx + 1.5, 49, cx + 5, 44);
    ctx.closePath();
    D.fs(ctx, '#c2185b', OL, 0.9);
    if (stage >= 5) {
      // a little sparkly tiara
      ctx.beginPath();
      ctx.moveTo(cx - 7, 23);
      ctx.lineTo(cx - 5, 17);
      ctx.lineTo(cx - 1, 21);
      ctx.lineTo(cx + 2, 15);
      ctx.lineTo(cx + 5, 21);
      ctx.lineTo(cx + 9, 17);
      ctx.lineTo(cx + 10, 23);
      ctx.closePath();
      ctx.fillStyle = D.lin(ctx, 0, 15, 0, 23, [[0, '#fffde7'], [1, '#ffca28']]);
      ctx.fill();
      ctx.strokeStyle = OL;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      D.circlePath(ctx, cx + 2, 19, 1.3);
      D.fs(ctx, '#ff4081');
    }
    // right arm hugging the unicorn
    D.limb(ctx, cx + 10, 61, cx + 18, 68, 5, '#ffcc40', { lw: 1.2, gloveColor: '#f9dcc4', bend: [cx + 18, 60] });
    unicornPlush(ctx, cx + 22, 64, stage >= 5 ? 1.15 : 1, stage);
  }

  // ---------------------------------------------------------------- El Macho
  function elmacho(ctx, stage) {
    const cx = 45;
    if (stage >= 5) cape(ctx, cx, 56, 40, 66, '#c62828');
    // legs: black trousers + cowboy boots
    for (const s of [-1, 1]) {
      D.rrPath(ctx, cx + s * 8 - 4, 80, 8, 16, 3);
      D.fs(ctx, '#212121', OL, 1.2);
      D.rrPath(ctx, cx + s * 8 - 5, 91, 10, 8, 3);
      D.fs(ctx, '#5d4037', OL, 1.1);
      D.ellipsePath(ctx, cx + s * 8 + 2, 99.5, 7, 2.6);
      D.fs(ctx, '#3e2723', OL, 1.1);
    }
    // huge barrel chest: tan skin under an open red shirt
    const skin = '#d9a06b';
    ctx.beginPath();
    ctx.moveTo(cx - 26, 48);
    ctx.quadraticCurveTo(cx - 30, 66, cx - 18, 84);
    ctx.lineTo(cx + 18, 84);
    ctx.quadraticCurveTo(cx + 30, 66, cx + 26, 48);
    ctx.quadraticCurveTo(cx, 40, cx - 26, 48);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, cx - 28, 0, cx + 28, 0, [[0, '#ff6f60'], [0.5, '#d32f2f'], [1, '#7f1010']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // the open V of the shirt with a hairy chest
    ctx.beginPath();
    ctx.moveTo(cx - 12, 46);
    ctx.lineTo(cx, 72);
    ctx.lineTo(cx + 12, 46);
    ctx.closePath();
    ctx.fillStyle = D.rad(ctx, cx - 3, 52, 1, cx, 56, 16, [[0, '#f0c59a'], [1, skin]]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,20,10,0.55)';
    ctx.lineWidth = 0.8;
    const rnd = D.rng(23);
    for (let i = 0; i < 14; i++) {
      const x = cx - 6 + rnd() * 12, y = 50 + rnd() * 14;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 1.5, y - 1, x + 1, y + 1.5);
      ctx.stroke();
    }
    // gold chain
    ctx.strokeStyle = '#ffd740';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 9, 48);
    ctx.quadraticCurveTo(cx, 62, cx + 9, 48);
    ctx.stroke();
    // champion belt
    D.rrPath(ctx, cx - 22, 76, 44, 8, 3);
    D.fs(ctx, '#3e2723', OL, 1.2);
    D.ellipsePath(ctx, cx, 80, 8, 5.5);
    ctx.fillStyle = D.rad(ctx, cx - 2, 78, 0.5, cx, 80, 8, [[0, '#fffde7'], [0.5, '#ffd740'], [1, '#a77700']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (stage >= 10) {
      // the dynamite he strapped to his chest
      ctx.save();
      ctx.translate(cx, 60);
      ctx.rotate(-0.5);
      D.rrPath(ctx, -26, -3, 52, 6, 2);
      D.fs(ctx, '#5d4037', OL, 1);
      for (let i = -2; i <= 2; i++) {
        D.rrPath(ctx, i * 9 - 2.6, -7, 5.2, 13, 1.5);
        D.fs(ctx, '#e53935', OL, 0.8);
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(i * 9, -7);
        ctx.quadraticCurveTo(i * 9 + 2, -10, i * 9 + 1, -12);
        ctx.stroke();
      }
      ctx.restore();
    }
    // left arm: a massive bicep
    D.limb(ctx, cx - 24, 52, cx - 28, 76, 11, skin, { lw: 1.4, gloveColor: skin });
    // head
    D.rrPath(ctx, cx - 5, 36, 10, 10, 3);
    D.fs(ctx, skin, OL, 1.1);
    face(ctx, cx + 1, 26, 13, 14, skin);
    // slicked-back black pompadour
    ctx.beginPath();
    ctx.moveTo(cx - 13, 24);
    ctx.bezierCurveTo(cx - 17, 6, cx - 2, 0, cx + 8, 3);
    ctx.bezierCurveTo(cx + 18, 4, cx + 18, 14, cx + 14, 22);
    ctx.quadraticCurveTo(cx + 10, 14, cx + 2, 15);
    ctx.quadraticCurveTo(cx - 8, 14, cx - 13, 24);
    ctx.closePath();
    ctx.fillStyle = D.lin(ctx, 0, 0, 0, 22, [[0, '#4a4a4a'], [1, '#0d0d0d']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    D.ellipsePath(ctx, cx, 6, 6, 1.6, -0.2);
    D.fs(ctx, 'rgba(255,255,255,0.45)');
    // thick brows and narrow, cocky eyes
    for (const s of [-1, 1]) {
      const ex = cx + 1 + s * 5.5, ey = 24;
      D.ellipsePath(ctx, ex, ey, 3, 2.2);
      D.fs(ctx, '#ffffff', OL, 0.8);
      D.circlePath(ctx, ex + 0.6, ey + 0.2, 1.3);
      D.fs(ctx, '#1a1a1a');
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(ex - 4, ey - 3.4 + (s > 0 ? 0.6 : 0));
      ctx.lineTo(ex + 4, ey - 4.2 - (s > 0 ? 0 : 0.6));
      ctx.lineTo(ex + 4, ey - 2.4);
      ctx.lineTo(ex - 4, ey - 1.8);
      ctx.closePath();
      ctx.fill();
    }
    // nose
    ctx.beginPath();
    ctx.moveTo(cx, 26);
    ctx.quadraticCurveTo(cx + 6, 32, cx + 2, 34);
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // the magnificent moustache
    ctx.beginPath();
    ctx.moveTo(cx + 1, 34);
    ctx.bezierCurveTo(cx - 6, 32, cx - 13, 36, cx - 14, 42);
    ctx.bezierCurveTo(cx - 8, 38, cx - 3, 39, cx + 1, 37);
    ctx.bezierCurveTo(cx + 5, 39, cx + 10, 38, cx + 16, 42);
    ctx.bezierCurveTo(cx + 15, 36, cx + 8, 32, cx + 1, 34);
    ctx.closePath();
    D.fs(ctx, '#111111', OL, 0.9);
    // grin with a gold tooth
    ctx.beginPath();
    ctx.moveTo(cx - 4, 40);
    ctx.quadraticCurveTo(cx + 1, 44, cx + 6, 40);
    ctx.closePath();
    D.fs(ctx, '#ffffff', OL, 0.8);
    ctx.fillStyle = '#ffd740';
    ctx.fillRect(cx + 1.6, 40.3, 1.6, 1.8);
    if (stage >= 10) {
      // Pollito, perched on his shoulder
      chicken(ctx, cx - 22, 42, 0.8);
    }
    // right arm: a fist ready to punch
    D.limb(ctx, cx + 24, 52, cx + 30, 64, 11, skin, { lw: 1.4, gloveColor: skin, bend: [cx + 32, 54] });
    D.circlePath(ctx, cx + 31, 64, 7.4);
    ctx.fillStyle = D.rad(ctx, cx + 29, 62, 0.5, cx + 31, 64, 8, [[0, '#f0c59a'], [1, '#b97a45']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,0.6)';
    ctx.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + 33, 61 + i * 2.6);
      ctx.lineTo(cx + 37, 61 + i * 2.6);
      ctx.stroke();
    }
    if (stage >= 5) glowRing(ctx, cx + 31, 64, 11, '#ff8a65', 0.55);
  }

  // Pollito the chicken (also used for the ability and the boss' chicken bombs)
  function chicken(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // tail
    for (let i = 0; i < 3; i++) {
      D.ellipsePath(ctx, -9 + i, -4 - i * 3, 5, 2.4, -0.8 + i * 0.3);
      D.fs(ctx, ['#5d4037', '#8d6e63', '#3e2723'][i], OL, 0.8);
    }
    // body
    D.ellipsePath(ctx, 0, 0, 9, 7.5);
    ctx.fillStyle = D.rad(ctx, -2, -3, 1, 0, 0, 10, [[0, '#ffffff'], [0.7, '#f5f5f5'], [1, '#d7ccc8']]);
    ctx.fill();
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // wing
    D.ellipsePath(ctx, -1, 1, 5, 3.4, 0.3);
    D.fs(ctx, '#e0e0e0', OL, 0.8);
    // head + comb + beak
    D.circlePath(ctx, 6, -7, 4.6);
    D.fs(ctx, '#ffffff', OL, 1);
    for (let i = 0; i < 3; i++) {
      D.circlePath(ctx, 4 + i * 2, -11.5 + Math.abs(i - 1) * 0.8, 1.6);
      D.fs(ctx, '#e53935', OL, 0.6);
    }
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(14, -6.5);
    ctx.lineTo(10, -5);
    ctx.closePath();
    D.fs(ctx, '#ffb300', OL, 0.7);
    D.ellipsePath(ctx, 9.5, -3.6, 1.2, 2);
    D.fs(ctx, '#e53935', OL, 0.5);
    // one angry eye
    D.circlePath(ctx, 7.4, -7.6, 1.5);
    D.fs(ctx, '#fff59d', OL, 0.5);
    D.circlePath(ctx, 7.8, -7.4, 0.7);
    D.fs(ctx, '#111');
    ctx.strokeStyle = OL;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(5.4, -10);
    ctx.lineTo(9.4, -8.6);
    ctx.stroke();
    // legs
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, 7);
    ctx.lineTo(-3, 11);
    ctx.moveTo(2, 7);
    ctx.lineTo(3, 11);
    ctx.stroke();
    ctx.restore();
  }

  Object.assign(MT.HeroArt, { dru, agnes, elmacho, chicken, unicornPlush });
})();
