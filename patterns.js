/*!
 * Sacred Geometry Generator - pattern definitions
 * https://github.com/evoluteur/sacred-geometry
 * (c) 2026 Olivier Giulieri - MIT license
 *
 * Every pattern is built in an abstract unit space (the construction circle
 * has radius 1) and returns plain shape descriptors, so the same code can
 * feed the DOM, an exported SVG file, or a test runner.
 *
 *   draw(options) -> { shapes: [{ tag, attrs, guide }], extent }
 *
 * "extent" is the radius of the drawing around the origin: the renderer uses
 * it to scale the pattern into the viewBox.
 */

const PHI = (1 + Math.sqrt(5)) / 2;
const SQRT3 = Math.sqrt(3);
const DEG = Math.PI / 180;

// 4 decimals is plenty at any export size, and keeps the SVG small
const n4 = (n) => Math.round(n * 1e4) / 1e4;
const xy = (p) => `${n4(p[0])},${n4(p[1])}`;

const polar = (dist, deg) => [
  dist * Math.cos(deg * DEG),
  dist * Math.sin(deg * DEG),
];

// 6 points on a circle, starting at "offset" degrees
const hex = (dist, offset = 0) =>
  [0, 1, 2, 3, 4, 5].map((i) => polar(dist, i * 60 + offset));

// "len" is the exact outline length, which the renderer uses to animate the
// drawing (browsers measure a circle's length too crudely to do it for us)
const shape = (tag, attrs, len, guide) => ({
  tag,
  attrs,
  len: n4(len),
  guide: !!guide,
});

const circle = (c, r, guide) =>
  shape(
    "circle",
    { cx: n4(c[0]), cy: n4(c[1]), r: n4(r) },
    2 * Math.PI * r,
    guide,
  );

const line = (a, b, guide) =>
  shape(
    "line",
    { x1: n4(a[0]), y1: n4(a[1]), x2: n4(b[0]), y2: n4(b[1]) },
    Math.hypot(b[0] - a[0], b[1] - a[1]),
    guide,
  );

const polygon = (pts, guide) =>
  shape(
    "polygon",
    { points: pts.map(xy).join(" ") },
    pts.reduce((sum, p, i) => {
      const q = pts[(i + 1) % pts.length];
      return sum + Math.hypot(q[0] - p[0], q[1] - p[1]);
    }, 0),
    guide,
  );

const path = (d, len, guide) => shape("path", { d }, len, guide);

// every pair of points, once
const pairs = (pts) => {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) out.push([pts[i], pts[j]]);
  }
  return out;
};

// The lens (mandorla) shared by two unit circles whose centers are "d" apart
const mandorla = (mid, d, r = 1) => {
  const h = Math.sqrt(r * r - (d / 2) * (d / 2));
  const lens = path(
    `M ${n4(mid)},${n4(-h)} A ${n4(r)},${n4(r)} 0 0,1 ${n4(mid)},${n4(h)}` +
      ` A ${n4(r)},${n4(r)} 0 0,1 ${n4(mid)},${n4(-h)} Z`,
    // two arcs, each subtending 120 degrees
    (4 * Math.PI * r) / 3,
  );
  lens.fill = true; // the renderer tints it with the palette color
  return lens;
};

// Triangular lattice of circle centers, keeping everything within "rings"
const lattice = (rings) => {
  const pts = [];
  const span = rings + 1;
  for (let i = -span; i <= span; i++) {
    for (let j = -span; j <= span; j++) {
      const x = i + j * 0.5;
      const y = (j * SQRT3) / 2;
      if (Math.hypot(x, y) <= rings + 1e-9) pts.push([x, y]);
    }
  }
  return pts;
};

// Fibonacci squares, spiralling counter-clockwise out of a unit seed square.
// dir: 0 right, 1 up, 2 left, 3 down - it also picks the arc's pivot corner.
const fibSquares = (count) => {
  const sq = [{ x0: 0, y0: 0, x1: 1, y1: 1, dir: 3 }];
  let minx = 0;
  let miny = 0;
  let maxx = 1;
  let maxy = 1;
  for (let k = 1; k < count; k++) {
    const dir = (k - 1) % 4;
    if (dir === 0) {
      const s = maxy - miny;
      sq.push({ x0: maxx, y0: miny, x1: maxx + s, y1: miny + s, dir });
      maxx += s;
    } else if (dir === 1) {
      const s = maxx - minx;
      sq.push({ x0: minx, y0: maxy, x1: minx + s, y1: maxy + s, dir });
      maxy += s;
    } else if (dir === 2) {
      const s = maxy - miny;
      sq.push({ x0: minx - s, y0: maxy - s, x1: minx, y1: maxy, dir });
      minx -= s;
    } else {
      const s = maxx - minx;
      sq.push({ x0: maxx - s, y0: miny - s, x1: maxx, y1: miny, dir });
      miny -= s;
    }
  }
  return { sq, bbox: [minx, miny, maxx, maxy] };
};

