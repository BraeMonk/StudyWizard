// engine/dragdrop.js
const DragDrop = {
  furniture: [],
  selected: null,
  offsetX: 0,
  offsetY: 0,

  // List of furniture keys that match your SVG filenames (without .svg)
  furnitureCatalog: [
    "reading_chair",
    "study_desk",
    "tall_bookshelf",
    "short_bookshelf",
    "round_table",
    "candle_cluster",
    "rug_round",
    "rug_long",
    "cauldron",
    "armchair",
    "bed_frame",
    "nightstand",
    "plant_stand",
    "potion_shelf",
    "scroll_rack"
  ],

  init() {
    // Simple layout: spread them out in a grid-ish way
    const startX = 80;
    const startY = 120;
    const spacingX = 180;
    const spacingY = 150;
    let col = 0;
    let row = 0;

    this.furniture = [];

    this.furnitureCatalog.forEach((key, index) => {
      const img = new Image();
      img.src = `assets/furniture/${key}.svg`;

      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      this.furniture.push({
        key,
        img,
        x,
        y,
        w: 128,
        h: 128
      });

      col++;
      if (col > 3) {
        col = 0;
        row++;
      }
    });
  },

  render(ctx) {
    this.furniture.forEach(f => {
      if (f.img.complete) {
        ctx.drawImage(f.img, f.x, f.y, f.w, f.h);
      }
    });
  },

  hitTest(x, y) {
    // iterate from topmost down so we grab the "front" item first
    for (let i = this.furniture.length - 1; i >= 0; i--) {
      const f = this.furniture[i];
      if (
        x >= f.x && x <= f.x + f.w &&
        y >= f.y && y <= f.y + f.h
      ) {
        return f;
      }
    }
    return null;
  },

  onPointerDown(x, y) {
    const hit = this.hitTest(x, y);
    if (hit) {
      this.selected = hit;
      this.offsetX = x - hit.x;
      this.offsetY = y - hit.y;

      // bring selected item to front (highest z-order)
      const idx = this.furniture.indexOf(hit);
      if (idx > -1) {
        this.furniture.splice(idx, 1);
        this.furniture.push(hit);
      }
    }
  },

  onPointerMove(x, y) {
    if (this.selected) {
      this.selected.x = x - this.offsetX;
      this.selected.y = y - this.offsetY;
    }
  },

  onPointerUp() {
    this.selected = null;
  }
};
