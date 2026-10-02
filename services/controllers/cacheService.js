const { getCachedPlaces, saveCachedPlaces } = require("../../models/place-cache-model");
const { getCachedRoute, saveRouteToCache } = require("../../models/route-cache-model");
const { fetchDrivingRoute } = require("./mapboxService");

function createGeocodingError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getGeocodingResults(query) {
    const cachedPlaces = await getCachedPlaces(query);
    if (cachedPlaces !== null) {
        return cachedPlaces;
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({
        format: "json",
        limit: "5",
        countrycodes: "bj",
        q: query.trim(),
    });

    const response = await fetch(url, {
        headers: {
            "User-Agent": "AZOODIE-Localization/1.0 (contact: sewlanguedou@gmail.com)",
        },
    });

    if (!response.ok) {
        throw createGeocodingError(
            `Nominatim request failed with status ${response.status}.`,
            response.status
        );
    }

    const places = await response.json();
    if (!Array.isArray(places)) {
        throw new TypeError("Nominatim returned an invalid geocoding response.");
    }

    const results = places.map((place) => ({
        display_name: place.display_name,
        lat: place.lat,
        lng: place.lon,
    }));

    await saveCachedPlaces(query, results);
    return results;
}

async function getRoute(originLat, originLng, destLat, destLng) {
    const cachedRoute = await getCachedRoute(originLat, originLng, destLat, destLng);
    if (cachedRoute) {
        return {
            distance_m: cachedRoute.distance_m,
            duration_s: cachedRoute.duration_s,
            geometry: cachedRoute.geometry,
        };
    }

    const route = await fetchDrivingRoute(originLat, originLng, destLat, destLng);
    await saveRouteToCache(
        originLat,
        originLng,
        destLat,
        destLng,
        route.distance_m,
        route.duration_s,
        route.geometry
    );

    return route;
}

module.exports = { getGeocodingResults, getRoute };