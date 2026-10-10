const TILE = 28;
const LAG_MS = 100;

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const who = document.getElementById("who");
const toast = document.getElementById("toast");
const status = document.getElementById("status");
const hint = document.getElementById("hint");
const chartBox = document.getElementById("chart");
const chartCanvas = document.getElementById("chartview");
const sayForm = document.getElementById("say");
const sayInput = document.getElementById("text");
const actButton = document.getElementById("act");
const leaveButton = document.getElementById("leave");

const SEA = 0, REEF = 1, LAND = 2, PIER = 3;
const tileColour = { [REEF]: "#1f5f6b", [LAND]: "#b9a66b", [PIER]: "#8a6a3a" };

let me = null;
let deck = null;
let stations = null;
let sayRange = 8;
let pier = { x: 9.5, y: 31.5 };
let day = "";
let wrecks = [];
let landings = [];
let near = [];
let chart = null;
let snaps = [];
let clockOffset = 0;
const roster = new Map();
const bubbles = new Map();
const held = { dx: 0, dy: 0 };
let seq = 0;
let holding = false;
let lastHint = "";
let aboardNow = null;

const sibling = sessionStorage.getItem("sibling");
const wsBase = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
const ws = new WebSocket(sibling ? `${wsBase}?token=${sibling}` : wsBase);

ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.t === "hello") {
    me = m.you;
    deck = m.deck;
    stations = m.stations;
    sayRange = m.sayRange;
    pier = m.pier;
    day = m.day;
    wrecks = m.wrecks;
    landings = m.landings;
    who.textContent = `You are ${me.name}`;
    who.style.color = `hsl(${me.hue} 60% 35%)`;
    for (const r of m.roster) roster.set(r.id, r);
    say(`Welcome ashore. ${m.ships.length} ship${m.ships.length === 1 ? "" : "s"} at the pier, ${wrecks.length} wreck${wrecks.length === 1 ? "" : "s"} out there.`);
  } else if (m.t === "join") {
    roster.set(m.id, m);
  } else if (m.t === "leave") {
    roster.delete(m.id);
    bubbles.delete(m.id);
  } else if (m.t === "snap") {
    clockOffset = Date.now() - m.at;
    m.players = m.p.map(([id, x, y, , ship]) => ({ id, x: x / 100, y: y / 100, ship: ship === "" ? null : ship, name: roster.get(id)?.name ?? "", hue: roster.get(id)?.hue ?? 0 }));
    m.ships = m.s.map(([id, x, y, h, sail, water, state, sh, he, ch, pu]) => ({ id, x: x / 100, y: y / 100, heading: h / 100, sail: sail / 100, water, state, holders: { sail: sh, helm: he, chart: ch, pump: pu } }));
    snaps.push(m);
    if (snaps.length > 6) snaps.shift();
  } else if (m.t === "near") {
    near = m.tiles;
  } else if (m.t === "chart") {
    chart = m.tiles ? m : null;
    chartBox.hidden = !chart;
    if (chart) drawChart();
  } else if (m.t === "bubble") {
    bubbles.set(m.from, { text: m.text, until: performance.now() + 4000 });
  } else if (m.t === "wreck") {
    wrecks.push(m.wreck);
    say(`A ship went down ${Math.round(m.wreck.distance)} tiles out with ${m.wreck.crew.join(", ")} aboard.`);
  } else if (m.t === "landing") {
    const i = landings.findIndex((l) => l.island === m.landing.island);
    if (i >= 0) landings[i] = m.landing;
    else landings.push(m.landing);
    say(m.first ? `First landing on ${m.name}: ${m.landing.crew.join(", ")} (crew of ${m.landing.size}).` : `${m.name} again. First reached by ${m.landing.crew.join(", ")}; ${m.landing.visits} visits now.`);
  } else if (m.t === "ship" && m.event === "launched") {
    say("A new hull is ready at the pier.");
  } else if (m.t === "toast") {
    say(m.text);
  } else if (m.t === "refused") {
    if (m.why === "full") return say("The harbour is full right now.");
    if (m.why === "bad_token") return say("This browser's ticket isn't one the harbour issued.");
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
function say(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}

function sendInput() {
  if (ws.readyState !== 1) return;
  ws.send(JSON.stringify({ t: "input", seq: ++seq, dx: held.dx, dy: held.dy }));
}
setInterval(() => { if (held.dx || held.dy) sendInput(); }, 500);

function setHold(on) {
  if (holding === on || ws.readyState !== 1) return;
  holding = on;
  ws.send(JSON.stringify({ t: "hold", on }));
  actButton.classList.toggle("down", on);
}

function act(down) {
  if (!me || ws.readyState !== 1) return;
  if (aboardNow === null) {
    if (down) ws.send(JSON.stringify({ t: "board" }));
    return;
  }
  setHold(down);
}

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
  if ((e.key === "e" || e.key === "E") && !e.repeat) { e.preventDefault(); act(true); }
  if (e.key === "q" || e.key === "Q") { e.preventDefault(); if (ws.readyState === 1) ws.send(JSON.stringify({ t: "ashore" })); }
});
window.addEventListener("keyup", (e) => {
  if (keys.delete(e.key)) recompute();
  if (e.key === "e" || e.key === "E") act(false);
});
window.addEventListener("blur", () => { keys.clear(); recompute(); setHold(false); });

