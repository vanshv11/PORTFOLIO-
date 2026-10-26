console.log("JavaScript connected");
const themeButton = document.getElementById("themeToggle");

themeButton.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        themeButton.textContent = "Switch to Light Mode";
    } else {
        themeButton.textContent = "Switch to Dark Mode";
    }

});

const cityInput = document.getElementById("cityInput");
const weatherButton = document.getElementById("weatherButton");
const weatherResult = document.getElementById("weatherResult");

async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        weatherResult.textContent = "Please enter a city.";
        return;
    }

    weatherResult.textContent = "Loading weather...";

    try {
        // Try the backend weather endpoint first
        let data = null;
        try {
            const apiRes = await fetch("/api/weather?city=" + encodeURIComponent(city));
            if (apiRes.status === 404) {
                weatherResult.textContent = "City not found. Check the spelling and try again.";
                return;
            }
            if (apiRes.ok) {
                data = await apiRes.json();
            }
        } catch {
            // Backend endpoint unavailable, will try direct fallback
        }

        // Direct OpenWeather fallback if backend is unavailable
        if (!data) {
            const apiKey = "80cbe9053ad7b33527a02c5405abaddc";
            const url = "https://api.openweathermap.org/data/2.5/weather?q=" +
                encodeURIComponent(city) +
                "&appid=" + apiKey +
                "&units=metric";
            const response = await fetch(url);
            if (response.status === 404) {
                weatherResult.textContent = "City not found. Check the spelling and try again.";
                return;
            }
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            const owData = await response.json();
            data = {
                name: owData.name,
                country: owData.sys?.country,
                temp: owData.main.temp,
                feels_like: owData.main.feels_like,
                condition: owData.weather[0].description
            };
        }

        let html = "<h3>" + data.name + (data.country ? ", " + data.country : "") + "</h3>" +
            "<p>Temperature: " + data.temp + "°C</p>" +
            "<p>Condition: " + data.condition + "</p>";
        if (data.aiNote) {
            html += "<p style='margin-top:0.5rem;font-style:italic;'>💡 AI tip: " + data.aiNote + "</p>";
        }
        weatherResult.innerHTML = html;

    } catch (error) {
        weatherResult.textContent = "Unable to fetch weather. Please try again.";
        console.error(error);
    }
}

weatherButton.addEventListener("click", getWeather);

cityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

const projectSearch = document.getElementById("projectSearch");
const projectCards = document.querySelectorAll(".project-card");
const projectSearchEmpty = document.getElementById("projectSearchEmpty");

function filterProjects() {
    const query = projectSearch.value.trim().toLowerCase();
    let visibleCount = 0;

    projectCards.forEach(function (card) {
        const title = card.querySelector(".project-title").textContent.toLowerCase();
        const description = card.querySelector(".project-description").textContent.toLowerCase();
        const technologies = (card.dataset.technologies || "").toLowerCase();
        const matches =
            !query ||
            title.includes(query) ||
            description.includes(query) ||
            technologies.includes(query);

        card.hidden = !matches;
        if (matches) {
            visibleCount += 1;
        }
    });

    projectSearchEmpty.hidden = visibleCount > 0;
}

projectSearch.addEventListener("input", filterProjects);