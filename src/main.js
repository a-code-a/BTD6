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
      width: MT.CFG.W * R,
      height: MT.CFG.H * R,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
      disableContextMenu: true,
      banner: false,
      scene: [MT.BootScene, MT.MenuScene, MT.MapSelectScene, MT.GameScene],
    });
  });
})();
