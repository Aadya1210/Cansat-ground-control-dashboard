const state = {
  running: false,
  packet: 0,
  startTime: null,
  timer: null,
  serialReader: null,
  cameraStream: null,
  commandStatus: "STANDBY",
  separated: false,
  parachute: false,
  telemetry: [],
  maxPoints: 60,
  baseLat: 28.6139,
  baseLon: 77.2090
};

const graphSeries = {
  altitude: { label: "Altitude", color: "#39c3ff", min: 0, max: 750 },
  pressure: { label: "Pressure", color: "#ffcc66", min: 900, max: 1020 },
  payloadTemp: { label: "Temp", color: "#ff5c75", min: 10, max: 45 },
  descentRate: { label: "Descent", color: "#65e4a3", min: 0, max: 16 },
  battery: { label: "Battery", color: "#b78cff", min: 6.5, max: 8.5 }
};

const containerFields = [
  ["altitude", "Altitude", "m"],
  ["pressure", "Pressure", "hPa"],
  ["descentRate", "Descent Rate", "m/s"],
  ["battery", "Battery", "V"],
  ["containerTemp", "Container Temp", "deg C"],
  ["signal", "Signal", "%"]
];

const payloadFields = [
  ["payloadTemp", "Payload Temp", "deg C"],
  ["humidity", "Humidity", "%"],
  ["roll", "Roll", "deg"],
  ["pitch", "Pitch", "deg"],
  ["yaw", "Yaw", "deg"],
  ["gpsStatus", "GPS", ""]
];

const els = {
  clock: document.querySelector("#clock"),
  elapsed: document.querySelector("#missionElapsed"),
  linkStatus: document.querySelector("#linkStatus"),
  missionState: document.querySelector("#missionState"),
  packetCount: document.querySelector("#packetCount"),
  errorCode: document.querySelector("#errorCode"),
  gpsLock: document.querySelector("#gpsLock"),
  dateLabel: document.querySelector("#dateLabel"),
  lastCommand: document.querySelector("#lastCommand"),
  commandStatus: document.querySelector("#commandStatus"),
  commandLog: document.querySelector("#commandLog"),
  packetMirror: document.querySelector("#packetMirror"),
  altitudeTrend: document.querySelector("#altitudeTrend"),
  pressureTrend: document.querySelector("#pressureTrend"),
  tempTrend: document.querySelector("#tempTrend"),
  batteryTrend: document.querySelector("#batteryTrend"),
  descentTrend: document.querySelector("#descentTrend"),
  signalTrend: document.querySelector("#signalTrend"),
  parachuteHealth: document.querySelector("#parachuteHealth"),
  batteryHealth: document.querySelector("#batteryHealth"),
  maxAltitude: document.querySelector("#maxAltitude"),
  launchTime: document.querySelector("#launchTime"),
  apogeeTime: document.querySelector("#apogeeTime"),
  totalDistance: document.querySelector("#totalDistance"),
  flightTime: document.querySelector("#flightTime"),
  phaseDescent: document.querySelector("#phaseDescent"),
  phaseLanding: document.querySelector("#phaseLanding"),
  graphCanvas: document.querySelector("#graphCanvas"),
  mapCanvas: document.querySelector("#mapCanvas"),
  graphLegend: document.querySelector("#graphLegend"),
  coordinates: document.querySelector("#coordinates"),
  horizon: document.querySelector("#horizon"),
  rollValue: document.querySelector("#rollValue"),
  pitchValue: document.querySelector("#pitchValue"),
  yawValue: document.querySelector("#yawValue"),
  telemetryTable: document.querySelector("#telemetryTable"),
  logCount: document.querySelector("#logCount"),
  cameraSelect: document.querySelector("#cameraSelect"),
  cameraStatus: document.querySelector("#cameraStatus"),
  video: document.querySelector("#video")
};

function init() {
  renderLegend();
  bindControls();
  initTooltips();
  tickClock();
  setInterval(tickClock, 1000);
  refreshCameras();
  drawGraph();
  drawMap();
  window.addEventListener("resize", drawGraph);
  logCommand("System ready. Simulation mode armed.");
}

function initTooltips() {
  if (typeof tippy === "undefined") return;
  tippy(".telemetry-card[data-tippy-content]", {
    theme: "cansat",
    placement: "top",
    arrow: true,
    animation: "shift-away",
    delay: [180, 0],
    maxWidth: 280,
    touch: ["hold", 400]
  });
}

