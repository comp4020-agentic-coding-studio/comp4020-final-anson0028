const TILE = 28;
const LAG_MS = 100;

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const who = document.getElementById("who");
const toast = document.getElementById("toast");
const codeBox = document.getElementById("code");
const sayForm = document.getElementById("say");
const sayInput = document.getElementById("text");
const keypadForm = document.getElementById("keypad");
const digits = document.getElementById("digits");
const sign = document.getElementById("sign");

const colours = { 0: "#3f7a4a", 1: "#2b5f8a", 2: "#4a4038", 3: "#c9a24a", 4: "#8a8f99", 5: "#6b4a2e", 6: "#d9c48a" };

let me = null;
let map = null;
let sayRange = 8;
let gateOpen = false;
let snaps = [];
let clockOffset = 0;
const bubbles = new Map();
const roster = new Map();
const held = { dx: 0, dy: 0 };
let seq = 0;
let keypadNear = false;
let gateNear = false;
let openings = [];
const dayLabel = (d) => new Date(d + "T12:00:00Z").toLocaleDateString(undefined, { day: "numeric", month: "short" });
function renderSign() {
  sign.replaceChildren();
  const h = document.createElement("strong");
  h.textContent = gateOpen ? "Gate log · open today" : "Gate log · locked today";
  sign.append(h);
  const ul = document.createElement("ul");
  if (!openings.length) { const li = document.createElement("li"); li.textContent = "Nobody has opened it yet."; ul.append(li); }
  for (const o of openings) { const li = document.createElement("li"); li.textContent = `${dayLabel(o.day)}: ${o.by} with ${o.with}`; ul.append(li); }
  sign.append(ul);
}

const sibling = sessionStorage.getItem("sibling");
const wsBase = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
const ws = new WebSocket(sibling ? `${wsBase}?token=${sibling}` : wsBase);

ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.t === "hello") {
    me = m.you;
    map = m.map;
    sayRange = m.sayRange;
    gateOpen = m.gateOpen;
    who.textContent = `You are ${me.name}`;
    who.style.color = `hsl(${me.hue} 60% 35%)`;
    for (const r of m.roster) roster.set(r.id, r);
    openings = m.openings ?? [];
    renderSign();
    if (!gateOpen && openings.length) say(`The gate has locked itself again today. Last opened ${dayLabel(openings[0].day)} by ${openings[0].by} with ${openings[0].with}.`, true);
  } else if (m.t === "join") {
    roster.set(m.id, m);
  } else if (m.t === "leave") {
    roster.delete(m.id);
    bubbles.delete(m.id);
  } else if (m.t === "snap") {
    clockOffset = Date.now() - m.at;
    m.players = m.p.map(([id, x, y]) => ({ id, x: x / 100, y: y / 100, name: roster.get(id)?.name ?? "", hue: roster.get(id)?.hue ?? 0 }));
    snaps.push(m);
    if (snaps.length > 6) snaps.shift();
  } else if (m.t === "bubble") {
    bubbles.set(m.from, { text: m.text, until: performance.now() + 4000 });
  } else if (m.t === "code") {
    codeBox.hidden = m.code === null;
    codeBox.textContent = m.code ?? "";
    if (m.code) say(`(only you can see the plate's code: ${m.code})`, true);
  } else if (m.t === "gate") {
    gateOpen = m.open;
    if (m.reset) say("A new day: the gate has locked itself and the plate shows a new code.", true);
    else { openings.unshift({ day: m.day, by: m.by, with: m.with }); say(`${m.by} opened the gate while ${m.with} held the plate.`, true); }
    keypadForm.hidden = !keypadNear || gateOpen;
    renderSign();
  } else if (m.t === "toast") {
    say(m.text, true);
  } else if (m.t === "refused") {
    if (m.why === "full") return say("The island is full right now.", true);
    who.textContent = "You're already on the island in another tab.";
    const again = document.createElement("button");
    again.type = "button";
    again.textContent = "Walk here as a second person";
    again.className = "again";
    again.addEventListener("click", () => { sessionStorage.setItem("sibling", crypto.randomUUID()); location.reload(); });
    who.append(" ", again);
  }
});

let toastTimer;
function say(text, local) {
  if (!local) return;
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function sendInput() {
  if (ws.readyState !== 1) return;
  ws.send(JSON.stringify({ t: "input", seq: ++seq, dx: held.dx, dy: held.dy }));
}
setInterval(() => { if (held.dx || held.dy) sendInput(); }, 500);

const keys = new Set();
const dirOf = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
function recompute() {
  let dx = 0, dy = 0;
  for (const k of keys) { const d = dirOf[k]; if (d) { dx += d[0]; dy += d[1]; } }
  held.dx = Math.sign(dx);
  held.dy = Math.sign(dy);
  sendInput();
}
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (dirOf[e.key]) { e.preventDefault(); if (!keys.has(e.key)) { keys.add(e.key); recompute(); } }
  if (e.key === "Enter") { e.preventDefault(); sayInput.focus(); }
  if ((e.key === "e" || e.key === "E") && !keypadForm.hidden) { e.preventDefault(); digits.focus(); }
});
window.addEventListener("keyup", (e) => { if (keys.delete(e.key)) recompute(); });
window.addEventListener("blur", () => { keys.clear(); recompute(); });

for (const b of document.querySelectorAll(".pad button")) {
  const [dx, dy] = b.dataset.dir.split(",").map(Number);
  const down = (e) => { e.preventDefault(); held.dx = dx; held.dy = dy; sendInput(); };
  const up = () => { held.dx = 0; held.dy = 0; sendInput(); };
  b.addEventListener("pointerdown", down);
  b.addEventListener("pointerup", up);
  b.addEventListener("pointercancel", up);
  b.addEventListener("pointerleave", up);
}

