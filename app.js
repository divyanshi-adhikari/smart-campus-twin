/* DIGITAL TWIN CAMPUS — app.js (vanilla JS, data comes from the backend API) */
const API = "http://localhost:3000";

/* ------------------------------ HELPERS ------------------------------ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const setText = (id, value) => { $(`#${id}`).textContent = value ?? "—"; };
const pills = (items) => items.map(([v, l]) => `<div class="pill"><b>${v}</b><span>${l}</span></div>`).join("");

async function get(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

const statusBadge = (status) => {
  const map = { available:"badge-ok", occupied:"badge-bad", maintenance:"badge-warn" };
  return `<span class="badge ${map[status] || "badge-ghost"}">${esc(status ?? "—")}</span>`;
};

const heatColor = (v) => {
  const stops = [[18,48,67],[53,224,208],[255,200,87],[255,95,126]];
  const p = Math.min(v,100)/100*(stops.length-1), i = Math.floor(p), f = p-i;
  const a = stops[i], b = stops[Math.min(i+1, stops.length-1)];
  return `rgb(${a.map((c,k)=>Math.round(c+(b[k]-c)*f)).join(",")})`;
};

function toast(message) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = message;
  $("#toastStack").append(t);
  setTimeout(() => t.remove(), 3500);
}

/* ------------------------------- SHELL ------------------------------- */
function initShell() {
  const pill = $(".role-pill"), btns = $$(".role-btn");
  const movePill = (btn) => { pill.style.left = btn.offsetLeft + "px"; pill.style.width = btn.offsetWidth + "px"; };
  btns.forEach(btn => btn.addEventListener("click", () => {
    btns.forEach(b => b.classList.toggle("is-active", b === btn));
    $$(".view").forEach(v => v.classList.toggle("is-active", v.id === `view-${btn.dataset.view}`));
    movePill(btn);
    location.hash = btn.dataset.view;
  }));
  (btns.find(b => b.dataset.view === location.hash.slice(1)) || btns[0]).click();
  window.addEventListener("resize", () => movePill($(".role-btn.is-active")));

  const saved = localStorage.getItem("dtc-theme");
  if (saved) document.documentElement.dataset.theme = saved;
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("dtc-theme", next);
  });

  const tick = () => $("#clock").textContent = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  tick(); setInterval(tick, 1000);
}

/* ---------------------------- BACKEND DATA --------------------------- */
let buildings = [], rooms = [], cabins = [];

async function loadData() {
  const [b, floors, roomRows, cabinRows] = await Promise.all([
    get("/buildings"), get("/floors"), get("/rooms"), get("/faculty-cabins"),
  ]);
  const floorNo = Object.fromEntries(floors.map(f => [f.floor_id, f.floor_number]));
  buildings = b;
  rooms = roomRows.map(r => ({
    ...r,
    status: String(r.status).toLowerCase(),
    building: b.find(x => x.building_id === r.building_id)?.building_name,
    floor: floorNo[r.floor_id],
  }));
  const roomById = Object.fromEntries(rooms.map(r => [r.room_id, r]));
  cabins = cabinRows.map(c => ({ ...c, room: roomById[c.room_id] }));
}

/* --------------------------- STUDENT PORTAL -------------------------- */
let roomFilter = "all", roomQuery = "";
const ROOM_LIMIT = 100;

async function initStudent(dash) {
  $("#studentQuickStats").innerHTML = pills([
    [dash.rooms.available, "rooms free"],
    [dash.rooms.total, "tracked spaces"],
    [dash.buildings, "buildings"],
  ]);

  const types = [...new Set(rooms.map(r => r.room_type))].sort();
  const chip = (value, label) => `<button class="chip" data-filter="${esc(value.toLowerCase())}">${esc(label)}</button>`;
  $("#roomFilters").innerHTML = [chip("all", "All"), chip("available", "Available"), chip("occupied", "Occupied"), ...types.map(t => chip(t, t))].join("");
  $("#roomFilters .chip").classList.add("is-active");
  $("#roomFilters").addEventListener("click", e => {
    const c = e.target.closest(".chip"); if (!c) return;
    $$("#roomFilters .chip").forEach(x => x.classList.toggle("is-active", x === c));
    roomFilter = c.dataset.filter; renderRooms();
  });
  $("#roomSearch").addEventListener("input", e => { roomQuery = e.target.value.toLowerCase(); renderRooms(); });
  renderRooms();

  const notices = await get("/announcements/audience/Student");
  $("#noticeList").innerHTML = notices.length
    ? notices.map(n => `<li><b>${esc(n.title)}</b> — ${esc(n.message)}</li>`).join("")
    : `<div class="empty">No announcements right now.</div>`;
}

