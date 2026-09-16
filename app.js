/* =====================================================================
   DIGITAL TWIN CAMPUS — app.js  (Vanilla ES6+, no build step)
   ---------------------------------------------------------------------
   STRUCTURE
     [1] DATA LAYER    -> mock JSON + single swap point for real APIs
     [2] HELPERS
     [3] SHELL         -> role switching, theme, clock, toasts
     [4] STUDENT PORTAL
     [5] FACULTY PORTAL
     [6] ADMIN PORTAL
     [7] 3D MAP PLACEHOLDER (replace with teammate's renderer)
     [8] BOOT
   ===================================================================== */

/* =====================================================================
   [1] DATA LAYER  ⚠️ BACKEND TEAM: this is the ONLY section to change.
   Flip USE_LIVE_API to true and point ENDPOINTS at the real routes.
   Every view reads data through DATA_SOURCE.<method>() and nothing else.
   ===================================================================== */
const USE_LIVE_API = false;

const ENDPOINTS = {
  rooms:       "/api/rooms",
  faculty:     "/api/faculty",
  utilities:   "/api/utilities",
  parking:     "/api/parking",
  occupancy:   "/api/occupancy",
  alerts:      "/api/maintenance/alerts",
  resources:   "/api/resources",
  notices:     "/api/notices",
  assistant:   "/api/assistant",     // POST { question } -> { answer }
};

