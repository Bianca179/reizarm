// Öffentliches Einreichungsformular (Airtable Form-View, ohne Account nutzbar).
// Nach dem Anlegen des Form-Views in Airtable hier den Share-Link eintragen.
const SUBMISSION_FORM_URL = "https://airtable.com/appPQ9KSqKDuS4HaC/shrNNXKHl24dCtDTy";

// Nur-Lese-Zugriff auf die Airtable-Base, damit neue Einreichungen sofort
// erscheinen, ohne dass jemand manuell einen Commit machen muss. Der Token
// MUSS auf data.records:read und genau diese eine Base beschränkt sein,
// da er im Frontend für alle sichtbar ist.
const AIRTABLE_BASE_ID = "appPQ9KSqKDuS4HaC";
const AIRTABLE_TABLE_NAME = "Orte";
const AIRTABLE_READ_TOKEN = "";

const AIRTABLE_FIELD_TO_CRITERIA = {
  Licht: "light",
  Geräuschkulisse: "noise",
  Musik: "music",
  "Düfte/Gerüche": "smell",
  Speisekarte: "menu",
  "Räumliche Faktoren": "space",
  "Soziale Reize": "social",
  "Sensorik allgemein": "sensory",
};

// Nur-Lese-Zugriff auf die Airtable-Base, damit neue Einreichungen sofort
// erscheinen, ohne dass jemand manuell einen Commit machen muss. Der Token
// MUSS auf data.records:read und genau diese eine Base beschränkt sein,
// da er im Frontend für alle sichtbar ist.
const AIRTABLE_BASE_ID = "appPQ9KSqKDuS4HaC";
const AIRTABLE_TABLE_NAME = "Orte";
const AIRTABLE_READ_TOKEN = "";

const AIRTABLE_FIELD_TO_CRITERIA = {
  Licht: "light",
  Geräuschkulisse: "noise",
  Musik: "music",
  "Düfte/Gerüche": "smell",
  Speisekarte: "menu",
  "Räumliche Faktoren": "space",
  "Soziale Reize": "social",
  "Sensorik allgemein": "sensory",
};

const CRITERIA = [
  { key: "light", label: "Licht" },
  { key: "noise", label: "Geräusche" },
  { key: "music", label: "Musik" },
  { key: "smell", label: "Düfte" },
  { key: "menu", label: "Speisekarte" },
  { key: "space", label: "Raum" },
  { key: "social", label: "Soziale Reize" },
  { key: "sensory", label: "Sensorik" },
];

const state = {
  places: [],
  city: "",
  categories: new Set(),
  criteriaMax: {}, // key -> 1 | 2 | undefined (undefined = egal)
};

let map;
let markers = new Map(); // place.id -> Leaflet marker

async function init() {
  const [curated, community] = await Promise.all([loadCuratedPlaces(), loadCommunityPlaces()]);
  state.places = [...curated, ...community];

  map = L.map("map").setView([48.7758, 9.1829], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap-Mitwirkende",
  }).addTo(map);

  buildCityFilter();
  buildCategoryFilter();
  buildCriteriaFilters();
  setupSubmissionLink();

  document.getElementById("filter-city").addEventListener("change", (e) => {
    state.city = e.target.value;
    render();
  });

  document.getElementById("filter-reset").addEventListener("click", resetFilters);

  render();
  geocodeMissingCoordinates(state.places).then(render);
}

async function loadCuratedPlaces() {
  const res = await fetch("data/places.json");
  const places = await res.json();
  return places.map((p) => ({ ...p, source: "curated" }));
}

