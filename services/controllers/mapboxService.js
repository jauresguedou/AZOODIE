function createMapboxError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function fetchDrivingRoute(originLat, originLng, destLat, destLng) {
    const accessToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
        throw createMapboxError("Mapbox access token is not configured.", 500);
    }

    const coordinates = [originLat, originLng, destLat, destLng].map(Number);
    const [numericOriginLat, numericOriginLng, numericDestLat, numericDestLng] = coordinates;
    if (!coordinates.every(Number.isFinite)
        || Math.abs(numericOriginLat) > 90
        || Math.abs(numericDestLat) > 90
        || Math.abs(numericOriginLng) > 180
        || Math.abs(numericDestLng) > 180) {
        throw createMapboxError("Route coordinates are invalid.", 400);
    }

    const url = new URL(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${numericOriginLng},${numericOriginLat};${numericDestLng},${numericDestLat}`
    );
    url.search = new URLSearchParams({
        geometries: "geojson",
        access_token: accessToken,
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw createMapboxError(`Mapbox request failed with status ${response.status}.`, response.status);
    }

    const data = await response.json();
    const route = Array.isArray(data.routes) ? data.routes[0] : null;
    if (!route) {
        throw createMapboxError("No route was found for these coordinates.", 404);
    }

    if (!Number.isFinite(route.distance) || !Number.isFinite(route.duration) || !route.geometry) {
        throw new TypeError("Mapbox returned an invalid route.");
    }

    return {
        distance_m: route.distance,
        duration_s: route.duration,
        geometry: route.geometry,
    };
}

module.exports = { fetchDrivingRoute };