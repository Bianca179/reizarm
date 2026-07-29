// Öffentliches Einreichungsformular (Airtable Form-View, ohne Account nutzbar).
// Nach dem Anlegen des Form-Views in Airtable hier den Share-Link eintragen.
const SUBMISSION_FORM_URL = "";

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
  const res = await fetch("data/places.json");
  state.places = await res.json();

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
  const cities = [...new Set(state.places.map((p) => p.city))].sort();
  for (const city of cities) {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    select.appendChild(opt);
  }
}

function buildCategoryFilter() {
  const container = document.getElementById("filter-categories");
  const categories = [...new Set(state.places.map((p) => p.category))].sort();
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

  const visibleIds = new Set(filtered.map((p) => p.id));
  for (const place of filtered) {
    const marker = L.marker([place.lat, place.lng]).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${escapeHtml(place.category)}`);
    marker.on("click", () => highlightCard(place.id));
    markers.set(place.id, marker);
  }
  void visibleIds;
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

    card.innerHTML = `
      <h3>${escapeHtml(place.name)}</h3>
      <p class="meta">${escapeHtml(place.category)} · ${escapeHtml(place.city)}</p>
      <div class="criteria-badges">${badges}</div>
      <p class="tips">${escapeHtml(place.tips || "")}</p>
    `;

    card.addEventListener("click", () => focusPlace(place));
    list.appendChild(card);
  }
}

function levelLabel(level) {
  return { 1: "reizarm", 2: "mittel", 3: "intensiv" }[level] || "?";
}

function focusPlace(place) {
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
