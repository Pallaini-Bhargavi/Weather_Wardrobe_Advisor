const OPENWEATHER_KEY = "56d3340b5a2db0d248439495dcf862a4";

// DOM Elements
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const card = document.getElementById("card");
const geoBtn = document.getElementById("geoBtn");
const unitsSelect = document.getElementById("unitsSelect");
const feedbackArea = document.getElementById("feedbackArea");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const alternateArea = document.getElementById("alternateArea");

// Save preferences
function savePrefs() {
  const prefs = {
    units: unitsSelect.value
  };
  localStorage.setItem("nf_prefs", JSON.stringify(prefs));
}

unitsSelect.addEventListener("change", savePrefs);

// Load preferences
const prefs = JSON.parse(localStorage.getItem("nf_prefs") || "{}");
if (prefs.units) unitsSelect.value = prefs.units;

// MAIN SEARCH
searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return showError("Enter a city name");
  fetchWeather(city);
});

// GEOLOCATION BUTTON
geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => fetchWeather(null, pos.coords),
    () => showError("Location access denied")
  );
});

async function fetchWeather(city, coords) {
  try {
    showLoading();
    const units = unitsSelect.value;

    const url = coords
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${OPENWEATHER_KEY}&units=${units}`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_KEY}&units=${units}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("City not found");

    const data = await res.json();
    renderWeather(data);

  } catch (err) {
    showError("City not found");
  }
}

function renderWeather(data) {
  const { name, main, weather, sys } = data;

  const temp = Math.round(main.temp);
  const humidity = main.humidity;
  const description = weather[0].description;
  const id = weather[0].id;

  const isNight = isNightTime(sys);
  const units = unitsSelect.value;

  const outfit = generateOutfit(main.temp, id, humidity, units, isNight);

  card.classList.remove("hidden");
  feedbackArea.classList.remove("hidden");
  alternateArea.classList.add("hidden");

  card.innerHTML = `
    <div>
      <div class="city">${name}</div>
      <div class="temp">${temp}°${units === "metric" ? "C" : "F"}</div>
      <div class="desc">${description}</div>
      <div class="desc">Humidity: ${humidity}%</div>

      <div class="recommendation">
        <strong style="font-size:1.3rem;">Outfit Recommendation</strong>
        ${outfit.map(item => `
          <div class="rec-item">
            <span>${item.slot}</span>
            <span>${item.choice}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="emoji">${weatherEmoji(id)}</div>
  `;

  card.dataset.outfit = JSON.stringify(outfit);
}

function isNightTime(sys) {
  const now = Date.now() / 1000;
  return now < sys.sunrise || now > sys.sunset;
}


// ⭐ FABRIC-BASED OUTFIT RECOMMENDATION
function generateOutfit(temp, id, humidity, units, isNight) {
  let tempC = units === "metric" ? temp : (temp - 32) * 5/9;

  if (isNight) tempC -= 2;

  const items = [];

  /* 🌞 HOT WEATHER */
  if (tempC >= 30) {
    items.push({ slot: "Top", choice: "Cotton or Linen (breathable fabric)" });
    items.push({ slot: "Bottom", choice: "Cotton shorts or Light Nylon" });
  }

  /* 🌤️ WARM WEATHER */
  else if (tempC >= 20) {
    items.push({ slot: "Top", choice: "Cotton or Light Polyester" });
    items.push({ slot: "Bottom", choice: "Denim or Cotton chinos" });
  }

  /* 🌥️ COOL WEATHER */
  else if (tempC >= 10) {
    items.push({ slot: "Top", choice: "Fleece or Light Wool" });
    items.push({ slot: "Bottom", choice: "Denim or Warm Cotton pants" });
  }

  /* ❄️ COLD WEATHER */
  else {
    items.push({ slot: "Top", choice: "Thermal inner + Wool or Fleece" });
    items.push({ slot: "Bottom", choice: "Thermal leggings or Wool pants" });
  }

  /* 🌧️ RAIN */
  if (id >= 500 && id < 600) {
    items.push({ slot: "Outerwear", choice: "Waterproof Nylon / Raincoat" });
  }

  /* ❄️ SNOW */
  if (id >= 600 && id < 700) {
    items.push({ slot: "Outerwear", choice: "Insulated Waterproof Jacket" });
    items.push({ slot: "Shoes", choice: "Waterproof Snow Boots" });
  }

  /* ☀️ HOT CLEAR SKY */
  if (id === 800 && tempC >= 25) {
    items.push({ slot: "Accessory", choice: "Sunglasses (UV Protection)" });
  }

  /* 🌫️ FOG */
  if (id >= 700 && id < 800) {
    items.push({ slot: "Accessory", choice: "Reflective fabric recommended" });
  }

  return items;
}


// Feedback System
yesBtn.addEventListener("click", () => {
  alert("Thanks for your feedback!");
  feedbackArea.classList.add("hidden");
});

noBtn.addEventListener("click", () => {
  const old = JSON.parse(card.dataset.outfit);

  const alternateChoices = {
    "Cotton or Linen (breathable fabric)": "Linen or Rayon",
    "Cotton shorts or Light Nylon": "Polyester shorts or Activewear Nylon",
    "Cotton or Light Polyester": "Linen or Bamboo fabric",
    "Denim or Cotton chinos": "Joggers or Cargo Pants",
    "Fleece or Light Wool": "Cashmere or Knitted Cotton",
    "Denim or Warm Cotton pants": "Corduroy or Thermal Joggers",
    "Thermal inner + Wool or Fleece": "Down Jacket + Thermal Top",
    "Thermal leggings or Wool pants": "Fleece-lined Joggers or Layered Cotton pants",
    "Waterproof Nylon / Raincoat": "PVC Waterproof Jacket",
    "Insulated Waterproof Jacket": "Padded Down Jacket",
    "Waterproof Snow Boots": "Thermal Waterproof Boots",
    "Sunglasses (UV Protection)": "Polarized Sunglasses",
    "Reflective fabric recommended": "High-visibility Reflective Strips"
  };

  const alt = old.map(x => ({
    slot: x.slot,
    choice: alternateChoices[x.choice] || (x.choice + " (alt)")
  }));

  alternateArea.innerHTML = `
    <strong style="font-size:1.3rem;">Alternate Outfit</strong>
    ${alt.map(item => `
      <div class="rec-item">
        <span>${item.slot}</span>
        <span>${item.choice}</span>
      </div>
    `).join("")}
  `;
  alternateArea.classList.remove("hidden");
});

function showLoading() {
  card.classList.remove("hidden");
  card.innerHTML = "<div class='city'>Loading...</div>";
  feedbackArea.classList.add("hidden");
}

function showError(msg) {
  card.classList.remove("hidden");
  feedbackArea.classList.add("hidden");
  card.innerHTML = `<div class='city'>${msg}</div>`;
}

function weatherEmoji(id) {
  if (id >= 200 && id < 300) return "⛈️";
  if (id >= 300 && id < 400) return "🌦️";
  if (id >= 500 && id < 600) return "🌧️";
  if (id >= 600 && id < 700) return "❄️";
  if (id >= 700 && id < 800) return "🌫️";
  if (id === 800) return "☀️";
  return "☁️";
}
