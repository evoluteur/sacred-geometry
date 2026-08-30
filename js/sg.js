/*!
 * Sacred Geometry Generator - rendering and UI
 * https://github.com/evoluteur/sacred-geometry
 * (c) 2026 Olivier Giulieri - MIT license
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const VIEW = 100; // viewBox is "-50 -50 100 100"
const PAD = 0.94; // margin left around the figure

const PALETTES = [
  { id: "gold", name: "Gold", stroke: "#d4af37", guide: "#d4af37" },
  { id: "moon", name: "Moonlight", stroke: "#eef1ff", guide: "#aab4e8" },
  { id: "rose", name: "Rose Quartz", stroke: "#f3a7bd", guide: "#c98aa5" },
  { id: "jade", name: "Jade", stroke: "#7fd6b5", guide: "#5fae95" },
  { id: "spectrum", name: "Spectrum", stroke: null, guide: "#8d88b8" },
  { id: "ink", name: "Ink", stroke: "#1b1b2f", guide: "#1b1b2f" },
];

const BACKGROUNDS = [
  { id: "midnight", name: "Midnight", fill: "#12122a" },
  { id: "void", name: "Void", fill: "#000000" },
  { id: "parchment", name: "Parchment", fill: "#f4ecd8" },
  { id: "none", name: "Transparent", fill: null },
];

const byId = (list, id) => list.find((x) => x.id === id) || list[0];

const svgEl = (tag, attrs) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) {
    if (attrs[k] !== null && attrs[k] !== undefined) {
      node.setAttribute(k, attrs[k]);
    }
  }
  return node;
};

// Options: { steps, rot, stroke, palette, bg, guides, animate }
const buildSvg = (pattern, o) => {
  const pal = byId(PALETTES, o.palette);
  const bg = byId(BACKGROUNDS, o.bg);
  const { shapes, extent } = pattern.draw({ steps: o.steps });
  const scale = ((VIEW / 2) * PAD) / extent;
  const svg = svgEl("svg", {
    viewBox: `${-VIEW / 2} ${-VIEW / 2} ${VIEW} ${VIEW}`,
    class: o.animate ? "anim" : null,
  });
  if (bg.fill) {
    svg.appendChild(
      svgEl("rect", {
        x: -VIEW / 2,
        y: -VIEW / 2,
        width: VIEW,
        height: VIEW,
        fill: bg.fill,
      }),
    );
  }
  const layer = (isGuide) =>
    svgEl("g", {
      fill: "none",
      stroke: isGuide ? pal.guide : pal.stroke,
      "stroke-opacity": isGuide ? 0.3 : 1,
      "stroke-width": (isGuide ? o.stroke * 0.6 : o.stroke) / scale,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      transform: `scale(${scale}) rotate(${o.rot})`,
    });
  const guides = layer(true);
  const main = layer(false);
  const drawn = shapes.filter((s) => o.guides || !s.guide);
  const step = Math.min(0.04, 0.9 / Math.max(drawn.length, 1));
  drawn.forEach((s, i) => {
    const node = svgEl(s.tag, s.attrs);
    node.setAttribute("data-len", "");
    node.style.setProperty("--len", s.len || 100);
    let stroke = s.guide ? pal.guide : pal.stroke;
    if (pal.stroke === null && !s.guide) {
      const hue = 190 + Math.round((280 * i) / Math.max(drawn.length - 1, 1));
      stroke = `hsl(${hue}, 72%, 64%)`;
      node.setAttribute("stroke", stroke);
    }
    if (s.fill) {
      node.setAttribute("fill", stroke || pal.guide);
      node.setAttribute("fill-opacity", 0.1);
    }
    if (o.animate) node.style.animationDelay = `${(i * step).toFixed(3)}s`;
    (s.guide ? guides : main).appendChild(node);
  });
  svg.appendChild(guides);
  svg.appendChild(main);
  return svg;
};

const svgMarkup = (node, size = 1024) => {
  const clone = node.cloneNode(true);
  clone.removeAttribute("class");
  clone.setAttribute("xmlns", SVG_NS);
  clone.setAttribute("width", size);
  clone.setAttribute("height", size);
  clone.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
  clone
    .querySelectorAll("[data-len]")
    .forEach((n) => n.removeAttribute("data-len"));
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
};

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/* ------------------------------------------------------------------ app */

const $ = (id) => document.getElementById(id);

const state = {
  pattern: PATTERNS[0],
  steps: 2,
  rot: 0,
  stroke: 0.5,
  palette: "gold",
  bg: "midnight",
  guides: false,
  animate: true,
};

const hint = (msg) => {
  const el = $("hint");
  if (!el) return;
  el.textContent = msg;
  clearTimeout(hint.timer);
  hint.timer = setTimeout(() => (el.textContent = ""), 2600);
};

