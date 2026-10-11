import * as THREE from "three";

const LAG_MS = 100;
const SEA = 0, REEF = 1, LAND = 2, PIER = 3;
const DECK_TOP = 0.5;
const TOP = { [LAND]: 0.7, [PIER]: 0.45, [REEF]: 0.2 };
const SKY = 0x9cc3df;

const canvas = document.getElementById("view");
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
const intro = document.getElementById("intro");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name");
const helpButton = document.getElementById("help");
const boardBox = document.getElementById("board");
const boardToggle = document.getElementById("board-toggle");
const furthest = document.getElementById("furthest");
const logList = document.getElementById("log");
const countEl = document.getElementById("count");
const heardList = document.getElementById("heard");
const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-text");
const noteButton = document.getElementById("note");
const unnoteButton = document.getElementById("unnote");

let me = null;
let deck = null;
let stations = null;
let sayRange = 8;
let boardRange = 9;
let pier = { x: 9.5, y: 31.5 };
let day = "";
let wrecks = [];
let landings = [];
let log = [];
let near = [];
let notes = [];
const heard = [];
let ownNoteNear = null;
let chart = null;
let snaps = [];
let clockOffset = 0;
const roster = new Map();
const bubbles = new Map();
const ground = new Map();
let seq = 0;
let holding = false;
let lastHint = "";
let aboardNow = null;
let yawOffset = 0;
let lastViewYaw = 0;
let pitch = 0.55;

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
    boardRange = m.boardRange ?? boardRange;
    pier = m.pier;
    day = m.day;
    wrecks = m.wrecks;
    landings = m.landings;
    log = m.log;
    who.textContent = `You are ${me.name}`;
    who.style.color = `hsl(${me.hue} 60% 35%)`;
    for (const r of m.roster) roster.set(r.id, r);
    ring.geometry.dispose();
    ring.geometry = new THREE.RingGeometry(sayRange - 0.06, sayRange + 0.06, 96);
    nameInput.value = me.name;
    drawBoard();
    if (!seenIntro()) showIntro();
    else say(`Welcome ashore. ${m.ships.length} ship${m.ships.length === 1 ? "" : "s"} at the pier, ${wrecks.length} wreck${wrecks.length === 1 ? "" : "s"} out there.`);
  } else if (m.t === "join") {
    roster.set(m.id, m);
  } else if (m.t === "rename") {
    const r = roster.get(m.id);
    if (r) r.name = m.name;
    if (me && m.id === me.id) {
      me.name = m.name;
      who.textContent = `You are ${me.name}`;
      nameInput.value = me.name;
    }
  } else if (m.t === "log") {
    log.unshift(m.entry);
    drawBoard();
  } else if (m.t === "leave") {
    roster.delete(m.id);
    bubbles.delete(m.id);
  } else if (m.t === "snap") {
    clockOffset = Date.now() - m.at;
    m.players = m.p.map(([id, x, y, , ship]) => ({ id, x: x / 100, y: y / 100, ship: ship === "" ? null : ship, name: roster.get(id)?.name ?? "", hue: roster.get(id)?.hue ?? 0 }));
    m.ships = m.s.map(([id, x, y, h, sail, water, state, sh, he, ch, pu, hull, leaks]) => ({ id, x: x / 100, y: y / 100, heading: h / 100, sail: sail / 100, water, state, hull: hull ?? 0, leaks: (leaks ?? []).map(([lx, ly, amount]) => ({ x: lx, y: ly, amount })), holders: { sail: sh, helm: he, chart: ch, pump: pu } }));
    snaps.push(m);
    if (snaps.length > 6) snaps.shift();
  } else if (m.t === "near") {
    near = m.tiles;
    notes = m.notes ?? [];
    setTiles();
    syncNotes();
  } else if (m.t === "chart") {
    chart = m.tiles ? m : null;
    chartBox.hidden = !chart;
    if (chart) drawChart();
  } else if (m.t === "emote") {
    const g = birdMeshes.get(m.id);
    if (g) g.userData.emote = { kind: m.kind, t0: performance.now() };
  } else if (m.t === "bubble") {
    bubbles.set(m.from, { text: m.text, until: performance.now() + 8000, crew: !!m.crew });
    heard.push({ at: Date.now(), name: roster.get(m.from)?.name ?? "", text: m.text, crew: !!m.crew });
    drawHeard();
  } else if (m.t === "wreck") {
    wrecks.push(m.wreck);
    const who = m.wreck.crew[0] === "nobody aboard" ? "nobody aboard" : `${m.wreck.crew.join(", ")} aboard`;
    say(`A ship went down ${Math.round(m.wreck.distance)} tiles out with ${who}.`);
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

function seenIntro() {
  try { return localStorage.getItem("earshot-intro") === "1"; } catch { return false; }
}
function showIntro() {
  intro.hidden = false;
  nameInput.value = me?.name ?? "";
  nameInput.focus();
  nameInput.select();
}
function hideIntro() {
  try { localStorage.setItem("earshot-intro", "1"); } catch {}
  intro.hidden = true;
  canvas.focus();
}
nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (name && me && name !== me.name && ws.readyState === 1) ws.send(JSON.stringify({ t: "name", name }));
  hideIntro();
});
helpButton.addEventListener("click", showIntro);
boardToggle.addEventListener("click", () => {
  const open = boardBox.classList.toggle("open");
  boardToggle.setAttribute("aria-expanded", String(open));
});