for (const b of document.querySelectorAll(".pad button")) {
  const [dx, dy] = b.dataset.dir.split(",").map(Number);
  const down = (e) => { e.preventDefault(); held.dx = dx; held.dy = dy; sendInput(); };
  const up = () => { held.dx = 0; held.dy = 0; sendInput(); };
  b.addEventListener("pointerdown", down);
  b.addEventListener("pointerup", up);
  b.addEventListener("pointercancel", up);
  b.addEventListener("pointerleave", up);
}
actButton.addEventListener("pointerdown", (e) => { e.preventDefault(); act(true); });
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) actButton.addEventListener(ev, () => act(false));
leaveButton.addEventListener("click", () => { if (ws.readyState === 1) ws.send(JSON.stringify({ t: "ashore" })); });

sayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = sayInput.value.trim();
  if (text && ws.readyState === 1) ws.send(JSON.stringify({ t: "say", text }));
  sayInput.value = "";
  canvas.focus();
});

canvas.addEventListener("pointerdown", (e) => {
  const cur = current();
  if (!cur?.self || ws.readyState !== 1) return;
  const r = canvas.getBoundingClientRect();
  const w = worldOf(cur.self, cur.ships);
  const wx = w.x + (e.clientX - r.left - r.width / 2) / TILE;
  const wy = w.y + (e.clientY - r.top - r.height / 2) / TILE;
  keys.clear();
  held.dx = 0;
  held.dy = 0;
  setHold(false);
  let target = { x: wx, y: wy };
  if (cur.self.ship !== null) {
    const ship = cur.ships.find((s) => s.id === cur.self.ship);
    if (ship) target = toDeck(ship, wx, wy);
  }
  ws.send(JSON.stringify({ t: "goto", seq: ++seq, x: target.x, y: target.y }));
  canvas.focus();
});

function resize() {
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.floor(r.width * devicePixelRatio);
  canvas.height = Math.floor(r.height * devicePixelRatio);
}
window.addEventListener("resize", resize);
resize();

function toWorld(ship, lx, ly) {
  const c = Math.cos(ship.heading), n = Math.sin(ship.heading);
  return { x: ship.x + lx * c - ly * n, y: ship.y + lx * n + ly * c };
}
function toDeck(ship, wx, wy) {
  const c = Math.cos(ship.heading), n = Math.sin(ship.heading);
  const dx = wx - ship.x, dy = wy - ship.y;
  return { x: dx * c + dy * n, y: -dx * n + dy * c };
}
function worldOf(p, shipsNow) {
  if (p.ship === null) return { x: p.x, y: p.y };
  const ship = shipsNow.find((s) => s.id === p.ship);
  return ship ? toWorld(ship, p.x, p.y) : { x: p.x, y: p.y };
}

function lerpAngle(a, b, f) {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * f;
}

function current() {
  if (!me || !snaps.length) return null;
  const target = Date.now() - clockOffset - LAG_MS;
  let a = snaps[0], b = snaps[0];
  for (let i = 0; i < snaps.length - 1; i++) {
    if (snaps[i].at <= target && snaps[i + 1].at >= target) { a = snaps[i]; b = snaps[i + 1]; break; }
    a = snaps[i + 1]; b = snaps[i + 1];
  }
  const f = b.at === a.at ? 1 : Math.min(1, Math.max(0, (target - a.at) / (b.at - a.at)));
  const prevP = new Map(a.players.map((p) => [p.id, p]));
  const prevS = new Map(a.ships.map((s) => [s.id, s]));
  const players = b.players.map((p) => { const q = prevP.get(p.id); return q && q.ship === p.ship ? { ...p, x: q.x + (p.x - q.x) * f, y: q.y + (p.y - q.y) * f } : p; });
  const ships = b.ships.map((s) => { const q = prevS.get(s.id); return q ? { ...s, x: q.x + (s.x - q.x) * f, y: q.y + (s.y - q.y) * f, heading: lerpAngle(q.heading, s.heading, f) } : s; });
  return { players, ships, self: players.find((p) => p.id === me.id) ?? null };
}