/* ---------------------------- MOCK JSON ---------------------------- */
const MOCK = {
  rooms: [
    { id:"AB-101", name:"Lecture Hall 101", type:"class", block:"Academic Block A", floor:1, capacity:120, occupied:96, status:"occupied", until:"10:50", course:"CSE2005 · Operating Systems" },
    { id:"AB-204", name:"Smart Classroom 204", type:"class", block:"Academic Block A", floor:2, capacity:60, occupied:0, status:"available", until:"—", course:"" },
    { id:"AB-209", name:"Seminar Room 209", type:"class", block:"Academic Block A", floor:2, capacity:40, occupied:34, status:"soon", until:"10:15", course:"Guest Lecture · IoT" },
    { id:"LB-01",  name:"IoT & Embedded Lab", type:"lab", block:"Lab Block", floor:0, capacity:45, occupied:12, status:"available", until:"—", course:"" },
    { id:"LB-07",  name:"AI / Data Science Lab", type:"lab", block:"Lab Block", floor:1, capacity:50, occupied:48, status:"occupied", until:"12:30", course:"CSE3012 · ML Lab" },
    { id:"LB-12",  name:"Networks Lab", type:"lab", block:"Lab Block", floor:1, capacity:35, occupied:5, status:"available", until:"—", course:"" },
    { id:"FC-118", name:"Cabin 118 · Dr. A. Mehra", type:"cabin", block:"Faculty Wing", floor:1, capacity:4, occupied:1, status:"occupied", until:"11:00", course:"Office hours" },
    { id:"FC-122", name:"Cabin 122 · Prof. S. Nair", type:"cabin", block:"Faculty Wing", floor:1, capacity:4, occupied:0, status:"available", until:"—", course:"" },
    { id:"LIB-R2", name:"Library Discussion Room 2", type:"class", block:"Central Library", floor:2, capacity:12, occupied:11, status:"occupied", until:"13:00", course:"Group study" },
    { id:"AUD-1",  name:"Main Auditorium", type:"class", block:"Convention Centre", floor:0, capacity:600, occupied:0, status:"available", until:"—", course:"" },
  ],
  faculty: [
    { name:"Dr. A. Mehra",   room:"FC-118", block:"Faculty Wing", floor:1, status:"In cabin",   next:"11:00 · AB-101" },
    { name:"Prof. S. Nair",  room:"FC-122", block:"Faculty Wing", floor:1, status:"Free",       next:"12:00 · LB-07" },
    { name:"Dr. R. Iyer",    room:"FC-130", block:"Faculty Wing", floor:2, status:"In class",   next:"10:50 · AB-204" },
    { name:"Dr. K. Bansal",  room:"FC-141", block:"Faculty Wing", floor:2, status:"On leave",   next:"—" },
    { name:"Prof. M. Dsouza",room:"FC-115", block:"Faculty Wing", floor:1, status:"In cabin",   next:"14:00 · LB-12" },
  ],
  utilities: [
    { label:"Electricity", value:1840, budget:2400, unit:"kWh", color:"var(--warn)" },
    { label:"Water",       value:52,   budget:90,   unit:"kL",  color:"var(--accent)" },
    { label:"HVAC load",   value:71,   budget:100,  unit:"%",   color:"var(--accent-2)" },
    { label:"Solar offset",value:410,  budget:600,  unit:"kWh", color:"var(--ok)" },
  ],
  parking: [
    { lot:"Gate 1 · Faculty", total:28, taken:21, ev:3 },
    { lot:"Gate 2 · Student", total:40, taken:34, ev:2 },
    { lot:"Visitor Bay",      total:16, taken:5,  ev:1 },
  ],
  occupancy: {
    hours:["8","9","10","11","12","13","14","15","16"],
    blocks:[
      { block:"Block A",  values:[30,72,88,91,64,40,70,85,55] },
      { block:"Lab Block",values:[15,45,80,95,70,35,60,78,42] },
      { block:"Library",  values:[20,35,50,62,75,88,80,68,58] },
      { block:"Cafeteria",values:[40,30,45,60,96,92,55,48,70] },
      { block:"Hostel Rd",values:[70,55,25,20,45,58,30,35,80] },
    ],
  },
  alerts: [
    { id:"MT-1042", room:"AB-101", category:"Projector / AV", severity:"High",   note:"Projector lamp failure — class shifted", by:"Dr. A. Mehra", time:"09:12" },
    { id:"MT-1041", room:"LB-07",  category:"Electrical",     severity:"High",   note:"Socket row 3 not powering workstations", by:"Lab assistant", time:"08:55" },
    { id:"MT-1039", room:"Washroom B2", category:"Plumbing",  severity:"Medium", note:"Continuous flow detected by smart meter", by:"IoT sensor", time:"08:20" },
    { id:"MT-1036", room:"AB-209", category:"Furniture",      severity:"Low",    note:"4 chairs damaged", by:"Prof. S. Nair", time:"Yesterday" },
    { id:"MT-1031", room:"Lab Block", category:"Network",     severity:"Medium", note:"AP-14 offline, weak coverage floor 1", by:"Network ops", time:"Yesterday" },
  ],
  resources: [
    { title:"Unit 3 — Digital Twin Architectures", course:"CSE3012", type:"Slides", by:"Dr. R. Iyer", time:"2h ago" },
    { title:"ESP32 Sensor Interfacing Lab Manual", course:"ECE2011", type:"Lab Manual", by:"Prof. S. Nair", time:"Yesterday" },
  ],
  notices: [
    "Block A corridor crowd expected 12:30–13:10 — use Lab Block link bridge.",
    "Library Discussion Room 2 freed at 13:00.",
    "IoT Lab open access session today, 16:00–18:00.",
  ],
  crowd: [ {t:"10a",v:62},{t:"11a",v:78},{t:"12p",v:94},{t:"1p",v:71},{t:"2p",v:55},{t:"3p",v:66} ],
};