const dayLabel = (at) => new Date(at).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
function drawBoard() {
  const today = log.filter((e) => e.kind === "landing" && e.day === day);
  const best = today.sort((p, q) => q.distance - p.distance)[0];
  furthest.textContent = best ? `Furthest today: ${best.name} · ${best.crew.join(", ")} (${best.size})` : "Nobody has landed anywhere today.";
  logList.replaceChildren(...log.slice(0, 12).map((e) => {
    const li = document.createElement("li");
    const what = e.kind === "landing" ? e.name : `Wreck, ${Math.round(e.distance)} tiles out`;
    const who = e.crew[0] === "nobody aboard" ? "nobody aboard" : `${e.crew.join(", ")} (${e.size})`;
    li.textContent = `${dayLabel(e.at)} · ${what} · ${who}`;
    if (e.kind === "wreck") li.className = "wreck";
    return li;
  }));
}

const toastQueue = [];
let toastBusy = false;
function say(text) {
  if (toastQueue.at(-1) === text || (toastBusy && toast.textContent === text)) return;
  toastQueue.push(text);
  if (!toastBusy) nextToast();
}
function nextToast() {
  const text = toastQueue.shift();
  if (text === undefined) {
    toastBusy = false;
    toast.classList.remove("show");
    return;
  }
  toastBusy = true;
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(nextToast, toastQueue.length ? 2600 : 4000);
}
const touch = matchMedia("(pointer: coarse)").matches;
const key = (desk, tap) => (touch ? tap : desk);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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
  const f = b.at === a.at ? 1 : clamp((target - a.at) / (b.at - a.at), 0, 1);
  const prevP = new Map(a.players.map((p) => [p.id, p]));
  const prevS = new Map(a.ships.map((s) => [s.id, s]));
  const players = b.players.map((p) => { const q = prevP.get(p.id); return q && q.ship === p.ship ? { ...p, x: q.x + (p.x - q.x) * f, y: q.y + (p.y - q.y) * f } : p; });
  const ships = b.ships.map((s) => { const q = prevS.get(s.id); return q ? { ...s, x: q.x + (s.x - q.x) * f, y: q.y + (s.y - q.y) * f, heading: lerpAngle(q.heading, s.heading, f) } : s; });
  return { players, ships, self: players.find((p) => p.id === me.id) ?? null };
}

function selfShip(cur) {
  if (!cur?.self || cur.self.ship === null) return null;
  return cur.ships.find((s) => s.id === cur.self.ship) ?? null;
}

function viewYaw(cur) {
  const ship = selfShip(cur);
  return (ship ? ship.heading : 0) + yawOffset;
}

const moveKeys = new Set();
const look = new Set();
let pad = null;
let lastSent = { dx: 0, dy: 0, at: 0 };