const render = () => {
  const svg = buildSvg(state.pattern, state);
  const stage = $("stage");
  stage.replaceChildren(svg);
};

const setPattern = (id, skipHash) => {
  const p = patternById(id);
  state.pattern = p;
  state.steps = p.steps ? p.steps.def : 0;
  $("pname").textContent = p.name;
  $("tagline").textContent = p.tagline;
  $("blurb").textContent = p.blurb;
  document.title = `${p.name} - Sacred Geometry Generator`;
  const row = $("stepsRow");
  if (p.steps) {
    row.style.display = "";
    $("stepsLabel").textContent = p.steps.label;
    const input = $("steps");
    input.min = p.steps.min;
    input.max = p.steps.max;
    input.value = p.steps.def;
    $("stepsVal").textContent = p.steps.def;
  } else {
    row.style.display = "none";
  }
  document
    .querySelectorAll(".nav > a")
    .forEach((a) => a.classList.toggle("on", a.dataset.id === p.id));
  if (!skipHash) location.hash = p.id;
  render();
};

const fillSelect = (id, list) => {
  $(id).replaceChildren(
    ...list.map((x) => new Option(x.name, x.id, false, x.id === state[id])),
  );
};

const onSteps = (input) => {
  state.steps = +input.value;
  $("stepsVal").textContent = input.value;
  render();
};

const onRot = (input) => {
  state.rot = +input.value;
  $("rotVal").textContent = `${input.value}°`;
  render();
};

const onStroke = (input) => {
  state.stroke = +input.value;
  $("strokeVal").textContent = (+input.value).toFixed(1);
  render();
};

const onSelect = (input, key) => {
  state[key] = input.value;
  render();
};

const onCheck = (input, key) => {
  state[key] = input.checked;
  render();
};

const replay = () => {
  state.animate = $("animate").checked;
  render();
};

const filename = (ext) => `sacred-geometry-${state.pattern.id}.${ext}`;

const downloadSvg = () => {
  const markup = svgMarkup($("stage").firstElementChild);
  saveBlob(new Blob([markup], { type: "image/svg+xml" }), filename("svg"));
  hint("SVG saved.");
};

const downloadPng = (size = 2048) => {
  const markup = svgMarkup($("stage").firstElementChild, size);
  const url = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
  );
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.getContext("2d").drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      saveBlob(blob, filename("png"));
      hint(`PNG saved (${size}×${size}).`);
    });
  };
  img.onerror = () => hint("Could not render the PNG.");
  img.src = url;
};

const copySvg = async () => {
  try {
    await navigator.clipboard.writeText(
      svgMarkup($("stage").firstElementChild),
    );
    hint("SVG copied to the clipboard.");
  } catch (e) {
    hint("Clipboard not available - use Save SVG.");
  }
};

const surprise = () => {
  const p = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  const pick = (list) => list[Math.floor(Math.random() * list.length)].id;
  state.palette = pick(PALETTES);
  state.bg = pick(BACKGROUNDS.slice(0, 3));
  state.rot = Math.floor(Math.random() * 360);
  state.stroke = Math.round((0.2 + Math.random() * 1.2) * 10) / 10;
  $("palette").value = state.palette;
  $("bg").value = state.bg;
  $("rot").value = state.rot;
  $("rotVal").textContent = `${state.rot}°`;
  $("stroke").value = state.stroke;
  $("strokeVal").textContent = state.stroke.toFixed(1);
  setPattern(p.id);
  if (p.steps) {
    const s =
      p.steps.min + Math.floor(Math.random() * (p.steps.max - p.steps.min + 1));
    $("steps").value = s;
    onSteps($("steps"));
  }
};

const init = () => {
  const nav = document.querySelector(".nav");
  nav.replaceChildren(
    ...PATTERNS.map((p) => {
      const a = document.createElement("a");
      a.href = `#${p.id}`;
      a.dataset.id = p.id;
      a.textContent = p.name;
      return a;
    }),
  );
  fillSelect("palette", PALETTES);
  fillSelect("bg", BACKGROUNDS);
  addEventListener("hashchange", () =>
    setPattern(location.hash.slice(1), true),
  );
  setPattern(location.hash.slice(1) || PATTERNS[0].id, true);
};

const initGallery = () => {
  const cards = PATTERNS.map((p) => {
    const a = document.createElement("a");
    a.className = "card";
    a.href = `index.html#${p.id}`;
    a.appendChild(
      buildSvg(p, {
        steps: p.steps ? p.steps.def : 0,
        rot: 0,
        stroke: 0.45,
        palette: "gold",
        bg: "none",
        guides: false,
        animate: true,
      }),
    );
    const h2 = document.createElement("h2");
    h2.textContent = p.name;
    const tag = document.createElement("p");
    tag.textContent = p.tagline;
    a.append(h2, tag);
    return a;
  });
  document.querySelector(".cards").replaceChildren(...cards);
};