/* --------- Single access point used by ALL UI code ---------------- */
const DATA_SOURCE = {
  async _get(key) {
    if (!USE_LIVE_API) return structuredClone(MOCK[key]);           // mock path
    const res = await fetch(ENDPOINTS[key]);                        // live path
    if (!res.ok) throw new Error(`${key} request failed`);
    return res.json();
  },
  getRooms()      { return this._get("rooms"); },
  getFaculty()    { return this._get("faculty"); },
  getUtilities()  { return this._get("utilities"); },
  getParking()    { return this._get("parking"); },
  getOccupancy()  { return this._get("occupancy"); },
  getAlerts()     { return this._get("alerts"); },
  getResources()  { return this._get("resources"); },
  getNotices()    { return this._get("notices"); },
  getCrowd()      { return this._get("crowd"); },

  /* Writes — swap bodies for POST fetches later */
  async postResource(payload) {
    if (USE_LIVE_API) return (await fetch(ENDPOINTS.resources, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) })).json();
    return { ...payload, by:"You", time:"just now" };
  },
  async postIssue(payload) {
    if (USE_LIVE_API) return (await fetch(ENDPOINTS.alerts, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) })).json();
    return { id:`MT-${Math.floor(1000 + Math.random()*9000)}`, time:"just now", by:"You", ...payload };
  },
  async askAssistant(question) {
    if (USE_LIVE_API) return (await fetch(ENDPOINTS.assistant, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ question }) })).json();
    return { answer: mockAssistantReply(question) };
  },
};

/* Rule-based stand-in for the AI teammate's RAG assistant */
function mockAssistantReply(q) {
  const s = q.toLowerCase();
  const free = MOCK.rooms.filter(r => r.status === "available");
  if (s.includes("free") || s.includes("available") || s.includes("empty"))
    return `${free.length} spaces are free right now — closest: ${free.slice(0,3).map(r=>r.id).join(", ")}.`;
  if (s.includes("lab"))  return "IoT & Embedded Lab (LB-01) is open with 12/45 seats used. Networks Lab (LB-12) is nearly empty.";
  if (s.includes("crowd")||s.includes("busy")) return "Peak crowd is forecast at 12:00 (94%) near the Cafeteria. Prefer the Lab Block bridge route.";
  if (s.includes("route")||s.includes("how do i get")||s.includes("way"))
    return "Use the route bar under the 3D view — I'll highlight the shortest indoor path on the twin.";
  if (s.includes("cabin")||s.includes("sir")||s.includes("ma'am")||s.includes("faculty"))
    return "Prof. S. Nair is free in Cabin FC-122 (Faculty Wing, floor 1). Dr. A. Mehra is in cabin until 11:00.";
  if (s.includes("water")||s.includes("electric")||s.includes("energy"))
    return "Today: 1840 kWh electricity (77% of budget) and 52 kL water. A plumbing anomaly is flagged at Washroom B2.";
  return "I can help with room availability, indoor routes, faculty cabins, crowd forecasts and campus resource usage. Try: “Which labs are free now?”";
}

/* ============================= [2] HELPERS ========================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const statusBadge = (status) => {
  const map = { available:["badge-ok","Available"], occupied:["badge-bad","Occupied"], soon:["badge-warn","Free soon"] };
  const [cls, label] = map[status] || ["badge-ghost", status];
  return `<span class="badge ${cls}">${label}</span>`;
};
const heatColor = (v) => {
  // 0 -> deep teal, 100 -> red
  const stops = [[18,48,67],[53,224,208],[255,200,87],[255,95,126]];
  const p = Math.min(v,100)/100*(stops.length-1), i = Math.floor(p), f = p-i;
  const a = stops[i], b = stops[Math.min(i+1, stops.length-1)];
  return `rgb(${a.map((c,k)=>Math.round(c+(b[k]-c)*f)).join(",")})`;
};
function toast(message) {
  const t = el("div", "toast", message);
  $("#toastStack").append(t);
  setTimeout(() => { t.style.opacity = 0; t.style.transform = "translateX(30px)"; setTimeout(() => t.remove(), 300); }, 3200);
}

/* ============================== [3] SHELL =========================== */
function initShell() {
  // --- role switcher with sliding pill ---
  const pill = $(".role-pill"), btns = $$(".role-btn");
  const movePill = (btn) => { pill.style.left = btn.offsetLeft + "px"; pill.style.width = btn.offsetWidth + "px"; };
  btns.forEach(btn => btn.addEventListener("click", () => {
    btns.forEach(b => b.classList.toggle("is-active", b === btn));
    $$(".view").forEach(v => v.classList.toggle("is-active", v.id === `view-${btn.dataset.view}`));
    movePill(btn);
    location.hash = btn.dataset.view;
  }));
  const fromHash = btns.find(b => b.dataset.view === location.hash.slice(1));
  (fromHash || btns[0]).click();
  window.addEventListener("resize", () => movePill($(".role-btn.is-active")));

  // --- theme toggle (persisted) ---
  const saved = localStorage.getItem("dtc-theme");
  if (saved) document.documentElement.dataset.theme = saved;
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("dtc-theme", next);
  });

  // --- live clock ---
  const tick = () => $("#clock").textContent = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  tick(); setInterval(tick, 1000);
}