function moveVector() {
  let f = 0, r = 0;
  for (const k of moveKeys) {
    if (k === "w") f += 1;
    if (k === "s") f -= 1;
    if (k === "d") r += 1;
    if (k === "a") r -= 1;
  }
  if (pad) { f += pad.f; r += pad.r; }
  if (!f && !r) return { dx: 0, dy: 0 };
  const cur = current();
  const yaw = viewYaw(cur);
  let dx = f * Math.cos(yaw) - r * Math.sin(yaw);
  let dy = f * Math.sin(yaw) + r * Math.cos(yaw);
  const ship = selfShip(cur);
  if (ship) {
    const c = Math.cos(ship.heading), n = Math.sin(ship.heading);
    const lx = dx * c + dy * n, ly = -dx * n + dy * c;
    dx = lx;
    dy = ly;
  }
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

function sendMove() {
  if (ws.readyState !== 1) return;
  const v = moveVector();
  const now = performance.now();
  const moving = v.dx !== 0 || v.dy !== 0;
  const changed = Math.abs(v.dx - lastSent.dx) > 0.02 || Math.abs(v.dy - lastSent.dy) > 0.02;
  if (!changed && !(moving && now - lastSent.at > 400)) return;
  lastSent = { dx: v.dx, dy: v.dy, at: now };
  ws.send(JSON.stringify({ t: "input", seq: ++seq, dx: v.dx, dy: v.dy }));
}

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

function goAshore() {
  if (ws.readyState === 1) ws.send(JSON.stringify({ t: "ashore" }));
}

const moveKeyOf = { w: "w", W: "w", s: "s", S: "s", a: "a", A: "a", d: "d", D: "d" };
const lookKeyOf = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (moveKeyOf[e.key]) { e.preventDefault(); moveKeys.add(moveKeyOf[e.key]); sendMove(); }
  if (lookKeyOf[e.key]) { e.preventDefault(); look.add(lookKeyOf[e.key]); }
  if (e.key === "Enter") { e.preventDefault(); sayInput.focus(); }
  if ((e.key === "e" || e.key === "E") && !e.repeat) { e.preventDefault(); act(true); }
  if (e.key === "q" || e.key === "Q") { e.preventDefault(); goAshore(); }
  if (e.key === "?") { e.preventDefault(); showIntro(); }
  if ((e.key === "n" || e.key === "N") && !e.repeat) { e.preventDefault(); openNote(); }
  if (e.key === "x" || e.key === "X") { e.preventDefault(); removeNote(); }
  if (e.target instanceof HTMLButtonElement) return;
  const gesture = { " ": "jump", h: "wave", H: "wave", y: "yes", Y: "yes", b: "no", B: "no" }[e.key];
  if (gesture && !e.repeat) { e.preventDefault(); emote(gesture); }
});
function emote(kind) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ t: "emote", kind }));
}
for (const b of document.querySelectorAll(".emotes button")) b.addEventListener("click", () => { emote(b.dataset.emote); canvas.focus(); });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!intro.hidden) { e.preventDefault(); hideIntro(); }
    else if (!noteForm.hidden) { e.preventDefault(); closeNote(); }
    else if (e.target === sayInput) { e.preventDefault(); sayInput.blur(); canvas.focus(); }
  }
});
intro.addEventListener("pointerdown", (e) => { if (e.target === intro) hideIntro(); });
window.addEventListener("keyup", (e) => {
  if (moveKeyOf[e.key]) { moveKeys.delete(moveKeyOf[e.key]); sendMove(); }
  if (lookKeyOf[e.key]) look.delete(lookKeyOf[e.key]);
  if (e.key === "e" || e.key === "E") act(false);
});
window.addEventListener("blur", () => { moveKeys.clear(); look.clear(); pad = null; setHold(false); sendMove(); });

const padDirs = { "0,-1": { f: 1, r: 0 }, "0,1": { f: -1, r: 0 }, "-1,0": { f: 0, r: -1 }, "1,0": { f: 0, r: 1 } };
for (const b of document.querySelectorAll(".pad button")) {
  const dir = padDirs[b.dataset.dir];
  const down = (e) => { e.preventDefault(); pad = dir; sendMove(); };
  const up = () => { if (pad === dir) pad = null; sendMove(); };
  b.addEventListener("pointerdown", down);
  b.addEventListener("pointerup", up);
  b.addEventListener("pointercancel", up);
  b.addEventListener("pointerleave", up);
}
actButton.addEventListener("pointerdown", (e) => { e.preventDefault(); act(true); });
for (const ev of ["pointerup", "pointercancel", "pointerleave"]) actButton.addEventListener(ev, () => act(false));
leaveButton.addEventListener("click", goAshore);

function sendSay(to) {
  const text = sayInput.value.trim();
  if (text && ws.readyState === 1) ws.send(JSON.stringify(to ? { t: "say", text, to } : { t: "say", text }));
  sayInput.value = "";
  countEl.textContent = "0/40";
  canvas.focus();
}
sayForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendSay();
});
sayInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.shiftKey) {
    e.preventDefault();
    sendSay(aboardNow === null ? undefined : "crew");
  }
});
sayInput.addEventListener("input", () => { countEl.textContent = `${sayInput.value.length}/40`; });

function drawHeard() {
  const cutoff = Date.now() - 120000;
  while (heard.length && heard[0].at < cutoff) heard.shift();
  const show = heard.slice(matchMedia("(max-width: 40rem)").matches ? -3 : -6);
  heardList.hidden = show.length === 0;
  heardList.replaceChildren(...show.map((h) => {
    const li = document.createElement("li");
    li.textContent = `${h.name}: ${h.text}`;
    if (h.crew) li.className = "crew";
    return li;
  }));
}
setInterval(drawHeard, 5000);

function openNote() {
  if (aboardNow !== null) return say("Notes go on the ground. Step ashore first.");
  noteForm.hidden = false;
  sayForm.hidden = true;
  noteInput.value = "";
  noteInput.focus();
}
function closeNote() {
  noteForm.hidden = true;
  sayForm.hidden = false;
  canvas.focus();
}
noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = noteInput.value.trim();
  if (text && ws.readyState === 1) ws.send(JSON.stringify({ t: "note", text }));
  closeNote();
});
noteButton.addEventListener("click", openNote);
function removeNote() {
  if (ownNoteNear !== null && ws.readyState === 1) ws.send(JSON.stringify({ t: "unnote", id: ownNoteNear }));
}
unnoteButton.addEventListener("click", removeNote);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 10, 26);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xe8f0f8, 0x3f5a46, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(6, 12, 4);
scene.add(sun);