function renderLegend() {
  if (!els.graphLegend) return;
  els.graphLegend.innerHTML = Object.values(graphSeries).map(series =>
    `<span class="legend-item" style="--legend-color:${series.color}">${series.label}</span>`
  ).join("");
}

function bindControls() {
  document.querySelector("#sidebarToggle").addEventListener("click", toggleSidebar);
  document.querySelector("#startBtn").addEventListener("click", startTelemetry);
  document.querySelector("#stopBtn").addEventListener("click", stopTelemetry);
  document.querySelector("#exportCsvBtn").addEventListener("click", exportCsv);
  document.querySelector("#exportGraphBtn").addEventListener("click", exportGraph);
  document.querySelector("#syncTimeBtn").addEventListener("click", () => logCommand("PC time synced with dashboard clock."));
  document.querySelector("#resetPacketBtn").addEventListener("click", resetPackets);
  document.querySelector("#connectSerialBtn").addEventListener("click", connectSerial);
  document.querySelector("#separateBtn").addEventListener("click", () => runCommand("Manual separation", () => state.separated = true));
  document.querySelector("#parachuteBtn").addEventListener("click", () => runCommand("Emergency parachute deployment", () => state.parachute = true));
  document.querySelector("#redundantBtn").addEventListener("click", () => runCommand("Redundant activation", () => state.commandStatus = "REDUNDANT ACTIVE"));
  document.querySelector("#startCameraBtn").addEventListener("click", startCamera);
  document.querySelector("#stopCameraBtn").addEventListener("click", stopCamera);
}

function toggleSidebar() {
  const layout = document.querySelector(".mission-layout");
  const btn = document.querySelector("#sidebarToggle");
  const collapsed = layout.classList.toggle("sidebar-collapsed");
  btn.setAttribute("aria-expanded", String(!collapsed));
  btn.textContent = collapsed ? "Show Panels" : "Mission Panels";
  drawGraph();
}

function startTelemetry() {
  if (state.running) return;
  state.running = true;
  state.startTime = state.startTime || Date.now();
  state.timer = setInterval(() => acceptTelemetry(generateTelemetry()), 1000);
  els.linkStatus.textContent = "STREAMING";
  els.linkStatus.className = "live";
  els.missionState.textContent = "ASCENT";
  els.launchTime.textContent = els.launchTime.textContent === "--" ? new Date().toLocaleTimeString() : els.launchTime.textContent;
  logCommand("Telemetry stream started.");
}

function stopTelemetry() {
  state.running = false;
  clearInterval(state.timer);
  els.linkStatus.textContent = "STOPPED";
  els.linkStatus.className = "";
  els.missionState.textContent = "HOLD";
  logCommand("Telemetry stream stopped.");
}

function resetPackets() {
  state.packet = 0;
  state.telemetry = [];
  state.separated = false;
  state.parachute = false;
  state.startTime = Date.now();
  els.telemetryTable.innerHTML = "";
  els.launchTime.textContent = "--";
  els.apogeeTime.textContent = "--";
  els.maxAltitude.textContent = "--";
  els.totalDistance.textContent = "--";
  els.flightTime.textContent = "--";
  updateSummary(null, "0000");
  drawGraph();
  drawMap();
  logCommand("Packet counter and telemetry history reset.");
}

function generateTelemetry() {
  state.packet += 1;
  const t = state.packet;
  const descending = t > 32;
  const altitude = Math.max(0, descending ? 720 - ((t - 32) * 9.2) : t * 21.5);
  const descentRate = descending ? 8 + Math.sin(t / 4) * 1.8 : Math.max(0, 1.2 + Math.sin(t / 3));
  const gpsAvailable = t % 23 !== 0;
  const lat = state.baseLat + Math.sin(t / 25) * 0.004 + t * 0.00004;
  const lon = state.baseLon + Math.cos(t / 28) * 0.004 + t * 0.00003;
  const separated = state.separated || t > 45;

  return {
    packet: state.packet,
    time: new Date().toLocaleTimeString(),
    altitude,
    pressure: 1013.2 - altitude * 0.11,
    descentRate,
    battery: 8.2 - t * 0.006,
    containerTemp: 27 + Math.sin(t / 8) * 4,
    payloadTemp: 25 + Math.cos(t / 9) * 3.5,
    humidity: 42 + Math.sin(t / 7) * 9,
    signal: gpsAvailable ? 88 + Math.sin(t / 5) * 7 : 38,
    roll: Math.sin(t / 6) * 38,
    pitch: Math.cos(t / 7) * 19,
    yaw: (t * 7) % 360,
    lat,
    lon,
    gpsStatus: gpsAvailable ? "LOCK" : "NO FIX",
    separated,
    parachute: state.parachute
  };
}