canvas.addEventListener("pointerdown", (e) => {
  if (!map || !me || ws.readyState !== 1) return;
  const self = interpolated().players.find((p) => p.id === me.id);
  if (!self) return;
  const r = canvas.getBoundingClientRect();
  const s = TILE;
  const x = self.x + (e.clientX - r.left - r.width / 2) / s;
  const y = self.y + (e.clientY - r.top - r.height / 2) / s;
  keys.clear();
  held.dx = 0;
  held.dy = 0;
  ws.send(JSON.stringify({ t: "goto", seq: ++seq, x, y }));
  canvas.focus();
});

sayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = sayInput.value.trim();
  if (text && ws.readyState === 1) ws.send(JSON.stringify({ t: "say", text }));
  sayInput.value = "";
  canvas.focus();
});

keypadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (ws.readyState === 1) ws.send(JSON.stringify({ t: "code", code: digits.value }));
  digits.value = "";
  canvas.focus();
});

function resize() {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.floor(r.width * devicePixelRatio);
  canvas.height = Math.floor(r.height * devicePixelRatio);
}
window.addEventListener("resize", resize);
resize();

function interpolated() {
  const target = Date.now() - clockOffset - LAG_MS;
  let a = snaps[0], b = snaps[0];
  for (let i = 0; i < snaps.length - 1; i++) {
    if (snaps[i].at <= target && snaps[i + 1].at >= target) { a = snaps[i]; b = snaps[i + 1]; break; }
    a = snaps[i + 1]; b = snaps[i + 1];
  }
  if (!a) return { players: [], plate: null };
  const f = b.at === a.at ? 1 : Math.min(1, Math.max(0, (target - a.at) / (b.at - a.at)));
  const byId = new Map(a.players.map((p) => [p.id, p]));
  return {
    plate: b.plate,
    players: b.players.map((p) => { const q = byId.get(p.id) ?? p; return { ...p, x: q.x + (p.x - q.x) * f, y: q.y + (p.y - q.y) * f }; }),
  };
}

function draw() {
  requestAnimationFrame(draw);
  if (!map || !me) return;
  const { players, plate } = interpolated();
  const self = players.find((p) => p.id === me.id);
  const s = TILE * devicePixelRatio;
  const cw = canvas.width, ch = canvas.height;
  const cx = self ? self.x : map.w / 2, cy = self ? self.y : map.h / 2;
  const ox = cw / 2 - cx * s, oy = ch / 2 - cy * s;
  ctx.fillStyle = "#1b2a1f";
  ctx.fillRect(0, 0, cw, ch);
  const x0 = Math.max(0, Math.floor(-ox / s)), x1 = Math.min(map.w, Math.ceil((cw - ox) / s));
  const y0 = Math.max(0, Math.floor(-oy / s)), y1 = Math.min(map.h, Math.ceil((ch - oy) / s));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    let t = map.tiles[y * map.w + x];
    if (t === 5 && gateOpen) t = 6;
    ctx.fillStyle = colours[t];
    ctx.fillRect(ox + x * s, oy + y * s, s + 1, s + 1);
    if (t === 3) { ctx.fillStyle = plate ? "#ffe08a" : "#a8823a"; ctx.fillRect(ox + x * s + s * 0.2, oy + y * s + s * 0.2, s * 0.6, s * 0.6); }
    if (t === 4) { ctx.fillStyle = plate ? "#7CFC9A" : "#2b2f36"; ctx.fillRect(ox + x * s + s * 0.3, oy + y * s + s * 0.15, s * 0.4, s * 0.7); }
  }
  if (self) {
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox + self.x * s, oy + self.y * s, sayRange * s, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.font = `${12 * devicePixelRatio}px system-ui`;
  for (const p of players) {
    const px = ox + p.x * s, py = oy + p.y * s;
    ctx.fillStyle = `hsl(${p.hue} 65% 55%)`;
    ctx.beginPath();
    ctx.arc(px, py, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    if (p.id === me.id) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = "#fff";
    ctx.fillText(p.name, px, py + s * 0.95);
    const b = bubbles.get(p.id);
    if (b && b.until > performance.now()) {
      const w = ctx.measureText(b.text).width + 16 * devicePixelRatio;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(px - w / 2, py - s * 1.25, w, 20 * devicePixelRatio);
      ctx.fillStyle = "#15171c";
      ctx.fillText(b.text, px, py - s * 1.25 + 14 * devicePixelRatio);
    }
  }
  if (self) {
    const g = gateTile();
    const nearGate = Math.hypot(self.x - (g.x + 0.5), self.y - (g.y + 0.5)) <= 3;
    if (nearGate !== gateNear) { gateNear = nearGate; sign.hidden = !nearGate; }
    const near = Math.hypot(self.x - (keypadTile().x + 0.5), self.y - (keypadTile().y + 0.5)) <= 1.5;
    if (near !== keypadNear) { keypadNear = near; keypadForm.hidden = !near || gateOpen; if (near && !gateOpen) say("You're at the keypad. Press E or tap the box to enter a code.", true); }
  }
}

let gateCache = null;
function gateTile() {
  if (gateCache) return gateCache;
  const i = map.tiles.indexOf(5);
  gateCache = { x: i % map.w, y: Math.floor(i / map.w) };
  return gateCache;
}

let keypadCache = null;
function keypadTile() {
  if (keypadCache) return keypadCache;
  const i = map.tiles.indexOf(4);
  keypadCache = { x: i % map.w, y: Math.floor(i / map.w) };
  return keypadCache;
}

draw();
