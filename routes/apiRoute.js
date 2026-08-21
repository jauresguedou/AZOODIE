const express = require("express");

const router = express.Router();

router.get("/geocode", async(req, res) => {
    const query = req.query.q;

    if (!query || query.trim().length < 3) {
        return res.json([]);
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=bj&q=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "AZOODIE-Localization/1.0 (contact: sewlanguedou@gmail.com",

            },
        });

        if (!response.ok) {
            console.error("Nominatim error:", response.status, response.statusText);
            return res.status(response.status).json([]);
        }

        const data = await response.json();

        const results = data.map((place) => ({
            display_name: place.display_name,
            lat: place.lat,
            lng: place.lon,
        }));

        res.json(results);
    } catch (err) {
        console.error("Geocoding error:", err);
        res.status(500).json([]);
    }
})

module.exports = router;