const mat = (color, extra) => new THREE.MeshLambertMaterial({ color, ...extra });
const sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mat(0x28506e));
sea.rotation.x = -Math.PI / 2;
scene.add(sea);
const ring = new THREE.Mesh(new THREE.RingGeometry(sayRange - 0.06, sayRange + 0.06, 96), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.03;
scene.add(ring);

const tileGeo = new THREE.BoxGeometry(1, 1, 1);
const pools = {
  [LAND]: { mesh: new THREE.InstancedMesh(tileGeo, mat(0xb9a66b), 400), h: TOP[LAND] },
  [PIER]: { mesh: new THREE.InstancedMesh(tileGeo, mat(0x8a6a3a), 400), h: TOP[PIER] },
  [REEF]: { mesh: new THREE.InstancedMesh(tileGeo, mat(0x6b665a), 400), h: 0.35 },
};
const foam = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.02, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }), 400);
foam.count = 0;
foam.frustumCulled = false;
scene.add(foam);
for (const pool of Object.values(pools)) {
  pool.mesh.count = 0;
  pool.mesh.frustumCulled = false;
  scene.add(pool.mesh);
}
const m4 = new THREE.Matrix4();
const hash = (x, y) => ((((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000) / 1000;
function setTiles() {
  const counts = { [LAND]: 0, [PIER]: 0, [REEF]: 0 };
  ground.clear();
  for (const [x, y, kind] of near) {
    const pool = pools[kind];
    if (!pool) continue;
    ground.set(`${x},${y}`, kind);
    const h = kind === REEF ? 0.35 + 0.35 * hash(x, y) : pool.h;
    const sink = kind === REEF ? 0.12 : 0;
    m4.makeScale(kind === REEF ? 0.8 : 1, h, kind === REEF ? 0.8 : 1);
    m4.setPosition(x + 0.5, h / 2 - sink, y + 0.5);
    pool.mesh.setMatrixAt(counts[kind]++, m4);
    if (kind === REEF) {
      m4.makeRotationY(hash(y, x) * Math.PI);
      m4.setPosition(x + 0.5, 0.015, y + 0.5);
      foam.setMatrixAt(counts[kind] - 1, m4);
    }
  }
  for (const kind of Object.keys(pools)) {
    pools[kind].mesh.count = counts[kind];
    pools[kind].mesh.instanceMatrix.needsUpdate = true;
  }
  foam.count = counts[REEF];
  foam.instanceMatrix.needsUpdate = true;
}

const labels = new Map();
function makeLabel(text, bg, fg, width = 2.4) {
  const key = `${text}|${bg}|${fg}`;
  let tex = labels.get(key);
  if (!tex) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const g = c.getContext("2d");
    g.font = "bold 54px system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    if (bg) {
      const w = Math.min(504, g.measureText(text).width + 48);
      g.fillStyle = bg;
      g.beginPath();
      g.roundRect(256 - w / 2, 16, w, 96, 28);
      g.fill();
    }
    g.fillStyle = fg;
    g.fillText(text, 256, 66, 470);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    labels.set(key, tex);
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(width, width / 4, 1);
  return sprite;
}

const tileCentre = (name) => ({ x: stations[name].x + 0.5, y: stations[name].y + 0.5 });

function makeShip() {
  const g = new THREE.Group();
  const w = deck.maxX - deck.minX, d = deck.maxY - deck.minY;
  const cx = (deck.minX + deck.maxX) / 2, cz = (deck.minY + deck.maxY) / 2;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(w, 0.76, d), mat(0x6b4a2e));
  hull.position.set(cx, DECK_TOP - 0.42, cz);
  g.add(hull);
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.08, d + 0.2), mat(0x8a6a3a));
  top.position.set(cx, DECK_TOP - 0.04, cz);
  g.add(top);
  for (const [sx, sz, lx, lz] of [[w + 0.16, 0.1, cx, deck.minY - 0.03], [w + 0.16, 0.1, cx, deck.maxY + 0.03], [0.1, d + 0.16, deck.minX - 0.03, cz], [0.1, d + 0.16, deck.maxX + 0.03, cz]]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.35, sz), mat(0x5a3d26));
    rail.position.set(lx, DECK_TOP + 0.175, lz);
    g.add(rail);
  }
  const water = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 1, d - 0.2), mat(0x2e6ea8, { transparent: true, opacity: 0.6 }));
  water.position.set(cx, DECK_TOP, cz);
  water.visible = false;
  g.add(water);
  const pads = {};
  for (const name of Object.keys(stations)) {
    const c = tileCentre(name);
    const padMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), mat(0xd9c48a));
    padMesh.rotation.x = -Math.PI / 2;
    padMesh.position.set(c.x, DECK_TOP + 0.01, c.y);
    g.add(padMesh);
    pads[name] = padMesh;
    const sign = makeLabel(stationLabel[name], "rgba(21,23,28,0.55)", "#ffffff", 1.5);
    sign.position.set(c.x, DECK_TOP + 1.05, c.y);
    g.add(sign);
  }
  const helm = tileCentre("helm");
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), mat(0x5a3d26));
  post.position.set(helm.x + 0.42, DECK_TOP + 0.5, helm.y);
  g.add(post);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 18), mat(0x3b2a1a));
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(helm.x + 0.42, DECK_TOP + 1.2, helm.y);
  g.add(wheel);
  const sailAt = tileCentre("sail");
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8), mat(0x5a3d26));
  mast.position.set(sailAt.x, DECK_TOP + 1.7, sailAt.y + 0.42);
  g.add(mast);
  const sailGeo = new THREE.PlaneGeometry(1.6, 2.4);
  sailGeo.translate(0, -1.2, 0);
  const sail = new THREE.Mesh(sailGeo, new THREE.MeshBasicMaterial({ color: 0xf4f1ea, side: THREE.DoubleSide }));
  sail.rotation.y = Math.PI / 2;
  sail.position.set(sailAt.x, DECK_TOP + 3.3, sailAt.y + 0.42);
  g.add(sail);
  const chartAt = tileCentre("chart");
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.5, 0.8), mat(0x5c4a2a));
  table.position.set(chartAt.x + 0.28, DECK_TOP + 0.25, chartAt.y);
  g.add(table);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.7), mat(0xe9dcbf));
  paper.rotation.x = -Math.PI / 2;
  paper.position.set(chartAt.x + 0.28, DECK_TOP + 0.51, chartAt.y);
  g.add(paper);
  const pumpAt = tileCentre("pump");
  const pump = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), mat(0x4a4a4a));
  pump.position.set(pumpAt.x, DECK_TOP + 0.25, pumpAt.y - 0.3);
  g.add(pump);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), mat(0x8a6a3a));
  handle.position.set(pumpAt.x, DECK_TOP + 0.75, pumpAt.y - 0.3);
  g.add(handle);
  g.userData = { water, pads, sail, leaks: new Map() };
  return g;
}

