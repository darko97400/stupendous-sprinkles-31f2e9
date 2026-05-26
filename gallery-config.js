/*
  Project S Gallery Config
  ------------------------
  To choose which images appear in the Gallery:
  - show: true  = visible
  - show: false = hidden

  You can also rename the title.
  Keep the file path exactly the same unless you replace images in /assets.
*/

window.PROJECTS_GALLERY = [
  {
    title: "VR Gameplay",
    file: "assets/gameplay-vr.png",
    show: true
  },
  {
    title: "Victory",
    file: "assets/victory.png",
    show: true
  },
  {
    title: "Big Bob & Bouba",
    file: "assets/robots-box.png",
    show: false
  },
  {
    title: "Key Art",
    file: "assets/hero-packshot.png",
    show: true
  },

  // Hidden by default because you marked them with a red X.
  {
    title: "Hero Art",
    file: "assets/hero-bg.png",
    show: false
  },
  {
    title: "Alt Art",
    file: "assets/alt-packshot.png",
    show: false
  }
];