/* ========================= [4] STUDENT PORTAL ======================= */
let ROOMS = [], roomFilter = "all", roomQuery = "";

async function initStudent() {
  ROOMS = await DATA_SOURCE.getRooms();

  // quick stats
  const free = ROOMS.filter(r => r.status === "available").length;
  $("#studentQuickStats").innerHTML = `
    <div class="pill"><b>${free}</b><span>rooms free</span></div>
    <div class="pill"><b>${ROOMS.length}</b><span>tracked spaces</span></div>
    <div class="pill"><b>94%</b><span>peak crowd 12:00</span></div>`;

  // room search + filters
  $("#roomSearch").addEventListener("input", e => { roomQuery = e.target.value.toLowerCase(); renderRooms(); });
  $$("#roomFilters .chip").forEach(chip => chip.addEventListener("click", () => {
    $$("#roomFilters .chip").forEach(c => c.classList.toggle("is-active", c === chip));
    roomFilter = chip.dataset.filter; renderRooms();
  }));
  renderRooms();

  // route selectors
  const opts = ROOMS.map(r => `<option value="${r.id}">${r.id} · ${r.name}</option>`).join("");
  $("#routeFrom").innerHTML = opts; $("#routeTo").innerHTML = opts;
  $("#routeTo").selectedIndex = 3;
  $("#routeBtn").addEventListener("click", () => {
    const a = $("#routeFrom").value, b = $("#routeTo").value;
    if (a === b) return toast("Pick two different locations.");
    const dist = 40 + Math.floor(Math.random() * 260);
    $("#routeOut").textContent = `${a} → ${b} · ${dist} m · ~${Math.ceil(dist / 75)} min`;
    toast(`Shortest path plotted on the twin: ${a} → ${b}`);
    // TEAM HOOK: window.CampusTwin?.drawRoute(a, b)
  });

  // floor tabs (drive the 3D view later)
  $("#floorTabs").innerHTML = ["G","1","2","3"].map((f,i) => `<button class="${i===1?"is-active":""}" data-floor="${f}">Floor ${f}</button>`).join("");
  $$("#floorTabs button").forEach(b => b.addEventListener("click", () => {
    $$("#floorTabs button").forEach(x => x.classList.toggle("is-active", x === b));
    toast(`Twin switched to floor ${b.dataset.floor}`);
    // TEAM HOOK: window.CampusTwin?.setFloor(b.dataset.floor)
  }));

  // chatbot
  const suggestions = ["Which labs are free now?", "Where is Prof. S. Nair?", "How crowded is the cafeteria?"];
  $("#chatSuggestions").innerHTML = suggestions.map(s => `<button class="chip">${s}</button>`).join("");
  $$("#chatSuggestions .chip").forEach(c => c.addEventListener("click", () => sendChat(c.textContent)));
  pushMsg("ai", "Hi! I'm your campus twin assistant. Ask me about rooms, routes, faculty or crowd levels.");
  $("#chatForm").addEventListener("submit", e => { e.preventDefault(); const v = $("#chatInput").value.trim(); if (v) sendChat(v); });

  // crowd spark + notices
  const crowd = await DATA_SOURCE.getCrowd();
  $("#crowdSpark").innerHTML = crowd.map(c => `<div style="height:${c.v}%" data-label="${c.t}" title="${c.v}% capacity"></div>`).join("");
  $("#noticeList").innerHTML = (await DATA_SOURCE.getNotices()).map(n => `<li>${n}</li>`).join("");
}

