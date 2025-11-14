const form = document.querySelector(".weather-form");
const card = document.getElementById("card");
const cityInput = document.querySelector(".city-input");
const loader = document.getElementById("loader");

const apiKey = "e271b2cdcffa28d5b6df80d42e56e915";

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();

    if (!city) return showError("Enter a city name");

    loader.style.display = "block";
    card.style.display = "none";

    try {
        const data = await getWeather(city);
        showWeather(data);
    } catch (error) {
        showError("City not found");
    } finally {
        loader.style.display = "none";
    }
});

async function getWeather(city){
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("Failed");

    return res.json();
}

function showWeather(data){
    const city = data.name;
    const tempC = (data.main.temp - 273.15).toFixed(1);
    const humidity = data.main.humidity;
    const description = data.weather[0].description;
    const id = data.weather[0].id;

    const emoji = getEmoji(id);

    card.innerHTML = `
        <div class="city">${city}</div>
        <div class="emoji">${emoji}</div>
        <div class="temp">${tempC}°C</div>
        <div class="desc">${description}</div>
        <div class="data">Humidity: ${humidity}%</div>
    `;

    card.style.display = "flex";
}

function showError(msg){
    card.style.display = "flex";
    card.innerHTML = `<div class='error'>${msg}</div>`;
}

function getEmoji(id){
    if (id >= 200 && id < 300) return "⛈️";
    if (id >= 300 && id < 400) return "🌦️";
    if (id >= 500 && id < 600) return "🌧️";
    if (id >= 600 && id < 700) return "❄️";
    if (id >= 700 && id < 800) return "🌫️";
    if (id === 800) return "☀️";
    if (id > 800) return "☁️";
    return "❓";
}