function acceptTelemetry(packet) {
  const errorCode = calculateErrorCode(packet);
  packet.errorCode = errorCode;
  state.telemetry.push(packet);
  if (state.telemetry.length > 500) state.telemetry.shift();
  updateMetrics(packet);
  updateSummary(packet, errorCode);
  updateOrientation(packet);
  updateTable(packet);
  drawGraph();
  drawMap();
}

function calculateErrorCode(packet) {
  const descentFault = packet.descentRate < 8 || packet.descentRate > 10 ? "1" : "0";
  const gpsFault = packet.gpsStatus === "LOCK" ? "0" : "1";
  const separationFault = packet.packet > 50 && !packet.separated ? "1" : "0";
  const parachuteActive = packet.parachute ? "1" : "0";
  return `${descentFault}${gpsFault}${separationFault}${parachuteActive}`;
}

function updateMetrics(packet) {
  const values = {
    altitude: format(packet.altitude, 1),
    pressure: format(packet.pressure, 1),
    descentRate: format(packet.descentRate, 2),
    battery: format(packet.battery, 2),
    containerTemp: format(packet.containerTemp, 1),
    signal: format(packet.signal, 0),
    payloadTemp: format(packet.payloadTemp, 1),
    humidity: format(packet.humidity, 0),
    roll: format(packet.roll, 1),
    pitch: format(packet.pitch, 1),
    yaw: format(packet.yaw, 0),
    gpsStatus: packet.gpsStatus
  };

  [...containerFields, ...payloadFields].forEach(([key, label, unit]) => {
    const node = document.querySelector(`#metric-${key}`);
    if (!node) return;
    const valStr = String(values[key]);
    if (node.textContent !== valStr) {
      node.textContent = valStr;
      pulseMetric(node);
    }
  });

  els.altitudeTrend.textContent = `${packet.packet > 32 ? "-" : "+"} ${format(Math.abs(packet.descentRate), 2)} m/s`;
  els.pressureTrend.textContent = `${packet.packet > 32 ? "+" : "-"} ${format(Math.abs(packet.descentRate / 7), 1)} hPa`;
  els.tempTrend.textContent = `${packet.payloadTemp >= 25 ? "+" : "-"} ${format(Math.abs(packet.payloadTemp - 25), 1)} C`;
  els.batteryTrend.textContent = `${Math.max(0, Math.round((packet.battery / 8.2) * 100))}%`;
  els.descentTrend.textContent = packet.descentRate >= 8 && packet.descentRate <= 10 ? "Stable" : "Watch";
  els.signalTrend.textContent = packet.signal > 70 ? "Good" : "Weak";
}

function pulseMetric(node) {
  if (!node) return;
  node.classList.remove("tm-value-flash");
  void node.offsetWidth;
  node.classList.add("tm-value-flash");
}

function updateSummary(packet, errorCode) {
  const packetStr = String(state.packet);
  els.packetCount.textContent = packetStr;
  if (els.packetMirror.textContent !== packetStr) pulseMetric(els.packetMirror);
  els.packetMirror.textContent = packetStr;
  els.errorCode.textContent = errorCode;
  els.errorCode.classList.toggle("fault", errorCode !== "0000");
  els.gpsLock.textContent = packet ? packet.gpsStatus : "WAITING";
  els.logCount.textContent = `${state.telemetry.length} records`;
  if (packet) {
    els.gpsLock.className = packet.gpsStatus === "LOCK" ? "live" : "";
    els.coordinates.textContent = `${packet.lat.toFixed(4)} N ${packet.lon.toFixed(4)} E`;
    const landed = packet.altitude <= 5 && packet.packet > 40;
    els.missionState.textContent = landed ? "LANDED" : packet.packet > 32 ? "DESCENT" : "ASCENT";
    els.phaseDescent.classList.toggle("active", !landed);
    els.phaseLanding.classList.toggle("active", landed);
    els.batteryHealth.textContent = `${Math.max(0, Math.round((packet.battery / 8.2) * 100))}%`;
    els.parachuteHealth.textContent = packet.parachute ? "ACTIVE" : "OK";
    els.maxAltitude.textContent = `${format(Math.max(...state.telemetry.map(p => p.altitude)), 0)} m`;
    if (packet.packet === 33 && els.apogeeTime.textContent === "--") els.apogeeTime.textContent = packet.time;
    els.totalDistance.textContent = `${format(estimateDistanceKm(), 2)} km`;
    els.flightTime.textContent = els.elapsed.textContent.replace("T+ ", "");
  }
}