function renderRooms() {
  const list = ROOMS.filter(r => {
    const matchQ = !roomQuery || `${r.id} ${r.name} ${r.block}`.toLowerCase().includes(roomQuery);
    const matchF = roomFilter === "all" || r.status === roomFilter || r.type === roomFilter;
    return matchQ && matchF;
  });
  $("#roomCount").textContent = `${list.length} results`;
  $("#roomList").innerHTML = list.length ? list.map(r => `
    <li class="room-item" data-id="${r.id}">
      <div>
        <h4>${r.id} · ${r.name}</h4>
        <p>${r.block} · Floor ${r.floor} · ${r.occupied}/${r.capacity} seats${r.course ? " · " + r.course : ""}</p>
      </div>
      <div class="meta">${statusBadge(r.status)}<span class="tiny mono">${r.status === "available" ? "now" : "till " + r.until}</span></div>
    </li>`).join("") : `<div class="empty">No space matches that search.</div>`;

  $$("#roomList .room-item").forEach(item => item.addEventListener("click", () => {
    toast(`Focusing ${item.dataset.id} on the 3D twin`);
    // TEAM HOOK: window.CampusTwin?.focusRoom(item.dataset.id)
  }));
}

function pushMsg(role, text) {
  const m = el("div", `msg msg-${role}`, text);
  $("#chatLog").append(m);
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  return m;
}
async function sendChat(text) {
  $("#chatInput").value = "";
  pushMsg("user", text);
  const typing = pushMsg("ai", `<span class="msg-typing"><span></span><span></span><span></span></span>`);
  const { answer } = await DATA_SOURCE.askAssistant(text);
  setTimeout(() => { typing.innerHTML = answer; $("#chatLog").scrollTop = $("#chatLog").scrollHeight; }, 550);
}

/* ========================= [5] FACULTY PORTAL ======================= */
async function initFaculty() {
  const faculty = await DATA_SOURCE.getFaculty();
  const rooms = ROOMS.length ? ROOMS : await DATA_SOURCE.getRooms();

  $("#facultyQuickStats").innerHTML = `
    <div class="pill"><b>${faculty.filter(f=>f.status==="Free").length}</b><span>colleagues free</span></div>
    <div class="pill"><b>${rooms.filter(r=>r.status==="available").length}</b><span>bookable rooms</span></div>
    <div class="pill"><b>2</b><span>open tickets</span></div>`;

  const drawTable = (q = "") => {
    $("#facultyTable tbody").innerHTML = faculty
      .filter(f => `${f.name} ${f.room}`.toLowerCase().includes(q))
      .map(f => `<tr>
        <td><b>${f.name}</b><br /><span class="tiny mono">${f.room}</span></td>
        <td>${f.block}</td><td>${f.floor}</td>
        <td><span class="badge ${f.status==="Free"?"badge-ok":f.status==="On leave"?"badge-ghost":"badge-warn"}">${f.status}</span></td>
        <td class="mono tiny">${f.next}</td></tr>`).join("");
  };
  drawTable();
  $("#facultySearch").addEventListener("input", e => drawTable(e.target.value.toLowerCase()));

  // availability grid
  $("#availGrid").innerHTML = rooms.map(r => {
    const cls = r.status === "available" ? "free" : r.status === "soon" ? "soon" : "busy";
    return `<div class="avail-cell ${cls}" title="${r.name} · ${r.occupied}/${r.capacity}"><b>${r.id}</b>${r.status === "available" ? "free" : r.until}</div>`;
  }).join("");
  $("#availSummary").textContent = `${rooms.filter(r=>r.status==="available").length}/${rooms.length} free`;

  // resource sharing
  const resources = await DATA_SOURCE.getResources();
  const drawFeed = () => $("#resourceFeed").innerHTML = resources.map(r =>
    `<li><b>${r.title}</b><small>${r.course} · ${r.type} · ${r.by} · ${r.time}</small></li>`).join("");
  drawFeed();
  $("#resourceForm").addEventListener("submit", async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    resources.unshift(await DATA_SOURCE.postResource(fd));
    drawFeed(); e.target.reset(); toast("Resource published to student portal.");
  });

  // maintenance reporting
  $("#issueRoom").innerHTML = rooms.map(r => `<option>${r.id} · ${r.name}</option>`).join("");
  let priority = "Medium";
  $$("#prioritySeg .seg-btn").forEach(b => b.addEventListener("click", () => {
    $$("#prioritySeg .seg-btn").forEach(x => x.classList.toggle("is-active", x === b));
    priority = b.dataset.val;
  }));
  const issues = [];
  $("#issueForm").addEventListener("submit", async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const ticket = await DATA_SOURCE.postIssue({ ...fd, severity: priority });
    issues.unshift(ticket);
    $("#issueFeed").innerHTML = issues.map(i =>
      `<li><b>${i.id} · ${i.category}</b><small>${i.room} · ${i.severity} · ${i.description || "no description"}</small></li>`).join("");
    e.target.reset(); toast(`Ticket ${ticket.id} raised — visible in Admin log.`);
    MOCK.alerts.unshift({ id:ticket.id, room:ticket.room, category:ticket.category, severity:priority, note:ticket.description||"—", by:"Faculty", time:"just now" });
  });
}