function leakPatch(g, l) {
  const k = `${l.x},${l.y}`;
  let patch = g.userData.leaks.get(k);
  if (!patch) {
    patch = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), mat(0x7a1a1a));
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(l.x + 0.5, DECK_TOP + 0.012, l.y + 0.5);
    const sign = makeLabel("hole", "rgba(122,26,26,0.8)", "#ffffff", 1.2);
    sign.position.set(l.x + 0.5, DECK_TOP + 0.8, l.y + 0.5);
    patch.userData.sign = sign;
    g.add(patch, sign);
    g.userData.leaks.set(k, patch);
  }
  return patch;
}

const shipMeshes = new Map();
const lastHolders = new Map();
function crewChanges(s) {
  const prev = lastHolders.get(s.id);
  lastHolders.set(s.id, { ...s.holders });
  if (!prev || aboardNow !== s.id || !me) return;
  for (const station of Object.keys(s.holders)) {
    const now = s.holders[station] || null, was = prev[station] || null;
    if (now === was) continue;
    if (now && now !== me.id) say(`${roster.get(now)?.name ?? "Someone"} took the ${stationLabel[station]}.`);
    else if (!now && was && was !== me.id) say(`${roster.get(was)?.name ?? "Someone"} left the ${stationLabel[station]}.`);
  }
}
function syncShips(shipsNow) {
  const seen = new Set();
  for (const s of shipsNow) {
    seen.add(s.id);
    crewChanges(s);
    let g = shipMeshes.get(s.id);
    if (!g) {
      g = makeShip();
      shipMeshes.set(s.id, g);
      scene.add(g);
    }
    g.position.set(s.x, 0, s.y);
    g.rotation.y = -s.heading;
    g.userData.sail.scale.y = Math.max(0.03, s.sail);
    const h = 0.45 * (s.water / 100);
    g.userData.water.visible = s.water > 1;
    g.userData.water.scale.y = Math.max(0.01, h);
    g.userData.water.position.y = DECK_TOP + 0.02 + h / 2;
    for (const [name, padMesh] of Object.entries(g.userData.pads)) padMesh.material.color.set(s.holders[name] ? 0xffe08a : 0xd9c48a);
    const open = new Set();
    for (const l of s.leaks) {
      open.add(`${l.x},${l.y}`);
      const patch = leakPatch(g, l);
      patch.visible = patch.userData.sign.visible = true;
      patch.material.color.setHSL(0.02, 0.75, 0.46 - 0.26 * Math.min(1, l.amount / 40));
    }
    for (const [k, patch] of g.userData.leaks) if (!open.has(k)) patch.visible = patch.userData.sign.visible = false;
  }
  for (const [id, g] of shipMeshes) if (!seen.has(id)) { scene.remove(g); shipMeshes.delete(id); }
}