function stationUnder(p) {
  if (!stations || p.ship === null) return null;
  const tx = Math.floor(p.x), ty = Math.floor(p.y);
  for (const [name, s] of Object.entries(stations)) if (s.x === tx && s.y === ty) return name;
  return null;
}

const stationLabel = { helm: "helm", sail: "sail", chart: "chart table", pump: "pump" };

function draw() {
  requestAnimationFrame(draw);
  const cur = current();
  if (!cur) return;
  const { players, ships, self } = cur;
  const s = TILE * devicePixelRatio;
  const cw = canvas.width, ch = canvas.height;
  const centre = self ? worldOf(self, ships) : pier;
  const ox = cw / 2 - centre.x * s, oy = ch / 2 - centre.y * s;
  ctx.fillStyle = "#28506e";
  ctx.fillRect(0, 0, cw, ch);

  for (const [x, y, kind] of near) {
    ctx.fillStyle = tileColour[kind] ?? "#28506e";
    ctx.fillRect(ox + x * s, oy + y * s, s + 1, s + 1);
    if (kind === REEF) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(ox + x * s + s * 0.3, oy + y * s + s * 0.4, s * 0.15, s * 0.15);
      ctx.fillRect(ox + x * s + s * 0.6, oy + y * s + s * 0.6, s * 0.15, s * 0.15);
    }
  }

  ctx.textAlign = "center";
  ctx.font = `${12 * devicePixelRatio}px system-ui`;
  for (const w of wrecks) {
    const age = Math.max(0, (Date.now() - Date.parse(w.at)) / 86400000);
    const alpha = Math.max(0.25, 1 - age / 14);
    const px = ox + w.x * s, py = oy + w.y * s;
    if (px < -s || py < -s || px > cw + s || py > ch + s) continue;
    ctx.strokeStyle = `rgba(80,40,20,${alpha})`;
    ctx.lineWidth = 3 * devicePixelRatio;
    ctx.beginPath();
    ctx.moveTo(px - s * 0.35, py - s * 0.35); ctx.lineTo(px + s * 0.35, py + s * 0.35);
    ctx.moveTo(px + s * 0.35, py - s * 0.35); ctx.lineTo(px - s * 0.35, py + s * 0.35);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(w.crew.length > 1 ? `${w.crew.length} aboard` : w.crew[0], px, py + s * 0.95);
  }

  for (const ship of ships) {
    ctx.save();
    ctx.translate(ox + ship.x * s, oy + ship.y * s);
    ctx.rotate(ship.heading);
    ctx.fillStyle = "#6b4a2e";
    ctx.fillRect(deck.minX * s, deck.minY * s, (deck.maxX - deck.minX) * s, (deck.maxY - deck.minY) * s);
    ctx.fillStyle = "#8a6a3a";
    ctx.fillRect((deck.minX + 0.15) * s, (deck.minY + 0.15) * s, (deck.maxX - deck.minX - 0.3) * s, (deck.maxY - deck.minY - 0.3) * s);
    if (ship.water > 0) {
      ctx.fillStyle = "rgba(40,110,170,0.55)";
      const h = (deck.maxY - deck.minY) * s * (ship.water / 100);
      ctx.fillRect(deck.minX * s, deck.maxY * s - h, (deck.maxX - deck.minX) * s, h);
    }
    for (const [name, st] of Object.entries(stations)) {
      const cx = (st.x + 0.5) * s, cy = (st.y + 0.5) * s;
      const heldBy = ship.holders[name];
      ctx.fillStyle = heldBy ? "#ffe08a" : "#d9c48a";
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-ship.heading);
      ctx.fillStyle = "#15171c";
      ctx.font = `${9 * devicePixelRatio}px system-ui`;
      ctx.fillText(stationLabel[name], 0, s * 0.62);
      ctx.restore();
    }
    const mast = stations.sail;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo((mast.x + 0.5) * s, (mast.y + 0.5) * s);
    ctx.lineTo((mast.x + 0.5) * s, (mast.y + 0.5 - 1.6 * ship.sail) * s);
    ctx.lineTo((mast.x + 0.5 + 1.4 * ship.sail) * s, (mast.y + 0.5) * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (self) {
    const w = worldOf(self, ships);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ox + w.x * s, oy + w.y * s, sayRange * s, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.font = `${12 * devicePixelRatio}px system-ui`;
  for (const p of players) {
    const w = worldOf(p, ships);
    const px = ox + w.x * s, py = oy + w.y * s;
    ctx.fillStyle = `hsl(${p.hue} 65% 55%)`;
    ctx.beginPath();
    ctx.arc(px, py, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    if (p.id === me.id) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke(); }
    ctx.fillStyle = "#fff";
    ctx.fillText(p.name, px, py + s * 0.95);
    const b = bubbles.get(p.id);
    if (b && b.until > performance.now()) {
      const bw = ctx.measureText(b.text).width + 16 * devicePixelRatio;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillRect(px - bw / 2, py - s * 1.25, bw, 20 * devicePixelRatio);
      ctx.fillStyle = "#15171c";
      ctx.fillText(b.text, px, py - s * 1.25 + 14 * devicePixelRatio);
    }
  }

  updateHud(self, ships);
}

function updateHud(self, ships) {
  if (!self) return;
  aboardNow = self.ship;
  const ship = self.ship === null ? null : ships.find((s) => s.id === self.ship);
  leaveButton.hidden = !ship;
  if (ship) {
    status.hidden = false;
    const crew = snaps.at(-1).players.filter((p) => p.ship === ship.id).length;
    const deg = Math.round(((ship.heading * 180) / Math.PI + 360) % 360);
    status.textContent = `Sail ${Math.round(ship.sail * 100)}% · Water ${Math.round(ship.water)}% · Heading ${deg}° · ${crew} aboard`;
    status.classList.toggle("warn", ship.water >= 50);
  } else {
    status.hidden = true;
  }
  const st = stationUnder(self);
  let text = "";
  if (!ship) {
    const nearShip = ships.some((s) => s.state !== "building" && s.sail <= 0.05 && Math.hypot(s.x - self.x, s.y - self.y) <= 7);
    text = nearShip ? "A ship is close. Press E to board." : "";
  } else if (st === "helm") text = holding ? "Holding the helm. Left or right to turn." : "Hold E to take the helm.";
  else if (st === "sail") text = holding ? "Raising the sail. Let go and it loosens." : "Hold E to raise the sail.";
  else if (st === "pump") text = holding ? "Pumping." : "Hold E to pump.";
  else if (st === "chart") text = "The chart. Stand here to see the sea.";
  else text = "Walk to a station. Q to go ashore.";
  if (text !== lastHint) {
    lastHint = text;
    hint.hidden = !text;
    hint.textContent = text;
  }
}

function drawChart() {
  const c = chartCanvas.getContext("2d");
  const cw = chartCanvas.width, chh = chartCanvas.height;
  const sx = cw / chart.w, sy = chh / chart.h;
  c.fillStyle = "#e9dcbf";
  c.fillRect(0, 0, cw, chh);
  for (let y = 0; y < chart.h; y++) for (let x = 0; x < chart.w; x++) {
    const k = chart.tiles[y * chart.w + x];
    if (k === SEA) continue;
    c.fillStyle = k === REEF ? "#7a4a3a" : k === LAND ? "#5c4a2a" : "#3a2a1a";
    c.fillRect(x * sx, y * sy, sx + 0.5, sy + 0.5);
  }
  c.font = "bold 14px system-ui";
  c.textAlign = "center";
  for (const i of chart.islands) {
    const l = landings.find((x) => x.island === i.id);
    c.fillStyle = "#2a1a0a";
    c.fillText(i.name, i.cx * sx, (i.cy - i.r - 1) * sy);
    if (l) { c.font = "12px system-ui"; c.fillText(`first: ${l.crew.join(", ")} (${l.size})`, i.cx * sx, (i.cy + i.r + 2.2) * sy); c.font = "bold 14px system-ui"; }
  }
  c.fillStyle = "#2a1a0a";
  c.fillText("Harbour", chart.pier.x * sx + 20, chart.pier.y * sy - 8);
  for (const w of wrecks) {
    c.strokeStyle = "#7a1a1a";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w.x * sx - 4, w.y * sy - 4); c.lineTo(w.x * sx + 4, w.y * sy + 4);
    c.moveTo(w.x * sx + 4, w.y * sy - 4); c.lineTo(w.x * sx - 4, w.y * sy + 4);
    c.stroke();
  }
  const cur = current();
  if (cur) for (const sh of cur.ships) {
    c.fillStyle = "#1a4a7a";
    c.beginPath();
    c.arc(sh.x * sx, sh.y * sy, 5, 0, Math.PI * 2);
    c.fill();
  }
}

setInterval(() => { if (chart) drawChart(); }, 1000);
draw();
