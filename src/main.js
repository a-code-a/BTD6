// Entry point: wait for the cartoon fonts, then boot Phaser.
(function () {
  const fontsReady = (document.fonts && document.fonts.load)
    ? Promise.all([
      document.fonts.load('40px "Luckiest Guy"'),
      document.fonts.load('700 20px "Fredoka"'),
    ]).catch(() => null)
    : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 2500));

  Promise.race([fontsReady, timeout]).then(() => {
    const R = MT.CFG.RES;
    MT.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      backgroundColor: '#1b2a49',
      width: Math.round(MT.CFG.W * R),
      height: Math.round(MT.CFG.H * R),
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      // snap sprites and text to whole device pixels so nothing is drawn half
      // between two pixels (a big source of blurry text)
      render: { antialias: true, roundPixels: true },
      disableContextMenu: true,
      banner: false,
      scene: [MT.BootScene, MT.MenuScene, MT.MapSelectScene, MT.GameScene],
    });
    let timer = null;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => MT.applyResolution(MT.game), 300);
    });
  });
})();