function makeBird(hue, name, isMe) {
  const g = new THREE.Group();
  const colour = new THREE.Color().setHSL(hue / 360, 0.65, 0.55);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), mat(colour));
  body.position.y = 0.4;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.38), mat(colour));
  head.position.set(0.12, 0.85, 0);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), mat(0xe8a03a));
  beak.position.set(0.38, 0.82, 0);
  g.add(beak);
  const wingGeo = new THREE.BoxGeometry(0.3, 0.34, 0.08);
  wingGeo.translate(0, -0.17, 0);
  const wings = [-0.32, 0.32].map((z) => {
    const wing = new THREE.Mesh(wingGeo, mat(colour.clone().offsetHSL(0, 0, -0.08)));
    wing.position.set(0, 0.6, z);
    g.add(wing);
    return wing;
  });
  for (const z of [-0.12, 0.12]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), mat(0x15171c));
    eye.position.set(0.29, 0.9, z);
    g.add(eye);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), mat(0xe8a03a));
    leg.position.set(0, 0.09, z);
    g.add(leg);
  }
  const label = makeLabel(name, null, "#ffffff");
  label.position.y = 1.4;
  g.add(label);
  if (isMe) {
    const mark = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    mark.rotation.x = -Math.PI / 2;
    mark.position.y = 0.03;
    g.add(mark);
  }
  g.userData = { last: null, bubble: null, bubbleText: "", label, name, head, wingR: wings[1], emote: null };
  return g;
}

function animateEmote(g, now) {
  const em = g.userData.emote;
  if (!em) return 0;
  const dt = (now - em.t0) / 1000;
  const { head, wingR } = g.userData;
  if (em.kind === "jump") {
    if (dt < 0.6) return 0.7 * Math.sin((Math.PI * dt) / 0.6);
  } else if (em.kind === "wave") {
    if (dt < 1.4) { wingR.rotation.x = -Math.abs(Math.sin(dt * 10)) * 1.6; return 0; }
    wingR.rotation.x = 0;
  } else if (em.kind === "yes") {
    if (dt < 1) { head.rotation.z = Math.sin(dt * 14) * 0.25; return 0; }
    head.rotation.z = 0;
  } else if (em.kind === "no") {
    if (dt < 1) { head.rotation.y = Math.sin(dt * 14) * 0.45; return 0; }
    head.rotation.y = 0;
  }
  g.userData.emote = null;
  return 0;
}

function groundHeight(p) {
  if (p.ship !== null) return DECK_TOP;
  const kind = ground.get(`${Math.floor(p.x)},${Math.floor(p.y)}`);
  return TOP[kind] ?? TOP[PIER];
}

const birdMeshes = new Map();
function syncBirds(players, shipsNow) {
  const seen = new Set();
  const now = performance.now();
  for (const p of players) {
    seen.add(p.id);
    let g = birdMeshes.get(p.id);
    if (!g) {
      g = makeBird(p.hue, p.name, p.id === me.id);
      birdMeshes.set(p.id, g);
      scene.add(g);
    }
    if (g.userData.name !== p.name) {
      g.remove(g.userData.label);
      const label = makeLabel(p.name, null, "#ffffff");
      label.position.y = 1.4;
      g.add(label);
      g.userData.label = label;
      g.userData.name = p.name;
    }
    const w = worldOf(p, shipsNow);
    const y = groundHeight(p);
    const last = g.userData.last;
    if (last) {
      const dx = w.x - last.x, dz = w.y - last.y;
      if (Math.hypot(dx, dz) > 0.02) g.rotation.y = -Math.atan2(dz, dx);
    }
    g.userData.last = w;
    g.position.set(w.x, y + animateEmote(g, now), w.y);
    const b = bubbles.get(p.id);
    if (b && b.until > now) {
      if (g.userData.bubbleText !== b.text) {
        if (g.userData.bubble) g.remove(g.userData.bubble);
        const sprite = makeLabel(b.text, "#ffffff", "#15171c", 3.2);
        sprite.position.y = 1.95;
        g.add(sprite);
        g.userData.bubble = sprite;
        g.userData.bubbleText = b.text;
      }
    } else if (g.userData.bubble) {
      g.remove(g.userData.bubble);
      g.userData.bubble = null;
      g.userData.bubbleText = "";
    }
  }
  for (const [id, g] of birdMeshes) if (!seen.has(id)) { scene.remove(g); birdMeshes.delete(id); }
}

const wreckMeshes = new Map();
function syncWrecks() {
  for (const w of wrecks) {
    const age = Math.max(0, (Date.now() - Date.parse(w.at)) / 86400000);
    const alpha = Math.max(0.3, 1 - age / 14);
    let g = wreckMeshes.get(w.id);
    if (!g) {
      g = new THREE.Group();
      for (const a of [Math.PI / 4, -Math.PI / 4]) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.14), mat(0x4a2a14, { transparent: true }));
        beam.rotation.y = a;
        beam.position.y = 0.12;
        g.add(beam);
      }
      const label = makeLabel(w.crew.length > 1 ? `${w.crew.length} aboard` : w.crew[0], null, "#ffffff");
      label.position.y = 0.9;
      g.add(label);
      g.position.set(w.x, 0, w.y);
      wreckMeshes.set(w.id, g);
      scene.add(g);
    }
    for (const child of g.children) child.material.opacity = alpha;
  }
}

