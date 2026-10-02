const { getGeocodingResults, getRoute } = require("../services/controllers/cacheService");
const express = require("express");

const router = express.Router();

router.get("/geocode", async(req, res) => {
    const query = req.query.q;

    if (typeof query !== "string" || query.trim().length < 3) {
        return res.json([]);
    }

    try {
        const results = await getGeocodingResults(query);
        return res.json(results);
    } catch (err) {
        console.error("Geocoding error:", err);
        return res.status(err.statusCode || 500).json([]);
    }
});

router.get("/route", async (req, res) => {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({ error: "Coordonnées manquantes." });
    }

    try {
        const coordinates = [originLat, originLng, destLat, destLng].map(Number);
        if (!coordinates.every(Number.isFinite)) {
            return res.status(400).json({ error: "Coordonnées invalides." });
        }

        const [numericOriginLat, numericOriginLng, numericDestLat, numericDestLng] = coordinates;
        if (Math.abs(numericOriginLat) > 90 || Math.abs(numericDestLat) > 90
            || Math.abs(numericOriginLng) > 180 || Math.abs(numericDestLng) > 180) {
            return res.status(400).json({ error: "Coordonnées invalides." });
        }

        const route = await getRoute(numericOriginLat, numericOriginLng, numericDestLat, numericDestLng);
        return res.json(route);
    } catch (err) {
        console.error("Mapbox routing error:", err);
        const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
        return res.status(status).json({
            error: status === 404 ? "Aucun itinéraire." : "Erreur de calcul d'itinéraire.",
        });
    }
});

module.exports = router;