async function loadCommunityPlaces() {
  if (!AIRTABLE_READ_TOKEN) return [];
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_READ_TOKEN}` } });
    if (!res.ok) throw new Error(`Airtable antwortete mit ${res.status}`);
    const data = await res.json();
    return (data.records || [])
      .filter((record) => record.fields["Status"] !== "Abgelehnt")
      .map(recordToPlace)
      .filter(Boolean);
  } catch (err) {
    console.warn("Community-Einträge konnten nicht geladen werden:", err);
    return [];
  }
}

function recordToPlace(record) {
  const f = record.fields;
  if (!f["Name des Orts"]) return null;

  const criteria = {};
  for (const { key } of CRITERIA) criteria[key] = 2;
  for (const [fieldName, key] of Object.entries(AIRTABLE_FIELD_TO_CRITERIA)) {
    criteria[key] = parseLevel(f[fieldName]);
  }

  return {
    id: `airtable-${record.id}`,
    name: f["Name des Orts"],
    category: f["Kategorie"] || "Sonstiges",
    city: f["Stadt"] || "",
    country: f["Land"] || "",
    address: f["Adresse"] || "",
    website: f["Website"] || "",
    lat: null,
    lng: null,
    criteria,
    tips: f["Tipps"] || "",
    source: "community",
  };
}

function parseLevel(value) {
  const match = /^(\d)/.exec(value || "");
  return match ? Number(match[1]) : 2;
}

async function geocodeMissingCoordinates(places) {
  for (const place of places) {
    if (place.lat != null && place.lng != null) continue;
    const query = [place.address, place.city, place.country].filter(Boolean).join(", ");
    if (!query) continue;
    try {
      const coords = await geocodeAddress(query);
      if (coords) Object.assign(place, coords);
    } catch (err) {
      console.warn("Geokodierung fehlgeschlagen für", place.name, err);
    }
    await delay(1100); // Nominatim-Nutzungsrichtlinie: max. 1 Anfrage/Sekunde
  }
}

async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const results = await res.json();
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupSubmissionLink() {
  const link = document.getElementById("submit-place-link");
  if (SUBMISSION_FORM_URL) {
    link.href = SUBMISSION_FORM_URL;
  } else {
    link.remove();
  }
}

function buildCityFilter() {
  const select = document.getElementById("filter-city");
  const cities = [...new Set(state.places.map((p) => p.city).filter(Boolean))].sort();
  for (const city of cities) {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    select.appendChild(opt);
  }
}

function buildCategoryFilter() {
  const container = document.getElementById("filter-categories");
  const categories = [...new Set(state.places.map((p) => p.category).filter(Boolean))].sort();
  for (const category of categories) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = category;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.categories.add(category);
      } else {
        state.categories.delete(category);
      }
      render();
    });
    label.appendChild(checkbox);
    label.append(category);
    container.appendChild(label);
  }
}

function buildCriteriaFilters() {
  const container = document.getElementById("filter-criteria");
  for (const { key, label } of CRITERIA) {
    const row = document.createElement("div");
    row.className = "criteria-filter-row";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;
    labelEl.htmlFor = `criteria-${key}`;

    const select = document.createElement("select");
    select.id = `criteria-${key}`;
    select.innerHTML = `
      <option value="">egal</option>
      <option value="1">nur sehr reizarm</option>
      <option value="2">reizarm bis mittel</option>
    `;
    select.addEventListener("change", (e) => {
      state.criteriaMax[key] = e.target.value ? Number(e.target.value) : undefined;
      render();
    });

    row.append(labelEl, select);
    container.appendChild(row);
  }
}

function resetFilters() {
  state.city = "";
  state.categories.clear();
  state.criteriaMax = {};

  document.getElementById("filter-city").value = "";
  document.querySelectorAll("#filter-categories input").forEach((cb) => (cb.checked = false));
  document.querySelectorAll("#filter-criteria select").forEach((sel) => (sel.value = ""));

  render();
}

function getFilteredPlaces() {
  return state.places.filter((place) => {
    if (state.city && place.city !== state.city) return false;
    if (state.categories.size && !state.categories.has(place.category)) return false;
    for (const [key, max] of Object.entries(state.criteriaMax)) {
      if (max !== undefined && place.criteria[key] > max) return false;
    }
    return true;
  });
}

function render() {
  const filtered = getFilteredPlaces();
  document.getElementById("result-count").textContent = filtered.length;
  renderMarkers(filtered);
  renderList(filtered);
}

function renderMarkers(filtered) {
  for (const marker of markers.values()) map.removeLayer(marker);
  markers.clear();

  for (const place of filtered) {
    if (place.lat == null || place.lng == null) continue;
    const marker = L.marker([place.lat, place.lng]).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${escapeHtml(place.category)}`);
    marker.on("click", () => highlightCard(place.id));
    markers.set(place.id, marker);
  }
}

function renderList(filtered) {
  const list = document.getElementById("place-list");
  list.innerHTML = "";

  for (const place of filtered) {
    const card = document.createElement("article");
    card.className = "place-card";
    card.dataset.id = place.id;

    const badges = CRITERIA.map(({ key, label }) => {
      const level = place.criteria[key];
      return `<span class="badge" data-level="${level}">${label}: ${levelLabel(level)}</span>`;
    }).join("");

    const communityTag =
      place.source === "community"
        ? `<span class="badge badge-community">Community-Eintrag · ungeprüft</span>`
        : "";
    const locationNote =
      place.lat == null || place.lng == null
        ? `<p class="hint">Standort konnte nicht automatisch gefunden werden.</p>`
        : "";

    card.innerHTML = `
      <h3>${escapeHtml(place.name)}</h3>
      <p class="meta">${escapeHtml(place.category)} · ${escapeHtml(place.city)}</p>
      <div class="criteria-badges">${communityTag}${badges}</div>
      <p class="tips">${escapeHtml(place.tips || "")}</p>
      ${locationNote}
    `;

    card.addEventListener("click", () => focusPlace(place));
    list.appendChild(card);
  }
}

function levelLabel(level) {
  return { 1: "reizarm", 2: "mittel", 3: "intensiv" }[level] || "?";
}

function focusPlace(place) {
  if (place.lat == null || place.lng == null) {
    highlightCard(place.id);
    return;
  }
  map.setView([place.lat, place.lng], 15);
  const marker = markers.get(place.id);
  if (marker) marker.openPopup();
  highlightCard(place.id);
}

function highlightCard(id) {
  document.querySelectorAll(".place-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.id === id);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

init();
