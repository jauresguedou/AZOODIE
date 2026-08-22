const { getCachedRoute, saveRouteToCache } = require("../models/route-cache-model");



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



router.get("/route", async (req,res) => {
    const {originLat, originLng, destLat, destLng} = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({error: "Coordonnées manquantes."});
    }

    try {
        const cached = await getCachedRoute(originLat, originLng, destLat, destLng);
        if(cached) {
            return res.json({
                distance_m: cached.distance_m,
                duration_s: cached.duration_s,
                geometry: cached.geometry,
            });
        }
        const url= `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.routes || data.routes.length === 0) {
            return res.status(404).json({error: "Aucun itinéraire "});
        }

        const route = data.routes[0];
        await saveRouteToCache(originLat, originLng, destLat, destLng, route.distance, route.duration, route.geometry);

        res.json({ distance_m: route.distance, duration_s: route.duration, geometry: route.geometry});
    } catch(err) {
        console.error("Mapbox routing error:", err);
        res.status(500).json({ error: "Erreur de calcul d'itinéraire."});
    }
});




module.exports = router;