const noteMeshes = new Map();
const noteAge = (n) => Math.max(0.35, 1 - Math.max(0, (Date.now() - Date.parse(n.at)) / 86400000) / 14);
function syncNotes() {
  const seen = new Set();
  for (const n of notes) {
    seen.add(n.id);
    let g = noteMeshes.get(n.id);
    if (!g) {
      g = new THREE.Group();
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.5), mat(0xf4e9cf, { transparent: true }));
      paper.position.y = 0.02;
      g.add(paper);
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mat(0x7a1a1a));
      pin.position.set(0.25, 0.09, -0.15);
      g.add(pin);
      g.rotation.y = (hash(Math.round(n.x * 10), Math.round(n.y * 10)) - 0.5) * 0.8;
      g.userData = { note: n, paper, label: null };
      noteMeshes.set(n.id, g);
      scene.add(g);
    }
    g.userData.note = n;
    const kind = ground.get(`${Math.floor(n.x)},${Math.floor(n.y)}`);
    g.position.set(n.x, TOP[kind] ?? TOP[PIER], n.y);
    g.userData.paper.material.opacity = noteAge(n);
  }
  for (const [id, g] of noteMeshes) if (!seen.has(id)) { scene.remove(g); noteMeshes.delete(id); }
}
function syncNoteLabels(self) {
  ownNoteNear = null;
  for (const g of noteMeshes.values()) {
    const n = g.userData.note;
    const close = self !== null && Math.hypot(n.x - self.x, n.y - self.y) <= 1.5;
    if (close && n.author === me.id) ownNoteNear = n.id;
    if (close && !g.userData.label) {
      const label = makeLabel(`${n.text} — ${n.name}`, "#f4e9cf", "#15171c", 3.6);
      label.position.y = 1.1;
      label.material.opacity = noteAge(n);
      g.add(label);
      g.userData.label = label;
    } else if (!close && g.userData.label) {
      g.remove(g.userData.label);
      g.userData.label = null;
    }
  }
}

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const deckPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DECK_TOP);
const hit = new THREE.Vector3();
function tapTo(cx, cy) {
  const cur = current();
  if (!cur?.self || ws.readyState !== 1) return;
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(deckPlane, hit)) return;
  moveKeys.clear();
  pad = null;
  setHold(false);
  let target = { x: hit.x, y: hit.z };
  if (cur.self.ship !== null) {
    const ship = cur.ships.find((s) => s.id === cur.self.ship);
    if (ship) target = toDeck(ship, hit.x, hit.z);
  }
  ws.send(JSON.stringify({ t: "goto", seq: ++seq, x: target.x, y: target.y }));
}

let press = null;
canvas.addEventListener("pointerdown", (e) => {
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, drag: false };
  canvas.setPointerCapture(e.pointerId);
  canvas.focus();
});
canvas.addEventListener("pointermove", (e) => {
  if (!press || e.pointerId !== press.id) return;
  const dx = e.clientX - press.lx, dy = e.clientY - press.ly;
  press.lx = e.clientX;
  press.ly = e.clientY;
  if (!press.drag && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) press.drag = true;
  if (press.drag) {
    yawOffset += dx * 0.006;
    pitch = clamp(pitch + dy * 0.004, 0.15, 1.3);
  }
});
canvas.addEventListener("pointerup", (e) => {
  if (!press || e.pointerId !== press.id) return;
  const p = press;
  press = null;
  if (!p.drag) tapTo(e.clientX, e.clientY);
});
canvas.addEventListener("pointercancel", () => { press = null; });

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const stationLabel = { helm: "helm", sail: "sail", chart: "chart table", pump: "pump" };
function stationUnder(p) {
  if (!stations || p.ship === null) return null;
  const tx = Math.floor(p.x), ty = Math.floor(p.y);
  for (const [name, s] of Object.entries(stations)) if (s.x === tx && s.y === ty) return name;
  return null;
}