/* ========================== [6] ADMIN PORTAL ======================== */
async function initAdmin() {
  const [utilities, parking, occ] = await Promise.all([
    DATA_SOURCE.getUtilities(), DATA_SOURCE.getParking(), DATA_SOURCE.getOccupancy(),
  ]);

  $("#adminQuickStats").innerHTML = `<div class="pill"><b>5</b><span>buildings synced</span></div><div class="pill"><b>38</b><span>IoT nodes online</span></div>`;

  // KPI cards
  const totalSlots = parking.reduce((a,p)=>a+p.total,0), taken = parking.reduce((a,p)=>a+p.taken,0);
  $("#kpiRow").innerHTML = [
    { l:"Campus occupancy", v:"68%", d:"+6% vs yesterday", up:true },
    { l:"Electricity today", v:"1840 kWh", d:"-4% vs budget", up:true },
    { l:"Water today", v:"52 kL", d:"+9% anomaly flagged", up:false },
    { l:"Parking free", v:`${totalSlots-taken}/${totalSlots}`, d:"Gate 2 near full", up:false },
  ].map(k => `<div class="kpi"><span>${k.l}</span><b>${k.v}</b><i class="${k.up?"up":"down"}">${k.d}</i></div>`).join("");

  // heatmap
  $("#heatmap").innerHTML = [
    `<div class="heat-row"><span class="lbl"></span>${occ.hours.map(h=>`<span class="lbl" style="text-align:center">${h}</span>`).join("")}</div>`,
    ...occ.blocks.map(b => `<div class="heat-row"><span class="lbl">${b.block}</span>${
      b.values.map(v => `<div class="heat-cell" style="background:${heatColor(v)}" title="${b.block} · ${v}%">${v}</div>`).join("")}</div>`),
  ].join("");

  // utility progress bars
  $("#utilityMeters").innerHTML = utilities.map(u => {
    const pct = Math.round(u.value / u.budget * 100);
    return `<div class="meter">
      <div class="row"><span>${u.label}</span><b>${u.value} ${u.unit} <span class="tiny">/ ${u.budget}</span></b></div>
      <div class="track"><div class="fill" style="width:0;background:${u.color}" data-w="${pct}%"></div></div>
    </div>`;
  }).join("");
  requestAnimationFrame(() => $$("#utilityMeters .fill").forEach(f => f.style.width = f.dataset.w));

  // parking
  $("#parkingLots").innerHTML = parking.map(p => `
    <div class="park-lot">
      <h4><span>${p.lot}</span><span class="mono tiny">${p.total - p.taken} free</span></h4>
      <div class="slots">${Array.from({length:p.total}, (_,i) =>
        `<div class="slot ${i < p.taken ? "taken" : i >= p.total - p.ev ? "ev" : ""}"></div>`).join("")}</div>
    </div>`).join("");
  $("#parkSummary").textContent = `${totalSlots - taken} of ${totalSlots} free`;

  // alert log + filters
  const drawAlerts = async (sev = "all") => {
    const alerts = await DATA_SOURCE.getAlerts();
    const rows = alerts.filter(a => sev === "all" || a.severity === sev);
    $("#alertLog").innerHTML = rows.length ? rows.map(a => `
      <li class="alert ${a.severity}">
        <span class="badge ${a.severity==="High"?"badge-bad":a.severity==="Medium"?"badge-warn":"badge-ok"}">${a.severity}</span>
        <div><b>${a.id} · ${a.room}</b><br /><span class="tiny">${a.category} — ${a.note}</span></div>
        <span class="who">${a.by}<br />${a.time}</span>
      </li>`).join("") : `<div class="empty">No alerts at this severity.</div>`;
  };
  $$("#alertFilters .chip").forEach(c => c.addEventListener("click", () => {
    $$("#alertFilters .chip").forEach(x => x.classList.toggle("is-active", x === c));
    drawAlerts(c.dataset.sev);
  }));
  drawAlerts();
}