function renderRooms() {
  const list = rooms.filter(r =>
    (!roomQuery || `${r.room_number} ${r.building} ${r.room_type}`.toLowerCase().includes(roomQuery)) &&
    (roomFilter === "all" || r.status === roomFilter || r.room_type.toLowerCase() === roomFilter));
  $("#roomCount").textContent = list.length > ROOM_LIMIT ? `${ROOM_LIMIT} of ${list.length}` : `${list.length} results`;
  $("#roomList").innerHTML = list.length ? list.slice(0, ROOM_LIMIT).map(r => `
    <li class="room-item">
      <div>
        <h4>${esc(r.room_number)} · ${esc(r.room_type)}</h4>
        <p>${esc(r.building)} · Floor ${r.floor} · ${r.current_occupancy}/${r.capacity ?? "—"} seats</p>
      </div>
      <div class="meta">${statusBadge(r.status)}</div>
    </li>`).join("") : `<div class="empty">No space matches that search.</div>`;
}

/* --------------------------- FACULTY PORTAL -------------------------- */
function initFaculty() {
  const free = rooms.filter(r => r.status === "available").length;
  $("#facultyQuickStats").innerHTML = pills([
    [cabins.filter(c => c.room?.status === "available").length, "cabins free"],
    [free, "bookable rooms"],
    [cabins.length, "faculty cabins"],
  ]);

  const drawTable = (q = "") => {
    $("#facultyTable tbody").innerHTML = cabins
      .filter(c => `${c.faculty_name} ${c.cabin_number}`.toLowerCase().includes(q))
      .map(c => `<tr>
        <td><b>${esc(c.faculty_name)}</b><br /><span class="tiny mono">${esc(c.cabin_number)}</span></td>
        <td>${esc(c.room?.building)}</td><td>${c.room?.floor ?? "—"}</td>
        <td>${statusBadge(c.room?.status)}</td></tr>`).join("");
  };
  drawTable();
  $("#facultySearch").addEventListener("input", e => drawTable(e.target.value.toLowerCase()));

  $("#availGrid").innerHTML = buildings.map(b => {
    const own = rooms.filter(r => r.building_id === b.building_id);
    const open = own.filter(r => r.status === "available").length;
    return own.length ? `<div class="avail-cell ${open ? "free" : "busy"}" title="${esc(b.building_name)}"><b>${esc(b.building_name)}</b>${open}/${own.length} free</div>` : "";
  }).join("");
  $("#availSummary").textContent = `${free}/${rooms.length} free`;
}

/* ---------------------------- ADMIN PORTAL --------------------------- */
function initAdmin(dash, analytics) {
  $("#adminQuickStats").innerHTML = pills([
    [dash.buildings, "buildings"], [dash.floors, "floors"], [dash.facilities, "facilities"],
  ]);

  const seats = rooms.reduce((a, r) => a + (r.capacity || 0), 0);
  const used = rooms.reduce((a, r) => a + (r.current_occupancy || 0), 0);
  $("#kpiRow").innerHTML = [
    { l:"Campus occupancy", v:`${seats ? Math.round(used / seats * 100) : 0}%`, d:`${used} of ${seats} seats`, c:"up" },
    { l:"Rooms available", v:dash.rooms.available, d:`of ${dash.rooms.total} rooms`, c:"up" },
    { l:"Under maintenance", v:dash.rooms.maintenance, d:"rooms out of service", c:"down" },
    { l:"Faculty cabins", v:dash.faculty_cabins, d:`${dash.buildings} buildings`, c:"up" },
  ].map(k => `<div class="kpi"><span>${k.l}</span><b>${k.v}</b><i class="${k.c}">${k.d}</i></div>`).join("");

  drawHeatmap(analytics.occupancy);
  drawUtilities(analytics.resource_consumption);
}