function updateHud(self, shipsNow) {
  if (!self) return;
  const ship = self.ship === null ? null : shipsNow.find((s) => s.id === self.ship);
  if (self.ship !== aboardNow) {
    yawOffset = ship ? 0 : lastViewYaw;
    sayInput.placeholder = ship ? "Say something (Enter · Shift+Enter: crew only)" : "Say something (Enter)";
  }
  aboardNow = self.ship;
  leaveButton.hidden = !ship;
  noteButton.hidden = !!ship;
  syncNoteLabels(ship ? null : self);
  unnoteButton.hidden = ownNoteNear === null;
  if (ship) {
    status.hidden = false;
    const crew = snaps.at(-1).players.filter((p) => p.ship === ship.id).length;
    const deg = Math.round(((ship.heading * 180) / Math.PI + 360) % 360);
    const at = (station) => (ship.holders[station] ? ` ${roster.get(ship.holders[station])?.name ?? ""}`.trimEnd() : "");
    status.textContent = `Sail ${Math.round(ship.sail * 100)}%${at("sail")} · Helm${at("helm") || " —"} · Water ${Math.round(ship.water)}%${at("pump") ? ` (pump${at("pump")})` : ""} · Hull ${100 - Math.round(ship.hull)}%${ship.leaks.length ? ` (${ship.leaks.length} hole${ship.leaks.length > 1 ? "s" : ""})` : ""} · Heading ${deg}° · ${crew} aboard`;
    status.classList.toggle("warn", ship.water >= 50);
    status.classList.toggle("hurt", ship.water < 50 && ship.hull > 0);
  } else {
    status.hidden = true;
  }
  const st = stationUnder(self);
  let text = "";
  if (!ship) {
    const nearShip = shipsNow.some((s) => s.state !== "building" && s.sail <= 0.05 && Math.hypot(s.x - self.x, s.y - self.y) <= boardRange);
    if (ownNoteNear !== null) text = key("Your note is here. X takes it up.", "Your note is here. Remove note takes it up.");
    else text = nearShip ? key("A ship is close. Press E to board.", "A ship is close. Tap Use to board.") : key("WASD to walk, arrows or drag to look. N leaves a note.", "The pad walks, a drag looks round. Note leaves a note.");
  } else if (st === "helm") text = holding ? key("Holding the helm. A or D to turn.", "Holding the helm. ◀ ▶ to turn.") : key("Hold E to take the helm.", "Hold Use to take the helm.");
  else if (st === "sail") text = holding ? "Raising the sail. Let go and it loosens." : key("Hold E to raise the sail.", "Hold Use to raise the sail.");
  else if (st === "pump") text = holding ? "Pumping." : key("Hold E to pump.", "Hold Use to pump.");
  else if (st === "chart") text = "The chart. Stand here to see the sea.";
  else if (ship.leaks.some((l) => l.x === Math.floor(self.x) && l.y === Math.floor(self.y))) text = holding ? "Patching the hole." : key("A hole. Hold E to patch it.", "A hole. Hold Use to patch it.");
  else if (ship.leaks.length) text = key("The hull is holed where the deck shows red. Stand there and hold E.", "The hull is holed where the deck shows red. Stand there and hold Use.");
  else text = key("Walk to a station. Q to go ashore.", "Walk to a station. Ashore takes you back.");
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
    if (cur.self && sh.id === cur.self.ship) {
      c.save();
      c.translate(sh.x * sx, sh.y * sy);
      c.rotate(sh.heading);
      c.fillStyle = "#b8860b";
      c.beginPath();
      c.moveTo(11, 0); c.lineTo(-7, 6); c.lineTo(-7, -6); c.closePath();
      c.fill();
      c.restore();
      c.fillStyle = "#2a1a0a";
      c.font = "12px system-ui";
      c.fillText("you", sh.x * sx, sh.y * sy - 10);
      c.font = "bold 14px system-ui";
      continue;
    }
    c.fillStyle = "#1a4a7a";
    c.beginPath();
    c.arc(sh.x * sx, sh.y * sy, 5, 0, Math.PI * 2);
    c.fill();
  }
}

setInterval(() => { if (chart) drawChart(); syncWrecks(); }, 1000);

let lastT = performance.now();
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (look.has("left")) yawOffset -= 2.2 * dt;
  if (look.has("right")) yawOffset += 2.2 * dt;
  if (look.has("up")) pitch = clamp(pitch + 1.2 * dt, 0.15, 1.3);
  if (look.has("down")) pitch = clamp(pitch - 1.2 * dt, 0.15, 1.3);
  const cur = current();
  let target = pier, ty = TOP[PIER];
  if (cur) {
    syncShips(cur.ships);
    syncBirds(cur.players, cur.ships);
    if (!wreckMeshes.size && wrecks.length) syncWrecks();
    updateHud(cur.self, cur.ships);
    sendMove();
    if (cur.self) {
      target = worldOf(cur.self, cur.ships);
      ty = groundHeight(cur.self);
    }
  }
  const yaw = viewYaw(cur);
  lastViewYaw = yaw;
  const dist = 7, cp = Math.cos(pitch), sp = Math.sin(pitch);
  camera.position.set(target.x - dist * cp * Math.cos(yaw), ty + 0.9 + dist * sp, target.y - dist * cp * Math.sin(yaw));
  camera.lookAt(target.x, ty + 0.9, target.y);
  sea.position.set(target.x, 0, target.y);
  ring.position.set(target.x, 0.03, target.y);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