/* ================ [7] 3D MAP PLACEHOLDER (replaceable) ==============
   Lightweight animated wireframe so the layout never looks empty.
   3D teammate: mount your renderer on #map-canvas-container and expose
   window.CampusTwin = { focusRoom, setFloor, drawRoute } — the hooks
   above are already wired to call it.
   =================================================================== */
function initTwinPlaceholder() {
  const canvas = $("#twinCanvas"); if (!canvas || window.CampusTwin) return;
  const ctx = canvas.getContext("2d");
  const blocks = Array.from({ length: 9 }, (_, i) => ({ x:(i%3)-1, z:Math.floor(i/3)-1, h:0.4 + Math.random()*0.9 }));
  let angle = 0;

  const resize = () => { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; };
  resize(); window.addEventListener("resize", resize);

  const project = (x, y, z, cx, cy, s) => {
    const rx = x * Math.cos(angle) - z * Math.sin(angle);
    const rz = x * Math.sin(angle) + z * Math.cos(angle);
    return [cx + rx * s, cy + rz * s * 0.5 - y * s];
  };

  (function frame() {
    const w = canvas.width, h = canvas.height, cx = w/2, cy = h*0.62, s = Math.min(w, h)/4.2;
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = Math.max(1, devicePixelRatio);
    blocks.forEach((b, i) => {
      const base = [[-0.35,-0.35],[0.35,-0.35],[0.35,0.35],[-0.35,0.35]].map(([dx,dz]) => project(b.x+dx, 0, b.z+dz, cx, cy, s));
      const top  = [[-0.35,-0.35],[0.35,-0.35],[0.35,0.35],[-0.35,0.35]].map(([dx,dz]) => project(b.x+dx, b.h, b.z+dz, cx, cy, s));
      const hue = i % 3 === 0 ? "rgba(53,224,208," : i % 3 === 1 ? "rgba(124,140,255," : "rgba(255,200,87,";
      ctx.fillStyle = hue + "0.10)"; ctx.strokeStyle = hue + "0.75)";
      ctx.beginPath(); top.forEach((p,k)=>k?ctx.lineTo(...p):ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); base.forEach((p,k)=>k?ctx.lineTo(...p):ctx.moveTo(...p)); ctx.closePath(); ctx.stroke();
      base.forEach((p,k) => { ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...top[k]); ctx.stroke(); });
    });
    angle += 0.0035;
    requestAnimationFrame(frame);
  })();
}

/* ============================== [8] BOOT ============================ */
document.addEventListener("DOMContentLoaded", async () => {
  initShell();
  await initStudent();
  await initFaculty();
  await initAdmin();
  initTwinPlaceholder();
});