function drawHeatmap(readings) {
  const cells = {}, hours = new Set();
  readings.forEach(o => {
    if (!o.capacity) return;
    const h = new Date(o.recorded_at).getHours();
    hours.add(h);
    ((cells[o.building_name] ??= {})[h] ??= []).push(Math.min(100, o.occupancy_count / o.capacity * 100));
  });
  const cols = [...hours].sort((a, b) => a - b);
  const map = $("#heatmap");
  if (!cols.length) { map.innerHTML = `<div class="empty">No occupancy readings recorded yet.</div>`; return; }
  map.style.setProperty("--cols", cols.length);
  map.innerHTML = [
    `<div class="heat-row"><span class="lbl"></span>${cols.map(h => `<span class="lbl" style="text-align:center">${h}</span>`).join("")}</div>`,
    ...Object.entries(cells).map(([name, byHour]) => `<div class="heat-row"><span class="lbl">${esc(name)}</span>${cols.map(h => {
      const v = byHour[h]; if (!v) return `<div class="heat-cell" style="background:var(--surface-2)"></div>`;
      const avg = Math.round(v.reduce((a, x) => a + x, 0) / v.length);
      return `<div class="heat-cell" style="background:${heatColor(avg)}" title="${esc(name)} · ${avg}%">${avg}</div>`;
    }).join("")}</div>`),
  ].join("");
}

function drawUtilities(readings) {
  const latest = {};
  readings.forEach(r => { latest[`${r.resource_type}|${r.building_id}`] ??= r; });   // newest first
  const rows = Object.values(latest);
  $("#utilityMeters").innerHTML = rows.length ? rows.map(u => `
    <div class="meter"><div class="row">
      <span>${esc(u.resource_type)} · ${esc(u.building_name ?? "Campus")}</span>
      <b>${Number(u.consumption_value)} ${esc(u.unit)}</b>
    </div></div>`).join("") : `<div class="empty">No consumption readings recorded yet.</div>`;
}

/* ---------------------------- AI ANALYTICS --------------------------- */
async function loadAIPatterns() {
  const d = await get("/analytics/patterns");
  setText("aiPeakHour", d.peak_hour);
  setText("aiPeakAverage", d.peak_average_occupancy);
  setText("aiWeekdayAverage", d.weekday_average_occupancy);
  setText("aiWeekendAverage", d.weekend_average_occupancy);
  setText("aiWifiCorrelation", d.wifi_occupancy_correlation);
}

async function loadAIAnomalies() {
  const d = await get("/analytics/anomalies");
  setText("aiAnomalyCount", d.anomaly_count);
  setText("aiAnomalyTotal", d.total_records);
  setText("aiAnomalyRate", `${d.total_records ? (d.anomaly_count / d.total_records * 100).toFixed(2) : 0}%`);
}

async function loadAIPrediction() {
  const res = await fetch(`${API}/analytics/predict`, { method: "POST" });
  const d = await res.json();
  if (!res.ok) throw new Error(d.details || d.error || d.detail || "Prediction failed");
  setText("aiCurrentOccupancy", d.current_occupancy);
  setText("aiPredictedOccupancy", d.predicted_occupancy_30min);
  setText("aiPredictedChange", d.predicted_change);
  setText("aiCrowdLevel", d.crowd_level);
  $("#aiCrowdLevel").className = `is-${String(d.crowd_level).toLowerCase()}`;
  setText("aiRecommendation", d.recommendation);
  setText("aiAction", d.action);
}

/* -------------------------------- BOOT ------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  initShell();

  loadAIPatterns().catch(console.error);
  loadAIAnomalies().catch(console.error);
  loadAIPrediction().catch(err => { console.error(err); setText("aiRecommendation", "Prediction service unavailable."); });

  try {
    const [dash, analytics] = await Promise.all([get("/dashboard"), get("/analytics"), loadData()]);
    await initStudent(dash);
    initFaculty();
    initAdmin(dash, analytics);
  } catch (err) {
    console.error(err);
    toast(`Could not load data from the backend (${API}).`);
  }
});
