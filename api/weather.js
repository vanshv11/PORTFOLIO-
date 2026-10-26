export default async function handler(req, res) {
  const urlObj = new URL(req.url, "http://localhost");
  const city = urlObj.searchParams.get("city") || (req.body && req.body.city);

  if (!city || typeof city !== "string" || !city.trim()) {
    return res.status(400).json({ error: "Please provide a valid city name." });
  }

  const trimmedCity = city.trim();
  const openWeatherKey = process.env.OPENWEATHER_API_KEY || "80cbe9053ad7b33527a02c5405abaddc";
  const aiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY;

  let weatherData = null;
  let weatherError = null;

  // 1. Fetch live metrics from OpenWeatherMap
  try {
    const owUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(trimmedCity)}&appid=${openWeatherKey}&units=metric`;
    const owRes = await fetch(owUrl);
    if (owRes.status === 404) {
      return res.status(404).json({ error: "City not found. Please check spelling." });
    }
    if (owRes.ok) {
      const data = await owRes.json();
      weatherData = {
        name: data.name,
        country: data.sys?.country,
        temp: Math.round(data.main?.temp * 10) / 10,
        feels_like: Math.round(data.main?.feels_like * 10) / 10,
        condition: data.weather?.[0]?.description,
        humidity: data.main?.humidity,
      };
    }
  } catch (err) {
    weatherError = err.message;
  }

  // 2. If AI key is configured, try querying xAI Grok for additional weather commentary / forecast
  let aiNote = null;
  if (aiKey && weatherData) {
    try {
      const isXAI = aiKey.startsWith("xai-");
      const endpoint = isXAI
        ? "https://api.x.ai/v1/chat/completions"
        : "https://api.groq.com/openai/v1/chat/completions";
      const model = isXAI ? "grok-beta" : "llama-3.3-70b-versatile";

      const aiRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.5,
          max_tokens: 60,
          messages: [
            {
              role: "system",
              content: "You are a concise weather assistant. Give a 1-sentence tip or outfit recommendation based on the current weather.",
            },
            {
              role: "user",
              content: `City: ${weatherData.name}, Temperature: ${weatherData.temp}°C, Condition: ${weatherData.condition}`,
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        aiNote = aiJson.choices?.[0]?.message?.content?.trim();
      }
    } catch {
      // Optional enhancement, ignore failure
    }
  }

  if (weatherData) {
    return res.status(200).json({
      name: weatherData.name,
      temp: weatherData.temp,
      condition: weatherData.condition,
      feels_like: weatherData.feels_like,
      humidity: weatherData.humidity,
      aiNote,
    });
  }

  return res.status(502).json({ error: weatherError || "Unable to fetch weather data." });
}