function updateOrientation(packet) {
  const roll = packet.roll;
  const pitch = packet.pitch;
  els.horizon.querySelector(".sky").style.transform = `translateY(${pitch}px) rotate(${roll}deg)`;
  els.horizon.querySelector(".ground").style.transform = `translateY(${pitch}px) rotate(${roll}deg)`;
  els.rollValue.textContent = `${format(packet.roll, 1)} deg`;
  els.pitchValue.textContent = `${format(packet.pitch, 1)} deg`;
  els.yawValue.textContent = `${format(packet.yaw, 0)} deg`;
}

function updateTable(packet) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${packet.time}</td>
    <td>${packet.packet}</td>
    <td>${format(packet.altitude, 1)}</td>
    <td>${format(packet.payloadTemp, 1)}</td>
    <td>${format(packet.pressure, 1)}</td>
    <td>${format(packet.battery, 2)}</td>
    <td>${format(packet.descentRate, 2)}</td>
    <td>${packet.errorCode}</td>
  `;
  els.telemetryTable.prepend(row);
  while (els.telemetryTable.children.length > 30) {
    els.telemetryTable.lastElementChild.remove();
  }
}

function drawGraph() {
  const canvas = els.graphCanvas;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(480, Math.floor(rect.width * dpr));
  const height = Math.max(240, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  const points = state.telemetry.slice(-state.maxPoints);
  const pad = Math.floor(48 * dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#07101e";
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height, pad, dpr);

  Object.entries(graphSeries).forEach(([key, series]) => {
    ctx.beginPath();
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2.5 * dpr;
    points.forEach((point, index) => {
      const x = pad + (index / Math.max(1, state.maxPoints - 1)) * (width - pad * 1.5);
      const normalized = (point[key] - series.min) / (series.max - series.min);
      const y = height - pad - Math.max(0, Math.min(1, normalized)) * (height - pad * 1.6);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
}

function drawGrid(ctx, width, height, pad, dpr = 1) {
  ctx.strokeStyle = "#1c3152";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = pad + i * ((height - pad * 1.6) / 5);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad / 2, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#9fb2cb";
  ctx.font = `${12 * dpr}px Segoe UI`;
  ctx.fillText("Normalized telemetry (last 60 packets)", pad, pad - 14 * dpr);
  ctx.fillText("Time →", width - pad - 52 * dpr, height - 10 * dpr);
}

function drawMap() {
  const canvas = els.mapCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const points = state.telemetry.slice(-120);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#020a16";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 172, 61, 0.35)";
  for (let i = 0; i < 120; i += 1) {
    const x = (Math.sin(i * 38.31) * 0.5 + 0.5) * width;
    const y = (Math.cos(i * 17.17) * 0.5 + 0.5) * height;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.strokeStyle = "rgba(35, 88, 140, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(width * 0.42, height * 0.58, width * 0.55, height * 0.28, -0.1, 0, Math.PI * 2);
  ctx.stroke();
  if (!points.length) return;

  const lats = points.map(p => p.lat);
  const lons = points.map(p => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  ctx.beginPath();
  ctx.strokeStyle = "#65e4a3";
  ctx.lineWidth = 3;
  points.forEach((p, index) => {
    const x = scale(p.lon, minLon, maxLon, 28, width - 28);
    const y = scale(p.lat, minLat, maxLat, height - 28, 28);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  const latest = points[points.length - 1];
  const x = scale(latest.lon, minLon, maxLon, 28, width - 28);
  const y = scale(latest.lat, minLat, maxLat, height - 28, 28);
  ctx.fillStyle = "#ffcc66";
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff4d64";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();
}

function scale(value, min, max, outMin, outMax) {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function estimateDistanceKm() {
  if (state.telemetry.length < 2) return 0;
  let distance = 0;
  for (let i = 1; i < state.telemetry.length; i += 1) {
    const a = state.telemetry[i - 1];
    const b = state.telemetry[i];
    distance += haversineKm(a.lat, a.lon, b.lat, b.lon);
  }
  return distance;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const toRad = degrees => degrees * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function runCommand(name, action) {
  action();
  state.commandStatus = "EXECUTED";
  els.commandStatus.textContent = "EXECUTED";
  els.commandStatus.className = "last-command";
  els.lastCommand.textContent = name.toUpperCase();
  logCommand(`${name} command executed.`);
}

function logCommand(message) {
  const line = document.createElement("div");
  line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  els.commandLog.prepend(line);
}

async function connectSerial() {
  if (!("serial" in navigator)) {
    logCommand("Web Serial API unavailable. Continue using simulation mode.");
    return;
  }
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    state.serialReader = decoder.readable.getReader();
    els.linkStatus.textContent = "SERIAL";
    els.linkStatus.className = "live";
    readSerialLoop();
  } catch (error) {
    logCommand(`Serial connection failed: ${error.message}`);
  }
}

async function readSerialLoop() {
  let buffer = "";
  while (state.serialReader) {
    const { value, done } = await state.serialReader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop();
    lines.map(parseTelemetryLine).filter(Boolean).forEach(acceptTelemetry);
  }
}

function parseTelemetryLine(line) {
  const parts = line.trim().split(",");
  if (parts.length < 10) return null;
  state.packet += 1;
  return {
    packet: state.packet,
    time: new Date().toLocaleTimeString(),
    altitude: Number(parts[0]),
    pressure: Number(parts[1]),
    descentRate: Number(parts[2]),
    battery: Number(parts[3]),
    containerTemp: Number(parts[4]),
    payloadTemp: Number(parts[5]),
    humidity: Number(parts[6]),
    roll: Number(parts[7]),
    pitch: Number(parts[8]),
    yaw: Number(parts[9]),
    lat: Number(parts[10]) || state.baseLat,
    lon: Number(parts[11]) || state.baseLon,
    gpsStatus: parts[12] || "LOCK",
    signal: Number(parts[13]) || 80,
    separated: parts[14] === "1",
    parachute: parts[15] === "1"
  };
}

async function refreshCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    els.cameraSelect.innerHTML = "<option>Camera API unavailable</option>";
    return;
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(device => device.kind === "videoinput");
  els.cameraSelect.innerHTML = cameras.length
    ? cameras.map((device, index) => `<option value="${device.deviceId}">${device.label || `Camera ${index + 1}`}</option>`).join("")
    : "<option>No camera detected</option>";
}

async function startCamera() {
  try {
    stopCamera();
    const deviceId = els.cameraSelect.value;
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    });
    els.video.srcObject = state.cameraStream;
    els.video.classList.add("active");
    els.cameraStatus.textContent = "Camera streaming";
    refreshCameras();
  } catch (error) {
    els.cameraStatus.textContent = "Camera blocked";
    logCommand(`Camera start failed: ${error.message}`);
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
  }
  state.cameraStream = null;
  els.video.srcObject = null;
  els.video.classList.remove("active");
  els.cameraStatus.textContent = "Camera idle";
}

function exportCsv() {
  const header = "packet,time,altitude,pressure,descentRate,battery,containerTemp,payloadTemp,humidity,roll,pitch,yaw,lat,lon,gpsStatus,errorCode";
  const rows = state.telemetry.map(p => [
    p.packet, p.time, p.altitude, p.pressure, p.descentRate, p.battery, p.containerTemp,
    p.payloadTemp, p.humidity, p.roll, p.pitch, p.yaw, p.lat, p.lon, p.gpsStatus, p.errorCode
  ].join(","));
  downloadFile("cansat_telemetry_export.csv", [header, ...rows].join("\n"), "text/csv");
  logCommand("CSV export generated.");
}

function exportGraph() {
  const url = els.graphCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "cansat_graph_export.png";
  link.href = url;
  link.click();
  logCommand("Graph PNG export generated.");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function tickClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString();
  els.dateLabel.textContent = now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const elapsed = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  els.elapsed.textContent = `T+ ${h}:${m}:${s}`;
}

function format(value, digits) {
  return Number(value).toFixed(digits);
}

init();