const PATTERNS = [
  {
    id: "vesica",
    name: "Vesica Piscis",
    tagline: "Two become one",
    blurb:
      "Two circles, each passing through the other's center. The almond-shaped overlap - the mandorla - holds the square roots of 2, 3, and 5, and every pattern that follows is built from it.",
    steps: { label: "Circles", min: 2, max: 8, def: 2 },
    draw({ steps = 2 }) {
      const n = Math.max(2, steps);
      const shapes = [];
      const xs = [];
      for (let i = 0; i < n; i++) xs.push(i - (n - 1) / 2);
      // guides first so they sit behind the figure
      shapes.push(line([xs[0] - 1.15, 0], [xs[n - 1] + 1.15, 0], true));
      const h = SQRT3 / 2;
      for (let i = 0; i < n - 1; i++) {
        const mid = (xs[i] + xs[i + 1]) / 2;
        shapes.push(line([mid, -h], [mid, h], true));
        shapes.push(
          polygon(
            [
              [xs[i], 0],
              [xs[i + 1], 0],
              [mid, -h],
            ],
            true,
          ),
        );
        shapes.push(
          polygon(
            [
              [xs[i], 0],
              [xs[i + 1], 0],
              [mid, h],
            ],
            true,
          ),
        );
      }
      xs.forEach((x) => shapes.push(circle([x, 0], 1)));
      for (let i = 0; i < n - 1; i++) {
        shapes.push(mandorla((xs[i] + xs[i + 1]) / 2, 1));
      }
      return { shapes, extent: (n - 1) / 2 + 1 };
    },
  },
  {
    id: "seed",
    name: "Seed of Life",
    tagline: "Seven days, seven circles",
    blurb:
      "Six circles around a seventh, each one centered on the rim of the last. Six overlapping vesicas make the six-petalled rosette at the heart of the Flower of Life.",
    steps: null,
    draw() {
      const shapes = [polygon(hex(1), true), circle([0, 0], 2, true)];
      shapes.push(circle([0, 0], 1));
      hex(1).forEach((c) => shapes.push(circle(c, 1)));
      return { shapes, extent: 2 };
    },
  },
  {
    id: "flower",
    name: "Flower of Life",
    tagline: "The lattice everything grows on",
    blurb:
      "The Seed of Life continued outward on a triangular lattice. Two rings give the classic nineteen-circle flower carved on the Osirion at Abydos; keep going and the rosettes tile the plane forever.",
    steps: { label: "Rings", min: 1, max: 6, def: 2 },
    draw({ steps = 2 }) {
      const rings = Math.max(1, steps);
      const shapes = [polygon(hex(rings), true)];
      lattice(rings).forEach((c) => shapes.push(circle(c, 1)));
      shapes.push(circle([0, 0], rings + 1));
      shapes.push(circle([0, 0], rings + 1.1));
      return { shapes, extent: rings + 1.1 };
    },
  },
  {
    id: "metatron",
    name: "Metatron's Cube",
    tagline: "Thirteen circles, seventy-eight lines",
    blurb:
      "Take the thirteen complete circles of the Fruit of Life and join every center to every other one. The seventy-eight lines hold two hexagrams, a hexagon, and the flat shadows of all five Platonic solids.",
    steps: null,
    draw() {
      const centers = [[0, 0]].concat(hex(2), hex(2 * SQRT3, 30));
      const shapes = [
        circle([0, 0], 2 * SQRT3 + 1, true),
        polygon(hex(2), true),
      ];
      centers.forEach((c) => shapes.push(circle(c, 1)));
      pairs(centers).forEach(([a, b]) => shapes.push(line(a, b)));
      return { shapes, extent: 2 * SQRT3 + 1 };
    },
  },
  {
    id: "golden",
    name: "Golden Spiral",
    tagline: "1, 1, 2, 3, 5, 8, 13...",
    blurb:
      "Fibonacci squares laid corner to corner, each one the sum of the two before it. Quarter circles across them approximate the logarithmic spiral that grows by phi (1.618...) every quarter turn.",
    steps: { label: "Squares", min: 2, max: 13, def: 8 },
    draw({ steps = 8 }) {
      const count = Math.max(2, steps);
      const { sq, bbox } = fibSquares(count);
      const cx = (bbox[0] + bbox[2]) / 2;
      const cy = (bbox[1] + bbox[3]) / 2;
      // center the figure and flip y so the spiral reads the usual way up
      const p = (x, y) => [x - cx, -(y - cy)];
      const shapes = [];
      sq.forEach((s) => {
        const c = p(s.x0, s.y1);
        const side = s.x1 - s.x0;
        shapes.push(
          shape(
            "rect",
            {
              x: n4(c[0]),
              y: n4(c[1]),
              width: n4(side),
              height: n4(side),
            },
            4 * side,
            true,
          ),
        );
      });
      const bw = bbox[2] - bbox[0];
      const bh = bbox[3] - bbox[1];
      shapes.push(
        shape(
          "rect",
          {
            x: n4(bbox[0] - cx),
            y: n4(-(bbox[3] - cy)),
            width: n4(bw),
            height: n4(bh),
          },
          2 * (bw + bh),
          true,
        ),
      );
      sq.forEach((s) => {
        const r = s.x1 - s.x0;
        let from;
        let to;
        if (s.dir === 0) {
          from = p(s.x0, s.y0);
          to = p(s.x1, s.y1);
        } else if (s.dir === 1) {
          from = p(s.x1, s.y0);
          to = p(s.x0, s.y1);
        } else if (s.dir === 2) {
          from = p(s.x1, s.y1);
          to = p(s.x0, s.y0);
        } else {
          from = p(s.x0, s.y1);
          to = p(s.x1, s.y0);
        }
        shapes.push(
          path(
            `M ${xy(from)} A ${n4(r)},${n4(r)} 0 0,0 ${xy(to)}`,
            (Math.PI * r) / 2,
          ),
        );
      });
      return {
        shapes,
        extent: Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]) / 2,
      };
    },
  },
];

const patternById = (id) => PATTERNS.find((p) => p.id === id) || PATTERNS[0];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PATTERNS, patternById, PHI };
}
