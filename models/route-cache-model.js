const pool = require("../config/database");

async function getCachedRoute(originLat, originLng, destLat, destLng) {
    const result = await pool.query (
        `SELECT * FROM route_cache
         WHERE origin_lat = $1 AND origin_lng = $2 AND dest_lat = $3 AND dest_lng = $4
         AND fetched_at > NOW() - INTERVAL '7 days'`,

         [originLat, originLng, destLat, destLng]
    );
    return result.rows[0];
}
async function saveRouteToCache(originLat, originLng, destLat, destLng, distance_m, duration_s, geometry) {
    await pool.query(
        `INSERT INTO route_cache (origin_lat, origin_lng, dest_lat, dest_lng, distance_m, duration_s, geometry )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
         [originLat, originLng, destLat, destLng, Math.round(distance_m), Math.round(duration_s), JSON.stringify(geometry) ]
    );
}

module.exports = { getCachedRoute, saveRouteToCache };